'use strict';

var _ = require('lodash');
var robokassa = require('../../server/lib/robokassa');

module.exports = function(Ad) {
  // validate the assigned contacts belong to the same owner
  Ad.validateAsync('contacts', function (err, done) {
    const ownerId = this.ownerId;
    const Contact = Ad.app.models.Contact;
    if (!ownerId) {
      // but does not have a ownerId
      err();
      return done();
    }
    if (this.contactIds.length === 0) {
      // contains no contacts
      return done();
    }
    //inq -- any match
    Contact.find({where: {id: {inq: this.contactIds}}}, function (error, contacts) {
      if (!_(contacts).every({ownerId: ownerId})) {
        err();
      }
      done();
    });
  }, {message: 'contains contact resources belonging to other readers'});

  // validate the assigned images belong to the same owner
  Ad.validateAsync('images', function (err, done) {
    const ownerId = this.ownerId;
    const Image = Ad.app.models.Image;
    if (!ownerId) {
      // but does not have a ownerId
      err();
      return done();
    }
    if (this.imageIds.length === 0) {
      // contains no images
      return done();
    }
    Image.find({where: {id: {inq: this.imageIds}}}, function (error, images) {
      if (!_(images).every({ownerId: ownerId})) {
        err();
      }
      done();
    });
  }, {message: 'contains image resources belonging to other readers'});

  // validate the assigned actions are supported by the assigned category
  Ad.validateAsync('actions', function (err, done) {
    const that = this;
    const Category = Ad.app.models.Category;
    if (!this.categoryId) {
      // has not assigned to a category
      err();
      return done();
    }
    Category.findById(this.categoryId, function (error, category) {
      if (!category.supercategoryId) {
        err(); //now every category has a child
      }
      if (category.actionIds.length > 0) {
        // the category contains some actions
        if (that.actionIds.length == 0) {
          // but the ad contains no actions
          err();
        }
        if (_.intersectionWith(category.actionIds, that.actionIds, _.isEqual).length != that.actionIds.length) {
          // but the ad contains unsupported actions
          console.log(_.intersectionWith(category.actionIds, that.actionIds, _.isEqual));
          err();
        }
      } else {
        // the category supports no action
        if (that.actionIds.length > 0) {
          // but the ad contains some actions
          err();
        }
      }
      done();
    });
  }, {message: 'the assigned actions are not supported in the category'});

  // validate the issues belong to the assigned publication
  Ad.validateAsync('issues', function (err, done) {
    const that = this;
    const Issue = Ad.app.models.Issue;
    Issue.find({inq: this.issueIds}, function (error, issues) {
      for (let issue of issues) {
        if (issue.publicationId != that.publicationId) {
          err();
          break;
        }
      }
      done();
    });
  }, {message: 'the assigned issues do not all belong to the specified publication'});

  // validate all assigned option groups do belong to the assigned publication.
  // missing ones will be assigned the defaults
  Ad.validateAsync('options', function (err, done) {
    const that = this;
    const Publication = Ad.app.models.Publication;
    if (!this.publicationId) {
      // but has no publicationId
      err();
      return done();
    }
    Publication.findById(this.publicationId, {include: 'optionGroups'}, function (error, publication) {
      const optionGroups = publication.optionGroups();
      let specifiedIds = _(that.options).keys().map(_.parseInt).value();
      if (_.difference(specifiedIds, _.map(optionGroups, 'id')).length > 0) {
        // contains some option groups
        err();
      }
      for (let optionGroup of optionGroups) {
        // assign the missing ones to default
        if (!(optionGroup.id in that.options)) {
          that.options[optionGroup.id] = optionGroup.defaultOptionId;
        }
      }
      done();
    });
  }, {message: 'contains some extraneous option groups'});

  // validate the assigned options belong to the option groups
  Ad.validateAsync('options', function (err, done) {
    const that = this;
    const Option = Ad.app.models.Option;
    const optionIds = _.values(this.options);
    if (!this.publicationId) {
      // but has no publicationId
      err();
      return done();
    }
    if (_.uniq(optionIds).length < _.keys(this.options).length) {
      // but there are overlapping options
      err();
      return done();
    }
    Option.find({where: {id: {inq: optionIds}}}, function (error, options) {
      if (options.length < optionIds.length) {
        // some option ids do not exist
        err();
      }
      const ogs = _.invert(that.options);
      for (let option of options) {
        if (ogs[option.id] != option.optionGroupId) {
          // the option is assigned to an option group other than the one it
          // belongs to
          err();
          break;
        }
      }
      done();
    });
  }, {message: 'has mismatched assigned options and option groups'});

  // payment status
  Ad.validatesInclusionOf('paymentStatus', {in: ['editable', 'paid', 'invoiced']});

  // create a new order
  Ad.prototype.createOrder = function (cb) {
    // first check if there is any unterminated orders
    Ad.app.models.Ad.findById(this.id, {include: ['contacts', 'issues', 'actions', 'category']}, (err, ad) => {
      Ad.app.models.Order.find({where: {adId: ad.id}}, function (err, orders) {
        // terminate all active orders:
        for (var order of orders) {
          if (order.status === 'paid:confirmed') {
            // refund confirmed paid orders
            order.refund();
          } else if (order.status === 'pending') {
            // cancel pending orders
            order.updateAttribute('status', 'canceled');
          }
        }

        // set the expiration date to be the first issue's submission deadline
        Ad.app.models.Issue.findOne({where: {id: {inq: ad.issueIds}}, order: 'submissionDeadline ASC'}, (err, issue) => {
          var firstSubmissionDeadline = issue.submissionDeadline;

          Ad.app.models.Reader.findById(ad.ownerId, function (err, owner) {
            // create a new order
            let dueAmount = Math.max(0, ad.cost - owner.balance);
            Ad.app.models.Order.count(function (err, orderCount) {
              Ad.app.models.Order.create({
                adId: ad.id,
                // XXX distinct numerical invoice id for robokassa
                invoiceId: orderCount + 1,
                status: 0 < dueAmount ? 'pending' : 'paid:confirmed',
                amount: ad.cost,
                dueAmount: dueAmount,
                refundableAmount: ad.cost,
                // save a snapshot of the ad
                archivedAd: JSON.stringify(ad),
                issueIds: ad.issueIds,
                ownerId: ad.ownerId,
                expireAt: firstSubmissionDeadline,
              }, (err, order) => {
                // change payment status
                ad.updateAttribute('paymentStatus', 'invoiced');
                // create a transaction:
                // we exchange a promise for future delivery
                // for payment from the user
                Ad.app.models.Transaction.create({
                  ownerId: ad.ownerId,
                  orderId: order.id,
                  creditAmount: -order.amount,
                  note: 'advertisement order',
                });
                if (dueAmount > 0) {
                  // generate the payment URL only if due amount > 0
                  // robokassa does not allow payment for 0 anyway
                  order.updateAttribute('paymentUrl', robokassa.generateOrderPaymentUrl(order), cb);
                } else {
                  // credit can pay for the entire order
                  ad.updateAttribute('paymentStatus', 'paid');
                  if (cb) {
                    cb(null, order);
                  }
                }
              });
            });
          });
        });
      });
    });
  };

  Ad.remoteMethod('createOrder', {
    description: 'create a new order for the ad',
    isStatic: false,
    returns: {arg: 'order', type: 'object'},
    http: {verb: 'post'},
  });

  // hide the inherited create related orders method from REST
  Ad.disableRemoteMethod('__create__orders', true);
};

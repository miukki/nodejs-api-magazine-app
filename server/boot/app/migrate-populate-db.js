var moment = require('moment');
var optionGroups = require('./data/options.json').optionGroups;
var options = require('./data/options.json').options;
var _ = require('lodash');
var log = require('bunyan').createLogger({name: 'migrate-populate-db.js'});

// turn callbacks into promises
function create(model, objects) {
  return new Promise(function(resolve, reject) {
    model.create(objects, function (err, results) {
      if (err) {
        // print out errors
        log.error(err);
        return reject(err);
      }
      return resolve(results);
    });
  });
}

module.exports = function(app) {
  app.dataSources.db.automigrate()
  .then(function() {
    return Promise.all([
      // create publishers, publications, issues
      create(app.models.Publisher, [
        {email: '1@publisher.com', password: '1'},
      ]).then(function (publishers) {
        return create(app.models.Publication, [
          // HACK use id 1 so the hard-coded client code works
          {id: '1', name: 'publication1', publisherId: publishers[0].id, period: 7, submissionCutoff: 1},
        ]);
      }).then(function (publications) {
        // option groups, options
        _.map(optionGroups, function (og) {
          return _.extend(og, {publicationId: publications[0].id});
        });
        return Promise.all([
          create(app.models.Option, options)
          .then(function () {
            return create(app.models.OptionGroup, optionGroups);
          }),
          create(app.models.Issue, [
            {publishAt: moment().subtract(1, 'week'), publicationId: publications[0].id, submissionDeadline: moment().subtract(1, 'week').subtract(1, 'day')},
            {publishAt: moment().add(12, 'hour'), publicationId: publications[0].id, submissionDeadline: moment().add(12, 'hour').subtract(1, 'day')},
            {publishAt: moment().add(1, 'week'), publicationId: publications[0].id, submissionDeadline: moment().add(1, 'week').subtract(1, 'day')},
          ])
        ]);
      }),
      // create actions
      create(app.models.Action, [
        {name: 'offer'},
        {name: 'ask'},
      ]).then(function (actions) {
        // create categories
        return Promise.all([
          Promise.resolve(actions),
          create(app.models.Category, [
            {name: 'category1', supercategoryId: null},
            {name: 'category2', supercategoryId: null},
          ]).then(function(categories) {
            return create(app.models.Category, [
              {name: 'category1.1', supercategoryId: categories[0].id},
              {name: 'category1.2', supercategoryId: categories[0].id},
            ]);
          }).then(function(subcategories) {
            return create(app.models.Category, [
              {name: 'category1.1.1', supercategoryId: subcategories[0].id, actionIds: [actions[0].id], custom: {type: 'service'}},
              {name: 'category1.1.2', supercategoryId: subcategories[0].id, actionIds: [actions[0].id, actions[1].id], custom: {type: 'product'}},
              {name: 'category1.2.1', supercategoryId: subcategories[1].id, actionIds: [], custom: {type: 'product'}},
            ]);
          })
        ]);
      }),
      // create readers
      create(app.models.Reader, [
        {email: '1@reader.com', password: '1'},
        {email: '2@reader.com', password: '2'},
      ]).then(function (readers) {
        return Promise.all([
          Promise.resolve(readers),
          create(app.models.Contact, [
            {kind: 'phone', info: '23123', ownerId: readers[0].id},
            {kind: 'phone', info: '1-23-5', ownerId: readers[0].id},
            {kind: 'email', info: '1@contact.com', ownerId: readers[1].id},
            {kind: 'website', info: 'contact.com', ownerId: readers[1].id},
          ]),
          create(app.models.Image, [
            {fileName: 'image1.jpg', ownerId: readers[0].id},
            {fileName: 'image2.jpg', ownerId: readers[1].id},
          ]),
        ]);
      }),
    ]);
  }).then(function(results) {

    const issues = results[0][1];
    const actions = results[1][0];
    const categories = results[1][1];
    const readers = results[2][0];
    const contacts = results[2][1];
    const images = results[2][2];
    const publicationId = issues[0].publicationId;

    // create ads
    return create(app.models.Ad, [
      {text: 'ad1', categoryId: categories[0].id, ownerId: readers[0].id, publicationId: publicationId, issueIds: [issues[0].id, issues[1].id], actionIds: [actions[0].id], contactIds: [contacts[0].id, contacts[1].id]},
      {text: 'ad2', categoryId: categories[0].id, ownerId: readers[0].id, publicationId: publicationId, issueIds: [issues[0].id], actionIds: [actions[0].id], contactIds: [contacts[1].id], options: {1: 23, 6: 19}},
      {text: 'ad3', categoryId: categories[1].id, ownerId: readers[1].id, publicationId: publicationId, issueIds: [issues[1].id], actionIds: [actions[1].id], contactIds: [contacts[2].id, contacts[3].id], options: {7: 11}},
      {text: 'ad4', id: '4', categoryId: categories[2].id, ownerId: readers[1].id, publicationId: publicationId, issueIds: [issues[2].id], actionIds: [], contactIds: [contacts[3].id], options: {}},
    ]);
  }).then(function(ads) {
    create(app.models.Order, [
      {invoiceId: 0, status: 'paid:confirmed', issueIds: ads[0].issueIds, amount: 200, dueAmount: 200, refundableAmount: 200, archivedAd: ads[0], expireAt: moment().add(2, 'week'), adId: ads[0].id, ownerId: ads[0].ownerId},
      {invoiceId: 1, status: 'pending', issueIds: ads[2].issueIds, amount: 100, dueAmount: 100, refundableAmount: 100, archivedAd: ads[2], expireAt: moment().add(2, 'week'), adId: ads[2].id, ownerId: ads[2].ownerId},
      {invoiceId: 2, status: 'paid:confirmed', issueIds: ads[1].issueIds, amount: 100, dueAmount: 100, refundableAmount: 100, archivedAd: ads[1], expireAt: moment().add(2, 'week'), adId: ads[1].id, ownerId: ads[1].ownerId},
    ]);
  }).then(function() {
    log.info('successfully populated sample data');
  }).catch(log.error);
}

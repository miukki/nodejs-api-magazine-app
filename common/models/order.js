'use strict';

var _ = require('lodash');

module.exports = function(Order) {
  // the states
  // - pending. waiting for payment
  //   - paid (confirmed/unconfirmed), unconfirmed state can be skipped
  //     - fulfilled*
  //     - refunded*
  //   - canceled*
  //   - expired*
  // - error* probably deserves further investigations
  // note the terminal states * are: canceled, refunded, fulfilled, error
  Order.validatesInclusionOf('status', {in: [
    'pending',
    'paid:unconfirmed',
    'paid:confirmed',
    'fulfilled',
    'refunded',
    'canceled',
    'expired',
    'error',
  ]});

  Order.prototype.refund = function (cb) {
    if (this.status === 'paid:confirmed') {
      this.updateAttribute('status', 'refunded');
      Order.app.models.Transaction.create({
        creditAmount: this.refundableAmount,
        ownerId: this.ownerId,
        note: 'refund to wallet',
        orderId: this.id,
      }, cb);
    } else if (cb) {
      cb({
        name: 'NotRefundable',
        status: 400,
        message: 'the order is not refundable. check its status',
      }, null);
    }
  };

  Order.remoteMethod('refund', {
    description: 'refund a paid and confirmed order, credits to the user\'s wallet',
    isStatic: false,
    returns: {arg: 'transaction', type: 'object'},
    http: {verb: 'post'}
  });
};

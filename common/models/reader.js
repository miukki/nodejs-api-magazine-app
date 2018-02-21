'use strict'

module.exports = function(Reader) {
  Reader.prototype.createWithdrawal = function (cb) {
    // create a new withdrawal for all the remaining credits on balance
    let balance = this.balance;
    let ownerId = this.id;
    if (balance > 0) {
      Reader.app.models.Withdrawal.create({
        status: 'pending',
        amount: balance,
        ownerId: ownerId,
      }, (err, refund) => {
        Reader.app.models.Transaction.create({
          creditAmount: -balance,
          note: 'withdrawal',
          ownerId: ownerId,
          withdrawalId: refund.id
        }, cb);
      });
    } else if (cb) {
      cb({
        name: 'NoCredit',
        status: 400,
        message: 'There is no credits to be refunded'
      }, null);
    }
  };

  Reader.remoteMethod('createWithdrawal', {
    description: 'create a new withdrawal for the user',
    isStatic: false,
    returns: {arg: 'transaction', type: 'object'},
    http: {verb: 'post'},
  });
};

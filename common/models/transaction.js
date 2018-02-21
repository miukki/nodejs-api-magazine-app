'use strict'

module.exports = function(Transaction) {
  // update the reader's balance after each new transaction
  Transaction.observe('after save', function updateBalance(ctx, next) {
    Transaction.find({where: {ownerId: ctx.instance.ownerId}}, function (err, transactions) {
      let sum = 0;
      for (let transaction of transactions) {
        sum += transaction.creditAmount;
      }
      Transaction.app.models.Reader.findById(ctx.instance.ownerId, function (err, reader) {
        reader.updateAttribute('balance', sum, next);
      });
    });
  });
}

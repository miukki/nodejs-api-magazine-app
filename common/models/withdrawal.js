'use strict'

module.exports = function(Withdrawal) {
  Withdrawal.validatesInclusionOf('status', {in: ['issued', 'pending']});
};

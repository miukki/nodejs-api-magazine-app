var crypto = require('crypto');
var _ = require('lodash');
// select the right credentials based on environment
var credential = process.env.NODE_ENV === 'staging' ? require('../credentials.staging').robokassa : require('../credentials').robokassa;

function signature(data) {
  return crypto.createHash(credential.hashAlgorithm).update(data.join(':')).digest('hex');
}

function generatePaymentStatusUrl(invId) {
  // generates the URL to the payment status API on Robokassa
  // doc: http://docs.robokassa.ru/en/#2629

  var baseUrl = 'https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpState';
  var signatureValue = signature([
    credential.merchantLogin,
    invId,
    credential.password2,
  ]);
  return `${baseUrl}?MerchantLogin=${credential.merchantLogin}&InvoiceID=${invId}&Signature=${signatureValue}`;
}

function generatePaymentUrl(invId, outSum, invDesc, expireAt) {
  // generates the URL to the payment page on Robokassa
  // doc: http://docs.robokassa.ru/en#2526

  // for definitions of the parameters
  // doc: http://docs.robokassa.ru/en#2507

  // for ExpirationDate and other optional parameters
  // doc: http://docs.robokassa.ru/en#2508

  // robokassa seems to only accept numerical invoiceID
  var signatureValue = signature([
    credential.merchantLogin,
    outSum,
    invId,
    credential.password1
  ]);

  // TODO change isTest value
  return `https://auth.robokassa.ru/Merchant/Index.aspx?isTest=1&MerchantLogin=${credential.merchantLogin}&InvoiceID=${invId}&OutSum=${outSum}&SignatureValue=${signatureValue}&InvDesc=${encodeURIComponent(invDesc)}&Culture=en&ExpirationDate=${expireAt.toISOString()}`;
}

function validateSignature(expectedSign, receivedSign) {
  // assuming that signatures are in hexidecimals, so upper/lower case does not matter
  if (_.isString(expectedSign) && _.isString(receivedSign)) {
    return expectedSign.toLowerCase() === receivedSign.toLowerCase();
  }
  return false;
}

function generateOrderPaymentUrl(order) {
  return generatePaymentUrl(order.invoiceId, order.dueAmount, `ad #${order.adId} on Gazetashans`, order.expireAt);
}

function verifyResultSignature(queryArgs, receivedSignature) {
  // doc: http://docs.robokassa.ru/en#2540
  var expectedSign = signature([
    queryArgs.OutSum,
    queryArgs.InvId,
    credential.password2,
  ]);
  return validateSignature(expectedSign, receivedSignature);
}

function verifySuccessSignature(queryArgs, receivedSignature) {
  // doc: http://docs.robokassa.ru/en#2546
  // there is an mistake about signature, it uses **password1** not password2
  var expectedSign = signature([
    queryArgs.OutSum,
    queryArgs.InvId,
    credential.password1,
  ]);
  return validateSignature(expectedSign, receivedSignature);
}

module.exports = {
  signature,
  generatePaymentUrl,
  generatePaymentStatusUrl,
  validateSignature,
  generateOrderPaymentUrl,
  verifyResultSignature,
  verifySuccessSignature,
}

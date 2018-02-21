module.exports = function (app) {
  var generateServices = require('loopback-sdk-angular').services;

  var client = generateServices(app, 'lbServices', '/api');
  require('fs').writeFileSync('client/js/services/lb-services.js', client, 'utf-8');

  console.log('> successfully generated lb-services.js');
}

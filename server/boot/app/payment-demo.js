var jade = require('jade');
var _ = require('lodash');
var robokassa = require('../../lib/robokassa');

module.exports = function (app) {
  var router = app.loopback.Router();
  router.get('/ad/:adId/order/new', function (req, res) {
    app.models.Ad.findById(req.params.adId, (err, ad) => {
      ad.createOrder((err, order) => {
        // populate info on a view
        var view = jade.renderFile(__dirname + '/../../pages/demo-payment.jade', {
          adId: ad.id,
          adText: ad.text,
          adCost: order.amount,
          expireAt: order.expireAt,
          paymentUrl: order.paymentUrl,
        });
        res.send(view);
      });
    });
  });

  app.use('/demo', router);
};

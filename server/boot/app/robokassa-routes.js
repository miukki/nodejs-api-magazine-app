var robokassa = require('../../lib/robokassa');
var jade = require('jade');
var bodyParser = require('body-parser');
var open = require('amqplib').connect('amqp://localhost');
var taskType = require('../../lib/task-type');
var q = 'tasks';
var log = require('bunyan').createLogger({name: 'robokassa-routes.js'});

module.exports = function(app) {
  var router = app.loopback.Router();

  // for testing in development
  router.get('/test', function (req, res) {
    var url = robokassa.generatePaymentUrl(1, 100, 'something awesome');
    var view = jade.renderFile(__dirname + '/../../pages/test-payment.jade', {
      paymentUrl: url
    });
    res.send(view);
  });

  // robokassa result callback/webhook
  // doc: http://docs.robokassa.ru/en#2540
  router.post('/result',
  bodyParser.urlencoded({extended: false}),
  function (req, res) {
    if (robokassa.verifyResultSignature(req.body, req.body.SignatureValue)) {
      // successfully verified signature
      // acknowledge the payment
      res.send(`OK${req.body.InvId}`);
      // update the order status
      app.models.Order.findById(req.body.InvId, function (err, order) {
        if (!err && order && (order.status === 'pending' || order.status === 'paid:unconfirmed')) {
          order.updateAttributes({
            status: 'paid:confirmed',
            paymentMethod: `robokassa:${req.body.PaymentMethod}`,
            refundableAmount: req.body.OutSum,
            paidAt: new Date(),
          }, function (err, order) {
            app.models.Ad.findById(order.adId, function (err, ad) {
              ad.updateAttribute('paymentStatus', 'paid');
            });
          });
          // record transaction
          app.models.Transaction.create({
            ownerId: order.ownerId,
            orderId: order.id,
            creditAmount: order.dueAmount,
            note: 'payment for order',
          });
        }
      });
    } else {
      res.status(400);
      res.send('BAD');
    }
  });

  // redirect pages
  router.get('/success', function (req, res) {
    // doc: http://docs.robokassa.ru/en#2546
    // there is an mistake about signature, it uses **password1** not password2
    if (robokassa.verifySuccessSignature(req.query, req.query.SignatureValue)) {
      app.models.Order.find({where: {invoiceId: +req.query.InvId}}, function (err, order) {
        if (!err && order) {
          res.send('thanks for the payment');
          if (order.status === 'pending') {
            // if we have not received the result callback before
            // change the order status to paid but unconfirmed
            // enqueue a polling task
            order.updateAttribute('status', 'paid:unconfirmed');
            open.then((conn) => {
              var ok = conn.createChannel();
              ok.then((ch) => {
                ch.assertQueue(q, {durable: true});
                log.info('producer connected to rabbitMQ');
                ch.sendToQueue(q, new Buffer(JSON.stringify({
                  lastPollAt: Date.now(),
                  attempt: 1,
                  orderId: order.id,
                })), {
                  type: taskType.POLL_PAYMENT_STATUS,
                  timestamp: Date.now(),
                  persistent: true,
                });
                log.info(`enqueued polling task for order ${order.id}`);
              });
            });
          }
        } else {
          res.redirect('error');
        }
      });
    } else {
      res.redirect('error');
    }
  });

  router.get('/fail', function (req, res) {
    // doc: http://docs.robokassa.ru/en#2553
    res.send('payment failed. try again?');
  });

  router.get('/error', function (req, res) {
    res.status(400);
    res.send('something went wrong.')
  });

  app.use('/robokassa', router);
};

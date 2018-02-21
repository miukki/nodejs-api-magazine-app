'use strict'

var app = require('loopback')();
var boot = require('loopback-boot');
var _ = require('lodash');
var moment = require('moment');
var taskType = require('./lib/task-type');
var log = require('bunyan').createLogger({name: 'worker.js', level: 'debug'});
var xml = require('xml2js');
var request = require('request');
var robokassa = require('./lib/robokassa');

// polling interval for exponential backoff in millisecond
const pollInterval = 1000;
const maxPollCount = 100;
const maxAttempt = 2;

// use the loopback app
boot(app, __dirname, function (err) {
  // connect to rabbitMQ
  var open = require('amqplib').connect('amqp://localhost');
  var q = 'tasks';

  open.then((conn) => {
    var ok = conn.createChannel();
    return ok.then((ch) => {
      ch.assertQueue(q, {durable: true});
      ch.prefetch(1);
      log.info('worker connected to rabbitMQ');
      ch.consume(q, (msg) => {
        if (msg !== null) {
          if (msg.properties.type === taskType.ADD_ISSUE) {
            // add one more issue
            app.models.Publication.findOne({include: 'issues'}
            , (err, publication) => {
              const lastIssue = _.maxBy(publication.issues(), 'publishAt');
              const newPublishAt = moment(lastIssue.publishAt).add(publication.period, 'days');
              const submissionDeadline = moment(newPublishAt).subtract(publication.submissionCutoff, 'days');
              app.models.Issue.create({
                publicationId: publication.id,
                publishAt: newPublishAt,
                submissionDeadline: submissionDeadline,
              }, (err, issue) => {
                if (err !== null) {
                  log.warn(err);
                  // reject and requeue the task
                  ch.nack(msg);
                } else {
                  log.info('created a new issue');
                  ch.ack(msg);
                }
              });
            });
          } else if (msg.properties.type === taskType.PUBLISH_ISSUE) {
            const now = new Date();
            // update fulfillment status of orders
            app.models.Order.find({
              where: {status: 'paid:confirmed'},
              include: 'issues',
            }, (err, orders) => {
              for (let order of orders) {
                if (_.every(order.issues(), (issue) => {return issue.publishAt < now})) {
                  order.status = 'fulfilled';
                  order.refundableAmount = 0;
                  order.save();
                }
              }
              ch.ack(msg);
            });
          } else if (msg.properties.type === taskType.CHECK_DEADLINE) {
            const now = new Date();
            app.models.Issue.find({
              where: {
                submissionDeadline: {lt: now},
                publishAt: {gt: now},
              },
              include: {orders: 'issues'},
            }, (err, issues) => {
              for (let issue of issues) {
                // update order status
                for (let order of issue.orders()) {
                  // pending -> expired
                  // paid:unconfirmed -> error
                  // paid:confirmed -> update refundableAmount
                  if (order.status === 'pending') {
                    order.updateAttribute('status', 'expired');
                  } else if (order.status === 'paid:unconfirmed') {
                    order.updateAttribute('status', 'error');
                  } else if (order.status === 'paid:confirmed') {
                    const orderedIssues = order.issues();
                    const perIssueAmount = order.amount / orderedIssues.length;
                    const pastIssues = _.filter(orderedIssues, (issue) => {
                      return issue.submissionDeadline < now;
                    });
                    order.updateAttribute('refundableAmount', order.amount - perIssueAmount * pastIssues.length);
                  }
                }
              }
              log.info('updated submission deadline-related states');
              ch.ack(msg);
            });
          } else if (msg.properties.type === taskType.POLL_PAYMENT_STATUS) {
            // poll robokassa for payment status
            // log.info(msg.content);
            log.warn(robokassa.generatePaymentStatusUrl(1));
            const content = JSON.parse(msg.content);
            const now = Date.now();
            // exponential backoff polling policy
            if (now - content.lastPollAt < content.attempt * pollInterval) {
              // need to wait for backoff
              log.debug('wait for backoff');
              ch.nack(msg);
            } else {
              // polled
              log.warn(`polling ${content.orderId}`);
              // poll robokassa XML API
              // doc: http://docs.robokassa.ru/en/#2559
              // code 0 = success
              // doc: http://docs.robokassa.ru/en/#2629
              request(robokassa.generatePaymentStatusUrl(content.orderId), (err, res, body) => {
                xml.parseString(body, (err, reply) => {
                  const resultCode = reply.OperationStateResponse.Result[0].Code[0];
                  if (resultCode == 0) {
                    // successful
                    const stateCode = reply.OperationStateResponse.State[0].Code[0];
                    if (stateCode == 100) {
                      // order completed
                      // change order to confirmed
                      app.models.Order.findById(content.orderId, (err, order) => {
                        if (order.status === 'pending' || order.status === 'paid:unconfirmed') {
                          order.status = 'paid:confirmed';
                          order.save();
                          log.info(`confirmed order ${order.id}`);
                        }
                      });
                    } else if (stateCode == 60 || stateCode == 80) {
                      // cancel the job and set error state
                      // on order when state 60 or 80
                      app.models.Order.findById(content.orderId, (err, order) => {
                        order.status = 'error';
                        order.save();
                      });
                    } else {
                      // polled but not confirmed
                      if (content.attempt < maxAttempt) {
                        // enqueue a new job
                        content.lastPollAt = now;
                        content.attempt += 1;
                        ch.sendToQueue(q, new Buffer(JSON.stringify(content)), {
                          type: taskType.POLL_PAYMENT_STATUS,
                          timestamp: Date.now(),
                          persistent: true,
                        });
                        log.info(`will poll order ${content.orderId} again`);
                      } else {
                        log.info(`order ${content.orderId} exceed maximum poll attempts`);
                      }
                    }
                    ch.ack(msg);
                  } else if (resultCode == 1 || resultCode == 3 || resultCode == 4) {
                    // cancel the job and fail on result code 1, 3, 4
                    app.models.Order.findById(content.orderId, (err, order) => {
                      order.status = 'error';
                      order.save();
                    });
                    ch.ack(msg);
                  } else {
                    // unsuccessful
                    ch.nack(msg);
                  }
                });
              });
            }
          } else {
            // reject messages with an unknown message type
            log.warn({msgType: msg.properties.type}, 'unknown message type');
            ch.nack(msg);
          }
        }
      }, {noAck: false});
    });
  }).catch(log.error);
});

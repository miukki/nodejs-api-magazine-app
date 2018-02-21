var taskType = require('../lib/task-type');
var open = require('amqplib').connect('amqp://localhost');
var q = 'tasks';
var log = require('bunyan').createLogger({name: 'updateIssue.js'});

open.then((conn) => {
  var ok = conn.createChannel();
  ok.then((ch) => {
    ch.assertQueue(q, {durable: true});
    log.info('producer connected to rabbitMQ');
    // create new issues
    ch.sendToQueue(q, new Buffer(JSON.stringify({})), {
      type: taskType.ADD_ISSUE,
      timestamp: Date.now(),
      persistent: true,
    });
    log.info('add new issues');
    // update ad status
    ch.sendToQueue(q, new Buffer(JSON.stringify({})), {
      type: taskType.PUBLISH_ISSUE,
      timestamp: Date.now(),
      persistent: true,
    });
    log.info('update publication-related states');
    ch.sendToQueue(q, new Buffer(JSON.stringify({})), {
      type: taskType.CHECK_DEADLINE,
      timestamp: Date.now(),
      persistent: true,
    });
    log.info('update submission deadline-related states');
    ch.sendToQueue(q, new Buffer(JSON.stringify({
      lastPollAt: Date.now() - 1000,
      attempt: 1,
      orderId: 0,
    })), {
      type: taskType.POLL_PAYMENT_STATUS,
      timestamp: Date.now(),
      persistent: true,
    });
    log.info('poll status');
  });
  return conn;
}).then((conn) => {
  setTimeout(() => { conn.close(); process.exit(0); }, 500);
}).catch(console.warn);

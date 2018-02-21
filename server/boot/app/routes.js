module.exports = function(app) {
  var router = app.loopback.Router();
  router.get('/ping', function(req, res) {
    res.send('something');
  });
  router.get('/status', app.loopback.status());
  app.use(router);
}

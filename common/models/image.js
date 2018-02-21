var _ = require('lodash');

module.exports = function(Image) {
  // image upload
  Image.upload = function (imageMeta, req, res, cb) {
    Image.app.models.Container.upload(req, res, {
      container: 'test',
      getFilename: function (file) {
        // generate a (hopefully) unique filename
        // preserving the file extension
        const extension = file.name.match(/\.\w+$/);
        var md5 = crypto.createHash('md5');
        md5.update(file.name + Date.now());
        return md5.digest('hex') + extension;
      }
    }, function (err, result) {
      if (err) {
        console.error(err);
        cb(err);
      } else {
        // create the image object
        //console.log('result', result)
        Image.create(_.extend(imageMeta || {}, {
          fileName: result.files.fileToUpload[0].name
        }),
          cb
        );
      }
    });
  };

  Image.remoteMethod('upload', {
    description: 'upload an image',
    accepts: [
      {arg: 'imageMeta', type: 'object'},
      {arg: 'req', type: 'object', 'http': {source: 'req'}},
      {arg: 'res', type: 'object', 'http': {source: 'res'}}
    ],
    returns: {arg: 'result', type: 'object', root: true},
    http: {verb: 'post'}
  });

  // image download
  Image.prototype.download = function (res, cb) {
    Image.app.models.Container.download('test', this.fileName, res, cb);
  };

  Image.remoteMethod('download', {
    description: 'download the uploaded image. this can be used as the URL to an image',
    isStatic: false,
    accepts: {arg: 'res', type: 'object', 'http': {source: 'res'}},
    http: {verb: 'get'}
  });

  //remove from storage
  Image.prototype.removeFile = function (cb) {
    Image.app.models.Container.removeFile('test', this.fileName, function(){
      cb(null, _.extend({}, {msg: 'delete from db... '}));
    });

    /*
    Image.deleteById({id: id}, function(){ not working here remove from DB
    })
    */
  };

  Image.remoteMethod('removeFile',
  {
    description: 'remove file image. ',
    returns: {arg: 'res', type: 'object', root: true},
    isStatic: false,
    http: {verb: 'delete'}


  });

};

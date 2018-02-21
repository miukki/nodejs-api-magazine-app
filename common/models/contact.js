module.exports = function(Contact) {
  Contact.validatesInclusionOf('kind', {in: ['phone', 'email', 'website']});
  Contact.validatesPresenceOf('info', { message: 'info can not be blank' });
  Contact.validatesLengthOf('info', { min: 3, message: {min: 'too short'}});

  Contact.validateAsync('info', function(err, done) {
    var that = this;
    process.nextTick(function () {

      if (that.kind === 'phone' && !/^(\d-?)+$/.test(that.info)) {
        err();
      }
      if (that.kind === 'email' && !/^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/i.test(that.info)) {
        err();
      }
      if (that.kind === 'website' && !/^(http|https|ftp)?(:\/\/)?(www|ftp)?.?[a-z0-9-]+(.|:)([a-z0-9-]+)+([\/?].*)?$/.test(that.info)) {
        err();
      }
      done();

    });

  }, {message: 'info doesn\'t match any rules'});


};

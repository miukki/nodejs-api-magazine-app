module.exports = function(OptionGroup) {
  // validate the assigned default option belongs to this option group
  OptionGroup.validateAsync('defaultOption', function (err, done) {
    const that = this;
    const Option = OptionGroup.app.models.Option;
    Option.findById(this.defaultOptionId, function (error, option) {
      if (option.optionGroupId !== that.id) {
        // the option does not belong to this option group
        err();
      }
      done();
    });
  }, {message: 'the assigned default option does not belong to this option group'});
};

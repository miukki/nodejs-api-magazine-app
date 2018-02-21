var _ = require('lodash');

module.exports = function(Category) {
  Category.trees = function (cb) {
    Category.find({include: 'actions'}, function (err, categories) {
      var cats = _.zipObject(
            _.map(categories, 'id'),
            _.invokeMap(categories, 'toObject')
          );
      var open = _.filter(cats, {supercategoryId: null});
      var trees = _.clone(open);
      while (open.length > 0) {
        var x = open.shift()
        // expand x
        var children = _.filter(cats, {supercategoryId: x.id});
        x.subcategories = children
        open = open.concat(children)
      }
      cb(null, trees)
    })
  }

  Category.remoteMethod('trees', {
    description: 'returns the entire tree structure of categories and actions',
    returns: {arg: 'trees', type: 'array'},
    http: {verb: 'get'}
  })
};

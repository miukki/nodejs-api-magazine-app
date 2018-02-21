angular.module('app')
.filter('moment',  ['$filter', function ($filter) {
  return function (input, timeF) {
    var tmpl = timeF || 'MM.DD.YYYY HH:mm:ss';
    var date = $filter('amUtcOffset')(input, '+0700');
    return $filter('amDateFormat')(date, tmpl)
  };
}])

.filter('toUtc', ['$filter',function ($filter) {
  return function (d) {
    return d ? $filter('date')(d, 'yyyy-MM-ddTHH:mm:ss.sssZ', 'UTC') : undefined;
  };
}]);
'use strict';

var csv = require('csv');
var fs = require('fs');
var _ = require('lodash');

// the mapping from calculation_type_id to calculationType
const CALCULATION_TYPE = {
  1: 'perWord',
  2: 'perService',
  3: 'multiplier'
};

// extract options and option groups from CSV dump
const parser = csv.parse({columns: true}, function (err, rows) {
  if (err) {
    throw err;
  }
  // extract option groups
  const optionGroups = _(rows)
  .filter({parent_id: ''})
  .map(function (row) {
    return {
      id: row.id,
      title: row.name_en,
      cost: row.price,
      calculationType: CALCULATION_TYPE[row.calculation_type_id]
    };
  }).value();
  console.log(optionGroups);
  // extract options
  const options = _(rows)
  .filter(_.negate(_.matches({parent_id: ''})))
  .map(function (row) {
    return {
      optionGroupId: row.parent_id,
      id: row.id,
      name: row.name_en,
      cost: row.price
    }
  }).value();
  console.log(options);
  // process
  let n = _(rows).map('id').max();
  for (let optionGroup of optionGroups) {
    const ops = _.filter(options, {optionGroupId: optionGroup.id});
    if (ops.length === 0) {
      // add no option
      options.push({
        optionGroupId: optionGroup.id,
        id: ++n,
        name: 'no ' + optionGroup.title,
        cost: '0'
      });
      // add yes option
      options.push({
        optionGroupId: optionGroup.id,
        id: ++n,
        name: optionGroup.title,
        cost: optionGroup.cost
      });
    } else {
      _.map(ops, function (op) {
        _.extend(op, {cost: optionGroup.cost});
      });
    }
    // move cost to options
    delete optionGroup.cost;
  }
  // add default options
  const x = _.groupBy(options, 'optionGroupId');
  for (let optionGroup of optionGroups) {
    optionGroup.defaultOptionId = _(x[optionGroup.id]).sort('cost').first().id;
  }

  // output JSON
  fs.writeFile('./options.json', JSON.stringify({
    optionGroups: optionGroups,
    options: options
  }));
});

// read the CSV dump
fs.createReadStream('./options.csv').pipe(parser);

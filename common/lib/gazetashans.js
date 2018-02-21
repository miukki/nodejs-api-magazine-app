'use strict';

// this file contains the gazetashans-specific business logic

var util = require('./util');

// calculate the cost of an advertisement according to gazetashans.ru's logic
//
// @param ad {Object} the ad object with all fields.
// @param optionGroups {Object} all option groups with all the available
//   options or all the selected options.
// @return {Number} the cost of the ad.
function cost(ad, optionGroups) {
  // each contact counts as a word
  const count = util.wordCount(ad.text) + ad.contacts.length;
  let total = 0;
  if (count === 1) {

  } else {

  }
}

// the valid options given
function validOptions(ad) {
  
}

modules.export = {
  cost: cost,
  validOptions: validOptions
}

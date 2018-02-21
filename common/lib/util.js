'use strict';

// count the number of words in an advertisement. specs:
// - count words by space and other non-characters
//   (so "10min" counts one word but "one-min" counts 2)
// - count words by Capitalization (so "HelloThere" counts 2 words)
//
// @param text {String} the content of an ad
// @return {Integer} the word count
function wordCount(text) {
  return text.match(/([A-Z]|\w+?)(?=[A-Z]|\W|$)/g).length || 0;
}

modules.export = {
  wordCount: wordCount
}

/**
 * Tests
 */

const path = require('path');
const fs = require('fs');
const cantolite = require('./cantolite.js');

// cantolite.searchCantoData("禪", "chinese", process);

// cantolite.processCharHtml(
//   'http://www.cantonese.sheik.co.uk/dictionary/characters/380',
//   fs.readFileSync('char.htm', 'utf8'));
//
// cantolite.processSearchHtml(fs.readFileSync('search.htm', 'utf8'));
//
cantolite.processWordHtml(
  'http://www.cantonese.sheik.co.uk/dictionary/words/380',
  fs.readFileSync('word.htm', 'utf8'));

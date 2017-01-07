/**
 * A chinese dictionary wrapper for cantodict.
 * Created by boscoh on 23/12/2016.
 */

"use strict";

const path = require('path');

const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');

const _ = require("lodash");


function getIndexFromUrl(url) {
  if (_.isUndefined(url)) {
    return null;
  }
  return _.toInteger(_.nth(url.split('/'), -2));
}


function getTypeFromUrl(url) {
  if (_.isUndefined(url)) {
    return null;
  }
  let token = _.nth(url.split('/'), -3);
  if (_.includes(token, 'word')) {
    return 'word';
  } else if (_.includes(token, 'char')) {
    return 'char'
  }
  return '';
}


function processCharHtml(url, html) {

  console.log(`processing char page ${url}`);

  let $ = cheerio.load(html);

  let result = {
    type: 'char',
    src: url,
    text: $('.chinesebigger > span').text(),
    jyutping: $('.cardjyutping').text(),
    pinyin: $('.cardpinyin').text(),
    meaning: '',
    words: [],
  };

  $('.wordmeaning').contents().each(function(i, elem) {

    if (elem.type === "text") {
      if (!_.includes(elem.data, 'PoS')) {
        result.meaning += $(elem).text();
      }
    }
    if (elem.name === 'a') {
      result.meaning += $(elem).text();
    }
  });

  let word;
  $('.white.cantodictbg1').contents().each(function(i, elem) {
    if (elem.name === 'a') {

      let src = elem.attribs.href;
      let id = getIndexFromUrl(src);
      if (_.includes(src, 'words') && (id)) {
        word = {
          id,
          src,
          type: 'word',
          text: '',
          meaning: ''
        };
        result.words.push(word);
      }

    } else if (result.words.length) {

      if (elem.name === 'span') {
        if (elem.attribs.class == "chinesemed") {
          word.text = $(elem).children().text();
        }
        if (elem.attribs.class == "summary_jyutping") {
          word.jyutping = $(elem).text();
        }
        if (elem.attribs.class == "summary_pinyin") {
          word.pinyin = $(elem).text();
        }
      }
      if (elem.type === 'text') {
          word.meaning += elem.data;
      }
    }
  });

  console.log(result);
  return result;
}


function processWordHtml(url, html) {

  console.log(`processing word page ${url}`);

  let $ = cheerio.load(html);

  let result = {
    type: 'word',
    src: url,
    id: getIndexFromUrl(url),
    text: $('.word.script').text(),
    jyutping: $('.cardjyutping').text(),
    pinyin: $('.cardpinyin').text(),
    meaning: '',
    chars: [],
  };

  $('.wordmeaning > div').each(function(i, elem) {
    if (elem.attribs.class) {
      return;
    }
    result.meaning += $(elem).text();
  });

  let char;
  $('.cantodictcharacterblock').contents().each(function(i, elem) {
    if (elem.name === 'span') {
      if (elem.attribs.class == "chinesemed") {
        let a = $(elem).find('a');
        let href = a.attr('href');
        let text = a.text();
        if (text.length == 1) {
          char = {
            type: 'char',
            id: getIndexFromUrl(href),
            src: href,
            text: a.text(),
            meaning: ''
          };
          result.chars.push(char);
        }
      } else if (elem.attribs.class == "summary_jyutping") {
        char.jyutping = $(elem).text();
      }
    } else if (elem.type === 'text') {
      if (!_.isUndefined(char)) {
        char.meaning += elem.data;
      }
    }
  });
  console.log(result);
  return result;
}


function processSearchHtml(html) {
  console.log('processing search page');

  let $ = cheerio.load(html);

  if (_.includes(html, 'does not redirect')) {
    let $lastLink = _.last($("a"));
    let url = $lastLink.attribs["href"];
    return {
      type: 'search',
      entries: [{ src: url}]
    };
  }

  let result = {
    type: 'search',
    entries: [],
  };

  $('.normalpage table').each(function(i, elem) {
    $(elem).find('tr').each(function(i, elem) {
      let tdList = $(elem).find('td');
      let src = $(tdList[0]).find('a').attr('href');
      let id = getIndexFromUrl(src);
      if (!_.isUndefined(src) && (id)) {

        result.entries.push({
          src,
          id,
          type: getTypeFromUrl(src),
          text: $(tdList[1]).text(),
          jyutping: $(tdList[2]).text(),
          pinyin: $(tdList[3]).text(),
          meaning: $(tdList[4]).text()
        });

      }
    });
  });
  return result;
}


/**
 * @param searchText
 * @param searchType: keys of mapSearchType
 * @param callback: to process the HTML that is returned
 */
function searchCantoData(searchText, searchType, callback) {
  console.log(`searching cantodict: ${searchType} '${searchText}'`);
  let mapSearchType = {
    chinese: 2,
    english: 4,
    jyutping: 3,
    word: 1
  };
  request.post(
    'http://www.cantonese.sheik.co.uk/scripts/wordsearch.php?level=0',
    {
      form: {
        TEXT: searchText,
        SEARCHTYPE: mapSearchType[searchType],
        radicaldropdown: 0,
        searchsubmit: "search"
      }
    },
    function (error, response, html) {
      if (!error && response.statusCode == 200) {
        console.log('success with cantodict');
        callback(processSearchHtml(html));
      } else {
        console.log('failed with cantodict');
      }
    });
}


function fetchEntryData(url, callback) {
  console.log(url);
  let type = getTypeFromUrl(url);
  let id = getIndexFromUrl(url);
  console.log(`fetching url ${url}`);
  request.get(
    url,
    function(error, response, html) {
      if (!error && response.statusCode == 200) {
        if (type === "word") {
          console.log('success');
          callback(processWordHtml(url, html));
        } else if (type == "char") {
          console.log('success');
          callback(processCharHtml(url, html));
        } else {
          console.log('failed');
        }
      } else {
        console.log('failed');
      }
    });
}


/**
 * Main Loop
 */

let isApp = true;
let isTest = false;


if (isApp) {
  let app = express();
  let indexHtmlText = fs.readFileSync('public/index.html').toString();

  app.get('/', function (request, response) {
    response.send(indexHtmlText);
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(express.static(path.join(__dirname, 'public')))

  app.post('/search', function (request, response) {
    searchCantoData(
      request.body.text,
      request.body.type,
      function (data) {
        if (data.entries.length == 1) {
          fetchEntryData(
            data.entries[0].src,
            function(data) { response.json(data); });
        } else {
          response.json(data)
        }
      });
  });

  app.post('/entry', function (request, response) {
    fetchEntryData(
      request.body.src, function (data) { response.json(data); });
  });

  let server = app.listen(8081, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port)
  });
}

/**
 * Tests
 */

if (isTest) {
  // searchCantoData("禪", "chinese", process);

  processCharHtml(
    'http://www.cantonese.sheik.co.uk/dictionary/characters/380',
    fs.readFileSync('char.htm', 'utf8'));
  //
  // processSearchHtml(fs.readFileSync('search.htm', 'utf8'));
  //
  // processWordHtml(
  //   'http://www.cantonese.sheik.co.uk/dictionary/words/380',
  //   fs.readFileSync('word.htm', 'utf8'));

}
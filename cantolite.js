"use strict";

const cheerio = require('cheerio');
const request = require('request');
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
    entries: [],
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
          src,
          type: 'word',
          text: '',
          meaning: ''
        };
        result.entries.push(word);
      }

    } else if (result.entries.length) {

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
    text: $('.word.script').text(),
    jyutping: $('.cardjyutping').text(),
    pinyin: $('.cardpinyin').text(),
    meaning: '',
    entries: [],
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
        char = undefined;
        if (text.length == 1) {
          char = {
            type: 'char',
            src: href,
            text: a.text(),
            meaning: ''
          };
          result.entries.push(char);
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
  console.log(`fetching ${url}`);
  let type = getTypeFromUrl(url);
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
          console.log("couldn't parse html");
        }
      } else {
        console.log('got error from server');
      }
    });
}


module.exports = {
  searchCantoData: searchCantoData,
  fetchEntryData: fetchEntryData,
  processWordHtml: processWordHtml,
  processCharHtml: processCharHtml,
  processSearchHtml: processSearchHtml
};
"use strict";


function trim(s) {
  let result = $.trim(s);
  while ((result.length > 0) &&
    ((result[0] === " ") || (result[0] === "=") || (result[0] === "-"))) {
    result = result.substring(1, result.length);
  }
  return result;
}

function splitAndTrimLines(s) {
  let lines = s.split(/\r?\n/);
  lines = lines.map(function (line) { return trim(line) });
  while (lines[0] === "") {
    lines = lines.splice(1, lines.length);
  }
  while (lines[lines.length-1] === "") {
    lines = lines.splice(0, lines.length-1);
  }
  return lines;
}


function addStatus(status) {
    $('#content')
      .prepend(
        $('<div class="status">')
          .attr('style', 'font-style: italic')
          .text(status));
}


function fetchEntry(entry) {
  return function (e) {
    e.preventDefault();
    addStatus('Fetching entry...');
    $.post('/entry', {src: entry.src }, processData, 'json');
  };
}

function renderEntries($content, entries) {
  $.each(entries, function (i, entry) {
    let $div = $('<div>');
    $content.append($div);

    $div.append(
      $('<span class="small-label">')
        .text(entry.type + ":"));
        
    $div.append(" ");

    let $a = $('<a>');
    $a.click(fetchEntry(entry));
    $a.attr('href', entry.src);
    $a.attr('id', entry.type + "-" + entry.id);
    $a.text(entry.text);
    $div.append($a);

    $div.append(" - ");
    $div.append(
      $('<span style="font-style: italic">')
        .text(entry.jyutping));

    $div.append(" - ");
    $div.append(trim(entry.meaning));
  });
}


function renderSingleEntry($content, data) {
  let $table = $('<table>');
  $content.append($table);

  $table.append($('<tr>')
    .append($("<td>").addClass('table-left').text(data.type))
    .append($("<td>").addClass('big-text').text(data.text)));

  $table.append($('<tr>')
    .append($("<td>").addClass('table-left').text('jyutping'))
    .append($("<td>").addClass('jyutping').text(data.jyutping)));

  $table.append($('<tr>')
    .append($("<td>").addClass('table-left').text('pinyin'))
    .append($("<td>").addClass('pinyin').text(data.pinyin)));

  {
    let $td = $('<td>');
    $table.append($('<tr>')
      .append($("<td>").addClass('table-left').text('unicode'))
      .append($td));
    for (let c of data.text) {
      $td.append('&amp;#' + c.charCodeAt() + "; ");
    };
  }
  
  {
    let $td = $('<td>');
    $table.append($('<tr>')
      .append($("<td>").addClass('table-left').text('meaning'))
      .append($td));
    let lines = splitAndTrimLines(data.meaning);
    $.each(lines, function(i, line) {
      $td.append(line + "<br>");
    });
  }
}


function renderSearchData(data) {
  let $content = $('#content');
  $content.html("");
  if (data.entries.length) {
    renderEntries($content, data.entries);
  } else {
    addStatus('No entries found.');
  }
}


function renderWordData(data) {
  let $content = $('#content');
  $content.html("");
  renderSingleEntry($content, data);
  $content.append($("<div>").addClass('divider'));
  renderEntries($content, data.chars);
}


function renderCharData(data) {
  let $content = $('#content');
  $content.html("");
  renderSingleEntry($content, data);
  $content.append($("<div>").addClass('divider'));
  renderEntries($content, data.words);
}


function processData(data) {
  console.log('process data', data);

  if (data.type === "search") {
    renderSearchData(data);
  } else if (data.type === "word") {
    renderWordData(data);
  } else if (data.type === "char") {
    renderCharData(data);
  } else {
    addStatus('No entries found.');
  }

  let $content = $('#content');
  if (data.src) {
    $content.append("<br>");
    $content.append(
      $("<a>").attr("href", data.src).text("[source page]"));
  }
  $content.append("<br>");
}


function submit(e) {
  e.preventDefault();
  let data = {
    type: $("input[name='search-type']:checked").val(),
    text: $("#search-text").val()
  };
  addStatus('Searching...');
  $.post("/search", data, processData, 'json');
}


$('#search-form').submit(submit);


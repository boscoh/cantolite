"use strict";


function trim(s) {
  let result = $.trim(s).replace(/\s\s+/g, ' ');
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

function loadingMessage(msg) {
  $.mobile.loading( 'show', {
    text: msg,
    textVisible: true
  });
}

function fetchEntry(entry) {
  return function (e) {
    e.preventDefault();
    loadingMessage(entry.text);
    $.post('/entry', {src: entry.src }, processData, 'json');
  };
}

function renderEntries($content, entries) {
  $.each(entries, function (i, entry) {
    let $div = $('<div style="line-height: 1.2em">');
    $content.append($div);

    let $a = $('<a>');
    $a.click(fetchEntry(entry));
    $a.attr('href', entry.src);
<<<<<<< HEAD
    $a.addClass("ui-input-btn ui-btn ui-btn-inline");
    $a.attr('style', "float: left; margin: 0 10px 0 0;");
    $a.text(entry.text);
    $div.append($a);

    $div.append($('<div style="height: 0.5em;">'))
=======
    $a.text(entry.text);
    $div.append($a);

>>>>>>> 7370a1943146ae314a53966ce41109c8dc91b69d
    if (entry.jyutping) {
      $div.append(" - ");
      $div.append(
        $('<span style="font-style: italic">')
          .text(entry.jyutping));
    }

    $div.append(" - ");
    $div.append(trim(entry.meaning));
    $div.append("<br clear=all>");
    
    $div.append($('<div style="height: 0.4em;">'))
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
    $content.text('No entries found.');
  }
}


function renderWordData(data) {
  let $content = $('#content');
  $content.html("");
  renderSingleEntry($content, data);
  $content.append($("<div>").addClass('divider'));
  renderEntries($content, data.entries);
}


function renderCharData(data) {
  let $content = $('#content');
  $content.html("");
  renderSingleEntry($content, data);
  $content.append($("<div>").addClass('divider'));
  renderEntries($content, data.entries);
}


function processData(data) {
  console.log('process data', data);

  $.mobile.loading( 'hide');

  if (data.type === "search") {
    renderSearchData(data);
  } else if (data.type === "word") {
    renderWordData(data);
  } else if (data.type === "char") {
    renderCharData(data);
  } else {
    $('#content').text('No entries found.');
  }

  let $content = $('#content');

<<<<<<< HEAD
  $content.append("<br>");

=======
>>>>>>> 7370a1943146ae314a53966ce41109c8dc91b69d
  if (data.src) {
    $('#source-page').html(
      $("<a>").attr("href", data.src).text("page"));
  }
}

function submit(e) {
  e.preventDefault();
  let text = $("#search-text").val();
  let data = {
    type: $("input[name='search-type']:checked").val(),
    text: text,
  };
  loadingMessage(text);
  $.post("/search", data, processData, 'json');
}


$('#search-form').submit(submit);

$( document ).bind( 'mobileinit', function(){
  $.mobile.loader.prototype.options.text = "loading";
  $.mobile.loader.prototype.options.textVisible = true;
  $.mobile.loader.prototype.options.theme = "d";
  $.mobile.loader.prototype.options.html = "";
});
/**
 * A server to manage a chinese dictionary wrapper for cantodict.
 * Created by boscoh on 23/12/2016.
 */

"use strict";

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const cantolite = require('./cantolite.js');

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')))
app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname + '/public/index.html'));;
});


app.post('/search', function (request, response) {
  cantolite.searchCantoData(
    request.body.text,
    request.body.type,
    function (data) {
      if (data.entries.length == 1) {
        cantolite.fetchEntryData(
          data.entries[0].src,
          function(data) { response.json(data); });
      } else {
        response.json(data)
      }
    });
});

app.post('/entry', function (request, response) {
  cantolite.fetchEntryData(
    request.body.src, function (data) { response.json(data); });
});

let server = app.listen(8080, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log(`Server listening at http://${host}:${port}`);
});


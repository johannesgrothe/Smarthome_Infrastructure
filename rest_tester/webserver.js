"use strict";
console.log("REST-Tester started.");

const express = require('express');
const port = 3005;
const app = express();

let response = (req, res, type) => {
  let resp_obj = {
    type: type,
    path: req.path,
    accept: req.headers.accept,
    body: req.body
  };

  res.status(200).send(resp_obj);
};


app.get('*', (req, res) => {
  console.log("GET aufgerufen");
  response(req, res, "GET")
});


app.post('*', (req, res) => {
  console.log("POST aufgerufen");
  response(req, res, "POST")
});


app.put('*', (req, res) => {
  console.log("PUT aufgerufen");
  response(req, res, "PUT")
});


app.delete('*', (req, res) => {
  console.log("DELETE aufgerufen");
  response(req, res, "DELETE")
});

app.listen(port, () => console.log("NodeJS Webserver Port: " + port));
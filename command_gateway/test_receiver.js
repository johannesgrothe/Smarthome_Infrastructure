"use strict"
/*
* NAMESPACE
*/
const http = require('http');
let SERVER = process.env.HOST;
if (SERVER === undefined) {
  // SERVER = "192.168.178.111";
  SERVER = "localhost";

}
const PORT = 3011;

const client_id = "tester1213";

let express = require('express');
let bodyParser = require('body-parser');
let tester = express();

tester.use(bodyParser.json());

function make_id(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

tester.post('/command', (req, res) => {
  let time = req.body["timestamp"];
  let com = req.body["command"];
  if (time !== undefined && com !== undefined) {
    console.log(`[i] New Command: ${time} : ${com}`);
    res.status(200).send("OK");
  } else {
    console.log(`[x] Illegal Command: ${time} : ${com}`);
    res.status(400).send("Bad Data");
  }
});

function get_time() {
  const gateway_options = {
    hostname: SERVER,
    port: 3006,
    path: '/time'
  };

  const request_options = {
    hostname: gateway_options.hostname,
    port: gateway_options.port,
    path: gateway_options.path,
    method: 'GET'
  };

  const req = http.request(request_options, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      console.log(`[i] Received Time from Server: ${data}`)
    });

    response.on('error', () => {
      console.log("[x] Couldn't sync time")
    });

  }).on("error", (err) => {
    console.log("[x] Couldn't sync time")
  });

  req.end();
}

function register_gateway() {
  const gateway_options = {
    hostname: SERVER,
    port: 3006,
    path: '/login'
  };

  const request_options = {
    hostname: gateway_options.hostname,
    port: gateway_options.port,
    path: gateway_options.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  let register_str = JSON.stringify({id: client_id, port: PORT});

  const req = http.request(request_options, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      if (response.statusCode === 200 || response.statusCode === 201) {
        console.log("[i] Registeriung erfolgreich.")
      } else {
        console.log("[x] Registeriung Fehlgeschlagen.")
      }
    });

    response.on('error', () => {
      console.log("[x] Registeriung Fehlgeschlagen.")
    });

  }).on("error", (err) => {
    console.log("[x] Registeriung Fehlgeschlagen.")
  });

  req.write(register_str);
  req.end();
}


register_gateway();

get_time();

tester.listen(PORT, () => console.log("[i] Tester:" + PORT));
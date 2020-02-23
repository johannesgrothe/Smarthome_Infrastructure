"use strict"
/*
* NAMESPACE
*/
const http = require('http');
let SERVER = process.env.HOST;
if (SERVER === undefined) {
  SERVER = "localhost";
}
const PORT = 3006;

let clients = [];

let add_client = (id, host, port) => {
  if (host === undefined || port === undefined || id === undefined) {
    return false;
  }
  clients.push({id: id, hostname: host, port: port});
  return true;
};

let express = require('express');
let bodyParser = require('body-parser');
let gateway = express();

gateway.use(bodyParser.json());

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

let get_time = () => {
  return (new Date().valueOf());
};

let forward_command = (command) => {
  let local_time = get_time();
  let in_timestamp = command["timestamp"];
  let in_command = command["command"];

  if (in_timestamp === undefined && in_command === undefined) {
    console.log(`[x] Received illegal command data`);
    return false;
  }

  if (in_timestamp === undefined) {
    console.log(`[x] Couldn't forward Command '${in_command}': No Timestamp found.`);
    return false;
  }

  if (in_command === undefined) {
    console.log(`[x] Couldn't forward Command: Timestamp found but Command missing.`);
    return false;
  }

  /*
    if (in_timestamp >= (local_time + 20)) {
      console.log(`[x] Couldn't forward Command '${in_command}': Timestamp is in the future.`);
      return false;
    }

    if (in_timestamp <= (local_time + -100)) {
      console.log(`[x] Couldn't forward Command '${in_command}': Command outdated.`);
      return false;
    }
  */

  console.log(`[i] Forwarding command '${in_command}' to ${clients.length} clients`);
  for (let client of clients) {
    forward_command_to_client(command, client);
  }
  return true;
};

let forward_command_to_client = (command, client) => {
  let out_str = JSON.stringify(command);

  const request_options = {
    hostname: client.hostname,
    port: client.port,
    path: "/command",
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(request_options, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      if (response.statusCode === 200) {
        console.log(`    [✓] ${client.id}`)
      } else {
        console.log(`   [x] ${client.id}`)
      }
    });

    response.on('error', () => {
      console.log(`   [x] ${client.id}`)
    });

  }).on("error", (err) => {
    console.log(`   [x] ${client.id}`)
  });

  req.write(out_str);
  req.end();
};

gateway.post('/command', (req, res) => {
  let in_timestamp = req.body["timestamp"];
  let in_command = req.body["command"];
  let out_json = {
    timestamp: in_timestamp,
    command: in_command
  };
  let forward_status = forward_command(out_json);
  if (forward_status)
    res.status(200).send("OK");
  else
    res.status(400).send("Error");
});

gateway.post('/login', (req, res) => {
  let new_id = req.body["id"];
  let new_host = req.hostname;
  let new_port = req.body["port"];
  if (add_client(new_id, new_host, new_port)) {
    res.status(200).send("Client registered");
    console.log(`[i] New Client '${new_id}' (${new_host}:${new_port})`);
  } else {
    res.status(400).send("[x] Adding Client failed.");
  }
});

gateway.get('/time', (req, res) => {
  let time = get_time();
  console.log(`[i] Client asking for time...`);
  let time_str = `${time}`;
  res.status(200).send(time_str);
});

function checkAcceptHeader(req) {
  if (req.headers["Accept"] === undefined) {
    return req.headers["accept"] === "application/json" || req.headers["accept"] === "*/*";
  }
  return req.headers["Accept"] === "application/json" || req.headers["Accept"] === "*/*";
}

function checkContentHeader(req) {
  if (req.headers["Content-Type"] === undefined) {
    return req.headers["content-type"] === "application/json" || req.headers["content-type"] === "*/*";
  }
  return req.headers["Content-Type"] === "application/json" || req.headers["Content-Type"] === "*/*";
}

gateway.listen(PORT, () => console.log("[i] Launching Smarthome Command Gateway: " + SERVER + ":" + PORT));
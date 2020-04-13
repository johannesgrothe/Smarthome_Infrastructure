"use strict"
/*
* NAMESPACE
*/
const http = require('http');
const mqtt = require('mqtt');

// Basic

const remote_types = ["homebridge"];

let clients = [];

let gadgets = [];

let codes = {};

function make_id(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

let get_time = () => {
  let time = new Date().valueOf();
  return time;
};

let forward_command = (command) => {
  let local_time = get_time();
  let in_timestamp = command["timestamp"];
  let in_command = command["command"];

  if (in_timestamp === undefined && in_command === undefined) {
    console.log(`[x] Received illegal command data`);
    // return false;
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

let add_client = (id, network) => {
  if (network["type"] === undefined || id === undefined) {
    return false;
  }
  for (let client of clients) {
    if (client["id"] === id) {
      client["network"] = network;
      console.log(`[i] Client '${id}' updated: (${JSON.stringify(network)})`);
      return true;
    }
  }
  console.log(`[i] Client '${id}' added: (${JSON.stringify(network)})`);
  clients.push({id: id, network: network});
  return true;
};

let get_gadget = (gadget_name) => {
  for (let gadget of gadgets) {
    if (gadget["name"] === gadget_name) {
      return gadget
    }
  }
  return false;
}

let add_gadget = (gadget_name, service, characteristics, remotes) => {
  let buf_gadget = {};
  buf_gadget["name"] = gadget_name;
  buf_gadget["service"] = service;

  //characteristics
  buf_gadget["characteristics"] = {};
  for (let characteristic in characteristics) {
    if (characteristics.hasOwnProperty(characteristic)) {
      let charac_data = characteristics[characteristic];
      buf_gadget["characteristics"][characteristic] = {};
      if (charac_data.hasOwnProperty("min")) {
        buf_gadget["characteristics"][characteristic]["min"] = Number(charac_data["min"]);
      } else {
        buf_gadget["characteristics"][characteristic]["min"] = 0;
      }
      if (charac_data.hasOwnProperty("max")) {
        buf_gadget["characteristics"][characteristic]["max"] = Number(charac_data["max"]);
      } else {
        buf_gadget["characteristics"][characteristic]["max"] = 100;
      }
      if (charac_data.hasOwnProperty("step")) {
        buf_gadget["characteristics"][characteristic]["step"] = Number(charac_data["step"]);
      } else {
        buf_gadget["characteristics"][characteristic]["step"] = 1;
      }
    }
  }

  // remotes
  buf_gadget["remotes"] = [];
  if (remotes !== undefined) {
    for (let remote of remote_types) {
      if (remotes.includes(remote)) {
        buf_gadget["remotes"].push(remote);
      }
    }
  }
  let existing_gadget = get_gadget(gadget_name);
  if (existing_gadget) {
    if (existing_gadget["service"] === buf_gadget["service"]) {
      console.log(`[i] Updating "${service}" ${gadget_name}`);
    } else {
      console.log(`[i] Updating ${gadget_name}: "${existing_gadget["service"]}" => "${service}"`);
    }
    gadgets = gadgets.filter(item => item !== existing_gadget);
    gadgets.push(buf_gadget);
  } else {
    console.log(`[i] Adding new "${service}" ${gadget_name}`);
    gadgets.push(buf_gadget);
  }
  console.log(gadgets);
};

let get_network_types = () => {
  return ["mqtt"];
}

let forward_code = (type, code, timestamp) => {
  let network_types = get_network_types();
  if (network_types.includes("mqtt")) {
    let res_json = {};
    res_json["type"] = type;
    res_json["code"] = code;
    res_json["timestamp"] = timestamp;
    mqtt_client.publish("smarthome/from/code", JSON.stringify(res_json));
  }
}

let handle_code = (type, code, timestamp) => {
  let ident = `${type}_${code}`;

  if (timestamp > get_time()) {
    console.log("  [x] Cannot add code: timestamp is in the future");
    return false;
  }

  // if (timestamp + 2000 < get_time()) {
  //   console.log("  [x] Cannot add code: timestamp is too far in the past");
  //   return false;
  // }

  if (codes[ident] !== undefined) {
    if (codes[ident] > timestamp + 150) {
      console.log("  [i] Code not forwarded: doubled code");
      return true;
    }
    console.log("  [i] Code forwarded");
    forward_code(type, code, timestamp);
    codes[ident] = timestamp;
    console.log(codes);
  } else {
    console.log("  [i] Code forwarded");
    forward_code(type, code, timestamp);
    codes[ident] = timestamp;
    console.log(codes);
  }
  return true;
};

// MQTT

let MQTT_SERVER = process.env.HOST;
if (MQTT_SERVER === undefined) {
  MQTT_SERVER = "mqtt://mosquitto";
}
const MQTT_PORT = 1883;
const mqtt_client = mqtt.connect(`${MQTT_SERVER}:${MQTT_PORT}`)

let respond_mqtt = (id, status) => {
  mqtt_client.publish("smarthome/from/response", `"request_id": ${id}, "status": "${status}"`);
};

let check_body = (message, needed_keys) => {
  let body;
  try {
    body = JSON.parse(message);
  } catch (error) {
    console.log("[x] Cannot parse Body");
    return false;
  }
  for (let k = 1; k < needed_keys.length; k++) {
    if (body[needed_keys[k]] === undefined) {
      console.log(`[x] Argument missing: ${needed_keys[k]}`);
      return false;
    }
  }
  return body;
};

mqtt_client.on('connect', () => {
  console.log("[MQTT] Launching Smarthome MQTT Gateway");
  mqtt_client.subscribe('smarthome/#')
  mqtt_client.publish('smarthome/status', 'Bridge launched')
})

mqtt_client.on('message', (topic, message) => {
  if (topic.startsWith('smarthome/to/') || topic.startsWith('smarthome/status')) {
    console.log(`[MQTT] Topic: ${topic}, Message: ${message}`);
    try {
      let body;
      switch (topic) {
        case 'smarthome/to/client/add':
          body = check_body(message.toString(), ["id"])
          if (body) {
            let network = {};
            network["type"] = "mqtt";
            let req_id;
            try {
              req_id = body["request_id"];
            } catch (error) {
              req_id = 0;
            }
            if (add_client(body["id"], network)) {
              respond_mqtt(req_id, "ACK");
              console.log("[i] ACK");
            } else {
              respond_mqtt(req_id, "ERR");
              console.log("[i] ERR");
            }
          }
          break;
        case 'smarthome/to/gadget/add':
          body = check_body(message.toString(), ["name", "service", "characteristics"])
          if (body) {
            add_gadget(body["name"], body["service"], body["characteristics"]);
          }
          break;
        case 'smarthome/to/code':
          body = check_body(message.toString(), ["type", "code", "timestamp"])
          if (body) {
            let req_id;
            try {
              req_id = body["request_id"];
            } catch (error) {
              req_id = 0;
            }
            if (handle_code(String(body["type"]), Number(body["code"]), Number(body["timestamp"]))) {
              respond_mqtt(req_id, "ACK");
            } else {
              respond_mqtt(req_id, "ERR");
            }
          }
          break;
        case 'smarthome/to/time':
          mqtt_client.publish("smarthome/from/time", String(get_time()));
          break;
        default:
          console.log("[x] Unknown Message");
      }
    } catch (error) {
      console.log("[x] " + error);
    }
  }
})

// HTTP

let HTTP_SERVER = process.env.HOST;
if (HTTP_SERVER === undefined) {
  HTTP_SERVER = "localhost";
}
const HTTP_PORT = 3006;

let express = require('express');
let bodyParser = require('body-parser');
let http_gateway = express();

http_gateway.use(bodyParser.json());

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

http_gateway.post('/command', (req, res) => {
  let in_timestamp = req.body["timestamp"];
  let in_command = req.body["command"];
  console.log(req.body);
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

http_gateway.post('/login', (req, res) => {
  let con_parts = req.connection.remoteAddress.split(":");
  let ip = con_parts[con_parts.length - 1];
  let new_id = req.body["id"];
  let network = {};
  network["type"] = "http";
  network["ip"] = ip;
  network["port"] = req.body["port"];
  if (add_client(new_id, network)) {
    res.status(200).send("Client registered");
  } else {
    res.status(400).send("Adding Client failed.");
  }
});

http_gateway.get('/time', (req, res) => {
  let time = get_time();
  console.log(`[i] Client asking for time...`);
  let time_str = `${time}`;
  res.status(200).send(time_str);
});

http_gateway.get('/gadgets', (req, res) => {
  console.log(`[i] Client asking for gadgets...`);
  res.status(200).send(JSON.stringify(gadgets));
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

http_gateway.listen(HTTP_PORT, () => console.log("[i] Launching Smarthome REST Gateway: " + HTTP_SERVER + ":" + HTTP_PORT));
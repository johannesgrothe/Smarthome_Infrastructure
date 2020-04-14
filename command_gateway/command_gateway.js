"use strict"
/*
* NAMESPACE
*/
const http = require('http');
const mqtt = require('mqtt');
let deepEqual = require('deep-equal');

// Basic

const remote_types = ["homebridge"];

const hb_update_id = 1213141516;

let clients = [];

let gadgets = [];

let codes = {};

let get_time = () => {
  let time = new Date().valueOf();
  return time;
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
};

let update_remotes = (gadget_name) => {
  console.log("[i] Updating remotes");
  let gadget = get_gadget(gadget_name);
  if (gadget) {
    if (gadget["remotes"].includes("homebridge")) {
      start_homebridge_update(gadget_name);
    }
  }
};

let update_remote_characteristic = (gadget_name, characteristic, value) => {
  console.log(`[i] Updating remotes for '${gadget_name}'/'${characteristic}'`);
  let gadget = get_gadget(gadget_name);
  if (gadget) {
    if (gadget["remotes"].includes("homebridge")) {
      update_homebridge_characteristic(gadget_name, gadget["service"], characteristic, value);
    }
  }
};

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

  // status
  buf_gadget["status"] = {};
  for (let characteristic in buf_gadget["characteristics"]) {
    if (buf_gadget["characteristics"].hasOwnProperty(characteristic)) {
      if (existing_gadget && existing_gadget["status"][characteristic] !== undefined) {
        buf_gadget["status"][characteristic] = existing_gadget["status"][characteristic];
      } else {
        buf_gadget["status"][characteristic] = buf_gadget["characteristics"][characteristic]["min"];
      }
    }
  }

  // save gadget
  if (existing_gadget) {
    if (deepEqual(existing_gadget, buf_gadget)) {
      console.log(`[✓] No need for update`);
    } else {
      console.log(`[✓] Updating "${existing_gadget["service"]} ${gadget_name}`);
      gadgets = gadgets.filter(item => item !== existing_gadget);
      gadgets.push(buf_gadget);
      update_remotes(gadget_name);
    }
  } else {
    console.log(`[✓] Adding new "${service}" ${gadget_name}`);
    gadgets.push(buf_gadget);
    update_remotes(gadget_name);
  }
};

let update_gadget = (gadget_name, characteristic, value) => {
  let buf_gadget = get_gadget(gadget_name);
  if (buf_gadget) {
    if (buf_gadget["status"].hasOwnProperty(characteristic)) {
      if (buf_gadget["status"][characteristic] !== value) {
        console.log(`[i] Updating gadget '${gadget_name}'`);
        buf_gadget["status"][characteristic] = value;
        update_remote_characteristic(buf_gadget["name"], characteristic, value);
      } else {
        console.log(`[i] No update for '${gadget_name}' needed`);
      }
    } else {
      console.log(`[i] No '${characteristic}' in '${gadget_name}' found`);
    }
  }
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


// Homebridge
let block_updates = false;

let start_homebridge_update = (gadget_name) => {
  console.log("[i] Starting Homebridge Update");
  let payload = {};
  payload["name"] = gadget_name;
  payload["request_id"] = hb_update_id;
  mqtt_client.publish("homebridge/to/get", JSON.stringify(payload));
};

let convert_name_to_homebridge = (name) => {
  switch (name) {
    case "lightbulb":
      return "Lightbulb"
    default:
      return name.charAt(0).toUpperCase() + name.slice(1);
  }
};

let finish_homebridge_update = (response_json) => {
  let generate_homebridge_json = (gadget_json) => {
    let gadget_name = gadget_json["name"];
    let homebridge_json = {};
    homebridge_json["request_id"] = hb_update_id;
    homebridge_json["name"] = gadget_name;
    homebridge_json["name"] = gadget_name;
    homebridge_json["service"] = convert_name_to_homebridge(gadget_json["service"]);

    let add_characteristic = (charac_name) => {
      if (gadget_json["characteristics"].hasOwnProperty(charac_name)) {
        let hb_charac_name = convert_name_to_homebridge(charac_name);
        homebridge_json[hb_charac_name] = {};
        homebridge_json[hb_charac_name]["min"] = gadget_json["characteristics"][charac_name]["min"];
        homebridge_json[hb_charac_name]["max"] = gadget_json["characteristics"][charac_name]["max"];
        homebridge_json[hb_charac_name]["step"] = gadget_json["characteristics"][charac_name]["step"];
      }
    };

    if (gadget_json["service"] === "lightbulb") {
      add_characteristic("brightness");
      add_characteristic("saturation");
      add_characteristic("hue");
    }
    if (gadget_json["service"] === "fan") {
      add_characteristic("rotationspeed");
    }
    return homebridge_json;
  };

  if (response_json.hasOwnProperty("ack")) {
    // Gadget deleted or not found
    if (response_json["ack"]) {
      console.log(`[✓] ${response_json["message"]}`);
    } else {
      console.log(`[x] ${response_json["message"]}`);
    }
    let name = response_json["message"].match(/'(.+?)'/g)[0];
    name = name.substr(1, name.length - 2);
    if (response_json["message"] === `accessory '${name}', service_name '${name}' is added.`) {
      return;
    }
    let buf_gadget = get_gadget(name);
    let homebridge_json = generate_homebridge_json(buf_gadget);
    console.log("[i] Re-adding Gadget " + name);
    mqtt_client.publish("homebridge/to/add", JSON.stringify(homebridge_json));
  } else {
    // Gadget Found
    if (Object.keys(response_json).length === 2) {
      let gadget_name = Object.keys(response_json)[0];
      if (gadget_name === "request_id") {
        gadget_name = Object.keys(response_json)[1];
      }
      let payload = {};
      payload["name"] = gadget_name;
      payload["request_id"] = hb_update_id;
      console.log("[i] Deleting homebridge-config");
      mqtt_client.publish("homebridge/to/remove", JSON.stringify(payload));
    } else {
      console.log(`[x] Response-json length: ${Object.keys(response_json).length}`);
    }
  }
};

let update_homebridge_characteristic = (gadget_name, service, characteristic, value) => {
  if (!block_updates) {
    let payload = {};
    payload["name"] = gadget_name;
    payload["service_name"] = gadget_name;
    payload["service_type"] = convert_name_to_homebridge(service);
    payload["characteristic"] = convert_name_to_homebridge(characteristic);
    payload["value"] = value;
    payload["request_id"] = hb_update_char_id;
    mqtt_client.publish("homebridge/to/set", JSON.stringify(payload));
  }
};

let handle_homebridge_update = (update_json) => {
  console.log("[i] Gadget Update Requested from Homebridge");
  block_updates = true;
  update_gadget(update_json["name"], update_json["characteristic"].toLowerCase(), Number(update_json["value"]));
  block_updates = false;
};

// MQTT
let MQTT_SERVER = process.env.MQTT_HOST;
if (MQTT_SERVER === undefined) {
  MQTT_SERVER = "mqtt://mosquitto";
}
const MQTT_PORT = 1883;
const mqtt_client = mqtt.connect(`${MQTT_SERVER}:${MQTT_PORT}`)

let respond_mqtt = (id, status) => {
  if (id === undefined) {
    id = 0;
  }
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
  mqtt_client.subscribe('smarthome/#');
  mqtt_client.publish('smarthome/status', 'Bridge launched');

  mqtt_client.subscribe('homebridge/from/response');
  mqtt_client.subscribe('homebridge/from/set');
})

mqtt_client.on('message', (topic, message) => {
  if (topic.startsWith('smarthome/to/') || topic.startsWith('smarthome/status') || topic.startsWith('homebridge/from/')) {
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
            add_gadget(body["name"], body["service"], body["characteristics"], body["remotes"]);
            respond_mqtt(body["request_id"], "ACK");
          } else {
            respond_mqtt(body["request_id"], "ERR");
          }
          break;
        case 'smarthome/to/gadget/update':
          body = check_body(message.toString(), ["name", "characteristic", "value"])
          if (body) {
            update_gadget(body["name"], body["characteristic"], body["value"]);
            respond_mqtt(body["request_id"], "ACK");
          } else {
            respond_mqtt(body["request_id"], "ERR");
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
        case 'homebridge/from/response':
          body = check_body(message.toString(), ["request_id"])
          if (body) {
            if (body["request_id"] === hb_update_id) {
              finish_homebridge_update(body);
            }
          }
          break;
        case 'homebridge/from/set':
          body = check_body(message.toString(), ["name", "characteristic", "value"])
          if (body) {
            handle_homebridge_update(body);
          }
          break;
        default:
          console.log("[x] Unknown Message");
      }
    } catch (error) {
      console.log("[x] " + error);
    }
  }
});


// HTTP
let HTTP_SERVER = process.env.HTTP_HOST;
if (HTTP_SERVER === undefined) {
  HTTP_SERVER = "localhost";
}
const HTTP_PORT = 3006;

let express = require('express');
let bodyParser = require('body-parser');
let http_gateway = express();

http_gateway.use(bodyParser.json());

http_gateway.get('/gadgets', (req, res) => {
  console.log(`[i] Client asking for gadgets...`);
  res.status(200).send(gadgets);
});

http_gateway.get('/clients', (req, res) => {
  console.log(`[i] Client asking for clients...`);
  res.status(200).send(JSON.stringify(clients));
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
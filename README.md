# Smarthome_Infrastructure

A Docker-Compose Container Setup implementing a Bridge for Controllers using the Smarthome_ESP32 Software

## Gadget Types
Gadgets can have one of the following Types:
- `lightbulb`
- `doorbell`
- `fan`

## Gadget Characteristics
Gadgets can have one of the following Types:
### Boolean
#### Types
- `status`
#### Configuration Parameters
Boolean Type Does not need any Configuration Parameters

### Number:
#### Types
- `brightness`
- `hue`
- `saturation`
- `rotationspeed`
#### Configuration Parameters
- `min`
- `max`
- `step`


## Protocol Definition

### Client
#### Adding new Client
MQTT Topic: `smarthome/to/client/add`

MQTT Payload Structure:
##### Required Information:
- `id` A String ID to identify the Controller, has to be unique to the whole Setup

##### Optional Information:
- `request_id` A Integer ID that will be included in the response

#### Write Client Config
to be done

### Gadget
#### Adding new Gadget
MQTT Topic: `smarthome/to/gadget/add`

MQTT Payload Structure:
##### Required Information:
- `name` A String ID to identify the Gadget, has to be unique to the whole Setup
- `service` The Type of the Gadget, has to be one of the Types defined in 'Gadget Types' above
- `characteristics` A JSON-Structure defining all the Characteristics the JSON contains, has to be one of the Characteristics defined in 'Gadget Characteristics' above


##### Optional Information:
- `request_id` An Integer ID that will be included in the response

#### Updating Gadget Characteristic
MQTT Topic: `smarthome/to/gadget/update`

MQTT Payload Structure:
##### Required Information:
- `name` Name of the Gadget to be changed
- `characteristic` Characteristic of the Gadget to be changed
- `value` New Value of the Characteristic

##### Optional Information:
- `request_id` An Integer ID that will be included in the response


### Code
#### Sending Code
MQTT Topic: `smarthome/to/gadget/update`

MQTT Payload Structure:
##### Required Information:
- `type` Type of the Code
- `code` Actual Value of the Code as an 32 Bit Integer
- `timestamp` Timestamp of the Code as a Unix Timestamp

##### Optional Information:
- `request_id` An Integer ID that will be included in the response

#### Receive Code
to be done


### Event
#### Send Event
to be done

#### Receive Event
to be done
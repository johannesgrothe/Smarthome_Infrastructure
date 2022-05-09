FROM node:14

ENV PROJECT_DIR /usr/local/src/Smarthome_Webinterface

WORKDIR ${PROJECT_DIR}

COPY ../.env .
COPY Smarthome_Webinterface .

RUN yarn install

EXPOSE ${WEBINTERFACT_PORT}

CMD [ "yarn", "start" ]

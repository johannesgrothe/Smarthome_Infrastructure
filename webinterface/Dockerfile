FROM node:14

ENV PROJECT_DIR /usr/local/src/Smarthome_Webinterface

WORKDIR ${PROJECT_DIR}

COPY Smarthome_Webinterface .

RUN yarn install

#EXPOSE ${WEBINTERFACT_PORT}
EXPOSE 19006

CMD [ "yarn", "start" ]

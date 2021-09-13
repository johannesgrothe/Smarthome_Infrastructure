FROM node:14

ENV PROJECT_DIR /usr/local/src/Smarthome_Webinterface

WORKDIR ${PROJECT_DIR}

COPY Smarthome_Webinterface .

#WORKDIR ${PROJECT_DIR}/${REPO_NAME}

RUN yarn install

EXPOSE ${WEBINTERFACT_PORT}

CMD [ "yarn", "start" ]

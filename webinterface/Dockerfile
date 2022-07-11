FROM node:16

ARG REST_API_PORT

ENV PROJECT_DIR /usr/local/src/Smarthome_Webinterface
ENV REACT_APP_API_PORT ${REST_API_PORT}
RUN npm i --unsafe-perm -g npm@latest
RUN npm i -g serve

WORKDIR $PROJECT_DIR

COPY Smarthome_Webinterface .

WORKDIR $PROJECT_DIR

RUN yarn install

EXPOSE $WEBINTERFACT_PORT

RUN yarn build

CMD serve -s build -l $WEBINTERFACE_PORT

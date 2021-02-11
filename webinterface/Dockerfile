FROM node:lts

ENV PROJECT_DIR /usr/local/src/smarthome_bridge
ENV REPO_NAME Smarthome_Webinterface

WORKDIR ${PROJECT_DIR}

RUN git clone https://github.com/johannesgrothe/${REPO_NAME}.git
WORKDIR ${PROJECT_DIR}/${REPO_NAME}
RUN git checkout ${WEBINTERFACE_BRANCH}
RUN yarn install
#RUN yarn create react-app smarthome_webinterface

EXPOSE 3000

CMD [ "yarn", "start" ]

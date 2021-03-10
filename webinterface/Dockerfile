FROM node:14

ENV PROJECT_DIR /usr/local/src/smarthome_webinterface
ENV REPO_NAME Smarthome_Webinterface

# Remove for prod, debug only
ENV WEBINTERFACE_BRANCH fb_1_basic_webinterface

WORKDIR ${PROJECT_DIR}

RUN git clone https://github.com/johannesgrothe/${REPO_NAME}.git

WORKDIR ${PROJECT_DIR}/${REPO_NAME}

RUN git checkout ${WEBINTERFACE_BRANCH}

RUN git branch

RUN yarn install

EXPOSE ${WEBINTERFACT_PORT}

CMD [ "yarn", "start" ]

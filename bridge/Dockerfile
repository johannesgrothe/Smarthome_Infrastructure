FROM python:3.8

RUN pip install pipenv

ENV PROJECT_DIR /usr/local/src/smarthome_bridge
ENV REPO_NAME Smarthome_Tools

WORKDIR ${PROJECT_DIR}

RUN git clone https://github.com/johannesgrothe/Smarthome_Tools.git

WORKDIR ${PROJECT_DIR}/${REPO_NAME}

RUN pipenv install --deploy

EXPOSE ${SOCKET_API_PORT}
EXPOSE ${REST_API_PORT}

CMD ["pipenv run python bridge.py --mqtt_ip ${MQTT_IP} --mqtt_port ${MQTT_PORT} --dummy_data --api_port ${REST_API_PORT} --socket_port ${SOCKET_API_PORT}"]
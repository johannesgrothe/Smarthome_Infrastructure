FROM python:3.8

RUN pip install pipenv

ENV PROJECT_DIR /usr/local/src/smarthome_bridge
ENV MQTT_IP 192.168.178.111
ENV MQTT_PORT 1883
ENV API_PORT 4999
ENV SOCKER_PORT 5003

WORKDIR ${PROJECT_DIR}

RUN git clone https://github.com/johannesgrothe/Smarthome_Tools.git

RUN cd Smarthome_Tools/ && pipenv install --system --deploy

EXPOSE ${SOCKET_PORT}
EXPOSE ${API_PORT}

CMD ["pipenv run python Smarthome_Tools/bridge.py --mqtt_ip ${MQTT_IP} --mqtt_port ${MQTT_PORT} --dummy_data --api_port ${API_PORT} --socket_port ${SOCKET_PORT}"]
FROM python:3.9

RUN pip install pipenv

ENV PROJECT_DIR /usr/local/src/smarthome_bridge
ENV REPO_NAME Smarthome_Bridge

# Remove for prod, debug only
ENV BRIDGE_BRANCH fb_3_basic_bridge

WORKDIR ${PROJECT_DIR}

RUN git clone https://github.com/johannesgrothe/${REPO_NAME}.git

WORKDIR ${PROJECT_DIR}/${REPO_NAME}

RUN git checkout ${BRIDGE_BRANCH}

RUN git branch

RUN pipenv install --deploy

# PlatformIO
RUN pip install -U platformio

# Platformio UDEV rules
RUN mkdir /etc/udev
RUN mkdir /etc/udev/rules.d
RUN curl -fsSL https://raw.githubusercontent.com/platformio/platformio-core/master/scripts/99-platformio-udev.rules > 99-platformio-udev.rules
RUN cp 99-platformio-udev.rules /etc/udev/rules.d/99-platformio-udev.rules
RUN pio --version

EXPOSE ${SOCKET_API_PORT}
EXPOSE ${REST_API_PORT}

CMD ["pipenv", "run", "python", "bridge.py", "--mqtt_ip", "${MQTT_IP}", "--mqtt_port", "${MQTT_PORT}", "--dummy_data", "--api_port", "${REST_API_PORT}", "--socket_port", "${SOCKET_API_PORT}", "--bridge_name", "${BRIDGE_NAME}"]

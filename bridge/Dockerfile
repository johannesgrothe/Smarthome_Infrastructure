FROM python:3.9

ENV PROJECT_DIR /usr/local/src/Smarthome_Bridge

WORKDIR ${PROJECT_DIR}

COPY Smarthome_Bridge .

# Pipenv
RUN pip install pipenv
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

CMD ["pipenv", "run", "python", "bridge_main.py", "--mqtt_ip", "${MQTT_IP}", "--mqtt_port", "${MQTT_PORT}", "--api_port", "${REST_API_PORT}", "--socket_port", "${SOCKET_API_PORT}", "--bridge_name", "${BRIDGE_NAME}"]

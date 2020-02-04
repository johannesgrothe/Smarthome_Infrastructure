FROM node:lts
RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install build-essential libssl-dev
RUN apt-get -y install python g++ libavahi-compat-libdnssd-dev
RUN npm install -g --unsafe-perm homebridge
RUN npm i homebridge-server
RUN npm install -g homebridge-mqtt

COPY config.json /root/.homebridge/config.json

EXPOSE 51826
EXPOSE 8765

CMD ["homebridge"]
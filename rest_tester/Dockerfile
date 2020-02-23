FROM node:lts

WORKDIR /usr/src/app

RUN npm install express

COPY . .

EXPOSE 3005

CMD [ "node", "webserver.js" ]
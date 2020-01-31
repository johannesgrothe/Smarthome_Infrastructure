FROM node:lts

WORKDIR /usr/src/app

RUN npm install express

COPY . .

EXPOSE 3000

CMD [ "node", "webserver.js" ]
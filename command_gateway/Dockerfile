FROM node:lts

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --quiet

COPY . .

CMD [ "node", "command_gateway.js" ]

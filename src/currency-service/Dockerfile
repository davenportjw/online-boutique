FROM node:22-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY dist/ ./dist/
COPY src/data/ ./src/data/

EXPOSE 8080

CMD [ "node", "dist/index.js" ]

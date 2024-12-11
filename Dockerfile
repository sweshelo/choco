FROM node:latest
WORKDIR /app

COPY ./src ./src
COPY package*.json ./
COPY build.js ./

RUN npm install && npm run build

CMD ["node", "dist/index.js"]

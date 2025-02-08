FROM node:alpine
WORKDIR /app

RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    echo "Asia/Tokyo" > /etc/timezone && \
    apk del tzdata

COPY ./src ./src
COPY package*.json ./
COPY build.js ./

RUN npm install && npm run build

CMD ["node", "dist/index.js"]

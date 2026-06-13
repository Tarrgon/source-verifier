FROM timbru31/node-alpine-git:22
WORKDIR /app
COPY . .

RUN chown -R node:node /app
RUN chmod 755 /app
RUN npm install
RUN npm run build
RUN apk add chromium
RUN apk add ffmpeg

USER node
CMD ["node", "./dist/index.js"]
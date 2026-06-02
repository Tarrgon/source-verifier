FROM timbru31/node-alpine-git:22
WORKDIR /app
COPY . .

RUN npm install
RUN npm run build
RUN apk add chromium

USER node
CMD ["node", "./dist/index.js"]
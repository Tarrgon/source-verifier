FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
WORKDIR /app/server
RUN npm run build

# ----------

FROM node:22-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/server/dist ./dist

USER node
CMD ["node", "./dist/index.js"]
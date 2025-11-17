# Stage 1
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


# Stage 2
FROM node:20-alpine

WORKDIR /usr/src/app

COPY .env .env

COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/dist ./dist

COPY package.json .

EXPOSE 3001

CMD ["node", "dist/main"]
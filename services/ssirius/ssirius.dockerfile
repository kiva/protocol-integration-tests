FROM node:lts-alpine
RUN mkdir /app
WORKDIR /app

RUN npx create-ssirius-standalone@latest ssi . --skip-install
WORKDIR /app/ssi
RUN npm ci

CMD ["npm", "run", "start"]

EXPOSE 7567

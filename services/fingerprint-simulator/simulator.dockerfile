FROM node:lts-alpine
RUN mkdir /fpapi
WORKDIR /fpapi

COPY . .
RUN npm ci

CMD ["npm", "run", "fpapi"]
EXPOSE 9907
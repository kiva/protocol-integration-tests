FROM node:lts-alpine
RUN mkdir /fpapi
WORKDIR /fpapi

COPY . .
RUN npm ci

CMD ["npm", "run", "fingerprintApi"]
EXPOSE 9907
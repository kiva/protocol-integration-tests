FROM node:carbon-alpine
RUN mkdir www/
WORKDIR www/
ADD integration_tests .
RUN npm install
RUN adduser -S tester
USER tester
CMD [ "npm", "run", "test" ]

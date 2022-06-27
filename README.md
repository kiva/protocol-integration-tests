# Protocol Integration Tests

This is a set of tests that can be run against the backend services and infrastructure that make up Kiva Protocol to
verify that a variety of basic use cases are functional.

## Components Under Test

The services tested are:
- [Gateway](https://github.com/kiva/protocol-gateway)
- [Aries Key Guardian](https://github.com/kiva/aries-key-guardian)
- [Aries Guardianship Agency](https://github.com/kiva/aries-guardianship-agency)
- [Bio Auth Service](https://github.com/kiva/guardian-bio-auth/tree/main/bio_auth_service)
- [Bioanalyzer Service](https://github.com/kiva/guardian-bio-auth/tree/main/bioanalyzer_service)
- [Demo Controller](https://github.com/kiva/protocol-demo)
- [FSP Controller](https://github.com/kiva/protocol-aries-controllers)
- [Kiva Controller](https://github.com/kiva/protocol-aries-controllers)

The infrastructure tested is:
- Multitenant (Used by Aries Guardianship Agency)
- Tails Server (Used by Multitenant)
- Indy Pool (Used by Aries Guardianship Agency, Multitenant, and Tails Server)
- Auth DB (Used by Aries Key Guardian)
- Identity DB (Used by FSP Controller)
- Identity Template DB (Used by Bio Auth Service)
- Identity Wallet DB (Used by Multitenant)

## Pre-requisites

You need to have the following installed locally:
- Git
- Docker
- Docker-Compose
- NPM
- NodeJS

## Setup

1. Clone the repo
    ```
    git clone https://github.com/kiva/protocol-integration-tests
    cd protocol-integration-tests
    ```
2. Copy the contents of `dummy.env` into `.env`. You can do this manually, or via a script:
    ```
    ./scripts/setup_env.sh
    ```
3. Install the integration tests' dependencies by running `npm install`
4. If you have not already, pull the Aries Cloudagent Python (AcaPy) image from Docker.
    ```
    docker pull bcgovimages/aries-cloudagent:py36-1.16-1_0.7.1
    ```

## How to Run the Tests

Running the tests is super simple! Just bring up the docker-compose, set up your test fixtures, and run the tests. Like this:

```
docker-compose up -d
./scripts/setup_fixtures.sh
npm run test
```

The version of each service tested will be whichever version is currently tagged with `latest` in
[dockerhub](https://hub.docker.com/orgs/kivaprotocol/repositories).

### Building the Frontend

The default behavior of this repo is to build only our backend stack for testing. But you can build our frontend out, too!

To do so, simply add the `--profile frontend` to the `docker-compose up` command in the steps above. Please note that it takes some time to build out these Docker images.

```
docker-compose --profile frontend up -d
./scripts/setup_fixtures.sh
npm run test
```

Once the the Docker script finishes running (and it may take a while!), you can head to `http://localhost:7567` in your browser window to test out our services. (Please note that right now the only UI paths that will work are those related to fingerprint scanning. Verification and Issuing using QR codes or SMS is not currently supported.)

We are currently working on writing tests against our frontend. Stay tuned!

## How to Test a Particular Change

The real value of the these integration tests is that it makes testing changes across components easy.

For example, if you want to make some changes to the way fingerprints are processed, you will likely need up update
Bio Auth Service. How do you know that those changes didn't break authentication? Run the tests!

1. **Make your changes in the target code base.** In this example, you'd have a local clone of Bio Auth Service and
   you'd have some local changes.
2. **Build a docker image from your local changes.** In this example, you'd navigate to Bio Auth Service's parent 
   directory (`guardian-bio-auth`) and run `docker build -f Dockerfile.bioauthservice .`.
3. **Tag your locally built docker image.** In this example, you'd run `docker tag bio-auth-service bio-auth-service:local`
4. **Update .env to reference your locally build docker image.** In this example, you'd edit `.env` such that the line
   that line which sets the image for Bio Auth Service reads: `BIO_AUTH_SERVICE_IMAGE=bio-auth-service:local`
5. **Run the tests like normal**

You can do this for as many services as you like! You could, for example, update the images for Bio Auth Service,
Bioanalyzer Service, and Aries Key Guardian and test them all together at the same time.

You can also test changes to infrastructure in a similar way. Instead of updating `.env`, though, you'd directly update
the image for the relevant container in `docker-compose.yml`.

## Using Auth0

These tests were initially meant to be run using an authentication token from [Auth0](https://auth0.com/), because the Protocol project was originally built using Auth0 as the permissioning system for network requests.

We have disabled the use of bearer tokens in this repo by default, but if you have an Auth0 account, you can enable authentication headers with the following steps:

1. Using the values from your Auth0 account, add values for the following environment variables to `.env`:
   ```
   AUTH0_DOMAIN=<auth0 domain>
   AUTH0_CLIENT_ID=<auth0 client ID>
   AUTH0_CLIENT_SECRET=<auth0 client secret>
   AUTH0_EXPIRED_TOKEN=<valid, but expired auth0 token>
   AUTH0_USER_CLIENT_ID=<auth0 user client ID>
   AUTH0_USERNAME=<auth0 username>
   AUTH0_PASSWORD=<auth0 password>
   ```
2. Make sure to update the `AUTH0_DOMAIN` in `demo_controller/test.env` and `fsp_controller/test.env`, using the same
   value you provided in the previous step.

_*PLEASE NOTE*_: If you have already built the Docker containers without your Auth0 account info provided as environment variables, you'll have to rebuild the images.

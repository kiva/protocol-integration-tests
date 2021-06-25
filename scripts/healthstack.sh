#!/bin/bash
set -ev

# This script waits for the whole stack to be up

# wait for gateway to be up
./scripts/healthcheck.sh http://localhost:8080/healthz

# wait for bio-auth-service to be up
./scripts/healthcheck.sh http://localhost:8081/healthz

# wait for bioanalyzer-service to be up
./scripts/healthcheck.sh http://localhost:8089/healthz

# wait for agency to be up
./scripts/healthcheck.sh http://localhost:3010/healthz

# wait for key guardian to be up
./scripts/healthcheck.sh http://localhost:3005/healthz

# wait for controllers to be up
./scripts/healthcheck.sh http://localhost:3011/healthz
./scripts/healthcheck.sh http://localhost:3013/healthz
./scripts/healthcheck.sh http://localhost:3014/healthz

# TODO: wait for tails and multitenant agent (need health check endpoints)

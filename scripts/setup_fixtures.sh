#!/bin/sh

# starts up all the containers and runs scripts to insert data and setup wallets
set -ev

sleep 1
docker exec -it kiva-controller node /www/scripts/setup.sl.kiva.js
docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
./scripts/setup_demo_controller.sh

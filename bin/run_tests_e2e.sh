#!/usr/bin/env bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

command -v node && node --version
command -v docker-compose && docker-compose --version

cd $DIR/..
ROOT=$PWD

node node_modules/.bin/testcafe --hostname localhost -c 4 -s takeOnFails=true chrome:headless tests/e2e/networkless.test.js
node node_modules/.bin/testcafe --hostname localhost -c 4 -s takeOnFails=true firefox:headless tests/e2e/networkless.test.js

# On exit, teardown the docker containers
trap "docker-compose -f ${ROOT}/tests/e2e/docker-compose.yml down" EXIT

# Setup the docker containers
docker-compose -f tests/e2e/docker-compose.yml up -d

docker-compose -f tests/e2e/docker-compose.yml up -d createbuckets
node node_modules/.bin/testcafe --hostname localhost -c 1 -s takeOnFails=true chrome:headless tests/e2e/network_api.test.js
docker-compose -f tests/e2e/docker-compose.yml up -d createbuckets
node node_modules/.bin/testcafe --hostname localhost -c 1 -s takeOnFails=true firefox:headless tests/e2e/network_api.test.js


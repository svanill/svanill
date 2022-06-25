#!/usr/bin/env bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

command -v node && node --version
command -v docker-compose && docker-compose --version

cd $DIR/..
ROOT=$PWD

yarn playwright test --browser chromium e2e/networkless.spec.mjs
yarn playwright test --browser firefox e2e/networkless.spec.mjs

# On exit, teardown the docker containers
trap "docker-compose -f ${ROOT}/tests/e2e/docker-compose.yml down" EXIT

# Setup the docker containers
docker-compose -f tests/e2e/docker-compose.yml up -d

docker-compose -f tests/e2e/docker-compose.yml up -d createbuckets
yarn playwright test --browser chromium e2e/network_on.spec.mjs

docker-compose -f tests/e2e/docker-compose.yml up -d createbuckets
yarn playwright test --browser firefox e2e/network_on.spec.mjs

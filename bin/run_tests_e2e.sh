#!/usr/bin/env bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

command -v node && node --version
command -v docker && docker --version

cd $DIR/..
ROOT=$PWD

npx playwright test --browser chromium e2e/networkless.spec.mjs
npx playwright test --browser firefox e2e/networkless.spec.mjs

# On exit, teardown the docker containers
trap "docker compose -f ${ROOT}/tests/e2e/docker-compose.yml down" EXIT

# Setup the docker containers
docker compose -f tests/e2e/docker-compose.yml up --force-recreate -d

# reset (empty) s3 (minio) so tests run from a blank state
docker compose -f tests/e2e/docker-compose.yml up --force-recreate -d createbuckets
npx playwright test --browser chromium e2e/network_on.spec.mjs

# reset (empty) s3 (minio) so tests run from a blank state
docker compose -f tests/e2e/docker-compose.yml up --force-recreate  -d createbuckets
npx playwright test --browser firefox e2e/network_on.spec.mjs

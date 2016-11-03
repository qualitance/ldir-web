#!/usr/bin/env bash

set -x

export NODE_ENV='production'

export SITE_URL="letsdoit.qualitance.com"
export SITE_PROTOCOL="https"

export LDIRO_STATIC_VERSION="1.0.56"

export NODE_V30_VERSION='3.0.3'
export NODE_V24_VERSION='2.4.13'
export NODE_V23_VERSION='2.3.12'
export NODE_V22_VERSION='2.2.15'
export NODE_V21_VERSION='2.1.10'
export NODE_V20_VERSION='2.0.5'
export NODE_V10_VERSION='1.0.5'

export NODE_TAG='production'

export DOCKER_OWNER='qqualitance'
export DOCKER_REPOSITORY='ldiro'

export LDIRO_API_IMG_NAME='api'
export LDIRO_STATIC_IMG_NAME='static'

export STACK_NAME="ldir-web"

export STACK_FILE="docker-stack-production.yaml"

export NODE_V30_PORT='830'
export NODE_V24_PORT='824'
export NODE_V23_PORT='823'
export NODE_V22_PORT='822'
export NODE_V21_PORT='821'
export NODE_V20_PORT='820'
export NODE_V10_PORT='810'


if docker-cloud stack ls | egrep -q "^${STACK_NAME}\b"; then
  echo "Stack ${STACK_NAME} is already created and it will only be updated."
  docker-cloud stack update --sync -f ${STACK_FILE} ${STACK_NAME}
else
  docker-cloud stack create --sync -f ${STACK_FILE} -n ${STACK_NAME}
  docker-cloud stack start --sync ${STACK_NAME}
fi

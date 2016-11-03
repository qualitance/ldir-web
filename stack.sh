#!/usr/bin/env bash

export NODE_ENV='sandbox'
export DEPLOY_VERSION='1.0.45'
export NODE_TAG='qa'
export DOCKER_OWNER='ldiro'

#docker build -t ${DOCKER_OWNER}/ldir-api:${DEPLOY_VERSION} . -f Dockerfile-node


#docker push ${DOCKER_OWNER}/ldir-api:${DEPLOY_VERSION}


docker build -t ${DOCKER_OWNER}/static:1.0.55 . -f Dockerfile-static
docker push ${DOCKER_OWNER}/static:1.0.55

docker build -t ${DOCKER_OWNER}/api:3.0.1 . -f Dockerfile-node
docker push ${DOCKER_OWNER}/api:3.0.1

#docker-cloud stack update ldir-web -f docker-stack.yaml

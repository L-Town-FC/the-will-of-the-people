#!/bin/bash
echo 'Running container restart script'
. $PWD/scripts/time_info.sh
docker container inspect -f "{{.State.Status}}" $CONTAINER_NAME
docker stop $CONTAINER_NAME; docker rm $CONTAINER_NAME
docker pull $IMAGE_NAME
docker run -d -e PRODBOTTOKEN=$PRODBOTTOKEN -e NODE_ENV=production --name $CONTAINER_NAME $IMAGE_NAME

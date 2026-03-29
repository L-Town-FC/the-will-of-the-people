#!/bin/bash
echo 'Running container restart script'
. $PWD/scripts/time-info.sh
volume_name=${VOLUME_NAME:-bot-vol}
json_path=${JSONPATH:-/usr/src/bot/volume}
docker container inspect -f "{{.State.Status}}" $CONTAINER_NAME
docker rm -f $CONTAINER_NAME
docker pull $IMAGE_NAME
docker run -d --restart unless-stopped -e PRODBOTTOKEN=$PRODBOTTOKEN -e NODE_ENV=production -e JSONPATH=$json_path --name $CONTAINER_NAME -v $volume_name:$json_path $IMAGE_NAME

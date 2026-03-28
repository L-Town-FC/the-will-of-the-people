#!/bin/bash
echo 'Running deployment to Raspberry Pi'
. $PWD/scripts/time_info.sh
. $PWD/scripts/image_version.sh
env_file_name=.env
env_file_location=$PWD/$env_file_name
volume_name=bot-vol
json_path=/usr/src/bot/volume
if [ ! -e "$env_file_location" ]; then
    echo ".env file does not exist go find it"
else 
    echo "Sourcing .env for deployment it..."
    . "$env_file_location"
    resolve_image_tags "${1:-}"
    deploy_tag="${DEPLOY_TAG:-${IMAGE_TAGS[0]}}"
    image_full_tag="$repo/$name:$deploy_tag"
    echo "Deploying image tag: $deploy_tag"
    echo "Ready to connect to $PI_HOST as $PI_USER"
    ssh -i $PATH_TO_KEY -o StrictHostKeyChecking=no $PI_USER@$PI_HOST PRODBOTTOKEN=$PRODBOTTOKEN IMAGE_NAME=$image_full_tag CONTAINER_NAME=$name VOLUME_NAME=$volume_name JSONPATH=$json_path '
    echo "Connected to $HOSTNAME as $USER at $PWD"
    docker rm -f $CONTAINER_NAME || true
    docker pull $IMAGE_NAME
    docker run -d -e PRODBOTTOKEN=$PRODBOTTOKEN -e NODE_ENV=production -e JSONPATH=$JSONPATH --name $CONTAINER_NAME -v $VOLUME_NAME:$JSONPATH $IMAGE_NAME
    '
fi 

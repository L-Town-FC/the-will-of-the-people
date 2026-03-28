#!/bin/bash
echo 'Running deployment to AWS EC2 instance'
. $PWD/scripts/time_info.sh
repo=atmollohan
name=bot
tag=latest
image_full_tag=$repo/$name:$tag
env_file_name=.env
env_file_location=$PWD/$env_file_name
volume_name=bot-vol
json_path=/usr/src/bot/volume
if [ ! -e "$env_file_location" ]; then
    echo ".env file does not exist got find it"
else 
    echo "Sourcing .env for deployment it..."
    source "$env_file_location"
    echo "Ready to connect to $EC2_HOST as $EC2_USER"
    ssh -i $PATH_TO_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST PRODBOTTOKEN=$PRODBOTTOKEN IMAGE_NAME=$image_full_tag CONTAINER_NAME=$name VOLUME_NAME=$volume_name JSONPATH=$json_path '
    echo "Connected to $HOSTNAME as $USER at $PWD"
    docker rm -f $CONTAINER_NAME || true
    docker pull $IMAGE_NAME
    docker run -d -e PRODBOTTOKEN=$PRODBOTTOKEN -e NODE_ENV=production -e JSONPATH=$JSONPATH --name $CONTAINER_NAME -v $VOLUME_NAME:$JSONPATH $IMAGE_NAME
    '
fi 

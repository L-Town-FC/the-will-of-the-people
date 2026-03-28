#!/bin/bash
echo 'Running deployment to Raspberry Pi'
repo=atmollohan
name=bot
tag=latest
image_full_tag=$repo/$name:$tag
env_file_name=.env
env_file_location=$PWD/$env_file_name
if [ ! -e "$env_file_location" ]; then
    echo ".env file does not exist go find it"
else 
    echo "Sourcing .env for deployment it..."
    . $env_file_location
    echo "Trial is $TRIAL on client"
    echo "Ready to connect to $PI_HOST as $PI_USER"
    ssh -i $PATH_TO_KEY -o StrictHostKeyChecking=no $PI_USER@$PI_HOST TRIAL=$TRIAL IMAGE_NAME=$image_full_tag CONTAINER_NAME=$name '''
    echo "Connected to $HOSTNAME as $USER at $PWD"
    echo "Trial is $TRIAL on server"
    docker container inspect -f "{{.State.Status}}" $CONTAINER_NAME
    echo "need to implement check"
    docker pull $IMAGE_NAME
    '''
fi 
#!/bin/bash
echo 'Running buildx for multi-arch build and push'
. $PWD/scripts/time_info.sh

repo=atmollohan
name=bot
tag=latest
image_full_tag=$repo/$name:$tag
docker buildx ls
docker buildx create --name mybuilder --use --bootstrap
docker buildx build --push --platform linux/amd64,linux/arm64 --tag atmollohan/bot:latest .

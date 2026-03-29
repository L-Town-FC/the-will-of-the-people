#!/bin/bash
echo 'Running build and push for single architecture'
. $PWD/scripts/time-info.sh
. $PWD/scripts/image-version.sh

env_file_name=.env
env_file_location=$PWD/$env_file_name

if [ ! -e "$env_file_location" ]; then
    echo ".env file does not exist got find it"
else 
    echo "Sourcing .env for build..."
    echo "$env_file_location"
    source "$env_file_location"
    resolve_image_tags "${1:-}"
    print_image_selection
    docker_tag_args=()
    for tag in "${IMAGE_TAGS[@]}"; do
        docker_tag_args+=(-t "$repo/$name:$tag")
    done
    echo 'BUILDING' && \
    docker build \
        --build-arg APP_VERSION="$APP_VERSION" \
        "${docker_tag_args[@]}" \
        . && \
    echo 'PUSHING to docker hub' && \
    for tag in "${IMAGE_TAGS[@]}"; do
        docker push "$repo/$name:$tag"
    done
fi

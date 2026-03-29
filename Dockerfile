# Pull base node image
FROM node:22.19.0

ARG APP_VERSION=unknown

# Make project dir
ENV PROJECTDIR=/usr/src/bot
ENV APP_VERSION=$APP_VERSION
RUN mkdir -p $PROJECTDIR
WORKDIR $PROJECTDIR

# install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Add project to container
COPY . .

# Run bot
CMD ["node", "index.js"]

build:
	. ./scripts/build.sh

deploy_aws:
	. ./scripts/deploy_aws.sh

deploy_pi:
	. ./scripts/deploy_rpi.sh

develop:
	npm run start:dev

docker_build:
	docker build -t atmollohan/bot:local .

docker_build_multi_arch:
	docker buildx ls
	echo 'do buildx build'

clean: 
	rm -rf node_modules/ package-lock.json

clean_install:
	clean install

install:
	npm install

outdated:
	npm outdated

set_env:
	. ./.env

start:
	npm start

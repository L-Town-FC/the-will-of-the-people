.PHONY: dev start install clean clean_install outdated node_use node_versions build build_multi_arch deploy_aws deploy_pi compose_build compose_up compose_restart compose_logs compose_down

dev:
	npm run start:dev

start:
	npm start

install:
	npm install

clean:
	rm -rf node_modules/ package-lock.json

clean_install:
	make clean
	make install

outdated:
	npm outdated

node_use:
	bash -lc 'source "$$NVM_DIR/nvm.sh" && nvm use'

node_versions:
	bash -lc 'source "$$NVM_DIR/nvm.sh" && echo "nvm: $$(nvm --version)" && echo "node: $$(node --version)" && echo ".nvmrc: $$(cat .nvmrc)"'

build:
	. ./scripts/build.sh

build_multi_arch:
	. ./scripts/buidx.sh

deploy_aws:
	. ./scripts/deploy_aws.sh

deploy_pi:
	. ./scripts/deploy_rpi.sh

compose_build:
	docker compose build bot

compose_up:
	docker compose up -d bot

compose_restart:
	docker compose up -d --build bot

compose_logs:
	docker compose logs -f bot

compose_down:
	docker compose down

.PHONY: dev start install clean clean-install outdated node-use node-versions build build-multi-arch deploy-aws deploy-pi logs ping-pis compose-build compose-up compose-restart compose-logs compose-down

dev:
	npm run start:dev

start:
	npm start

install:
	npm install

clean:
	rm -rf node_modules/ package-lock.json

clean-install:
	make clean
	make install

outdated:
	npm outdated

node-use:
	bash -lc 'source "$$NVM_DIR/nvm.sh" && nvm use'

node-versions:
	bash -lc 'source "$$NVM_DIR/nvm.sh" && echo "nvm: $$(nvm --version)" && echo "node: $$(node --version)" && echo ".nvmrc: $$(cat .nvmrc)"'

build:
	. ./scripts/build.sh

build-multi-arch:
	. ./scripts/buildx.sh

deploy-aws:
	. ./scripts/deploy-aws.sh

deploy-pi:
	. ./scripts/deploy-rpi.sh

logs:
	. ./scripts/logs.sh

ping-pis:
	. ./scripts/ping-pis.sh

compose-build:
	docker compose build bot

compose-up:
	docker compose up -d bot

compose-restart:
	docker compose up -d --build bot

compose-logs:
	docker compose logs -f bot

compose-down:
	docker compose down

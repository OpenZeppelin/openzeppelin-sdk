#!/usr/bin/env bash

# usage: npm run start

set -o errexit

if [ ! -d openzeppelin-docs ]; then
  git clone https://github.com/frangio/openzeppelin-docs.git
fi

cd openzeppelin-docs
git pull
cd ..

npx concurrently \
  'nodemon -L -e "*" -w ../packages/lib/contracts -w "*.hbs" -x npm run prepare-docs' \
  'env DISABLE_PREPARE_DOCS= nodemon -L -e adoc,yml -i local-playbook.yml openzeppelin-docs/build-local.js' \
  'http-server -s -c-1 openzeppelin-docs/build/site'

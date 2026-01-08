#!/usr/bin/env bash
# fail if any of the commands fail
set -o errexit
# clean and install node modules
# rm -rf node_modules/
npm ci
# serve webapp
nx serve webapp
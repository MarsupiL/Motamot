#!/usr/bin/env bash
set -euo pipefail

TARGET="zivver-backend.zip"
SOURCE="https://buildserver.zivver.org/repository/download/ZivverBackend_Snapshot/.lastSuccessful/zivver-backend.zip?guest=1&branch=ZIV-186-Conversations"

curl --location --verbose --progress-bar --output ${TARGET} ${SOURCE}

rm -rf zivver-backend
mkdir zivver-backend
unzip -o ${TARGET} -d ./zivver-backend

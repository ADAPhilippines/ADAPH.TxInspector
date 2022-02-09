#!/bin/bash
docker build --build-arg PORT=${PORT} --build-arg BLOCKFROST_PROJECT_ID=${BLOCKFROST_PROJECT_ID} .
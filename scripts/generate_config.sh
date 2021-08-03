#!/bin/bash

yq eval-all 'select(fileIndex == 0) * {"orbs": {"integration-tests": select(fileIndex == 1)}}' .circleci/test.yml .circleci/orb.yml > .circleci/generated_config.yml

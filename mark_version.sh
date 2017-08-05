#!/bin/sh

# runs as a webpack pre-build step, mainly used for the version tag in JSON save files
echo "var ES_VERSION=\"$(git describe --tags)\";" >./static/version_info.js

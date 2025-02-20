#!/bin/bash
# This script installs missing type stubs for bleach, setuptools, and cachetools.

echo "Installing missing type stubs..."
python3 -m pip install types-bleach types-setuptools types-cachetools

echo "Missing type stubs installed." 
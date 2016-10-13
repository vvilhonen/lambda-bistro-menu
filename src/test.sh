#!/usr/bin/env bash
set -euo pipefail

for menu in ../bistro_menus/*.pdf; do
  node parse.js "$menu"
done


#!/usr/bin/env bash
set -euo pipefail

function runPdfToHtml() {
  local PDF_FILE=$1

  if [ ! -e "$PDF_FILE" ]; then
    echo >&2 "File doesn't exist: $PDF_FILE"
    exit 1
  fi
  
  if [ "$(uname)" == "Darwin" ]; then
    PDFTOHTML="pdftohtml"
  else
    PDFTOHTML="LD_LIBRARY_PATH=. ./pdftohtml"
  fi

  eval $PDFTOHTML -f 1 -l 1 -i -noframes -xml -stdout $PDF_FILE
}


if [ "$#" -eq 1 ]; then
  runPdfToHtml $1
else
  MENU_URL="http://radining.compass-usa.com/hbo/Documents/Menus/Bistro%20Web%20Menu.pdf"
  curl -s $MENU_URL > /tmp/menu.pdf
  runPdfToHtml /tmp/menu.pdf
fi


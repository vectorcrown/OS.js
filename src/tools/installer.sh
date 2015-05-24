#!/bin/bash
#
# OS.js automated installer
#
# Simply run this command and you're ready to go
#   curl -sS http://andersevenrud.github.io/OS.js-v2/installer | sh
#


REPO="https://github.com/andersevenrud/OS.js-v2.git"
DEST="OS.js-v2"

if [ -d "$DEST" ]; then
  echo "Destination already exists"
  exit 1
fi

echo "Installing 'grunt' (requires sudo)"
sudo npm install -g grunt-cli

echo "Downloading OS.js"
git clone --recursive $REPO $DEST

echo "Building"
cd $DEST
npm install
grunt

echo "INSTALLATION COMPLETE :-)"
echo "Look at INSTALL.md for documentation on how to start the a server"

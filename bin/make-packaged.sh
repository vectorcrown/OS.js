#!/bin/bash
#
# This script creates a optimized build for packaging purposes
#

OUTDIR=".build/output"
TMPDIR=".build/tmp"
TEMPLATE=$1

if [ "$TEMPLATE" == "arduino" ]; then
  if [ "$(git branch)" != "arduino" ]; then
    echo "You need to be on the 'arduino' brach to do this"
    exit 1
  fi
fi

#
# Reset
#
rm -rf $OUTDIR
mkdir -p $OUTDIR
mkdir -p $TMPDIR
rm -rf dist/themes/*
rm -rf dist/packages/*

git checkout -- dist &>/dev/null
npm install --production &>/dev/null

echo "[image] Building..."

#
# Build and copy required files
#

grunt all dist-files &>/dev/null

mkdir -p $OUTDIR/bin
cp README.md $OUTDIR/
cp AUTHORS $OUTDIR/
cp LICENSE $OUTDIR/
cp -r dist $OUTDIR/
mkdir -p $OUTDIR/server
cp src/server/settings.json $OUTDIR/
cp src/server/packages.json $OUTDIR/

if [ "$TEMPLATE" == "arduino" ]; then
  mkdir -p $OUTDIR/dist/cgi-bin
  mkdir -p $OUTDIR/lib/osjs/app
  cp -r src/server/lua/* $OUTDIR/server/

  APPS=`(cd src/packages/target; find . -maxdepth 1)`
  for AD in $APPS; do
    AD=$(basename $AD)
    AN=$(echo $AD | awk '{print tolower($0)}')
    if [[ "$AD" != "." ]]; then
      cp -v src/packages/target/$AD/server.lua $OUTDIR/lib/osjs/app/$AN.lua 2>/dev/null
    fi
  done

  cp bin/arduino-wifi-*.sh $OUTDIR/bin/
  cp bin/arduino-toggle-*.sh $OUTDIR/bin/
  cp bin/arduino-ifconfig*.sh $OUTDIR/bin/
  cp bin/arduino-wizard*.sh $OUTDIR/bin/

  mv $OUTDIR/server/lua/osjs.lua $OUTDIR/lib/
  mv $OUTDIR/server/lua/osjs-fs $OUTDIR/dist/cgi-bin/
  mv $OUTDIR/server/lua/osjs-api $OUTDIR/dist/cgi-bin/
  rm -rf $OUTDIR/server
else
  cp -r src/server/node/* $OUTDIR/server/
  cp -r node_modules $OUTDIR/
  rm -rf $OUTDIR/node_modules/grunt*
  rm -rf $OUTDIR/node_modules/*grunt
  modclean -p $OUTDIR -d -r -n safe
fi

chmod +x $OUTDIR/bin/* 2>/dev/null

echo "[image] Cleaning up..."


#
# Remove unused icons
#

rm -rf $TMPDIR
mkdir -p $TMPDIR
mkdir -p $TMPDIR/16x16
mkdir -p $TMPDIR/32x32

FILES=$(find $OUTDIR/dist/themes/icons/default/16x16 -maxdepth 1 -type d)
for d in $FILES; do
  b=$(basename $d)
  mkdir -p $TMPDIR/16x16/$b
  mkdir -p $TMPDIR/32x32/$b
done

GREPPED=$(grep -RHIi "\.png" $OUTDIR/dist/ | egrep -o '\w+\/[_A-Za-z0-9\-]+\.png')
for g in $GREPPED; do
  cp -L $OUTDIR/dist/themes/icons/default/16x16/$g $TMPDIR/16x16/$g 2>/dev/null
  cp -L $OUTDIR/dist/themes/icons/default/32x32/$g $TMPDIR/32x32/$g 2>/dev/null
done

cp $OUTDIR/dist/themes/icons/default/16x16/*.png $TMPDIR/16x16/
cp $OUTDIR/dist/themes/icons/default/32x32/*.png $TMPDIR/32x32/

rm -rf $OUTDIR/dist/themes/icons/default/*
mv $TMPDIR/* $OUTDIR/dist/themes/icons/default/

rm -rf $TMPDIR

#
# Cleanup
#

rm -rf $OUTDIR/dist/themes/sounds/*
rm -rf $OUTDIR/dist/themes/wallpapers/*

rm $OUTDIR/dist/*.min.* 2>/dev/null
rm $OUTDIR/dist/.htaccess 2>/dev/null
rm $OUTDIR/dist/.gitignore 2>/dev/null
rm $OUTDIR/dist/vendor/.gitignore 2>/dev/null
rm $OUTDIR/dist/themes/.gitignore 2>/dev/null
rm $OUTDIR/dist/packages/.gitignore 2>/dev/null
rm $OUTDIR/dist/api.php 2>/dev/null
rm $OUTDIR/dist/packages/*/*/package.json 2>/dev/null
rm $OUTDIR/dist/packages/*/*/api.php 2>/dev/null
rm $OUTDIR/dist/packages/*/*/server.lua 2>/dev/null
rm $OUTDIR/dist/packages/target/CoreWM/panelitems 2>/dev/null
rm $OUTDIR/dist/packages/target/CodeMirror/vendor 2>/dev/null
rm $OUTDIR/build/dist/themes/styles/material/*.less 2>/dev/null

echo "[image] Done :)"
exit 0

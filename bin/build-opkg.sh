#!/bin/bash
#
# This script creates an `ipkg` file ready for deployment
#

NAME=$1
VERSION=$2
ARCH=$3
TEMPLATE=$4

if [ -z $ARCH ]; then
  echo "Missing architechture argument"
  echo "usage: build-opkg.sh <name> <version> <arch> <template>"
  exit 1
fi
if [ -z $VERSION ]; then
  echo "Missing version argument"
  echo "usage: build-opkg.sh <name> <version> <arch> <template>"
  exit 1
fi
if [ -z $NAME ]; then
  echo "Missing name argument"
  echo "usage: build-opkg.sh <name> <version> <arch> <template>"
  exit 1
fi
if [ -z $TEMPLATE ]; then
  echo "Missing template argument"
  echo "usage: build-opkg.sh <name> <version> <arch> <template>"
  exit 1
fi

echo "[opkg] Preparing..."

./bin/make-packaged.sh $TEMPLATE

PKGNAME="${NAME}_${VERSION}_${ARCH}.ipk"
SRCDIR=".build/output"
OUTDIR=".build/opkg"

rm -rf $OUTDIR

echo "[opkg] Building..."

#
# Create package files
#
mkdir -p $OUTDIR/ipkg/CONTROL
mkdir -p $OUTDIR/data/osjs/templates

if [ "$TEMPLATE" == "arduino" ]; then
  mkdir -p $OUTDIR/data/usr/lib/lua/osjs
fi

cp -r $SRCDIR/* $OUTDIR/data/osjs/

if [ "$TEMPLATE" == "intel-edison" ]; then
  cp -r src/templates/misc/etc $OUTDIR/data/osjs/templates/etc
fi

echo "[opkg] Packing..."

#
# Create image(s)
#

F=$(readlink -f $OUTDIR)
cp src/templates/distro/opkg/$TEMPLATE/* $OUTDIR/ipkg/CONTROL/
awk '{gsub("ARCH", "'"$ARCH"'", $0); print }' $OUTDIR/ipkg/CONTROL/control_tmpl | awk '{gsub("VER", "'"${VERSION}"'", $0); print }' > $OUTDIR/ipkg/CONTROL/control
rm -rf $OUTDIR/ipkg/CONTROL/control_tmpl
(cd $OUTDIR/ipkg/CONTROL; tar -cz --format=gnu -f $F/control.tar.gz *)
(cd $OUTDIR/data; tar -cz --format=gnu -f $F/data.tar.gz *)
echo $VERSION > $OUTDIR/debian-binary
#tar -C $OUTDIR -cz ./debian-binary ./data.tar.gz ./control.tar.gz > $OUTDIR/$PKGNAME
(cd $OUTDIR; ar -crf $F/$PKGNAME ./debian-binary ./control.tar.gz ./data.tar.gz)


#
# Clean up
#

rm -rf $OUTDIR/ipkg
rm -rf $OUTDIR/data
rm $OUTDIR/debian-binary
rm $OUTDIR/data.tar.gz
rm $OUTDIR/control.tar.gz

echo "[opkg] Done :)"

exit 0

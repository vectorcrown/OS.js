# cPanel Hosting Setup guide

You can run OS.js with PHP if you have a "cPanel host" or similar, but it have some chaveats depending on your knowledge about Apache's `mod_rewrite`.

## 1: Clone on your computer
Build OS.js on your own computer

Basically follow the official instructions

```
sudo npm install -g grunt-cli

git clone https://github.com/andersevenrud/OS.js-v2.git
cd OS.js-v2
npm install --production
cp src/templates/conf/500-cpanel.json src/conf/500-cpanel.json
grunt
```

## 3: Transfer files

Now copy the entire `OS.js-v2` directory to your host

## 3: Run

Open up http://yourhost.com/OS.js-v2/dist/


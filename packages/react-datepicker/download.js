#!/usr/bin/env node
const Ftp = require('ftp-get');

const src = 'ftp://ftp.iana.org/tz/tzdata-latest.tar.gz';
const dest = 'tzdata-latest.tar.gz';

Ftp.get(src, dest, (err, res) => {
   if(err) {
      console.error(err);
      return;
   }
   console.log(`downloaded ${src} -> ${dest}`);
});
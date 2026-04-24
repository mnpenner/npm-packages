#!/usr/bin/env node
const FS = require('fs');
const OS = require('os');
const Path = require('path');
const data = require('moment-timezone/data/packed/latest.json');
const mkdirp = require('mkdirp');
const symlinkType = OS.platform() === 'win32' ? 'junction' : 'file';

data.zones.forEach(zoneData => {
    let firstPipe = zoneData.indexOf('|');
    let zoneName = zoneData.slice(0, firstPipe);

    let path = Path.normalize(`${__dirname}/data/${zoneName}.txt`);
    createDir(path).then(() => writeFile(path, zoneData));
});

data.links.forEach(zones => {
    let [mainZone, ...others] = zones.split('|');
    // console.log(mainZone, others);return;
    let target = Path.normalize(`${__dirname}/data/${mainZone}.txt`);
    for(let zoneName of others) {
        let path = Path.normalize(`${__dirname}/data/${zoneName}.txt`);
        createDir(path)
            .then(() => link(target, path))
            .catch(err => {
                console.error(`Failed to create link ${path} -> ${target}: ${err.message}`);
            });
    }
});

//////////////////////////////////////////////////////////////////////////

function createDir(path) {
    return new Promise((resolve, reject) => {
        let p = path.lastIndexOf(Path.sep);
        if(p !== -1) {
            let dir = path.slice(0, p);
            mkdirp(path.slice(0, p), err => err ? reject(err) : resolve(dir));
        } else {
            resolve('.');
        }
    });

}

function link(target, path) {
    return new Promise((resolve, reject) => {
        FS.unlink(path, err => {
            if(err && err.code !== 'ENOENT') {
                return reject(err);
            }
            FS.link(target, path, err => err ? reject(err) : resolve());
        });
    })
}

function writeFile(file, data, options = {}) {
    return new Promise((resolve, reject) => {
        FS.writeFile(file, data, options, err => err ? reject(err) : resolve());
    });
}
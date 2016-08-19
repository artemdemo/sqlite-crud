'use strict';

const fs = require('fs');
const chalk = require('chalk');
const sqlite3 = require('sqlite3').verbose();

let dbFileName;
let dbFile;

let db = null;

const getDB = () => {
    db = db || new sqlite3.Database(dbFileName);
    return db;
};

const connectToDB = (dbPath) => {
    dbFileName = dbPath;
    dbFile = fs.existsSync(dbFileName);

    if(!dbFile) {
        console.log(chalk.yellow('[Info]'), `There is no DB. Creating new empty file: ${dbFileName}`);
        fs.openSync(dbFileName, "w");
    }
};

module.exports = {
    getDB,
    connectToDB
};

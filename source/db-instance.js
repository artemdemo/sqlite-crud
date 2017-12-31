const debug = require('debug')('sqlite-crud:db-instance');
const fs = require('fs');
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

    if (!dbFile) {
        debug(`There is no DB. Creating new empty file: ${dbFileName}`);
        fs.openSync(dbFileName, 'w');
    }
};

module.exports = {
    getDB,
    connectToDB,
};

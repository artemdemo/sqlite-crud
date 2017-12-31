const debug = require('debug')('sqlite-crud:migrate');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');
const dbRun = require('./run');
const insertRow = require('./insertRow');
const getRows = require('./getRows');

const migrationsTableName = 'migrations';
const createMigrationQuery = `CREATE TABLE IF NOT EXISTS ${migrationsTableName} (migration CHAR (255));`;


/**
 * Add migration info to the table
 * @param fileName {String} - file name of the migration
 * @returns {promise}
 */
const addMigrationInfo = fileName => insertRow(migrationsTableName, {
    migration: fileName,
});


/**
 * Check if given file record exists in migrations table
 * @param fileName {String} - file name of the migration
 * @returns {promise}
 */
const checkMigration = (fileName) => {
    return getRows(migrationsTableName, [{
        column: 'migration',
        comparator: '=',
        value: fileName,
    }])
        .then((result) => {
            if (result.length > 0) {
                throw new Error(`This file already migrated: ${fileName}`);
            }
        });
};

/**
 * Recursively run queries step by step.
 * @param queries {Array}
 * @param queryId {Number}
 */
const runQueriesStepwise = (queries, queryId = 0) => {
    if (queries[queryId]) {
        return dbRun(queries[queryId], null, {saveRun: true})
            .then(() => {
                if (queries[queryId + 1]) {
                    return runQueriesStepwise(queries, queryId + 1);
                }
                return Promise.resolve();
            });
    }
    return Promise.reject();
};

/**
 * Run migration queries and add them to migrations table
 * @param queries {Array}
 * @param fileName {String}
 */
const runMigrationQueries = (queries, fileName) => {
    if (Array.isArray(queries)) {

        // Check that migration file is not exists in the DB
        return checkMigration(fileName)
            .then(() => runQueriesStepwise(queries))
            .then(() => addMigrationInfo(fileName));
    }
    const err = 'Query read error - `queries` variable should be an Array';
    debug(err);
    debug(queries);
    return Promise.reject(err);
};

/**
 * Recursively run queries of migration files
 * @param dirQueries {Object}
 * @example
 * {
 *    "20150616_dummy_tables.json": [
 *      "CREATE TABLE dummy04 (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100));",
        "CREATE TABLE dummy05 (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100));"
 *    ],
 *    "20160101_alter_dummy_table.json": []
 * }
 * @param keys {Array}
 * @param keyId {Number}
 */
const runDirQueries = (dirQueries, keys, keyId = 0) => {
    if (dirQueries[keys[keyId]]) {
        return runMigrationQueries(dirQueries[keys[keyId]], keys[keyId])
            .then(() => {
                if (dirQueries[keys[keyId + 1]]) {
                    return runDirQueries(dirQueries, keys, keyId + 1);
                }
                return Promise.resolve();
            });
    }
    return Promise.reject();
};


/**
 * Get migration queries from file
 * @param pathToFile {String} - path to migrate json file
 * @example
 * {
 *   "queries": [
 *       "CREATE TABLE dummy01 (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100));",
 *       "CREATE TABLE dummy02 (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100));"
 *   ]
 * }
 * @returns {Array|undefined}
 */
const getMigrateQueriesFromFile = (pathToFile) => {
    const fileName = path.basename(pathToFile);
    const fileExtension = path.extname(fileName);

    if (fileExtension !== '.json') {
        debug(`Given file is not json: ${pathToFile}`);
        return;
    }

    let jsonString = '';
    try {
        jsonString = fs.readFileSync(pathToFile, 'utf8');
    } catch (err) {
        debug(`File reading error ${pathToFile}`);
        debug(err);
        return;
    }

    let migrationJson = null;
    try {
        migrationJson = JSON.parse(jsonString);
    } catch (err) {
        debug(`Given string can't be parsed: ${jsonString}`);
        debug(err);
        return;
    }

    const queries = migrationJson.queries || migrationJson.query;

    return typeof queries === 'string' ? [queries] : queries;
};


/**
 * Main migration method
 * @param pathToMigrate {String} - can be path to file or path to directory
 * @returns {promise}
 */
const migrate = pathToMigrate => new Promise((resolve, reject) => {
    if (typeof pathToMigrate === 'string') {
        const pathStats = fs.lstatSync(pathToMigrate);

        if (pathStats.isDirectory()) {
            const migrationQueries = {};
            fs.readdirSync(pathToMigrate).forEach((file) => {
                if (file.substr(-5) === '.json') {
                    const queriesArr = getMigrateQueriesFromFile(path.join(pathToMigrate, file));
                    if (Array.isArray(queriesArr)) {
                        migrationQueries[file] = queriesArr;
                    }
                }
            });

            dbRun(createMigrationQuery)
                .then(() => runDirQueries(migrationQueries, Object.keys(migrationQueries)))
                .then(() => resolve())
                .catch((err) => {
                    debug(err);
                    reject(err);
                });
        } else {
            const queriesArr = getMigrateQueriesFromFile(pathToMigrate);
            const fileName = path.basename(pathToMigrate);
            dbRun(createMigrationQuery)
                .then(() => runMigrationQueries(queriesArr, fileName))
                .then(() => resolve())
                .catch((err) => {
                    debug(err);
                    reject(err);
                });
        }
    } else {
        debug('Given path is not string');
        reject();
    }
});

module.exports = migrate;

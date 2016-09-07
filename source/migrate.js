/* eslint-disable no-console, strict*/
'use strict';

const path = require('path');
const Q = require('q');
const chalk = require('chalk');
const fs = require('fs');
const dbRun = require('./run');
const verbose = require('./verbose');
const insertRow = require('./insertRow');
const getRows = require('./getRows');

const migrationsTableName = 'migrations';
const createMigrationQuery = `CREATE TABLE IF NOT EXISTS ${migrationsTableName} (migration CHAR (255));`;


/**
 * Add migration info to the table
 * @param fileName {String} - file name of the migration
 * @returns {promise}
 */
const addMigrationInfo = (fileName) => {
    let deferred = Q.defer();

    insertRow(migrationsTableName, {
        migration: fileName,
    }).then((result) => {
        deferred.resolve();
    }, () => {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[Migration]', 'Error while adding migration record'));
            console.log(error);
        }
        deferred.reject();
    });

    return deferred.promise;
};


/**
 * Check if given file record exists in migrations table
 * @param fileName {String} - file name of the migration
 * @returns {promise}
 */
const checkMigration = (fileName) => {
    let deferred = Q.defer();

    getRows(migrationsTableName, [{
        column: 'migration',
        comparator: '=',
        value: fileName,
    }])
        .then((result) => {
            if (result.length === 0) {
                deferred.resolve();
            } else {
                if (verbose.getVerbose()) {
                    console.log(chalk.red.bold('[Migration]', `This file already migrated: ${fileName}`));
                }
                deferred.reject();
            }
        }, () => {
            deferred.reject();
        });

    return deferred.promise;
};

/**
 * Recursively run queries step by step.
 * @param queries {Array}
 * @param queryId {Number}
 */
const runQueriesStepwise = (queries, queryId = 0) => {
    let deferred = Q.defer();

    if (queries[queryId]) {
        dbRun(queries[queryId], null, {saveRun: true})
            .then((result) => {

                if (queries[queryId + 1]) {
                    runQueriesStepwise(queries, queryId + 1)
                        .then(
                            () => deferred.resolve(),
                            () => deferred.resolve()
                        );
                } else {
                    deferred.resolve();
                }
            });
    } else {
        deferred.reject();
    }

    return deferred.promise;
}

/**
 * Run migration queries and add them to migrations table
 * @param queries {Array}
 * @param fileName {String}
 * @returns {promise}
 */
const runMigrationQueries = (queries, fileName) => {
    let deferred = Q.defer();
    if (Array.isArray(queries)) {

        // Check that migration file is not exists in the DB
        checkMigration(fileName)
            .then(() => {

                runQueriesStepwise(queries)
                    .then(() => {
                        addMigrationInfo(fileName)
                            .then(() => {
                                deferred.resolve();
                            }, () => {
                                deferred.reject();
                            });
                        }, () => {
                            deferred.reject();
                        });
            }, () => {
                deferred.reject();
            });
    } else {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[Migration queries error]', 'Query read error - `queries` variable should be an Array'));
            console.log(queries);
        }
        deferred.reject();
    }
    return deferred.promise;
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
 * @returns {promise}
 */
const runDirQueries = (dirQueries, keys, keyId = 0) => {
    let deferred = Q.defer();

    if (dirQueries[keys[keyId]]) {
        runMigrationQueries(dirQueries[keys[keyId]], keys[keyId])
            .then(() => {
                if (dirQueries[keys[keyId + 1]]) {
                    runDirQueries(dirQueries, keys, keyId + 1)
                        .then(
                            () => deferred.resolve(),
                            () => deferred.resolve()
                        );
                } else {
                    deferred.resolve();
                }
            }, () => {
                deferred.reject();
            });
    } else {
        deferred.reject();
    }

    return deferred.promise;
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
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[File format error]'), `Given file is not json: ${pathToFile}`);
        }
        return;
    }

    let jsonString = '';
    try {
        jsonString = fs.readFileSync(pathToFile, 'utf8');
    } catch (e) {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[File reading error]'), pathToFile);
            console.log(e);
        }
        return;
    }

    let migrationJson = null;
    try {
        migrationJson = JSON.parse(jsonString);
    } catch (e) {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[Migration JSON error]'), `Given string can't be parsed: ${jsonString}`);
            console.log(e);
        }
        return;
    }

    const queries = migrationJson.queries || migrationJson.query;

    return typeof queries == 'string' ? [queries] : queries;
};


/**
 * Main migration method
 * @param pathToMigrate {String} - can be path to file or path to directory
 * @returns {promise}
 */
const migrate = (pathToMigrate) => {
    let deferred = Q.defer();

    const createMigrationTableError = (error) => {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[Migration]', 'Creating migrations table error'));
            console.log(error);
        }
    };

    if (typeof pathToMigrate == 'string') {
        let pathStats;
        try {
            pathStats = fs.lstatSync(pathToMigrate);
        } catch(e) {
            if (verbose.getVerbose()) {
                console.log(chalk.red.bold('[Path reading error]'), pathToMigrate);
                console.log(e);
            }
            deferred.reject();
            return deferred.promise;
        }
        if (pathStats.isDirectory()) {
            const migrationQueries = {};
            fs.readdirSync(pathToMigrate).forEach((file) => {
                if(file.substr(-5) === '.json') {
                    const queriesArr = getMigrateQueriesFromFile(path.join(pathToMigrate, file));
                    if (Array.isArray(queriesArr)) {
                        migrationQueries[file] = queriesArr;
                    }
                }
            });
            dbRun(createMigrationQuery)
                .then(() => {
                    runDirQueries(migrationQueries, Object.keys(migrationQueries))
                        .then(() => {
                            deferred.resolve();
                        }, () => {
                            deferred.reject();
                        });
                }, (error) => {
                    createMigrationTableError(error);
                    deferred.reject();
                });
        } else {
            const queriesArr = getMigrateQueriesFromFile(pathToMigrate);
            const fileName = path.basename(pathToMigrate);
            dbRun(createMigrationQuery)
                .then(() => {
                    runMigrationQueries(queriesArr, fileName)
                        .then(() => {
                            deferred.resolve();
                        }, () => {
                            deferred.reject();
                        });
                }, (error) => {
                    createMigrationTableError(error);
                    deferred.reject();
                });
        }
    } else {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[Migration]', 'Given path is not string'));
        }
        deferred.reject();
    }
    return deferred.promise;
};

module.exports = migrate;

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

const runQueries = (queries, index, parentDeferred, fileName) => {
    if (queries[index]) {
        dbRun(queries[index])
            .then(() => {
                runQueries(queries, index + 1, parentDeferred, fileName);
            }, (error) => {
                if (verbose.getVerbose()) {
                    console.log(chalk.red.bold('[Migration query run error]', 'Given query: ' + queries[index]));
                    console.log(error);
                }
                parentDeferred.reject();
            });
    } else {
        addMigrationInfo(fileName)
            .then(() => {
                parentDeferred.resolve();
            }, () => {
                parentDeferred.reject();
            });
    }
};

/**
 * Add migration info to the table
 * @param fileName {String} - file name of the migration
 */
const addMigrationInfo = (fileName) => {
    let deferred = Q.defer();

    insertRow(migrationsTableName, {
        migration: fileName
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
 */
const checkMigration = (fileName) => {
    let deferred = Q.defer();

    getRows(migrationsTableName, [{
        column: 'migration',
        comparator: '=',
        value: fileName
    }])
        .then((result) => {
            if (result.length === 0) {
                deferred.resolve();
            } else {
                if (verbose.getVerbose()) {
                    console.log(chalk.red.bold('[Migration]', 'This file already migrated: ' + fileName));
                    console.log(error);
                }
                deferred.reject();
            }
        }, () => {
            deferred.reject();
        });

    return deferred.promise;
};

/**
 * Migrate file
 * @param pathToFile {String} - path to migrate json file
 * @example
 * {
 *   "queries": [
 *       "CREATE TABLE dummy01 (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100));",
 *       "CREATE TABLE dummy02 (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100));"
 *   ]
 * }
 */
const migrate = (pathToFile) => {
    let deferred = Q.defer();
    const fileName = path.basename(pathToFile);
    const fileExtension = path.extname(fileName);

    if (fileExtension !== '.json') {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[File format error]'), 'Given file is not json: ' + pathToFile);
        }
        deferred.reject();
        return deferred.promise;
    }

    let jsonString = '';
    try {
        jsonString = fs.readFileSync(pathToFile, 'utf8');
    } catch (e) {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[File reading error]'), pathToFile);
            console.log(e);
        }
        deferred.reject();
        return deferred.promise;
    }

    let migrationJson = null;
    try {
        migrationJson = JSON.parse(jsonString);
    } catch (e) {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[Migration JSON error]'), 'Given string can\'t be parsed: ' + jsonString);
            console.log(e);
        }
        deferred.reject();
        return deferred.promise;
    }

    dbRun('CREATE TABLE IF NOT EXISTS migrations (migration CHAR (255));')
        .then(() => {
            const queries = migrationJson.queries || migrationJson.query;
            if (typeof queries == 'string') {

                // Check that migration file is not exists in the DB
                checkMigration(fileName)
                    .then(() => {

                        // Run migration for given query from migration json file
                        dbRun(queries)
                            .then(() => {
                                addMigrationInfo(fileName)
                                    .then(() => {
                                        deferred.resolve();
                                    }, () => {
                                        deferred.reject();
                                    });
                            }, (error) => {
                                if (verbose.getVerbose()) {
                                    console.log(chalk.red.bold('[Migration query run error]', 'Given query: ' + queries));
                                    console.log(error);
                                }
                                deferred.reject();
                            });
                    }, () => {
                        deferred.reject();
                    });
            } else if (Array.isArray(queries)) {

                // Check that migration file is not exists in the DB
                checkMigration(fileName)
                    .then(() => {

                        // Run migration for given query from migration json file
                        runQueries(queries, 0, deferred, fileName);
                    }, () => {
                        deferred.reject();
                    });
            } else {
                if (verbose.getVerbose()) {
                    console.log(chalk.red.bold('[Migration queries error]', 'Query read error'));
                    console.log(queries);
                }
                deferred.reject();
            }
        }, (error) => {
            if (verbose.getVerbose()) {
                console.log(chalk.red.bold('[Migration]', 'Creating migrations table error'));
                console.log(error);
            }
            deferred.reject();
        });

    return deferred.promise;
};

module.exports = migrate;

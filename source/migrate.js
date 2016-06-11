'use strict';

const path = require('path');
const Q = require('q');
const chalk = require('chalk');
const fs = require('fs');
const dbRun = require('./run');
const verbose = require('./verbose');

const runQueries = (queries, index, parentDeferred) => {
    if (queries[index]) {
        dbRun(queries[index])
            .then(() => {
                runQueries(queries, index + 1, parentDeferred);
            }, (error) => {
                if (verbose.getVerbose()) {
                    console.log(chalk.red.bold('[Migration query run error]', 'Given query: ' + queries[index]));
                    console.log(error);
                }
                parentDeferred.reject();
            });
    } else {
        parentDeferred.resolve();
    }
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

    const queries = migrationJson.queries || migrationJson.query;

    if (typeof queries == 'string') {
        dbRun(queries)
            .then(() => {
                deferred.resolve();
            }, (error) => {
                if (verbose.getVerbose()) {
                    console.log(chalk.red.bold('[Migration query run error]', 'Given query: ' + queries));
                    console.log(error);
                }
                deferred.reject();
            });
    } else if (Array.isArray(queries)) {
        runQueries(queries, 0, deferred);
    } else {
        if (verbose.getVerbose()) {
            console.log(chalk.red.bold('[Migration queries error]', 'Query read error'));
            console.log(queries);
        }
        deferred.reject();
    }

    return deferred.promise;
};

module.exports = migrate;

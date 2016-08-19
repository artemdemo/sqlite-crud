'use strict';

const Q = require('q');
const dbInstance = require('./db-instance');

/**
 * Proxy function for run
 * @param query {String}
 * @param parameters {Array} array of parameters to the query (optional)
 * @param options {Object} (optional)
 * @param options.saveRun {Boolean} if `true` will always resolve promise
 * @example
 * In case you are passing parameters, function should be used in following way:
 * ```
 * run('INSERT INTO table_name (name, description) VALUES (?, ?)', false, ['run-test', 'run-test description'])
 * ```
 */
const run = (query, parameters = null, options = {}) => {
    let deferred = Q.defer();
    const DB = dbInstance.getDB();

    /*
     * If execution was successful, the `this` object will contain two properties named `lastID` and
     * `changes` which contain the value of the last inserted row `ID` and the number of rows
     * affected by this query respectively.
     * Note that `lastID` **only** contains valid information when the query was a successfully
     * completed `INSERT` statement and `changes` **only** contains valid information when the
     * query was a successfully completed `UPDATE` or `DELETE` statement.
     * In all other cases, the content of these properties is inaccurate and should not be used.
     *
     * @source https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback
     */
    const callback = function (error) {
        if (error) {
            if (options.saveRun) {
                deferred.resolve(error);
            } else {
                deferred.reject(error);
            }
        } else {
            // lastID - in case of INSERT
            // changes - in case of UPDATE or DELETE
            deferred.resolve(this);
        }
    }

    if (parameters && Array.isArray(parameters)) {
        DB.run(query, parameters, callback);
    } else {
        DB.run(query, callback);
    }

    return deferred.promise;
};

module.exports = run;

'use strict';

const Q = require('q');
const dbInstance = require('./db-instance');

/**
 * Proxy function for run
 * @param query
 * @returns {*}
 */
const run = (query) => {
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
    DB.run(query,
        (error) => {
            if (error) {
                deferred.reject(error);
            } else {
                // lastID - in case of INSERT
                // changes - in case of UPDATE or DELETE
                deferred.resolve(this);
            }
        });

    return deferred.promise;
};

module.exports = run;

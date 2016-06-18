'use strict';

const Q = require('q');
const dbInstance = require('./db-instance');

/**
 * Insert row into given table
 * @param tableName {String}
 * @param data {Object}
 * @returns {Promise}
 */
const insertRow = (tableName, data) => {
    let deferred = Q.defer();
    let DB = dbInstance.getDB();
    let query = 'INSERT INTO ' + tableName + ' ';
    let columns = [];
    let columnValues = [];
    if (!tableName) {
        throw new Error('tableName is not provided');
    }
    if (!data) {
        throw new Error('data object is not provided');
    }
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            columns.push(key);
            columnValues.push(data[key]);
        }
    }
    if (columns.length == 0) {
        throw new Error('There is no columns in data object');
    }
    query += '(' + columns.join(',') + ') VALUES (';
    columns.forEach((column, i) => {
        query += '?';
        if (i < columns.length - 1) {
            query += ',';
        }
    });
    query += ')';

    // console.log(chalk.blue('Query:'), query);

    let stmt = DB.prepare(query);
    stmt.run(columnValues, function(error) {
        if (!error) {
            /**
             * `this` object will contain:
             * {
             *     sql: 'INSERT INTO tableName (name,vacancy_id) VALUES (?,?)',
             *     lastID: 11,
             *     changes: 1
             * }
             */
            deferred.resolve({ id: this.lastID });
        } else {
            //console.log(chalk.red.bold('[insertToTable error]'), error);
            //console.log(chalk.red.bold('[insertToTable data]'), data)
            /**
             * In case of UNIQUE constraint failed
             * `error.errorno` will be 19
             */
            deferred.reject({
                errno: error.errno,
                code: error.code
            });
        }
    });
    stmt.finalize();
    return deferred.promise;
};

module.exports = insertRow;
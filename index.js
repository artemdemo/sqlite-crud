/**
 * Establishing connection to the database
 *
 * @source http://blog.modulus.io/nodejs-and-sqlite
 */

'use strict';

const Q = require('q');
const chalk = require('chalk');
const dbInstance = require('./source/db-instance');


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


/**
 * Update table row
 * @param tableName {String}
 * @param data {object}
 * @param where {Array}
 *  [
 *      {
 *          column: '',
 *          comparator: '',
 *          value: ''
 *      },
 *      ...
 *  ]
 * @returns {Promise}
 */
const updateRow = (tableName, data, where) => {
    let deferred = Q.defer();
    let DB = dbInstance.getDB();
    let query = 'UPDATE ' + tableName + ' SET ';
    let columns = [];
    let columnValues = [];
    if (!tableName) {
        throw new Error('`tableName` is not provided');
    }
    if (!data) {
        throw new Error('`data` object is not provided');
    }
    if (!where) {
        throw new Error('`where` is not provided');
    } else if (!where.hasOwnProperty('length')) {
        throw new Error('`where` should be an array');
    } else if (where.length == 0) {
        throw new Error('There is no data in `where` object');
    }
    var key;
    for (key in data) {
        if (data.hasOwnProperty(key)) {
            columns.push(key);
            columnValues.push(data[key]);
        }
    }
    if (columns.length == 0) {
        throw new Error('There is no columns in `data` object');
    }
    columns.forEach((column, i) => {
        query += column + ' = ?';
        if (i < columns.length - 1) {
            query += ', ';
        }
    });

    query += ' WHERE ';

    where.forEach((whereItem, i) => {
        query += whereItem.column + ' ' + whereItem.comparator + ' ?';
        if (i < where.length - 1) {
            query += ' AND ';
        }
        columnValues.push(whereItem.value);
    });

    // console.log(chalk.blue('Query:'), query);
    // console.log('columnValues', columnValues);

    DB.run(query, columnValues, (error) => {
        if (error) {
            console.log(chalk.red.bold('[updateInTable error]'), error);
            deferred.reject();
        } else {
            console.log(chalk.blue('Updated '), where);
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * Fetch rows from the table
 * @param tableName {String}
 * @param where {Array}
 *  [
 *      {
 *          column: '',
 *          comparator: '',
 *          value: ''
 *      },
 *      ...
 *  ]
 * @returns {Promise}
 */
const getRows = (tableName, where) => {
    let deferred = Q.defer();
    let DB = dbInstance.getDB();
    let query = 'SELECT * FROM ' + tableName;
    let whereValues = [];
    if (!tableName) {
        throw new Error('`tableName` is not provided');
    }
    if (!where) {
        throw new Error('`where` is not provided');
    } else if (!where.hasOwnProperty('length')) {
        throw new Error('`where` should be an array');
    } else if (where.length == 0) {
        throw new Error('There is no data in `where` object');
    }

    query += ' WHERE ';

    where.forEach((whereItem, i) => {
        query += whereItem.column + ' ' + whereItem.comparator + ' ?';
        if (i < where.length - 1) {
            query += ' AND ';
        }
        whereValues.push(whereItem.value);
    });

    // console.log(chalk.blue('Query:'), query);
    // console.log('whereValues', whereValues);

    DB.all(query, whereValues, (error, rows) => {
        if (error) {
            console.log(chalk.red.bold('[getRows error]'), error);
            deferred.reject();
        } else {
            deferred.resolve(rows);
        }
    });

    return deferred.promise;
};

/**
 * Return first result row
 * @param query {String}
 * @returns {Promise}
 */
const queryOneRow = (query) => {
    let deferred = Q.defer();
    let DB = dbInstance.getDB();

    DB.get(query, (err, row) => {
        if (err) {
            console.log(chalk.red.bold('[getFromTable error]'), err);
            console.log('QUERY was: ', query);
            deferred.reject();
        } else {
            deferred.resolve(row);
        }
    });

    return deferred.promise;
};

/**
 * Return all rows that fit to the given query
 * @param query {String}
 * @returns {Promise}
 */
const queryRows = (query) => {
    let deferred = Q.defer();
    let DB = dbInstance.getDB();

    DB.all(query, (err, rows) => {
        if (err) {
            console.log(chalk.red.bold('[getAll error]'), err);
            console.log('QUERY was: ', query);
            deferred.reject();
        } else {
            deferred.resolve(rows);
        }
    });

    return deferred.promise;
};

/**
 * Delete rows from table
 * @param tableName {String}
 * @param where {Array}
 *  [
 *      {
 *          column: '',
 *          comparator: '',
 *          value: ''
 *      },
 *      ...
 *  ]
 * @returns {Promise}
 */
const deleteRows = (tableName, where) => {
    let deferred = Q.defer();
    let DB = dbInstance.getDB();
    let query = 'DELETE FROM ' + tableName;
    let columnValues = [];
    if (!tableName) {
        throw new Error('`tableName` is not provided');
    }
    if (!where) {
        throw new Error('`where` is not provided');
    } else if (!where.hasOwnProperty('length')) {
        throw new Error('`where` should be an array');
    } else if (where.length == 0) {
        throw new Error('There is no data in `where` object');
    }

    query += ' WHERE ';

    where.forEach((whereItem, i) => {
        query += whereItem.column + ' ' + whereItem.comparator + ' ?';
        if (i < where.length - 1) {
            query += ' AND ';
        }
        columnValues.push(whereItem.value);
    });

    // console.log(chalk.blue('Query:'), query);
    // console.log('columnValues', columnValues);

    DB.serialize(function() {
        DB.run('PRAGMA foreign_keys = ON;');
        DB.run(query, columnValues, (error) => {
            if (error) {
                console.log(chalk.red.bold('[deleteRows error]'), error);
                console.log(chalk.blue('Query was:'), query);
                deferred.reject();
            } else {
                console.log(chalk.blue('Deleted '), where);
                deferred.resolve();
            }
        });
    });

    return deferred.promise;
};

module.exports = (dbPath) => {
    dbInstance.connectToDB(dbPath);

    return {
        getDB: dbInstance.getDB,
        insertRow,
        updateRow,
        getRows,
        deleteRows,
        queryOneRow,
        queryRows
    };
};

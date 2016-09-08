/* eslint-disable no-console, strict*/
'use strict';

const dbInstance = require('./db-instance');

/**
 * Insert row into given table
 * @param tableName {String}
 * @param data {Object}
 * @returns {Promise}
 */
const insertRow = (tableName, data) => new Promise((resolve, reject) => {
    const DB = dbInstance.getDB();
    let query = `INSERT INTO ${tableName} `;
    const columns = [];
    const columnValues = [];
    if (!tableName) {
        throw new Error('tableName is not provided');
    }
    if (!data) {
        throw new Error('data object is not provided');
    }
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            columns.push(key);
            columnValues.push(data[key]);
        }
    }
    if (columns.length === 0) {
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

    try {
        const stmt = DB.prepare(query);
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
                resolve({ id: this.lastID });
            } else {
                // console.log(chalk.red.bold('[insertRow error]'), error);
                // console.log(chalk.red.bold('[insertRow data]'), data)
                /**
                 * In case of UNIQUE constraint failed
                 * `error.errorno` will be 19
                 */
                reject({
                    errno: error.errno,
                    code: error.code
                });
            }
        });
        stmt.finalize();
    } catch (e) {
        console.log(chalk.red.bold('[insertRow error]'), e);
        reject(e);
    }
});

module.exports = insertRow;

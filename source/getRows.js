/* eslint-disable no-console, strict*/
'use strict';

const dbInstance = require('./db-instance');
const verbose = require('./verbose');

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
const getRows = (tableName, where) => new Promise((resolve, reject) => {
    const DB = dbInstance.getDB();
    let query = `SELECT * FROM ${tableName}`;
    const whereValues = [];
    if (!tableName) {
        throw new Error('`tableName` is not provided');
    }
    if (!where) {
        throw new Error('`where` is not provided');
    } else if (!where.hasOwnProperty('length')) {
        throw new Error('`where` should be an array');
    } else if (where.length === 0) {
        throw new Error('There is no data in `where` object');
    }

    query += ' WHERE ';

    where.forEach((whereItem, i) => {
        query += `${whereItem.column} ${whereItem.comparator} ?`;
        if (i < where.length - 1) {
            query += ' AND ';
        }
        whereValues.push(whereItem.value);
    });

    // console.log(chalk.blue('Query:'), query);
    // console.log('whereValues', whereValues);

    DB.all(query, whereValues, (error, rows) => {
        if (error) {
            if (verbose.getVerbose()) {
                console.log(chalk.red.bold('[getRows error]'), error);
            }
            reject();
        } else {
            resolve(rows);
        }
    });
});

module.exports = getRows;

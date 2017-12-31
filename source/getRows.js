const debug = require('debug')('sqlite-crud:getRows');
const dbInstance = require('./db-instance');

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

    DB.all(query, whereValues, (err, rows) => {
        if (err) {
            debug(err);
            reject(err);
        } else {
            resolve(rows);
        }
    });
});

module.exports = getRows;

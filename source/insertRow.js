const debug = require('debug')('sqlite-crud:insertRow');
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

    // eslint-disable-next-line
    query += '(' + columns.join(',') + ') VALUES (';
    columns.forEach((column, i) => {
        query += '?';
        if (i < columns.length - 1) {
            query += ',';
        }
    });
    query += ')';

    try {
        const stmt = DB.prepare(query);
        stmt.run(columnValues, function(err) {
            if (!err) {
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
                /**
                 * In case of UNIQUE constraint failed
                 * `error.errorno` will be 19
                 */
                debug(err);
                reject({
                    errno: err.errno,
                    code: err.code,
                });
            }
        });
        stmt.finalize();
    } catch (err) {
        debug(err);
        reject(err);
    }
});

module.exports = insertRow;

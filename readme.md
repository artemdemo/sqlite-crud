# SQLite layer of CRUD

Simple module for common CRUD operations with SQLite database.

```javascript
const DB = require('sqlite-crud')('./server/your-file.db');
```

**Dependencies**

* q
* sqlite3

## API

### getDB

Will return database object and you can use it for your own calls

```javascript
const myDB = DB.getDB();
```

### insertRow

```javascript
/**
 * Insert row into given table
 * @param tableName {string}
 * @param data {object}
 */
DB.insertRow(tableName, data);
```

```javascript
DB.insertRow('tasks', {
        name: newTask.name,
        description: newTask.description,
        added: now.format('YYYY-MM-DD HH:mm:ss'),
        updated: now.format('YYYY-MM-DD HH:mm:ss')
    }).then((result) => {
        deferred.resolve({
            id: result.id,
            added: now.format('YYYY-MM-DD HH:mm:ss'),
            updated: now.format('YYYY-MM-DD HH:mm:ss')
        });
    }, (error) => {
        console.log(chalk.red.bold('[error]'), error);
        deferred.reject();
    });
```

### updateRow

```javascript
/**
 * Update table row
 * @param tableName {string}
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
 */
DB.updateRow(tableName, data, where);
```

```javascript
DB.updateRow('tasks', {
        name: task.name,
        description: task.description,
        updated: now.format('YYYY-MM-DD HH:mm:ss')
    }, [{
        column: 'id',
        comparator: '=',
        value: task.id
    }]).then(() => {
        deferred.resolve();
    }, (error) => {
        console.log(chalk.red.bold('[error]'), error);
        deferred.reject();
    });
```

### getRows

```javascript
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
 DB.getRows(tableName, where);
```

```javascript
DB.getRows('tasks', [{
        column: 'id',
        comparator: '=',
        value: id
    }])
        .then((rows) => {
            deferred.resolve(rows);
        }, () => {
            console.log(chalk.red.bold('[error]'), error);
            deferred.reject();
        });
```

### deleteRows

```javascript
/**
 * Delete rows from table
 * @param tableName {string}
 * @param where {Array}
 *  [
 *      {
 *          column: '',
 *          comparator: '',
 *          value: ''
 *      },
 *      ...
 *  ]
 */
DB.deleteRows(tableName, where);
```

```javascript
DB.deleteRows('tasks', [{
        column: 'id',
        comparator: '=',
        value: taskId
    }]).then(() => {
        deferred.resolve();
    }, (error) => {
        console.log(chalk.red.bold('[deleteTask error]'), error);
        deferred.reject();
    });
```

### queryOneRow

```javascript
/**
 * Return first result row
 * @param query {string}
 */
DB.queryOneRow(query);
```

```javascript
DB.queryOneRow('SELECT * FROM ' + testTableName + ';')
    .then((result) => {
        // result - will be an object
        // If there is no match will be undefined
        deferred.resolve(result);
    }, () => {
        console.log(chalk.red.bold('[getFromTable error]'), error);
        deferred.reject();
    });
```

### queryRows

```javascript
/**
 * Return all results (rows) for given query
 * @param query {string}
 */
DB.queryRows(query);
```

```javascript
DB.queryRows('SELECT * FROM ' + testTableName + ';')
    .then((rows) => {
        // rows - will be an array
        deferred.resolve(rows);
    }, (error) => {
        console.log(chalk.red.bold('[getAll error]'), error);
        deferred.reject();
    });
```

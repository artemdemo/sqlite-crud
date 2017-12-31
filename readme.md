# SQLite layer of CRUD

Simple module for common CRUD operations with SQLite database.

```javascript
const DB = require('sqlite-crud');
DB.connectToDB('./server/your-file.db');
```

**Dependencies**

* sqlite3

## How to use
I haven't published this package in npm, therefore you'll need to add github link as source to you `package.json`:

```javascript
"dependencies": {
    // ...
    "sqlite-crud": "git+https://github.com/artemdemo/sqlite-crud.git#2.0"
}
```

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
 * @param tableName {String}
 * @param data {Object}
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
        resolve({
            id: result.id,
            added: now.format('YYYY-MM-DD HH:mm:ss'),
            updated: now.format('YYYY-MM-DD HH:mm:ss')
        });
    }, (error) => {
        console.log(chalk.red.bold('[error]'), error);
        reject();
    });
```

### updateRow

```javascript
/**
 * Update table row
 * @param tableName {String}
 * @param data {Object}
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
        resolve();
    }, (error) => {
        console.log(chalk.red.bold('[error]'), error);
        reject();
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
            resolve(rows);
        }, () => {
            console.log(chalk.red.bold('[error]'), error);
            reject();
        });
```

### deleteRows

```javascript
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
 */
DB.deleteRows(tableName, where);
```

```javascript
DB.deleteRows('tasks', [{
        column: 'id',
        comparator: '=',
        value: taskId
    }]).then(() => {
        resolve();
    }, (error) => {
        console.log(chalk.red.bold('[deleteTask error]'), error);
        reject();
    });
```

### queryOneRow

```javascript
/**
 * Return first result row
 * @param query {String}
 */
DB.queryOneRow(query);
```

```javascript
DB.queryOneRow('SELECT * FROM table_name;')
    .then((result) => {
        // result - will be an object
        // If there is no match will be undefined
        resolve(result);
    }, () => {
        console.log(chalk.red.bold('[error]'), error);
        reject();
    });
```

### queryRows

```javascript
/**
 * Return all results (rows) for given query
 * @param query {String}
 * @param parameters {Array} array of parameters to th query (optional)
 */
DB.queryRows(query, parameters);
```

```javascript
DB.queryRows('SELECT * FROM table_name WHERE name = ?;', ['Row name'])
    .then((rows) => {
        // rows - will be an array
        resolve(rows);
    }, (error) => {
        console.log(chalk.red.bold('[error]'), error);
        reject();
    });
```

### run

```javascript
/**
 * Proxy function for run
 * @param query {String}
 * @param parameters {Array} array of parameters to th query (optional)
 * @param options {Object} (optional)
 * @param options.saveRun {Boolean} if `true` will always resolve promise
 */
```

```javascript
DB.run(
    'INSERT INTO table_name (name, description) VALUES (?, ?)',
    ['run-test', 'run-test description']
).then((result) => {
    resolve(result.lastID);
}, (error) => {
    console.log(chalk.red.bold('[run error]'), error);
    reject();
});
```

### Migration

**File migration**

```json
{
    "query": "CREATE TABLE test (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100), description TEXT, added DATETIME);"
}
```

or

```json
{
    "queries": [
        "CREATE TABLE dummy01 (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100));",
        "CREATE TABLE dummy02 (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100));"
    ]
}
```

```javascript
/**
 * Migrate file
 * @param pathToFile {String} - path to migrate json file (or folder)
 */
DB.migrate(pathToFile)
```

```javascript
DB.migrate('./migrations/20151102_create_dummy_tables.json')
    .then(() => {
        // Migration was successful
    });
```

### Print errors

Set env variable `DEBUG`:

```
DEBUG=sqlite-crud:*
```

## SQLite database manager

Multiplatform software for sqlite database managing:

http://sqlitestudio.pl/


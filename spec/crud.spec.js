'use strict';

const dbPath = './db/test-db.db';
const testTableName = 'test';
const fs = require('fs');

let DB;


describe('Create new DB if don\'t exist and adding test table:', () => {

    try {
        // removing previous DB file, if there was one
        fs.unlinkSync(dbPath);
    } catch (e) {}

    DB = require('../index')(dbPath);

    it('DB file created', () => {
        fs.stat(dbPath, (error, stat) => {
            expect(error).toBe(null);
        });
    });

    it('Added test table', (done) => {
        const db = DB.getDB();
        db.run('CREATE TABLE ' + testTableName + ' (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR (100), description TEXT, added DATETIME);',
            (error) => {
                expect(!error).toBe(true);
                done();
            });
    });
});


describe('Inserting new rows:', () => {
    let rowId = 0;

    it('New row added to table', (done) => {
        DB.insertToTable(testTableName, {
            name: 'First name',
            description: 'Some description for first name',
            added: '1980-11-28 13:45'
        }).then((result) => {
            rowId = result.id;
            expect(rowId).toBe(1);
            done();
        }, () => {
            throw new Error('Row is not added - error in DB')
            done();
        });
    });

    it('Second row added', (done) => {
        DB.insertToTable(testTableName, {
            name: 'Second name',
            description: 'Another description for second name',
            added: '1996-12-31 23:18'
        }).then((result) => {
            rowId = result.id;
            expect(rowId).toBe(2);
            done();
        }, () => {
            throw new Error('Row is not added - error in DB')
            done();
        });
    });
});


describe('Getting rows from the table:', () => {

    it('Should be 2 rows in table', (done) => {
        DB.getAll('SELECT * FROM ' + testTableName + ';')
            .then((rows) => {
                expect(rows.length).toBe(2);
                done();
            }, () => {
                throw new Error('Error in DB')
                done();
            });
    });

    it('First row in table', (done) => {
        DB.getFromTable('SELECT * FROM ' + testTableName + ';')
            .then((result) => {
                expect(result.name).toBe('First name');
                done();
            }, () => {
                throw new Error('Error in DB')
                done();
            });
    });
});


describe('Updating row in table:', () => {

    it('Update first row', (done) => {
        DB.updateInTable(testTableName, {
            name: 'New First name'
        }, [{
            column: 'id',
            comparator: '=',
            value: 1
        }]).then((result) => {
            done();
        }, (error) => {
            throw new Error('Error in DB')
            done();
        });
    });

    it('Name in first row should changed', (done) => {
        DB.getFromTable('SELECT * FROM ' + testTableName + ' WHERE id=1;')
            .then((result) => {
                expect(result.name).toBe('New First name');
                done();
            }, () => {
                throw new Error('Error in DB')
                done();
            });
    });

    it('Update second row', (done) => {
        DB.updateInTable(testTableName, {
            name: 'New Second name'
        }, [{
            column: 'id',
            comparator: '=',
            value: 2
        }, {
            column: 'added',
            comparator: '=',
            value: '1996-12-31 23:18'
        }]).then((result) => {
            expect(true).toBe(true);
            done();
        }, (error) => {
            throw new Error('Error in DB')
            done();
        });
    });

    it('Name in second row should changed', (done) => {
        DB.getFromTable('SELECT * FROM ' + testTableName + ' WHERE id=2;')
            .then((result) => {
                expect(result.name).toBe('New Second name');
                done();
            }, () => {
                throw new Error('Error in DB')
                done();
            });
    });
});


describe('Remove rows from table:', () => {

    it('Delete first row from table', () => {
        DB.deleteRows(testTableName, [{
            column: 'id',
            comparator: '=',
            value: 1
        }]).then(() => {
            done();
        }, () => {
            throw new Error('Error in DB')
            done();
        });
    });

    it('There is no first row in table', (done) => {
        DB.getFromTable('SELECT * FROM ' + testTableName + ' WHERE id=1;')
            .then((result) => {
                expect(result).toBe(undefined);
                done();
            }, () => {
                throw new Error('Error in DB')
                done();
            });
    });

    it('Delete second row from table', () => {
        DB.deleteRows(testTableName, [{
            column: 'id',
            comparator: '=',
            value: 2
        }, {
            column: 'added',
            comparator: '=',
            value: '1996-12-31 23:18'
        }]).then(() => {
            done();
        }, () => {
            throw new Error('Error in DB')
            done();
        });
    });

    it('There is no second row in table', (done) => {
        DB.getFromTable('SELECT * FROM ' + testTableName + ' WHERE id=2;')
            .then((result) => {
                expect(result).toBe(undefined);
                done();
            }, () => {
                throw new Error('Error in DB')
                done();
            });
    });
});

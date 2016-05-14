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
        DB.insertRow(testTableName, {
            name: 'First name',
            description: 'Some description for first name',
            added: '1980-11-28 13:45'
        }).then((result) => {
            rowId = result.id;
            expect(rowId).toBe(1);
            done();
        }, () => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });

    it('Second row added', (done) => {
        DB.insertRow(testTableName, {
            name: 'Second name',
            description: 'Another description for second name',
            added: '1996-12-31 23:18'
        }).then((result) => {
            rowId = result.id;
            expect(rowId).toBe(2);
            done();
        }, () => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });

    it('Second row added', (done) => {
        DB.insertRow(testTableName, {
            name: 'Third name',
            description: 'Same as second name',
            added: '1996-12-31 23:18'
        }).then((result) => {
            rowId = result.id;
            expect(rowId).toBe(3);
            done();
        }, () => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });
});


describe('Getting rows from the table:', () => {

    it('Should be 3 rows in table', (done) => {
        DB.queryRows('SELECT * FROM ' + testTableName + ';')
            .then((rows) => {
                expect(rows.length).toBe(3);
                done();
            }, () => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('First row in table', (done) => {
        DB.queryOneRow('SELECT * FROM ' + testTableName + ';')
            .then((result) => {
                expect(result.name).toBe('First name');
                done();
            }, () => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('1 row with date 1996-12-31 23:18 and name "Second name"', (done) => {
        DB.getRows(testTableName, [{
            column: 'name',
            comparator: '=',
            value: 'Second name'
        },{
            column: 'added',
            comparator: '=',
            value: '1996-12-31 23:18'
        }])
            .then((result) => {
                expect(result && result.length).toBe(1);
                expect(result && result[0].name).toBe('Second name');
                done();
            }, () => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('2 rows with the same date', (done) => {
        DB.getRows(testTableName, [{
            column: 'added',
            comparator: '=',
            value: '1996-12-31 23:18'
        }])
            .then((result) => {
                expect(result && result.length).toBe(2);
                done();
            }, () => {
                done();
                throw new Error('Error in DB');
            });
    });
});


describe('Updating row in table:', () => {

    it('Update first row', (done) => {
        DB.updateRow(testTableName, {
            name: 'New First name'
        }, [{
            column: 'id',
            comparator: '=',
            value: 1
        }]).then((result) => {
            done();
        }, () => {
            done();
            throw new Error('Error in DB');
        });
    });

    it('Name in first row should changed', (done) => {
        DB.queryOneRow('SELECT * FROM ' + testTableName + ' WHERE id=1;')
            .then((result) => {
                expect(result.name).toBe('New First name');
                done();
            }, () => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('Update second row', (done) => {
        DB.updateRow(testTableName, {
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
        }, () => {
            done();
            throw new Error('Error in DB');
        });
    });

    it('Name in second row should changed', (done) => {
        DB.queryOneRow('SELECT * FROM ' + testTableName + ' WHERE id=2;')
            .then((result) => {
                expect(result.name).toBe('New Second name');
                done();
            }, () => {
                done();
                throw new Error('Error in DB');
            });
    });
});


describe('Remove rows from table:', () => {

    it('Delete first row from table', (done) => {
        DB.deleteRows(testTableName, [{
            column: 'id',
            comparator: '=',
            value: 1
        }]).then(() => {
            done();
        }, () => {
            done();
            throw new Error('Error in DB');
        });
    });

    it('There is no first row in table', (done) => {
        DB.queryOneRow('SELECT * FROM ' + testTableName + ' WHERE id=1;')
            .then((result) => {
                expect(result).toBe(undefined);
                done();
            }, () => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('Delete second row from table', (done) => {
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
            done();
            throw new Error('Error in DB');
        });
    });

    it('There is no second row in table', (done) => {
        DB.queryOneRow('SELECT * FROM ' + testTableName + ' WHERE id=2;')
            .then((result) => {
                expect(result).toBe(undefined);
                done();
            }, () => {
                done();
                throw new Error('Error in DB');
            });
    });
});

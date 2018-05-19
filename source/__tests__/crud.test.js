const fs = require('fs');
const { expect } = require('chai');

const dbPath = './db/test-db.db';
const testTableName = 'test';

let DB;

describe('Create new DB:', () => {
    try {
        // removing previous DB file, if there was one
        fs.unlinkSync(dbPath);
    } catch (e) {}

    DB = require('../../index');
    DB.connectToDB(dbPath);

    it('DB file created', () => {
        fs.stat(dbPath, (error) => {
            expect(error).to.equal(null);
        });
    });
});

describe('Create test table with migration:', () => {
    it('Wrong file name reject promise', (done) => {
        DB.migrate('source/__tests__/migrations/wrong_path.json')
            .then(() => {
                done();
                throw new Error('Error in DB');
            })
            .catch(() => {
                done();
            });
    });

    it('Added test table', (done) => {
        DB.migrate('source/__tests__/migrations/20151101_create_test_table.json')
            .then(() => {
                done();
            });
    });

    it('Test table can\'t be added twice', (done) => {
        DB.migrate('source/__tests__/migrations/20151101_create_test_table.json')
            .then(() => {
                done();
                throw new Error('Error in DB');
            })
            .catch(() => {
                done();
            });
    });

    it('Test table file name added to `migrations` table once', (done) => {
        DB.queryRows('SELECT * FROM migrations;')
            .then((results) => {
                let fileNamesCounter = 0;
                results.forEach((row) => {
                    switch (row.migration) {
                        case '20151101_create_test_table.json':
                            fileNamesCounter++;
                            break;
                    }
                });
                expect(fileNamesCounter).to.equal(1);
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });
});

describe('Create 2 dummy tables with migration:', () => {
    it('Added 2 dummy tables', (done) => {
        DB.migrate('source/__tests__/migrations/20151102_create_dummy_tables.json')
            .then(() => {
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('2 dummy tables can\'t be added twice', (done) => {
        DB.migrate('source/__tests__/migrations/20151102_create_dummy_tables.json')
            .then(() => {
                done();
                throw new Error('Error in DB');
            })
            .catch(() => {
                done();
            });
    });

    it('Add row to first dummy table', (done) => {
        let rowId = 0;

        DB.insertRow('dummy01', {
            name: 'First dummy01',
        }).then((result) => {
            rowId = result.id;
            expect(rowId).to.equal(1);
            done();
        }).catch(() => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });

    it('Add row to second dummy table', (done) => {
        let rowId = 0;

        DB.insertRow('dummy02', {
            name: 'First dummy02',
        }).then((result) => {
            rowId = result.id;
            expect(rowId).to.equal(1);
            done();
        }).catch(() => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });
});

describe('Test migration file with wrong query:', () => {
    it('Wrong query should be rejected', (done) => {
        DB.migrate('source/__tests__/migrations/20151103_wrong_query.json')
            .then(() => {
                // shouldn't get here
                done();
                throw new Error('Error in DB');
            })
            .catch(() => {
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
            added: '1980-11-28 13:45',
        }).then((result) => {
            rowId = result.id;
            expect(rowId).to.equal(1);
            done();
        }).catch(() => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });

    it('Second row added', (done) => {
        DB.insertRow(testTableName, {
            name: 'Second name',
            description: 'Another description for second name',
            added: '1996-12-31 23:18',
        }).then((result) => {
            rowId = result.id;
            expect(rowId).to.equal(2);
            done();
        }).catch(() => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });

    it('Second row added', (done) => {
        DB.insertRow(testTableName, {
            name: 'Third name',
            description: 'Same as second name',
            added: '1996-12-31 23:18',
        }).then((result) => {
            rowId = result.id;
            expect(rowId).to.equal(3);
            done();
        }).catch(() => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });
});


describe('Getting rows from the table:', () => {

    it('Should be 3 rows in table', (done) => {
        DB.queryRows(`SELECT * FROM ${testTableName};`)
            .then((rows) => {
                expect(rows.length).to.equal(3);
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('Should query 2 rows only', (done) => {
        DB.queryRows(
            `SELECT * FROM ${testTableName} WHERE name = ? OR id = ?;`,
            ['First name', 3]
        )
            .then((rows) => {
                expect(rows.length).to.equal(2);
                expect(rows[0].name).to.equal('First name');
                expect(rows[1].id).to.equal(3);
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('First row in table', (done) => {
        DB.queryOneRow(`SELECT * FROM ${testTableName};`)
            .then((result) => {
                expect(result.name).to.equal('First name');
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('1 row with date 1996-12-31 23:18 and name "Second name"', (done) => {
        DB.getRows(testTableName, [{
            column: 'name',
            comparator: '=',
            value: 'Second name',
        }, {
            column: 'added',
            comparator: '=',
            value: '1996-12-31 23:18',
        }])
            .then((result) => {
                expect(result && result.length).to.equal(1);
                expect(result && result[0].name).to.equal('Second name');
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('2 rows with the same date', (done) => {
        DB.getRows(testTableName, [{
            column: 'added',
            comparator: '=',
            value: '1996-12-31 23:18',
        }])
            .then((result) => {
                expect(result && result.length).to.equal(2);
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });
});


describe('Updating row in table:', () => {

    it('Update first row', (done) => {
        DB.updateRow(testTableName, {
            name: 'New First name',
        }, [{
            column: 'id',
            comparator: '=',
            value: 1,
        }]).then(() => {
            done();
        }).catch(() => {
            done();
            throw new Error('Error in DB');
        });
    });

    it('Name in first row should changed', (done) => {
        DB.queryOneRow(`SELECT * FROM ${testTableName} WHERE id=1;`)
            .then((result) => {
                expect(result.name).to.equal('New First name');
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('Update second row', (done) => {
        DB.updateRow(testTableName, {
            name: 'New Second name',
        }, [{
            column: 'id',
            comparator: '=',
            value: 2,
        }, {
            column: 'added',
            comparator: '=',
            value: '1996-12-31 23:18',
        }]).then(() => {
            expect(true).to.equal(true);
            done();
        }).catch(() => {
            done();
            throw new Error('Error in DB');
        });
    });

    it('Name in second row should changed', (done) => {
        DB.queryOneRow(`SELECT * FROM ${testTableName} WHERE id=2;`)
            .then((result) => {
                expect(result.name).to.equal('New Second name');
                done();
            })
            .catch(() => {
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
            value: 1,
        }]).then(() => {
            done();
        }).catch(() => {
            done();
            throw new Error('Error in DB');
        });
    });

    it('There is no first row in table', (done) => {
        DB.queryOneRow(`SELECT * FROM ${testTableName} WHERE id=1;`)
            .then((result) => {
                expect(result).to.equal(undefined);
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('Delete second row from table', (done) => {
        DB.deleteRows(testTableName, [{
            column: 'id',
            comparator: '=',
            value: 2,
        }, {
            column: 'added',
            comparator: '=',
            value: '1996-12-31 23:18',
        }]).then(() => {
            done();
        }).catch(() => {
            done();
            throw new Error('Error in DB');
        });
    });

    it('There is no second row in table', (done) => {
        DB.queryOneRow(`SELECT * FROM ${testTableName} WHERE id=2;`)
            .then((result) => {
                expect(result).to.equal(undefined);
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });
});

describe('Test DB.run()', () => {
    it('Insert row', (done) => {
        DB.run(
            `INSERT INTO ${testTableName}
                    (name, description, added)
             VALUES ('run-test', 'run-test description', '2096-11-11 11:34');`
        ).then((result) => {
            expect(result.lastID > 1).to.equal(true);
            done();
        }).catch(() => {
            done();
            throw new Error('Error in DB');
        });
    });
});

describe('Migrate folder:', () => {
    it('Create tables', (done) => {
        DB.migrate('source/__tests__/migrations_dir')
            .then(() => {
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('Tables can be created only once', (done) => {
        DB.migrate('source/__tests__/migrations_dir')
            .then(() => {
                done();
                throw new Error('Error in DB');
            })
            .catch(() => {
                done();
            });
    });

    it('File names added to `migrations` table', (done) => {
        DB.queryRows('SELECT * FROM migrations;')
            .then((results) => {
                let fileNamesCounter = 0;
                results.forEach((row) => {
                    switch (row.migration) {
                        case '20150616_dummy03_table.json':
                            fileNamesCounter++;
                            break;
                        case '20150618_dummy04-05_tables.json':
                            fileNamesCounter++;
                            break;
                        case '20150619_seeds_table.json':
                            fileNamesCounter++;
                            break;
                    }
                });
                expect(fileNamesCounter).to.equal(3);
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });

    it('Add row to third dummy table', (done) => {
        let rowId = 0;

        DB.insertRow('dummy03', {
            name: 'First dummy03',
        }).then((result) => {
            rowId = result.id;
            expect(rowId).to.equal(1);
            done();
        }).catch(() => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });

    it('Add row to fourth dummy table', (done) => {
        let rowId = 0;

        DB.insertRow('dummy04', {
            name: 'First dummy04',
        }).then((result) => {
            rowId = result.id;
            expect(rowId).to.equal(1);
            done();
        }).catch(() => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });

    it('Add row to fifth dummy table', (done) => {
        let rowId = 0;

        DB.insertRow('dummy05', {
            name: 'First dummy05',
        }).then((result) => {
            rowId = result.id;
            expect(rowId).to.equal(1);
            done();
        }).catch(() => {
            done();
            throw new Error('Row is not added - error in DB');
        });
    });

    it('Seeds added to the table', (done) => {
        DB.queryRows('SELECT * FROM seeds;')
            .then((rows) => {
                expect(rows.length).to.equal(4);
                done();
            })
            .catch(() => {
                done();
                throw new Error('Error in DB');
            });
    });
});

const { assert } = require('chai');
const pg = require('../lib');

describe('pg-db', () => {
  const connectionString = 'postgres://root:supersecret@localhost:5432/postgres';
  let db;

  beforeEach(async () => {
    db = pg({
      connectionString,
    });

    await db.query('drop schema if exists vicino cascade');
    await db.query('create schema vicino');
    await db.query(`
    create table vicino.users (
      id serial primary key,
      first_name text not null
    );
      `);
  });

  afterEach(async () => {
    await db.pool.end();
  });

  it('should connect to database', async () => {
    await db.query('select * from vicino.users');
  });

  it('should perform a transaction successfully', async () => {
    await db.performTransaction(async (client) => {
      await client.query(`
      insert into vicino.users (first_name)
      values ('alois');
      `);
    });

    const result = await db.query('select * from vicino.users');
    assert.equal(1, result.rowCount);

    // check to make sure the client is released back to the pool
    assert.equal(db.pool.idleCount, db.pool.totalCount);
  });

  it('should rollback on failure', async () => {
    // make sure we're starting with zero rows
    const result = await db.query('select * from vicino.users');
    assert.equal(0, result.rowCount);

    try {
      await db.performTransaction(async (client) => {
        // insert a good row
        await client.query(`
        insert into vicino.users (first_name)
        values ('alois');
      `);

        // insert a bad row so we can make sure it rolls back
        await client.query(`
        insert into vicino.users (first_name)
        values (null);
      `);
      });

      throw new Error('We shouldn\'t get here.');
    } catch (e) {
      // there should be zero because the transaction failed
      const res = await db.query('select * from vicino.users');
      assert.equal(0, res.rowCount);
    } finally {
      // check to make sure the client is released back to the pool
      assert.equal(db.pool.idleCount, db.pool.totalCount);
    }
  });
});

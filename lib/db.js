const { Pool } = require('pg');
const debug = require('debug')('@vicino/pg-db:query-stats');

class Database {
  constructor(options) {
    this.pool = new Pool(options);
  }

  async query(text, params) {
    const start = Date.now();
    const result = await this.pool.query(text, params);
    const duration = Date.now() - start;
    debug('executed query', { text, duration, rows: result.rowCount });
    return result;
  }

  async performTransaction(fn) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await fn(client);
      await client.query('commit');
      return result;
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = options => new Database(options);

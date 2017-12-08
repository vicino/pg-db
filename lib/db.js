const { Pool } = require('pg');
const debug = require('debug')('@vicino/pg-db:query-stats');

class Database {
  constructor(options) {
    this.pool = new Pool(options);
  }

  async query(text, client = this.pool) {
    const start = Date.now();
    const result = await client.query(text);
    const duration = Date.now() - start;
    debug('executed query', { text, duration, rows: result.rowCount });
    return result;
  }

  async performTransaction(fn) {
    const client = await this.pool.connect();
    try {
      await this.query('begin', client);
      const result = await fn({
        query: query => this.query(query, client),
      });
      await this.query('commit', client);
      return result;
    } catch (err) {
      await this.query('rollback', client);
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = options => new Database(options);

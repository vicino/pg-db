const { Pool } = require('pg');
const debug = require('debug')('@vicino/pg-db:query-stats');

class Query {
  constructor(options) {
    this.client = options.client;
    this.text = null;
    this.values = null;
    this._firstRow = false;
    this._allRows = false;
  }

  query(text, values) {
    this.text = text;
    this.values = values;
    return this;
  }

  async exec() {
    const start = Date.now();
    const result = await this.client.query(this.text, this.values);
    const duration = Date.now() - start;
    debug('executed query', { text: this.text, duration, rows: result.rowCount });
    return result;
  }

  firstRow() {
    this._firstRow = true;
    return this;
  }

  allRows() {
    this._allRows = true;
    return this;
  }

  then(resolve, reject) {
    const promise = new Promise((success, error) => {
      this.exec().then(
        (val) => {
          if (this._firstRow === true) {
            return success(val.rows[0]);
          }

          if (this._allRows) {
            return success(val.rows);
          }

          return success(val);
        },
        (e) => {
          error(e);
        },
      );
    });
    return promise.then(resolve, reject);
  }
}

class Database {
  constructor(options) {
    this.pool = new Pool(options);
  }

  query(text, values, client = this.pool) {
    return new Query({ client }).query(text, values);
  }

  async performTransaction(fn) {
    const client = await this.pool.connect();
    try {
      await this.query('begin', null, client);
      const result = await fn({
        query: (text, values) => this.query(text, values, client),
      });
      await this.query('commit', null, client);
      return result;
    } catch (err) {
      await this.query('rollback', null, client);
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = options => new Database(options);

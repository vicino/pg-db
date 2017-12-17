const knex = require('knex')({ client: 'pg' });

module.exports = (table, columns, {
  schema,
  defaultSelect = ['*'],
  defaultReturning = ['*'],
  db,
}) => {
  class Model {
    static knex() {
      return knex.withSchema(schema).table(table);
    }

    static get defaultSelect() {
      return defaultSelect;
    }

    static get defaultReturning() {
      return defaultReturning;
    }

    static findById(id, { transaction = db, select = defaultSelect } = {}) {
      const query = this.knex().select(select).where({ id }).toString();
      return transaction.query(query).firstRow();
    }

    static find(where, { transaction = db, select = defaultSelect } = {}) {
      const query = this.knex().select(select).where(where).toString();
      return transaction.query(query).allRows();
    }

    static insert(data, { transaction = db, returning = defaultReturning } = {}) {
      const query = this.knex().insert(data).returning(returning).toString();
      return transaction.query(query);
    }

    static update(data, where, { transaction = db, returning = defaultReturning } = {}) {
      const query = this.knex().update(data).where(where).returning(returning).toString(); // eslint-disable-line newline-per-chained-call
      return transaction.query(query);
    }

    static delete(where, { transaction = db }) {
      const query = this.knex().delete(where).toString();
      return transaction.query(query);
    }

    static query(query, { transaction = db } = {}) {
      return transaction.query(query);
    }
  }

  return Model;
};

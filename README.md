# pg-db
Package for connecting to a Postgres database and performing some basic operations.

## Installation
```npm install --save @vicino/pg-db```

## Usage

### Connecting to Postgres

```javascript
const pg = require('@vicino/pg-db');
const connectionString = 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb';

const db = pg({
  connectionString,
});

db.query('select now()');

```
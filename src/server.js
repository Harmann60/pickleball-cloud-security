'use strict';

const app = require('./app');

const port = Number(process.env.PORT) || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Pickleball demo app listening on http://0.0.0.0:${port}`);
  console.log(`Storage mode: ${process.env.STORAGE_MODE || 'local'}`);
  if (!process.env.ADMIN_TOKEN) {
    console.warn(
      'ADMIN_TOKEN not set — generated a random admin token for this run only.\n' +
        'This is a prototype control. Set ADMIN_TOKEN in .env for a stable token.'
    );
  }
});

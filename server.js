const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: `${__dirname}/config.env` });
const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected');
  })
  .catch((error) => {
    console.log('could not connect');
    console.log(error);
  });

const app = require('./app');
console.log(process.env.NODE_ENV);

app.listen(process.env.PORT, 'localhost', () => {
  console.log(`listening on localhost:${process.env.PORT}`);
});

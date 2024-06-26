const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log(err.stack);
  console.log('UNCAUGHT EXCEPTION, Shutting down ...');
  process.exit();
});

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

const server = app.listen(process.env.PORT, 'localhost', () => {
  console.log(`listening on localhost:${process.env.PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log(err.stack);

  console.log('UNHANDLED REJECTION, Shutting down...');
  server.close(() => {
    process.exit();
  });
});
process.on('SIGTERM', () => {
  console.log('SIGTERM recieved, shutting down gracefully');
  server.close(() => {
    console.log('Shut down successful');
  });
});

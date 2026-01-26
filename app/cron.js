const cron = require('node-cron');

// Runs every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running daily job:', new Date().toISOString());
  // put your job logic here
});

// Runs every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Running every 5 minutes');
});

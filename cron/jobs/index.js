// jobs/index.js
// Central place to register all cron jobs

import cron from 'node-cron';
import sampleJob from './sampleJob.js';

// Schedule the job to run every minute
cron.schedule('* * * * *', sampleJob);
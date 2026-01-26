const cron = require('node-cron');
const { runCampaignBatch } = require('./runCampaignBatch');

// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
	console.log('Running daily campaign batch:', new Date().toISOString());
	try {
		await runCampaignBatch();
	} catch (err) {
		console.error('Error running daily campaign batch:', err);
	}
});

// Runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
	console.log('Running 5-min campaign batch:', new Date().toISOString());
	try {
		await runCampaignBatch();
	} catch (err) {
		console.error('Error running 5-min campaign batch:', err);
	}
});

console.log('Cron job started. Waiting for scheduled executions...');
require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const { populateSampleData } = require('./utils/seedHelper');

const runSeed = async () => {
  const { mode } = await connectDB();
  if (mode === 'memory') {
    console.log('Note: Local MongoDB is not running. Seed data is auto-loaded whenever the server starts in embedded mode.');
  } else {
    await populateSampleData({ clearExisting: true });
    console.log('Persistent MongoDB seeded successfully.');
  }
  await disconnectDB();
  process.exit(0);
};

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

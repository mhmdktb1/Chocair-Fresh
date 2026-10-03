import mongoose from 'mongoose';

const MAX_RETRY_DELAY_MS = 30000;
let listenersAttached = false;

const attachConnectionListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected – driver will auto-reconnect'));
  mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected'));
  mongoose.connection.on('error', (err) => console.error(`❌ MongoDB error: ${err.message}`));
};

export const isDbConnected = () => mongoose.connection.readyState === 1;

// Keeps retrying the initial connection with exponential backoff. Without this, a single
// failed attempt at boot (Atlas hiccup, DNS blip, cold start) left the server permanently
// without a database until it was restarted.
const connectDB = async (attempt = 1) => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    return;
  }

  attachConnectionListeners();

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 2,
      maxIdleTimeMS: 60000,
      retryWrites: true,
      retryReads: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
  } catch (error) {
    const delay = Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** (attempt - 1));
    console.error(`❌ MongoDB Connection Error (attempt ${attempt}): ${error.message}. Retrying in ${delay / 1000}s`);
    if (attempt === 1) {
      console.log('⚠️  Please verify MONGO_URI in .env and ensure your IP is whitelisted on Atlas (or set to 0.0.0.0/0).');
    }
    setTimeout(() => connectDB(attempt + 1), delay);
  }
};

export default connectDB;

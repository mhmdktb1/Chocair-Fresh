import fs from 'fs';
import path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const lines = envConfig.split('\n');
    for (const line of lines) {
      if (line.startsWith('MONGO_URI=')) {
        console.log(line.trim());
      }
    }
  } else {
    console.log('No .env file found at ' + envPath);
  }
} catch (e) {
  console.error(e);
}

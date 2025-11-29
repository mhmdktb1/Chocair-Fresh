import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRE: z.string().default('30d'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DEV_MODE: z.string().optional().default('false'),
});

export const validateEnv = () => {
  try {
    // Set DEV_MODE default to 'true' in development if not explicitly set
    if (!process.env.DEV_MODE && process.env.NODE_ENV === 'development') {
      process.env.DEV_MODE = 'true';
    }
    
    const parsed = envSchema.parse(process.env);
    // Assign parsed values back to process.env to ensure defaults are applied
    Object.assign(process.env, parsed);
    console.log('✅ Environment variables validated');
    if (process.env.DEV_MODE === 'true') {
      console.log('⚠️  DEV_MODE enabled - Authentication bypassed');
    }
  } catch (error) {
    console.error('❌ Invalid environment variables:', error.errors);
    process.exit(1);
  }
};

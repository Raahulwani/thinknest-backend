import * as dotenv from 'dotenv';

export function loadEnv() {
  dotenv.config();
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT || 4000),

    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    DB_NAME: process.env.DB_NAME,

    // schema support
    DB_SCHEMA: process.env.DB_SCHEMA || 'public',

    FEATURED_IDEAS_ENABLED: process.env.FEATURED_IDEAS_ENABLED ?? 'true',
    RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET,
    CONTACT_ENABLE_RECAPTCHA: process.env.CONTACT_ENABLE_RECAPTCHA ?? 'true',
  };
}

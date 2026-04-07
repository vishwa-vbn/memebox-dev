import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'IMAGEKIT_PUBLIC_KEY',
  'IMAGEKIT_PRIVATE_KEY',
  'IMAGEKIT_URL_ENDPOINT',
  'FRONTENDDOMAIN',
  'BREVO_SMTP_PASS',
  'BREVO_SMTP_USER'
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully.');
}

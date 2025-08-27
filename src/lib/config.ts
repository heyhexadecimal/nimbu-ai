
export interface AppConfig {
  maxUserMessagesPerChat: number;
  databaseUrl: string | undefined;
  nextAuthSecret: string | undefined;
  nextAuthUrl: string | undefined;
  googleClientId: string | undefined;
  googleClientSecret: string | undefined;
}

export const config: AppConfig = {
  maxUserMessagesPerChat: (() => {
    const value = parseInt(process.env.MAX_USER_MESSAGES_PER_CHAT || '10', 10);
    if (value < 1 || value > 100) {
      console.warn(`MAX_USER_MESSAGES_PER_CHAT value ${value} is outside reasonable range (1-100). Using default value 10.`);
      return 10;
    }
    console.log(`Chat message limit set to: ${value}`);
    return value;
  })(),

  databaseUrl: process.env.DATABASE_URL,

  nextAuthSecret: process.env.NEXTAUTH_SECRET,
  nextAuthUrl: process.env.NEXTAUTH_URL,

  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
};

export function validateConfig() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
} 
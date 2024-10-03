import type { Config } from 'drizzle-kit';

export default {
  schema: './src/main/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'sqlite.db',
    },
} satisfies Config;
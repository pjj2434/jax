// src/db/index.schema.ts

import * as schema from './schema';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';

export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
  },
  schema: schema
});

export { eq };

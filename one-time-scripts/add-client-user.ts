// Usage: npx tsx one-time-scripts/add-client-user.ts
import bcrypt from 'bcryptjs';
import { db } from '../server/db.ts';
import { users } from '../shared/schemas/users-customers.ts';
import { eq } from 'drizzle-orm';

async function addClientUser() {
  const username = 'client';
  const password = 'client123';
  const role = 'client';
  const email = 'client@demo.com';

  // Check if user exists
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length) {
    console.log('Client user already exists.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    username,
    passwordHash,
    role,
    email,
    isActive: true
  });
  console.log('Client user created successfully.');
  process.exit(0);
}

addClientUser().catch(e => {
  console.error('Error creating client user:', e);
  process.exit(1);
});

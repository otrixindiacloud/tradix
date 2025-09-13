#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🚀 GT-ERP Database Setup\n');
  
  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists. Backing up to .env.backup');
    fs.copyFileSync(envPath, path.join(process.cwd(), '.env.backup'));
  }

  console.log('Please provide your database connection details:\n');
  
  const databaseUrl = await question('Enter your DATABASE_URL (e.g., postgresql://user:pass@host:port/db): ');
  
  if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
    console.log('❌ Invalid DATABASE_URL format. Please provide a valid PostgreSQL connection string.');
    process.exit(1);
  }

  const sessionSecret = await question('Enter a session secret (or press Enter for default): ') || 'dev-session-secret-change-in-production';
  const port = await question('Enter port number (or press Enter for 3000): ') || '3000';

  const envContent = `# Database Configuration
DATABASE_URL=${databaseUrl}

# Application Configuration
NODE_ENV=development
PORT=${port}

# Session Configuration (for development)
SESSION_SECRET=${sessionSecret}

# Optional: Add other environment variables as needed
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run db:push');
    console.log('2. Run: npm run dev');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
  }

  rl.close();
}

setupEnvironment().catch(console.error);

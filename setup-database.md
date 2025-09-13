# GT-ERP Database Setup Guide

## Quick Setup

The GT-ERP application requires a PostgreSQL database. The project is configured to use Neon Database (a serverless PostgreSQL service).

### Step 1: Create a Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Sign up or log in
3. Create a new project
4. Copy the connection string (it will look like: `postgresql://username:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require`)

### Step 2: Create Environment File

Create a `.env` file in the project root with the following content:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Application Configuration
NODE_ENV=development
PORT=3000

# Session Configuration (for development)
SESSION_SECRET=your-session-secret-key-here-change-this-in-production
```

### Step 3: Run Database Migrations

After setting up the `.env` file, run the database migrations:

```bash
npm run db:push
```

### Step 4: Start the Development Server

```bash
npm run dev
```

## Alternative: Local PostgreSQL Setup

If you prefer to use a local PostgreSQL database:

1. Install PostgreSQL locally
2. Create a database named `gt_erp`
3. Update the `DATABASE_URL` in your `.env` file to:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/gt_erp
   ```

## Troubleshooting

- Make sure the `DATABASE_URL` is correctly formatted
- Ensure the database is accessible from your network
- Check that all required environment variables are set
- Verify that the database user has the necessary permissions

## Database Schema

The application uses Drizzle ORM with a comprehensive schema that includes:
- Users and authentication
- Customers and suppliers
- Inventory management
- Enquiries and quotations
- Sales orders and deliveries
- Invoicing and payments
- Audit logging

The schema will be automatically created when you run `npm run db:push`.

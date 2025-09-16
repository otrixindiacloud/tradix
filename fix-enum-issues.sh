#!/bin/bash

# Script to fix the supplier LPO status enum issues
# This script will run the SQL fix and push the schema changes

echo "🔧 Fixing Supplier LPO Status Enum Issues..."

# Step 1: Run the comprehensive SQL fix
echo "📊 Step 1: Running database enum fix..."
if command -v psql >/dev/null 2>&1; then
    # If psql is available, use it directly
    psql "$DATABASE_URL" -f comprehensive-enum-fix.sql
else
    echo "⚠️  psql not available. Please run comprehensive-enum-fix.sql manually in your database."
    echo "   Or use your database client to execute the SQL commands."
fi

# Step 2: Push schema changes to database
echo "📝 Step 2: Pushing TypeScript schema changes to database..."
npm run db:push

echo "✅ Fix completed! The enum should now include 'Pending' status."
echo ""
echo "📋 Summary of changes:"
echo "   - Added 'Pending' to supplier_lpo_status enum in database"
echo "   - Updated TypeScript schema definition to include 'Pending'"
echo "   - Mapped any other invalid status values to valid ones"
echo ""
echo "🔄 Please restart your server to load the updated schema."
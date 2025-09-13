import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addMissingColumns() {
  try {
    console.log('Checking quotations table schema...');
    
    // Check if parent_quotation_id column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quotations' AND column_name = 'parent_quotation_id'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding parent_quotation_id column...');
      await pool.query(`
        ALTER TABLE quotations 
        ADD COLUMN parent_quotation_id UUID REFERENCES quotations(id)
      `);
      console.log('✅ parent_quotation_id column added successfully!');
    } else {
      console.log('✅ parent_quotation_id column already exists!');
    }
    
    // Check and add other missing columns
    const columnsToAdd = [
      { name: 'revision_reason', type: 'TEXT' },
      { name: 'superseded_at', type: 'TIMESTAMP' },
      { name: 'superseded_by', type: 'UUID REFERENCES users(id)' },
      { name: 'is_superseded', type: 'BOOLEAN DEFAULT FALSE' }
    ];
    
    for (const column of columnsToAdd) {
      const checkCol = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'quotations' AND column_name = $1
      `, [column.name]);
      
      if (checkCol.rows.length === 0) {
        console.log(`Adding ${column.name} column...`);
        await pool.query(`ALTER TABLE quotations ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✅ ${column.name} column added!`);
      } else {
        console.log(`✅ ${column.name} column already exists!`);
      }
    }
    
    console.log('Schema update completed!');
    
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

addMissingColumns();

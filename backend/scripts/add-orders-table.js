const fs = require('fs');
const path = require('path');
const sqlite3 = require('better-sqlite3');

// Read the SQL migration file
const sqlPath = path.join(__dirname, '../prisma/migrations/002_add_orders.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Open the database
const dbPath = path.join(__dirname, '../prisma/dev.db');
const db = sqlite3(dbPath);

// Execute the SQL
try {
  db.exec(sql);
  console.log('✅ Orders table added successfully!');
} catch (error) {
  if (error.message.includes('already exists')) {
    console.log('ℹ️ Orders table already exists');
  } else {
    console.error('❌ Error adding orders table:', error);
    process.exit(1);
  }
} finally {
  db.close();
}

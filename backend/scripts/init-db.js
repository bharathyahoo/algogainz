const fs = require('fs');
const path = require('path');
const sqlite3 = require('better-sqlite3');

// Read the SQL migration file
const sqlPath = path.join(__dirname, '../prisma/migrations/001_init.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Create the database
const dbPath = path.join(__dirname, '../prisma/dev.db');
const db = sqlite3(dbPath);

// Execute the SQL
try {
  db.exec(sql);
  console.log('✅ Database initialized successfully!');
  console.log('📁 Database location:', dbPath);
} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
} finally {
  db.close();
}

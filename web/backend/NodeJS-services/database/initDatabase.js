/**
 * This file replaces the previous database initialization script.
 * It no longer automatically initializes the database to prevent data loss.
 */

console.log('==== DATABASE INITIALIZATION ====');
console.log('WARNING: Automatic database initialization has been disabled.');
console.log('To initialize the database with sample data:');
console.log('1. Make sure you have Python 3 installed');
console.log('2. Run: python backend/init_database.py');
console.log('====================================');

// Do nothing - this ensures the script doesn't initialize anything automatically
module.exports = {
  initDatabase: () => {
    console.log('Database initialization function called but not executed.');
    console.log('To manually initialize, run: python backend/init_database.py');
    return Promise.resolve({ success: false, message: 'Initialization skipped by design' });
  }
}; 
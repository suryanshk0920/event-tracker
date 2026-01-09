import pool from './database';
import { schema } from './schema';

export async function initializeDatabase() {
  try {
    await pool.query(schema);
    console.log('Database schema initialized successfully');

    // Create default admin user if it doesn't exist
    const adminEmail = 'admin@eventtracker.com';
    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 12);

      await pool.query(`
        INSERT INTO users (name, email, department, role, password_hash)
        VALUES ($1, $2, $3, $4, $5)
      `, ['System Admin', adminEmail, 'Administration', 'ADMIN', hashedPassword]);

      console.log('Default admin user created');
      console.log('Email: admin@eventtracker.com');
      console.log('Password: admin123');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
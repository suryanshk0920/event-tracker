"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("./database"));
async function initializeDatabase() {
    try {
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        await database_1.default.query(schema);
        console.log('Database schema initialized successfully');
        // Create default admin user if it doesn't exist
        const adminEmail = 'admin@eventtracker.com';
        const existingAdmin = await database_1.default.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (existingAdmin.rows.length === 0) {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 12);
            await database_1.default.query(`
        INSERT INTO users (name, email, department, role, password_hash)
        VALUES ($1, $2, $3, $4, $5)
      `, ['System Admin', adminEmail, 'Administration', 'ADMIN', hashedPassword]);
            console.log('Default admin user created');
            console.log('Email: admin@eventtracker.com');
            console.log('Password: admin123');
        }
    }
    catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

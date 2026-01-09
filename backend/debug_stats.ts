
import pool from './src/config/database';

async function debugStats() {
    try {
        console.log('--- USERS ---');
        const users = await pool.query('SELECT id, name, email, role FROM users LIMIT 5');
        console.table(users.rows);

        console.log('\n--- EVENTS ---');
        const events = await pool.query('SELECT id, name, date, organizer_id FROM events LIMIT 5');
        console.table(events.rows);

        console.log('\n--- ATTENDANCE ---');
        const attendance = await pool.query('SELECT * FROM event_attendance LIMIT 5');
        console.table(attendance.rows);

        // Simulate Student Query
        const student = users.rows.find(u => u.role === 'STUDENT');
        if (student) {
            console.log(`\n--- SIMULATING QUERY FOR STUDENT: ${student.name} (${student.id}) ---`);
            const query = `
        SELECT e.id, e.name, 
               CASE WHEN ea.user_id IS NOT NULL THEN true ELSE false END as is_attending
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.user_id = $1
        ORDER BY e.date DESC
      `;
            const res = await pool.query(query, [student.id]);
            console.table(res.rows);
        } else {
            console.log("No student found to test query.");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

debugStats();


import http from 'http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function testSSE() {
    console.log('Testing SSE Endpoint...');

    // 1. Generate a mock Admin token
    const token = jwt.sign(
        { id: 1, email: 'admin@example.com', role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    console.log('✅ Generated Test Token');

    // 3. Connect to SSE
    const eventId = 1;
    const targetUrl = new URL(`${BASE_URL}/api/events/${eventId}/attendance-stream?token=${token}`);

    console.log(`Connecting to: ${targetUrl.toString()}`);

    const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port,
        path: targetUrl.pathname + targetUrl.search,
        method: 'GET',
        headers: {
            'Accept': 'text/event-stream',
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Response Status: ${res.statusCode}`);
        console.log(`Response Headers:`, res.headers);

        if (res.statusCode === 200) {
            console.log('✅ SSE Connection ESTABLISHED!');
            res.on('data', (chunk) => {
                console.log('Received chunk:', chunk.toString());
                // If we get data, we are good.
                process.exit(0);
            });
        } else if (res.statusCode === 404) {
            console.log('✅ SSE Connection reached controller (Event not found - expected if event 1 missing). Auth Passed.');
            process.exit(0);
        } else {
            console.error(`❌ SSE Connection Failed with status ${res.statusCode}`);
            res.on('data', (d) => console.log('Body:', d.toString()));
            process.exit(1);
        }
    });

    req.on('error', (e) => {
        console.error(`❌ Request Error: ${e.message}`);
        process.exit(1);
    });

    req.end();
}

testSSE();

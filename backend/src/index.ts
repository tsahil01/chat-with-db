import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { chat } from './chat';
import { parseResponse } from './parseQuery';
import cors from 'cors';
dotenv.config();

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

const tablesQuery = `
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
`;

const columnsQuery = `
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = $1;
`;

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.post('/chat', async (req, res) => {
    try {
        console.log("req.body: ", req.body);
        const { prompt } = req.body;
        const { messages } = req.body;

        const response = await chat(messages, { role: 'user', content: prompt });
        console.log("response: ", response);
        const parseData = await parseResponse(response);

        res.json(parseData)
    } catch (error) {
        console.error("error: ", error);
        res.status(500).json({ error: 'Error processing chat request' });
    }
});

app.post('/schema', async (req, res) => {
    const { DB_URL } = req.body;
    try {
        const pool = await new Pool({
            connectionString: DB_URL
        });

        const tables = await pool.query(tablesQuery);
        const schema: { [key: string]: any } = {};

        for (const table of tables.rows) {
            const tableName = table.table_name;
            const columns = await pool.query(columnsQuery, [tableName]);
            schema[tableName] = columns.rows;
        }
        res.json(schema);
    } catch (error) {
        console.error("error: ", error);
    }

})

app.post('/sql', async (req: any, res: any) => {
    const { sql, DB_URL } = req.body;

    const forbidden = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|merge|call|exec|execute)\b/i;

    // Reject if the SQL contains any dangerous statements
    if (forbidden.test(sql)) {
        return res.status(403).json({ error: 'Only read-only SQL queries are allowed.' });
    }

    try {
        const pool = new Pool({
            connectionString: DB_URL
        });

        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error("error: ", error);
        res.status(500).json({ error: 'Error executing SQL query' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
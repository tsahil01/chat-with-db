import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
dotenv.config();

const app = express();
const port = 3000;
app.use(express.json());
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

app.post('/chat', (req, res) => {
    const { messages, prompt } = req.body;
    res.send('Chat message received!');
});

app.post('/schema', async (req, res) => {
    const { DB_URL } = req.body;
    try {
        const pool = await new Pool({
            connectionString: DB_URL
        });
        console.log("Connected to database!");

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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { Message } from './types';
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

// delete it later
// const schema = {
//     "customers": [
//         {
//             "column_name": "id",
//             "data_type": "integer"
//         },
//         {
//             "column_name": "signup_date",
//             "data_type": "date"
//         },
//         {
//             "column_name": "name",
//             "data_type": "character varying"
//         },
//         {
//             "column_name": "email",
//             "data_type": "character varying"
//         }
//     ],
//     "orders": [
//         {
//             "column_name": "id",
//             "data_type": "integer"
//         },
//         {
//             "column_name": "customer_id",
//             "data_type": "integer"
//         },
//         {
//             "column_name": "order_date",
//             "data_type": "timestamp without time zone"
//         },
//         {
//             "column_name": "total_amount",
//             "data_type": "numeric"
//         },
//         {
//             "column_name": "status",
//             "data_type": "character varying"
//         }
//     ],
//     "order_items": [
//         {
//             "column_name": "id",
//             "data_type": "integer"
//         },
//         {
//             "column_name": "order_id",
//             "data_type": "integer"
//         },
//         {
//             "column_name": "product_id",
//             "data_type": "integer"
//         },
//         {
//             "column_name": "quantity",
//             "data_type": "integer"
//         },
//         {
//             "column_name": "unit_price",
//             "data_type": "numeric"
//         }
//     ],
//     "products": [
//         {
//             "column_name": "id",
//             "data_type": "integer"
//         },
//         {
//             "column_name": "price",
//             "data_type": "numeric"
//         },
//         {
//             "column_name": "inventory",
//             "data_type": "integer"
//         },
//         {
//             "column_name": "created_at",
//             "data_type": "timestamp without time zone"
//         },
//         {
//             "column_name": "name",
//             "data_type": "character varying"
//         },
//         {
//             "column_name": "category",
//             "data_type": "character varying"
//         }
//     ]
// }

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.post('/chat', async (req, res) => {
    const { prompt } = req.body;
    const { messages } = req.body;
    // const messages: Message[] = [{ // have to get this from frontend. We have to delete it later
    //     role: 'user',
    //     content: `Here is the schema information: ${JSON.stringify(schema)}`
    // }];
    const response = await chat(messages, { role: 'user', content: prompt });
    const parseData = await parseResponse(response);
    console.log("\nparseData: ", parseData);

    // if (parseData.responseFormat === 'json') {
    //     res.json(parseData.visualization);
    // }
    // if (parseData.responseFormat === 'text') {
    //     res.json(parseData.textResponse);
    // }
    // if (parseData.responseFormat === "sql") {
    //     res.json(`Generated SQL: ${parseData.generatedSQL}`);
    // }

    res.json(parseData)
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

app.post('/sql', async (req, res) => {
    const { sql, DB_URL } = req.body;
    const pool = await new Pool({
        connectionString: DB_URL
    });
    const result = await pool.query(sql);
    res.json(result.rows);
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
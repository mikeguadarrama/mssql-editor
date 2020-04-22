const sql = require('mssql')

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST, // You can use 'localhost\\instance' to connect to named instance
    database: process.env.DB_DATABASE
}

const result = async (query) => {
    try {
        let pool = await sql.connect(config)
        let result1 = await pool.request()
            //.input('input_parameter', sql.Int, value)
            .query(query)

        //console.dir(result1)

        return { result: true, data: result1.recordsets[0] }

    } catch (error) {
        console.log({ error })
        return { result: false, error }
    }
}

const getTables = async () => {
    return result(`
        SELECT *
        FROM INFORMATION_SCHEMA.TABLES
        ORDER BY TABLE_TYPE, TABLE_NAME
    `)
}

const getColumns = async (table) => {
    return result(`
    SELECT c.*
    , c2.CONSTRAINT_NAME
    , c3.CONSTRAINT_TYPE
    , [IS_IDENTITY] = COLUMNPROPERTY(object_id(c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity')
    FROM INFORMATION_SCHEMA.COLUMNS c
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE c2 ON c2.COLUMN_NAME = c.COLUMN_NAME AND c2.TABLE_NAME = c.TABLE_NAME AND c2.TABLE_SCHEMA = c.TABLE_SCHEMA
    LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS c3 ON c3.CONSTRAINT_NAME = c2.CONSTRAINT_NAME
    WHERE c.TABLE_NAME = N'${table}'
    ORDER BY c.ORDINAL_POSITION ASC
    `)
}

module.exports = {
    result,
    getTables,
    getColumns
}
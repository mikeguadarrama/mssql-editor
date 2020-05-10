const sql = require('mssql')

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST, // You can use 'localhost\\instance' to connect to named instance
    database: process.env.DB_DATABASE
}

const cleanStr = (str = "") => {
    return str.replace(/'/g, "''")
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

const insert = async (table, row) => {
    try {
        const columns = Object.keys(row)
        const query = `INSERT INTO ${table} (${columns.map(c => `[${c}]`).join(', ')})
        VALUES(${columns.map(c => row[c] !== null ? `'${cleanStr(row[c])}'` : 'NULL').join(', ')})`
        return execute(query)
    } catch (err) {
        return { result: false, err }
    }
}

const execute = async (query) => {
    try {
        let pool = await sql.connect(config)
        let result1 = await pool.request()
            //.input('input_parameter', sql.Int, value)
            .query(query)

        return { result: result1 && result1.recordsets ? true : false }

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
    , [REFERENCED_TABLE] = T2.REFERENCED_TABLE
    , [REFERENCED_COLUMN] = T2.REFERENCED_COLUMN
    FROM INFORMATION_SCHEMA.COLUMNS c
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE c2 ON c2.COLUMN_NAME = c.COLUMN_NAME AND c2.TABLE_NAME = c.TABLE_NAME AND c2.TABLE_SCHEMA = c.TABLE_SCHEMA
    LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS c3 ON c3.CONSTRAINT_NAME = c2.CONSTRAINT_NAME
    LEFT JOIN (
        SELECT 
            OBJECT_NAME(f.object_id) as [CONSTRAINT]
            , OBJECT_NAME(f.parent_object_id) [TABLE]
            , COL_NAME(fc.parent_object_id,fc.parent_column_id) [COLUMN] 
            , OBJECT_NAME(fc.referenced_object_id) as REFERENCED_TABLE
            , COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS REFERENCED_COLUMN
        FROM 
            sys.foreign_keys AS f
        INNER JOIN 
            sys.foreign_key_columns AS fc ON f.OBJECT_ID = fc.constraint_object_id
        INNER JOIN 
            sys.tables t ON t.OBJECT_ID = fc.referenced_object_id
        WHERE 
            OBJECT_NAME (f.parent_object_id) = '${table}'
    ) as T2 ON T2.[CONSTRAINT] = c2.[CONSTRAINT_NAME]
    WHERE c.TABLE_NAME = N'${table}'
    ORDER BY c.ORDINAL_POSITION ASC
    `)
}

const getFKDef = async (table) => {
    return result(`
    SELECT 
    OBJECT_NAME(f.object_id) as 'CONSTRAINT'
   , OBJECT_NAME(f.parent_object_id) [TABLE]
   , COL_NAME(fc.parent_object_id,fc.parent_column_id) [COLUMN] 
   , OBJECT_NAME(fc.referenced_object_id) as REFERENCED_TABLE
   , COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS REFERENCED_COLUMN
    FROM 
    sys.foreign_keys AS f
    INNER JOIN 
    sys.foreign_key_columns AS fc 
        ON f.OBJECT_ID = fc.constraint_object_id
    INNER JOIN 
    sys.tables t 
        ON t.OBJECT_ID = fc.referenced_object_id
    WHERE 
    OBJECT_NAME (f.referenced_object_id) = '${table}'
    `)
}

module.exports = {
    result,
    execute,
    insert,
    getTables,
    getColumns,
    getFKDef
}
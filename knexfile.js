require('dotenv').config()
const knexfile = {
    development: {
        client: 'pg',
    searchPath: 'public',
        connection: {
            host: process.env.HOST || 'localhost',
            user: process.env.user || 'postgres',
            database: process.env.database,
            password: process.env.password,
        },
    }
};

module.exports = knexfile;
require('dotenv').config()
const knexfile = {
    development: {
        client: 'pg',
        connection: {
            host: 'localhost',
            user: 'postgres',
            database: process.env.database,
            password: process.env.password
        },
    }
};

module.exports = knexfile;

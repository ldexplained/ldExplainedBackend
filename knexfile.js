require('dotenv').config()

const knexfile = {
    development: {
        client: 'mysql',
        connection: {
            host: 'localhost',
            user: 'root',
            database: process.env.database,
            password: process.env.password
        },
    }
};

module.exports = knexfile;



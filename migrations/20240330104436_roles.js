exports.up = async (knex) => {
    await knex.schema.createTable('roles', table => {
        table.increments('id'),
            table.string('email').notNullable(),
            table.string('role').notNullable(),
            table.dateTime('created_at');
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('roles');
}
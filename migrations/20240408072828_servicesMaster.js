exports.up = async (knex) => {
    await knex.schema.createTable('services_master_all', table => {
        table.increments('id'),
        table.string('services').notNullable()
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('services_master_all');
}
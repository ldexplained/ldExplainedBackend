exports.up = async (knex) => {
    await knex.schema.createTable('clinic_master_all', table => {
        table.increments('id'),
        table.string('clinic_name').notNullable(),
        table.string('clinic_address').notNullable()
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('clinic_master_all');
}
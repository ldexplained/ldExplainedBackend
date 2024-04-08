exports.up = async (knex) => {
    await knex.schema.createTable('services_master_all', table => {
        table.increments('id'),
        table.string('services').notNullable(),
        table.string('consulting_fee'),
        table.string('booking_fee')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('services_master_all');
}
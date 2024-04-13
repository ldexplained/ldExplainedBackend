exports.up = async (knex) => {
    await knex.schema.createTable('degree_master_all', table => {
        table.increments('id'),
        table.string('degrees').notNullable()
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('degree_master_all');
}
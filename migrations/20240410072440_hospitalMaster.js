exports.up = async (knex) => {
    await knex.schema.createTable('hospital_master_all', table => {
        table.increments('id'),
        table.string('hospital_name').notNullable()
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('hospital_master_all');
}
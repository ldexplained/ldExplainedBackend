exports.up = async (knex) => {
    await knex.schema.createTable('college_master_all', table => {
        table.increments('id'),
        table.string('college_name').notNullable()
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('college_master_all');
}
exports.up = async (knex) => {
    await knex.schema.createTable('specializations_master_all', table => {
        table.increments('id'),
        table.string('specializations').notNullable()
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('specializations_master_all');
}
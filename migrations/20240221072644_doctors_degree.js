// create doctors_degree table schema with column ( Id, dr_id, degree, college_name,  start_date ,  end_date )
exports.up = async (knex) => {
    await knex.schema.createTable('doctors_degree', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.string('degree'),
            table.string('college_name'),
            table.date('start_date'),
            table.date('end_date')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_degree');
}
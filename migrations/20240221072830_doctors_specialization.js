// create doctors_specilazition table schema with column ( Id     dr_id     Specialization  )
exports.up = async (knex) => {
    await knex.schema.createTable('doctors_specialization', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.string('specialization')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_specialization');
}
// create doctors_specilazition table schema with column ( Id     dr_id     Specialization  )
exports.up = async (knex) => {
    await knex.schema.createTable('doctors_specialization', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.integer('specialization_id').unsigned().notNullable().references('id').inTable('specializations_master_all').onDelete('CASCADE').onUpdate('CASCADE')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_specialization');
}
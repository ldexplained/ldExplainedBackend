// create doctors_award table schema with column ( Id   dr_id   award discription  date  )
exports.up = async (knex) => {
    await knex.schema.createTable('doctors_award', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.string('award'),
            table.string('description', 1000),
            table.date('date')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_award');
};
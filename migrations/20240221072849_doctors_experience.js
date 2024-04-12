// create doctors_experince table schema with column ( Id   dr_id   start date  end date    Designation     Hospital Name)
exports.up = async (knex) => {
    await knex.schema.createTable('doctors_experience', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.date('start_date'),
            table.date('end_date'),
            table.string('designation'),
            table.integer('hospital_id').unsigned().notNullable().references('id').inTable('hospital_master_all').onDelete('CASCADE').onUpdate('CASCADE')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_experience');
}
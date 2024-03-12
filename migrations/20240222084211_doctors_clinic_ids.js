// Id   dr_id     clink_id   
exports.up = async (knex) => {
    await knex.schema.createTable('doctors_clinic_ids', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.integer('clinic_id').unsigned().notNullable().references('id').inTable('doctors_clinic').onDelete('CASCADE').onUpdate('CASCADE')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_clinic_ids');
};

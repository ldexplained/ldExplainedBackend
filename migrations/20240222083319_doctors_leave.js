// Dr_leave
// Id      dr_id    leave(date)

exports.up = async (knex) => {
    await knex.schema.createTable('doctors_leave', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.date('leave')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_leave');
}
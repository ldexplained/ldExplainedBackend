
exports.up = async (knex) => {
    await knex.schema.createTable('doctors_feedback', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.string('feedback', 1000),
            table.integer('rating'),
            table.integer('parent_user_id') //.unsigned().notNullable().references('id').inTable('tbl_users').onDelete('CASCADE').onUpdate('CASCADE'),
            table.dateTime('date_time').defaultTo(knex.fn.now())
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_feedback');
}

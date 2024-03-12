exports.up = async (knex) => {
    await knex.schema.createTable('favourite_doctor', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors') //.onDelete('CASCADE').onUpdate('CASCADE'),
            table.integer('parent_user_id') //.unsigned().notNullable().references('id').inTable('tbl_users').onDelete('CASCADE').onUpdate('CASCADE')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('favourite_doctor');
};
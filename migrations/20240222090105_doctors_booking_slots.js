exports.up = async (knex) => {
    await knex.schema.createTable('doctors_booking_slots', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.integer('parent_user_id'), //.unsigned().notNullable().references('id').inTable('tbl_users'), //.onDelete('CASCADE').onUpdate('CASCADE'),
            table.integer('child_id') //.unsigned().notNullable().references('id').inTable('tbl_child'), //.onDelete('CASCADE').onUpdate('CASCADE'),
            table.string('link'),
            table.dateTime('booking_date'),
            table.dateTime('start_time'),
            table.dateTime('end_time'),
            table.string('purpose')
    })  
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_booking_slots');
};
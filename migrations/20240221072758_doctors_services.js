// create doctors_services table schema with column ( Id   dr_id   service_name )
exports.up = async (knex) => {
    await knex.schema.createTable('doctors_services', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.integer('service_id').unsigned().notNullable().references('id').inTable('services_master_all').onDelete('CASCADE').onUpdate('CASCADE')
            table.integer('consultation_fee').notNullable()
            table.integer('booking_fee').notNullable()
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_services');
}   
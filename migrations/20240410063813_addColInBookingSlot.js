exports.up = async (knex) => {
    await knex.schema.alterTable('doctors_booking_slots', table => {
        table.string('mode'),
        table.string('address'),
        table.integer('clinic_id'),
        table.string('event_id'),
        table.datetime('booking_date_for')
        table.integer('service_id').unsigned().references('id').inTable('services_master_all')
        table.integer('amount')
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('doctors_booking_slots', table => {
        table.dropColumn('mode'),
        table.dropColumn('address'),
        table.dropColumn('clinic_id')
        table.dropColumn('event_id'),
        table.dropColumn('booking_date_for'),
        table.dropColumn('service_id'),
        table.dropColumn('amount')
    });
};
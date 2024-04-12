exports.up = async (knex) => {
    await knex.schema.alterTable('doctors_booking_slots', table => {
        table.string('mode'),
        table.string('address'),
        table.integer('clinic_id'),
        table.string('event_id')
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('doctors_booking_slots', table => {
        table.dropColumn('mode'),
        table.dropColumn('address'),
        table.dropColumn('clinic_id')
        table.dropColumn('event_id')
    });
};
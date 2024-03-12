// create doctors_clinic table schema with column ( Id   dr_id     clinic_name  clinic_address)
exports.up = async (knex) => {
    await knex.schema.createTable('doctors_clinic', table => {
        table.increments('id'),
            table.string('clinic_name'),
            table.string('clinic_address')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_clinic');
}
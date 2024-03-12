exports.up = async (knex) => {
    await knex.schema.createTable('doctors_clinic_images', table => {
        table.increments('id'),
            table.string('clinic_images_link'),
            table.integer('clinic_id').unsigned().notNullable().references('id').inTable('doctors_clinic').onDelete('CASCADE').onUpdate('CASCADE')
    })
};

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_clinic_images');
};

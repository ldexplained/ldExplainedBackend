// create doctors tabale schema with column ( id    dr_name  location  rating  about_me  gender address contact )
exports.up = async (knex) => {
    await knex.schema.createTable('doctors', table => {
        table.increments('id'),
            table.string('name'),
            table.string('location'),
            table.float('rating'),
            table.string('about_me'),
            table.string('gender'),
            table.string('address'),
            table.string('contact'),
            table.string('profile_link'),
            table.integer('consulting_fee'),
            table.integer('booking_fee'),
            table.string('video_call_link')
    })
};


exports.down = async (knex) => {
    await knex.schema.dropTable('doctors');
};

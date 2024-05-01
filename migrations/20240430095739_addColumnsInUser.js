exports.up = async (knex) => {
    await knex.schema.alterTable('tbl_users', table => {
        table.string('last_name', 255);
        table.date('dob');
        table.string('blood_group');
        table.string('address');
        table.string('city');
        table.string('state');
        table.string('country');
        table.string('zipcodes');
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('tbl_users', table => {
        table.dropColumn('last_name');
        table.dropColumn('dob');
        table.dropColumn('blood_group');
        table.dropColumn('address');
        table.dropColumn('city');
        table.dropColumn('state');
        table.dropColumn('country');
        table.dropColumn('zipcodes');
    });
};
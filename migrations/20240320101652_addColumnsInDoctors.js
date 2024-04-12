exports.up = async (knex) => {
    await knex.schema.alterTable('doctors', table => {
        table.integer('total_feedback').defaultTo(0);
        table.string('email').unique();
        table.string('state');
        table.string('city');
        table.string('locality');
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('doctors', table => {
        table.dropColumn('total_feedback');
        table.dropColumn('email');
        table.dropColumn('state');
        table.dropColumn('city');
        table.dropColumn('locality');
    });
};
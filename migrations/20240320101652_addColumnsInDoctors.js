exports.up = async (knex) => {
    await knex.schema.alterTable('doctors', table => {
        table.integer('total_feedback').defaultTo(0);
        table.string('email').unique();
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('doctors', table => {
        table.dropColumn('total_feedback');
        table.dropColumn('email');
    });
};
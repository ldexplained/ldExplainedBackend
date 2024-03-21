exports.up = async (knex) => {
    await knex.schema.alterTable('doctors', table => {
        table.integer('total_feedback').defaultTo(0);
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('doctors', table => {
        table.dropColumn('total_feedback');
    });
};
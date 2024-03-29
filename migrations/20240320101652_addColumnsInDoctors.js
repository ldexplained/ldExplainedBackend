exports.up = async (knex) => {
    await knex.schema.alterTable('doctors', table => {
        table.string('email').unique();
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('doctors', table => {
        table.dropColumn('email');
    });
};

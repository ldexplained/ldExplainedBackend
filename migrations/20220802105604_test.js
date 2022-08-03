/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async(knex) {
  await knex.schema.createTable('hapi', table => {
    table.increments('id'),
    table.string('name'),
    table.string('email').unique(),
    table.string('password')
  }) 
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) {
  await knex.schema.dropTable('hapi')
};

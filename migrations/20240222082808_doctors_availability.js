// Id      dr_id       sun             mon         tue       wed        thu       fri          sat 
// 1       1           9am-5pm      9am-4pm

exports.up = async (knex) => {
    await knex.schema.createTable('doctors_availability', table => {
        table.increments('id'),
            table.integer('dr_id').unsigned().notNullable().references('id').inTable('doctors').onDelete('CASCADE').onUpdate('CASCADE'),
            table.string('sun'),
            table.string('mon'),
            table.string('tue'),
            table.string('wed'),
            table.string('thu'),
            table.string('fri'),
            table.string('sat')
    })
}

exports.down = async (knex) => {
    await knex.schema.dropTable('doctors_availability');
}
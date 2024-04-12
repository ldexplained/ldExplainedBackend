const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)

class collegeMasterAll extends Model {
    static get tableName() {
        return 'college_master_all'
    }
    
    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            college_name: Joi.string().required()
        });
    }
};

module.exports = collegeMasterAll;
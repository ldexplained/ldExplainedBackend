const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)

class degreesMasterAll extends Model {
    static get tableName() {
        return 'degree_master_all'
    }
    
    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            degrees: Joi.string().required()
        });
    }
};

module.exports = degreesMasterAll;
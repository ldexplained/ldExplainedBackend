const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)

class specializationsMasterAll extends Model {
    static get tableName() {
        return 'specializations_master_all'
    }
    
    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            specializations: Joi.string().required()
        });
    }
};

module.exports = specializationsMasterAll;
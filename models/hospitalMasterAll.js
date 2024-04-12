const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)

class hospitalMasterAll extends Model {
    static get tableName() {
        return 'hospital_master_all'
    }
    
    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            services: Joi.string().required()
        });
    }
};

module.exports = hospitalMasterAll;
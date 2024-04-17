const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)

class clinicMasterAll extends Model {
    static get tableName() {
        return 'clinic_master_all'
    }
    
    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            clinic_name: Joi.string(),
            clinic_address: Joi.string()
        });
    }
};

module.exports = clinicMasterAll;
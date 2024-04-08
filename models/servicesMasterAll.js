const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)

class servicesMasterAll extends Model {
    static get tableName() {
        return 'services_master_all'
    }
    
    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            services: Joi.string().required()
        });
    }
};

module.exports = servicesMasterAll;
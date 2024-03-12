const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')

Model.knex(db)

class DoctorsClinicIds extends Model {
    static get tableName() {
        return 'doctors_clinic_ids'
    }
    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            dr_id: Joi.number().integer().required(),
            clinic_id: Joi.number().integer().required()
        })
    }
};

module.exports = DoctorsClinicIds;

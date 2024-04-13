const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)


class DoctorsSpecialization extends Model{
    static get tableName() {
        return 'doctors_specialization'
    }

    static get JoiSchema(){
        return Joi.object({
            id: Joi.number().integer().greater(0),
            dr_id: Joi.number().integer().greater(0).required(),
            specialization_id: Joi.number().integer().greater(0).required()
        })
    }
}

module.exports = DoctorsSpecialization;
const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')

Model.knex(db)

class doctorsAvailability extends Model{
    static get tableName() {
        return 'doctors_availability'
    }

    static get JoiSchema(){
        return Joi.object({
            id: Joi.number().integer().greater(0),
            dr_id: Joi.number().integer().greater(0).required(),
            sun: Joi.string(),
            mon: Joi.string(),
            tue: Joi.string(),
            wed: Joi.string(),
            thu: Joi.string(),
            fri: Joi.string(),
            sat: Joi.string(),
        })
    }
}

module.exports = doctorsAvailability;
const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)


class DoctorsExperience extends Model{
    static get tableName() {
        return 'doctors_experience'
    }

    static get JoiSchema(){
        return Joi.object({
            id: Joi.number().integer().greater(0),
            dr_id: Joi.number().integer().greater(0).required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            designation: Joi.string().min(1).required(),
            hospital_name: Joi.string().min(1).required(),
        })
    }
}

module.exports = DoctorsExperience;
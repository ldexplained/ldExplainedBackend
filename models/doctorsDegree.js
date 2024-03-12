const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')

Model.knex(db)

class DoctorsDegree extends Model{
    static get tableName() {
        return 'doctors_degree'
    }

    static get JoiSchema(){
        return Joi.object({
            id: Joi.number().integer().greater(0),
            dr_id: Joi.number().integer().greater(0).required(),
            degree: Joi.string().min(1).required(),
            college_name: Joi.string().min(1).required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
        })
    }
}

module.exports = DoctorsDegree;
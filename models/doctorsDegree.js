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
            degree_id: Joi.number().integer().greater(0).required(),
            college_id: Joi.number().integer().greater(0).required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
        })
    }
}

module.exports = DoctorsDegree;
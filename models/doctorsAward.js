const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')

Model.knex(db)

class DoctorsAward extends Model{
    static get tableName() {
        return 'doctors_award'
    }

    static get JoiSchema(){
        return Joi.object({
            id: Joi.number().integer().greater(0),
            dr_id: Joi.number().integer().greater(0).required(),
            award: Joi.string().min(1).required(),
            description: Joi.string().min(1).max(1000).required(),
            date: Joi.date().required(),
        })
    }
}

module.exports = DoctorsAward;
const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)


class DoctorsService extends Model{
    static get tableName() {
        return 'doctors_services'
    }

    static get JoiSchema(){
        return Joi.object({
            id: Joi.number().integer().greater(0),
            dr_id: Joi.number().integer().greater(0).required(),
            service_name: Joi.string().min(1).required(),

        })
    }
}

module.exports = DoctorsService;
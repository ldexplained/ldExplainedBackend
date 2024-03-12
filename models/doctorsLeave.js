
const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)

class DoctorsLeave extends Model {
    static get tableName() {
        return 'doctors_leave'
    }

    static get JoiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            dr_id: Joi.number().integer().greater(0).required(),
            leave: Joi.date().required(),
        })
    }
};

module.exports = DoctorsLeave;
const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)

class DoctorsFeedback extends Model {
    static get tableName() {
        return 'doctors_feedback';
    }
    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            dr_id: Joi.number().integer().required(),
            feedback: Joi.string().max(1000).required(),
            rating: Joi.number().integer().required(),
            parent_user_id: Joi.number().integer().required(),
            date_time: Joi.date().required()
        });
    }
};

module.exports = DoctorsFeedback;
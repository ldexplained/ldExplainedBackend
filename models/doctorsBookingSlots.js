const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')

Model.knex(db)

class DoctorsBookingSlot extends Model {
    static get tableName() {
        return 'doctors_booking_slots'
    }
    static get joiSchema() {
        return Joi.object({
             id: Joi.number().integer().greater(0),
            dr_id: Joi.number().integer().greater(0).required(),
            parent_user_id: Joi.number().integer().required(),
            child_id: Joi.number().integer().required(),
            link: Joi.string().min(1).required(),
            booking_date: Joi.date().required(),
            start_time: Joi.date().required(),
            end_time: Joi.date().required(),
            purpose: Joi.string().min(1).required(),


        });
    }
};

module.exports = DoctorsBookingSlot;
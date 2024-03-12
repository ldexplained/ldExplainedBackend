const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db');
Model.knex(db);

class Child extends Model {
    static get tableName() {
        return 'tbl_child';
    }

    static get JoiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            user_id: Joi.number().integer().greater(0).required(),
            name: Joi.string().max(50).required(),
            parent_name: Joi.string().max(50).required(),
            contact: Joi.string().max(15).required(),
            email: Joi.string().email().max(50).required(),
            age: Joi.number().integer().min(0).max(127).required(),
            gender: Joi.string().valid('M', 'F', 'T').required(),
            child_class: Joi.string().max(30).required(),
            address1: Joi.string().max(100).required(),
            address2: Joi.string().max(100).required(),
            city: Joi.string().max(50).required(),
            state: Joi.string().max(50).required(),
            pincode: Joi.string().max(10).required(),
            country: Joi.string().max(50).required(),
            dos: Joi.date().optional(),
            status: Joi.string().valid('A', 'S').required(),
            last_updated: Joi.date().required(),
            dated: Joi.date().required()
        });
    }
}

module.exports = Child;

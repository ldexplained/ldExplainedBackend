const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db');
Model.knex(db);

class User extends Model {
    static get tableName() {
        return 'tbl_users';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            name: Joi.string().max(50).required(),
            email: Joi.string().email().max(100).required(),
            contact: Joi.string().max(15).required(),
            password: Joi.string().max(100),
            user_type: Joi.string(),
            status: Joi.string(),
            dated: Joi.date().iso(),
            last_updated: Joi.date().iso().required(),
            last_name: Joi.string().max(255),
            dob: Joi.date().iso(),
            blood_group: Joi.string(),
            address: Joi.string(),
            city: Joi.string(),
            state: Joi.string(),
            country: Joi.string(),
            zipcodes: Joi.string()
        });
    }
}

module.exports = User;

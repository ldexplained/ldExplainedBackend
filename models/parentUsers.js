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
            password: Joi.string().max(100).required(),
            user_type: Joi.string().valid('A', 'P').required(),
            status: Joi.string().valid('A', 'P', 'S').required(),
            dated: Joi.date().iso().required(),
            last_updated: Joi.date().iso().required(),
        });
    }
}

module.exports = User;

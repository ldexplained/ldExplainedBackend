const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')
Model.knex(db)


class Roles extends Model{
    static get tableName() {
        return 'roles'
    }

    static get JoiSchema(){
        return Joi.object({
            id: Joi.number().integer().greater(0),
            email: Joi.string().email().max(100).required(),
            role: Joi.string().min(1).required(),
            created_at: Joi.date().timestamp()
        })
    }
}

module.exports = Roles;
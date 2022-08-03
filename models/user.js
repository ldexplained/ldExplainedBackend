const Joi = require('joi');
const { Model } = require('objection')   // use Model class from objection library
const db = require('../config/db')

Model.knex(db)

class UserModel extends Model{
    static get tableName() {
        return 'hapi'
    }

    static get JoiSchema(){
        return Joi.object({
            id: Joi.number().integer().greater(0),
            name: Joi.string().min(1).required(),
            email: Joi.string().email().max(100).required(),
            password: Joi.string().min(8).required()
        })
    }
}

module.exports = UserModel;
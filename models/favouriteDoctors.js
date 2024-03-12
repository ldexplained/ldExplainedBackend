const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')

Model.knex(db)

class FavouriteDoctors extends Model {
    static get tableName() {
        return 'favourite_doctor'
    }
    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            dr_id: Joi.number().integer().required(),
            parent_user_id: Joi.number().integer().required()
        });
    }
};

module.exports = FavouriteDoctors;
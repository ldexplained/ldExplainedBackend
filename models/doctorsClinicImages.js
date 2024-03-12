const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')

Model.knex(db)

class DoctorsClinicImages extends Model {
    static get tableName() {
        return 'doctors_clinic_images'
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number(),
            clinic_images_link: Joi.string().max(1000).required(),
            clinic_id: Joi.number().integer().required()

        })
    }
};

module.exports = DoctorsClinicImages;
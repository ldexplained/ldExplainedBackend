const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')

Model.knex(db)

class DoctorsClinic extends Model {
    static get tableName() {
        return 'doctors_clinic';
    }

    static get JoiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            clinic_name: Joi.string().min(1).required(),
            clinic_address: Joi.string().min(1).required(),
        })
    }

    static get relationMappings() {
        const DoctorsClinicImages = require('./doctorsClinicImages');

        return {
            clinic: {
                relation: Model.HasManyRelation,
                modelClass: DoctorsClinicImages,
                join: {
                    from: 'doctors_clinic.id',
                    to: 'doctors_clinic_images.clinic_id',
                },
            },
        }
    }
}

module.exports = DoctorsClinic;
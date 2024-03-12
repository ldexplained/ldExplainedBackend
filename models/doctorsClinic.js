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
        // const DoctorsClinic = require('./doctorsClinic');
        const DoctorsClinicImages = require('./doctorsClinicImages');
        // const DoctorsClinicIds = require('./doctorsClinicIds');

        return {
            clinic: {
                relation: Model.HasManyRelation,
                modelClass: DoctorsClinicImages,
                join: {
                    from: 'doctors_clinic.id',
                    to: 'doctors_clinic_ids.clinic_id',
                },
            },
        }
    }
}

module.exports = DoctorsClinic;
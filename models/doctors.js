const Joi = require('joi');
const { Model } = require('objection');
const db = require('../config/db')

Model.knex(db)

class Doctors extends Model {
    static get tableName() {
        return 'doctors'
    }

    static get JoiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            name: Joi.string().min(1).required(),
            location: Joi.string().min(1).required(),
            rating: Joi.number().min(1).max(5).required(),
            about_me: Joi.string().min(1).required(),
            gender: Joi.string().min(1).required(),
            address: Joi.string().min(1).required(),
            contact: Joi.string().min(1).required(),
            profile_link: Joi.string().min(1).required(),
            consulting_fee: Joi.number().integer().required(),
            booking_fee: Joi.number().integer().required(),
            video_call_link: Joi.string(),
            total_feedback: Joi.number().integer(),
        })
    }

    static get relationMappings() {
        const DoctorsDegree = require('./doctorsDegree');
        const DoctorsAward = require('./doctorsAward');
        const DoctorsService = require('./doctorsServices');
        const DoctorsSpecialization = require('./doctorsSpecialization');
        const DoctorsExperience = require('./doctorsExperience');
        // const DoctorsClinic = require('./doctorsClinic');
        // const DoctorsClinicImages = require('./doctorsClinicImages');
        // const DoctorsClinicIds = require('./doctorsClinicIds');

        return {
            degrees: {
                relation: Model.HasManyRelation,
                modelClass: DoctorsDegree,
                join: {
                    from: 'doctors.id',
                    to: 'doctors_degree.dr_id',
                },
            },

            awards: {
                relation: Model.HasManyRelation,
                modelClass: DoctorsAward,
                join: {
                    from: 'doctors.id',
                    to: 'doctors_award.dr_id',
                },
            },

            services: {
                relation: Model.HasManyRelation,
                modelClass: DoctorsService,
                join: {
                    from: 'doctors.id',
                    to: 'doctors_services.dr_id',
                },
            },

            specialization: {
                relation: Model.HasManyRelation,
                modelClass: DoctorsSpecialization,
                join: {
                    from: 'doctors.id',
                    to: 'doctors_specialization.dr_id',
                },
            },

            experience: {
                relation: Model.HasManyRelation,
                modelClass: DoctorsExperience,
                join: {
                    from: 'doctors.id',
                    to: 'doctors_experience.dr_id',
                },
            },

            // clinics: {
            //     relation: Model.HasManyRelation,
            //     modelClass: DoctorsClinic,
            //     join: {
            //         from: 'doctors.id',
            //         to: 'doctors_clinic.dr_id',
            //     },
            // },

            // clinicImages: {
            //     relation: Model.HasManyRelation,
            //     modelClass: DoctorsClinicImages,
            //     join: {
            //         from: 'doctors_clinic.id',
            //         to: 'doctors_clinic_images.clinic_id',
            //     },
            // },
        };
    }
}

module.exports = Doctors;
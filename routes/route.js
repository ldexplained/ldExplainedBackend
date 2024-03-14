const { server } = require('../config/server');
const DoctorsServices = require('../services/service');
const doctorsService = new DoctorsServices();
const Joi = require('joi');
const logger = require('../config/logger');


// -------------------DOCTORS Routes-----------------------------------------------------
server.route({
    method: 'POST',
    path: '/doctors/create',
    options: {
        description: 'Create a new doctor [fine]',
        tags: ['api'],
        validate: {
            payload: Joi.object({
                // doctorDetails
                name: Joi.string().required(),
                location: Joi.string(),
                rating: Joi.number(),
                about_me: Joi.string(),
                gender: Joi.string(),
                address: Joi.string(),
                contact: Joi.string(),
                profile_link: Joi.string(),
                consulting_fee: Joi.number(),
                booking_fee: Joi.number(),
                video_call_link: Joi.string(),

                // Doctor degree
                degree: Joi.array().items(Joi.object({
                    degree: Joi.string().required(),
                    college_name: Joi.string().required(),
                    degree_start_date: Joi.date().required(),
                    degree_end_date: Joi.date().required()
                })).required(),

                // Doctor award
                award: Joi.array().items(Joi.object({
                    award: Joi.string().required(),
                    description: Joi.string().required(),
                    award_date: Joi.date().required()
                })).required(),

                // Doctor services
                service_name: Joi.array().items(Joi.string().required()).required(),

                // Doctor Specialization
                specialization: Joi.array().items(Joi.string().required()).required(),

                // Doctor Experience
                experience: Joi.array().items(Joi.object({
                    hospital_name: Joi.string().required(),
                    designation: Joi.string().required(),
                    exp_start_date: Joi.date().required(),
                    exp_end_date: Joi.date().required()
                })).required(),

                clinics: Joi.array().items(Joi.object({
                    clinic_name: Joi.string().required(),
                    clinic_address: Joi.string().required(),
                    clinic_images_link: Joi.array().items(Joi.string().required()).required()
                })).required(),
            })
        },
        handler: async (request, h) => {
            const { name, location, rating, about_me, gender, address, contact, profile_link, consulting_fee, booking_fee, video_call_link } = request.payload;
            const drDetails = { name, location, rating, about_me, gender, address, contact, profile_link, consulting_fee, booking_fee, video_call_link };

            let data = await doctorsService.createDoctors(drDetails);

            if (data.id !== undefined && data.id !== null) {

                const { service_name } = request.payload;
                const serviceDetails = { service_name };
                serviceDetails['dr_id'] = data.id;

                const { specialization } = request.payload;
                const specializationDetails = { specialization };
                specializationDetails['dr_id'] = data.id;


                for (let i = 0; i < request.payload.clinics.length; i++) {
                    let clinicDetails = request.payload.clinics[i];
                    let link = clinicDetails.clinic_images_link;
                    let clinicData = await doctorsService.createDoctorClinic(clinicDetails);

                    let clinicImages = {
                        clinic_id: clinicData.id,
                        clinic_images_link: link
                    };
                    if (clinicData.id !== undefined && clinicData.id !== null) {
                        await doctorsService.createClinicImages(clinicImages, data.id, clinicData.id);
                    }
                }

                for (let i = 0; i < request.payload.degree.length; i++) {
                    let degreeData = request.payload.degree[i];
                    degreeData['dr_id'] = data.id;
                    await doctorsService.createDoctorDegree(degreeData);
                }

                for (let i = 0; i < request.payload.award.length; i++) {
                    let awardData = request.payload.award[i];
                    awardData['dr_id'] = data.id;
                    await doctorsService.createDoctorAward(awardData);
                }

                for (let i = 0; i < request.payload.experience.length; i++) {
                    let experienceData = request.payload.experience[i];
                    experienceData['dr_id'] = data.id;
                    await doctorsService.createDoctorExperience(experienceData);
                }

                await doctorsService.createDoctorService(serviceDetails);
                await doctorsService.createDoctorSpecialization(specializationDetails);
            }
            logger.info('Doctor created successfully');
            return h.response(data);
        }
    }
});


server.route({
    method: 'GET',
    path: '/doctors/getDoctorsDetailsByFilter',
    options: {
        description: 'Get doctor by gender and specialization',
        tags: ['api'],
        validate: {
            query: Joi.object({
                // id: Joi.number(),
                gender: Joi.string(),
                specialization: Joi.string(),
            })
        },
        handler: async (request, h) => {
            const { id, gender, specialization } = request.query;
            const data = await doctorsService.getDoctorByName(gender, specialization);
            logger.info('Doctor details fetched successfully');
            return h.response(data);
        }
    }
});

// create a get API for doctors by id
server.route({
    method: 'GET',
    path: '/doctors/{id}',
    options: {
        description: 'Get doctor by id and their booking patients  details [fine]',
        tags: ['api'],
        validate: {
            query: Joi.object({
                dr_id: Joi.number().integer().greater(0).required(),
                key: Joi.string().valid('today', 'upcoming').required()
            })
        },
        handler: async (request, h) => {
            const { dr_id, key } = request.query;
            const data = await doctorsService.getDoctorById(dr_id, key);
            logger.info('Doctor details fetched successfully');
            return h.response(data);
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/doctors/{id}',
    options: {
        description: 'Delete doctor by id  [fine]',
        tags: ['api'],
        validate: {
            params: Joi.object({
                id: Joi.number()
            })
        },
        handler: async (request, h) => {
            const { id } = request.params;
            const data = await doctorsService.deleteDoctorById(id);
            logger.info('Doctor deleted successfully');
            return h.response(data);
        }
    }
});

server.route({
    method: 'GET',
    path: '/doctors/getDoctorsDetails',
    options: {
        description: 'Get all doctors details [fine]',
        tags: ['api'],
        handler: async (request, h) => {
            const data = await doctorsService.getDoctorsDetails();
            logger.info('All doctors details fetched successfully');
            return h.response(data);
        }
    }
});

server.route({
    method: 'POST',
    path: '/bookingSlots/parents',
    options: {
        description: 'Create a new booking slot [fine]',
        tags: ['api'],
        validate: {
            payload: Joi.object({
                dr_id: Joi.number().required(),
                parent_user_id: Joi.number().required(),
                child_id: Joi.number().required(),
                link: Joi.string().required(),
                booking_date: Joi.date().required(),
                appointment_date: Joi.date().required(),
                start_time: Joi.date().required(),
                end_time: Joi.date().required(),
                status: Joi.string().required(),
                purpose: Joi.string().required(),
                consulting_fee: Joi.number().required(),
                booking_fee: Joi.number().required()
            })
        },
        handler: async (request, h) => {
            const data = await doctorsService.BookingSlots(request.payload);
            logger.info('Booking slot created successfully');
            return h.response(data);
        }
    }
});

server.route({
    method: 'POST',
    path: '/favouriteDoctors/parents',
    options: {
        description: 'Add doctor to your favourite list [fine]',
        tags: ['api'],
        validate: {
            payload: Joi.object({
                dr_id: Joi.number().required(),
                parent_user_id: Joi.number().required()
            })
        },
        handler: async (request, h) => {
            const data = await doctorsService.addFavouriteDoctor(request.payload);
            logger.info('Doctor added to favourite list successfully');
            return h.response(data);
        }
    }
});


server.route({
    method: 'GET',
    path: '/favouriteDoctors/parents',
    options: {
        description: 'Get all your favourite doctors list by parent_user_id [fine]',
        tags: ['api'],
        validate: {
            query: Joi.object({
                parent_user_id: Joi.number().required()
            })
        },
        handler: async (request, h) => {
            const { parent_user_id } = request.query;
            const data = await doctorsService.getFavouriteDoctors(parent_user_id);
            logger.info('Favourite doctors list fetched successfully');
            return h.response(data);
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/favouriteDoctors/parents',
    options: {
        description: 'Remove doctor from your favourite list [fine]',
        tags: ['api'],
        validate: {
            payload: Joi.object({
                dr_id: Joi.number().required(),
                parent_user_id: Joi.number().required()
            })
        },
        handler: async (request, h) => {
            const data = await doctorsService.removeFavouriteDoctor(request.payload);
            logger.info('Doctor removed from favourite list successfully');
            return h.response(data);
        }
    }
});

server.route({
    method: 'GET',
    path: '/bookingSlots/parents',
    options: {
        description: 'Get all upcoming booking slots of a doctor details by parent_user_id [fine]',
        tags: ['api'],
        validate: {
            query: Joi.object({
                parent_user_id: Joi.number().required()
            })
        },
        handler: async (request, h) => {
            const { parent_user_id } = request.query;
            const data = await doctorsService.getUpcomingBookingSlotsByParentUserId(parent_user_id);
            logger.info('Upcoming booking slots fetched successfully');
            return h.response(data);
        }
    }
});

server.route({
    method: 'POST',
    path: '/rating/parents',
    options: {
        description: 'Rate a doctor [fine]',
        tags: ['api'],
        validate: {
            payload: Joi.object({
                dr_id: Joi.number().required(),
                feedback: Joi.string().required(),
                rating: Joi.number().required(),
                parent_user_id: Joi.number().required(),
            })
        },
        handler: async (request, h) => {
            const data = await doctorsService.ratingToDoctor(request.payload);
            logger.info('Rating given to doctor successfully');
            return h.response(data);
        }
    }
});

server.route({
    method: 'GET',
    path: '/rating/parents',
    options: {
        description: 'Get all Users details who gave ratings to a doctor by dr_id [fine]',
        tags: ['api'],
        validate: {
            query: Joi.object({
                dr_id: Joi.number().required()
            })
        },
        handler: async (request, h) => {
            const { dr_id } = request.query;
            const data = await doctorsService.getRatingDetailsOfUsersByDoctorId(dr_id);
            logger.info('Rating details fetched successfully');
            return h.response(data);
        }
    }
});

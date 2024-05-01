const DoctorsServices = require('../services/service');
const doctorsService = new DoctorsServices();
const Joi = require('joi');
const logger = require('../config/logger');
const { init, appEmitter } = require('../config/server'); // Adjust the path as needed

init().catch(error => console.error('Failed to start the server:', error));

appEmitter.on('ready', ({ server }) => {

    // -------------------Google login---------------------------------------------
    // create a get API for google for google for generating the AUTH URL
    server.route({
        method: 'GET',
        path: '/google',
        options: {
            description: 'Get google auth url',
            tags: ['api'],
            handler: async (request, h) => {
                const url = await doctorsService.getGoogleAuthUrl();
                logger.info('Google auth url generated successfully');
                // console.log('url', url);
                return h.response({ url });
                // return h.redirect({url});
            }
        }
    });

    // now create a google redirect route and and set the code in the query parameter and set the credicentials
    server.route({
        method: 'GET',
        path: '/google/redirect',
        options: {
            description: 'Get google redirect url with code',
            tags: ['api'],
            handler: async (request, h) => {
                const code = request.query.code;
                const data = await doctorsService.getGoogleRedirectUrl(code);
                logger.info('Google logged in successfully');
                return h.response(data);


            }
        }
    });


    server.route({
        method: 'POST',
        path: '/appointments-schedule',
        options: {
            description: 'Schedule appointments with a doctor',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                payload: Joi.object({
                    // parent_user_id: Joi.number().required(),
                    dr_id: Joi.number().integer().required(),
                    child_id: Joi.number().integer().required(),
                    purpose: Joi.string().required(),
                    mode: Joi.valid('home', 'online', 'in_clinic').required(),
                    address: Joi.string(),
                    clinic_id: Joi.number().integer(),
                    appointments: Joi.array().items(
                        Joi.object({
                            start_time: Joi.string().isoDate().required(),
                            end_time: Joi.string().isoDate().required()
                        })
                    ).required()
                })
            },
            handler: async (request, h) => {
                let parent_user_id = request.auth.credentials.id;
                request.payload['parent_user_id'] = parent_user_id;
                try {
                    const result = await doctorsService.scheduleAppointments(request.payload);
                    logger.info('Appointments scheduled successfully');
                    return h.response(result).code(200);
                } catch (error) {
                    logger.error('Error scheduling appointments:', error);
                    return h.response({ error: 'Error scheduling appointments' }).code(500);
                }
            }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/appointments-schedule/{event_id}',
        options: {
            description: 'Delete appointments by event_id',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                params: Joi.object({
                    event_id: Joi.string().required()
                })
            },
            handler: async (request, h) => {
                let parent_user_id = request.auth.credentials.id;
                const { event_id } = request.params;
                try {
                    const result = await doctorsService.deleteAppointments(event_id, parent_user_id);
                    logger.info('Appointments deleted successfully');
                    return h.response(result).code(200);
                } catch (error) {
                    logger.error('Error deleting appointments:', error);
                    return h.response({ error: 'Error deleting appointments' }).code(500);
                }
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/appointments-schedule/{event_id}',
        options: {
            description: 'Update appointments by event_id',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                params: Joi.object({
                    event_id: Joi.string().required()
                }),
                payload: Joi.object({
                    purpose: Joi.string(),
                    mode: Joi.valid('home', 'online', 'in_clinic'),
                    address: Joi.string(),
                    clinic_id: Joi.number().integer(),
                    start_time: Joi.string().isoDate(),
                    end_time: Joi.string().isoDate()
                })
            },
            handler: async (request, h) => {
                let parent_user_id = request.auth.credentials.id;
                const { event_id } = request.params;
                try {
                    const result = await doctorsService.updateAppointments(event_id, parent_user_id, request.payload);
                    logger.info('Appointments updated successfully');
                    return h.response(result).code(200);
                } catch (error) {
                    logger.error('Error updating appointments:', error);
                    return h.response({ error: 'Error updating appointments' }).code(500);
                }

            }
        }
    });


    // -------------------DOCTORS Routes-----------------------------------------------------
    server.route({
        method: 'POST',
        path: '/doctors/create',
        options: {
            description: 'Create a new doctor',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                payload: Joi.object({
                    // doctorDetails
                    name: Joi.string().required(),
                    location: Joi.string(),
                    about_me: Joi.string(),
                    gender: Joi.string(),
                    address: Joi.string(),
                    contact: Joi.string(),
                    profile_link: Joi.string(),
                    consulting_fee: Joi.number(),
                    booking_fee: Joi.number(),
                    video_call_link: Joi.string(),
                    state: Joi.string().required(),
                    city: Joi.string().required(),
                    locality: Joi.string().required(),

                    // Doctor degree
                    degree: Joi.array().items(Joi.object({
                        degree_id: Joi.string().required(),
                        college_id: Joi.string().required(),
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
                    service_id: Joi.array().items(Joi.number().integer().required()).required(),

                    // Doctor Specialization
                    specialization_id: Joi.array().items(Joi.string().required()).required(),

                    // Doctor Experience
                    experience: Joi.array().items(Joi.object({
                        hospital_id: Joi.string().required(),
                        designation: Joi.string().required(),
                        exp_start_date: Joi.date().required(),
                        exp_end_date: Joi.date().required()
                    })).required(),

                    clinic_id: Joi.array().items(Joi.number().integer().required())
                })
            },
            handler: async (request, h) => {
                if (request.auth.credentials.role !== 'admin') {
                    logger.error('You don\'t have sufficient access.');
                    return h.response({ error: 'You don\'t have sufficient access.' }).code(403);
                }

                const { name, location, about_me, gender, address, contact, profile_link, consulting_fee, booking_fee, video_call_link, state, city, locality } = request.payload;
                const drDetails = { name, location, about_me, gender, address, contact, profile_link, consulting_fee, booking_fee, video_call_link, state, city, locality };

                let data = await doctorsService.createDoctors(drDetails);

                if (data.id !== undefined && data.id !== null) {

                    const { service_id } = request.payload;
                    const serviceDetails = { service_id };
                    serviceDetails['dr_id'] = data.id;

                    const { specialization_id } = request.payload;
                    const specializationDetails = { specialization_id };
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

    // // create a put for doctors by id for updating the doctor degree details, specialization details, services details
    // server.route({
    //     method: 'PUT',
    //     path: '/doctors/{id}',
    //     options: {
    //         description: 'Update doctor by id',
    //         tags: ['api'],
    //         validate: {
    //             payload: Joi.object({
    //                 // degree details
    //                 degree_id: Joi.number().integer().greater(0).required(),
    //                 college_id: Joi.number().integer().greater(0).required(),

    //                 // specialization details
    //                 specialization_id: Joi.number().integer().greater(0).required(),

    //                 // service details
    //                 service_id: Joi.number().integer().greater(0).required(),
    //                 consultation_fee: Joi.number().integer().greater(0).required(),
    //                 booking_fee: Joi.number().integer().greater(0).required()

    //             }),
    //             params: Joi.object({
    //                 id: Joi.number()
    //             })
    //         },
    //         handler: async (request, h) => {
    //             // if (request.auth.credentials.role !== 'doctor' && request.auth.credentials.role !== 'admin') {
    //             //     logger.error('You don\'t have sufficient access.');
    //             //     return h.response({ error: 'You don\'t have sufficient access.' }).code(403);
    //             // }
    //             let dr_id = request.params.id;
    //             const { degree_id, college_id, specialization_id, service_id, consultation_fee, booking_fee } = request.payload;
    //             const data = await doctorsService.updateDoctorById( dr_id, degree_id, college_id, specialization_id, service_id, consultation_fee, booking_fee);
    //             logger.info('Doctor updated successfully');
    //             return h.response(data);
    //         }
    //     }
    // });



    server.route({
        method: 'GET',
        path: '/doctors/getDoctorsDetailsByFilter',
        options: {
            description: 'Get doctor by gender and specialization',
            tags: ['api'],
            validate: {
                query: Joi.object({
                    name_or_specil: Joi.string(),
                    city: Joi.string(),
                })
            },
            handler: async (request, h) => {
                const { name_or_specil, city } = request.query;
                try {
                    const data = await doctorsService.getDoctorByName(name_or_specil, city);
                    logger.info('Doctor details fetched successfully');
                    return h.response(data);
                } catch (error) {
                    logger.error('An error occurred while fetching doctor details:', error);
                    return h.response({ error: 'An internal server error occurred' }).code(500);
                }
            }
        }
    });

    // create routes for applying the doctors leave with dr_id and date
    server.route({
        method: 'POST',
        path: '/doctors/leave',
        options: {
            description: 'Apply leave for a doctor',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                payload: Joi.object({
                    dr_id: Joi.number().integer().greater(0).required(),
                    leave: Joi.date().required(),
                    // leave: Joi.string().required(),
                })
            },
            handler: async (request, h) => {
                if (request.auth.credentials.role !== 'doctor' && request.auth.credentials.role !== 'admin') {
                    logger.error('You don\'t have sufficient access.');
                    return h.response({ error: 'You don\'t have sufficient access.' }).code(403);
                }

                const data = await doctorsService.applyLeave(request.payload);
                logger.info('Leave applied successfully');
                return h.response(data);
            }
        }
    });

    // create a get API for doctors by id
    server.route({
        method: 'GET',
        path: '/doctors/byId',
        options: {
            description: 'Get doctor by id and their booking patients  details',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                query: Joi.object({
                    dr_id: Joi.number().integer().greater(0).required(),
                    key: Joi.string().valid('today', 'upcoming').required()
                })
            },
            handler: async (request, h) => {
                try {
                    if (request.auth.credentials.role !== 'doctor' && request.auth.credentials.role !== 'admin') {
                        logger.error('You don\'t have sufficient access.');
                        return h.response({ error: 'You don\'t have sufficient access.' }).code(403);
                    }

                    const { dr_id, key } = request.query;
                    const data = await doctorsService.getDoctorById(dr_id, key);
                    logger.info('Doctor details fetched successfully');
                    return h.response(data);
                } catch (error) {
                    logger.error('An error occurred while fetching doctor details:', error);
                    return h.response({ error: 'An internal server error occurred' }).code(500);
                }
            }

        }
    });

    server.route({
        method: 'DELETE',
        path: '/doctors/{id}',
        options: {
            description: 'Delete doctor by id',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                params: Joi.object({
                    id: Joi.number()
                })
            },
            handler: async (request, h) => {
                if (request.auth.credentials.role !== 'admin') {
                    logger.error('You don\'t have sufficient access.');
                    return h.response({ error: 'You don\'t have sufficient access.' }).code(403);
                }

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
            description: 'Get all doctors details',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            handler: async (request, h) => {
                if (request.auth.credentials.role !== 'admin') {
                    logger.error('You don\'t have sufficient access.');
                    return h.response({ error: 'You don\'t have sufficient access.' }).code(403);
                }
                const data = await doctorsService.getDoctorsDetails();
                logger.info('All doctors details fetched successfully');
                return h.response(data);
            }
        }
    });


    server.route({
        method: 'POST',
        path: '/favouriteDoctors/parents',
        options: {
            description: 'Add doctor to your favourite list',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                payload: Joi.object({
                    dr_id: Joi.number().required(),
                })
            },
            handler: async (request, h) => {
                request.payload['parent_user_id'] = request.auth.credentials.id;
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
            description: 'Get all your favourite doctors list by parent_user_id',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            handler: async (request, h) => {
                // const { parent_user_id } = request.query;
                const parent_user_id = request.auth.credentials.id;
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
            description: 'Remove doctor from your favourite list',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                payload: Joi.object({
                    dr_id: Joi.number().required(),
                })
            },
            handler: async (request, h) => {
                request.payload['parent_user_id'] = request.auth.credentials.id;
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
            description: 'Get all upcoming booking slots of a doctor details by parent_user_id',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            handler: async (request, h) => {
                // const { parent_user_id } = request.query;
                const parent_user_id = request.auth.credentials.id;
                const data = await doctorsService.getUpcomingBookingSlotsByParentUserId(parent_user_id);
                logger.info('Upcoming booking slots fetched successfully');
                return h.response(data);
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/bookingSlots/userId',
        options: {
            description: 'Get ALL booking slots by parent_user_id',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            handler: async (request, h) => {
                const parent_user_id = request.auth.credentials.id;
                const data = await doctorsService.getAllBookingSlotsByUserId(parent_user_id);
                logger.info('Upcoming booking slots fetched successfully');
                return h.response(data);
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/rating/parents',
        options: {
            description: 'Rate a doctor',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                payload: Joi.object({
                    dr_id: Joi.number().required(),
                    feedback: Joi.string().required(),
                    rating: Joi.number().required(),
                })
            },
            handler: async (request, h) => {
                request.payload['parent_user_id'] = request.auth.credentials.id;
                const data = await doctorsService.ratingToDoctor(request.payload);
                logger.info('Rating given to doctor successfully');
                return h.response(data);
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/doctor/rating/parents',
        options: {
            description: 'Get all Users details who gave ratings to a doctor by dr_id',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                query: Joi.object({
                    dr_id: Joi.number().required()
                })
            },
            handler: async (request, h) => {
                if (request.auth.credentials.role !== 'admin' || request.auth.credentials.role !== 'doctor') {
                    logger.error('You don\'t have sufficient access.');
                    return h.response({ error: 'You don\'t have sufficient access.' }).code(403);
                }

                const { dr_id } = request.query;
                const data = await doctorsService.getRatingDetailsOfUsersByDoctorId(dr_id);
                logger.info('Rating details fetched successfully');
                return h.response(data);
            }
        }
    });


    server.route({
        method: 'POST',
        path: '/children/parents',
        options: {
            description: 'Create a new child',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                payload: Joi.object({
                    //                 user_id: Joi.number().required(),
                    name: Joi.string().required(),
                    contact: Joi.string().required(),
                    email: Joi.string().email().required(),
                    age: Joi.number().required(),
                    gender: Joi.string().valid('M', 'F', 'T').required(),
                    child_class: Joi.string().max(30).required(),
                    address1: Joi.string().max(100).required(),
                    address2: Joi.string().max(100).required(),
                    city: Joi.string().max(50).required(),
                    state: Joi.string().max(50).required(),
                    pincode: Joi.string().max(10).required(),
                    country: Joi.string().max(50).required(),
                    dos: Joi.date().optional(),
                    status: Joi.string().valid('A', 'S').required(),
                    last_updated: Joi.date().required(),
                    dated: Joi.date().required(),
                })
            },
            handler: async (request, h) => {
                request.payload['user_id'] = request.auth.credentials.id;
                const data = await doctorsService.createChildren(request.payload);
                logger.info('Child created successfully');
                return h.response(data);
            }
        }

    });

    server.route({
        method: 'GET',
        path: '/user/children',
        options: {
            description: 'Get user profile with children details by parent_user_id',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            handler: async (request, h) => {
                try {
                    const user_id = request.auth.credentials.id;
                    const data = await doctorsService.getChildrenByParentUserId(user_id);
                    logger.info('Get user profile with children details by parent_user_id');
                    return h.response(data);
                } catch (error) {
                    logger.error('Error fetching user profile with children details:', error);
                    return h.response({ error: 'Error fetching user profile with children details' }).code(500);
                }
            }
        }
    });


    server.route({
        method: 'PUT',
        path: '/user/update-profile',
        options: {
            description: 'Update user profile',
            tags: ['api'],
            auth: {
                strategy: 'jwt',
            },
            validate: {
                payload: Joi.object({
                    name: Joi.string().max(50),
                    email: Joi.string().email().max(100),
                    contact: Joi.string().max(15),
                    last_name: Joi.string().max(255),
                    dob: Joi.date(),
                    blood_group: Joi.string(),
                    address: Joi.string(),
                    city: Joi.string(),
                    state: Joi.string(),
                    country: Joi.string(),
                    zipcodes: Joi.string()
                }),
            },
            handler: async (request, h) => {
                try {
                    const user_id = request.auth.credentials.id;
                    const data = await doctorsService.updateUserById(user_id, request.payload);
                    logger.info('User updated successfully');
                    return h.response(data);
                }
                catch (error) {
                    logger.error('An error occurred while updating user details:', error);
                    return h.response({ error: 'An internal server error occurred' }).code(500);
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/dropdown/specilizations',
        options: {
            description: 'Get all specializations details',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    const data = await doctorsService.getSpecializations();
                    logger.info('Specializations details fetched successfully');
                    return h.response(data);
                }
                catch (error) {
                    logger.error('An error occurred while fetching specializations details:', error);
                    return h.response({ error: 'An internal server error occurred' }).code(500);
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/dropdown/colleges',
        options: {
            description: 'Get all colleges details',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    const data = await doctorsService.getColleges();
                    logger.info('Colleges details fetched successfully');
                    return h.response(data);
                }
                catch (error) {
                    logger.error('An error occurred while fetching colleges details:', error);
                    return h.response({ error: 'An internal server error occurred' }).code(500);
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/dropdown/degrees',
        options: {
            description: 'Get all degrees details',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    const data = await doctorsService.getDegrees();
                    logger.info('Degrees details fetched successfully');
                    return h.response(data);
                }
                catch (error) {
                    logger.error('An error occurred while fetching degrees details:', error);
                    return h.response({ error: 'An internal server error occurred' }).code(500);
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/dropdown/hospitals',
        options: {
            description: 'Get all hospitals details',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    const data = await doctorsService.getHospitals();
                    logger.info('Hospitals details fetched successfully');
                    return h.response(data);
                }
                catch (error) {
                    logger.error('An error occurred while fetching hospitals details:', error);
                    return h.response({ error: 'An internal server error occurred' }).code(500);
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/dropdown/services',
        options: {
            description: 'Get all services details',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    const data = await doctorsService.getServices();
                    logger.info('Services details fetched successfully');
                    return h.response(data);
                }
                catch (error) {
                    logger.error('An error occurred while fetching services details:', error);
                    return h.response({ error: 'An internal server error occurred' }).code(500);
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/dropdown/clinics',
        options: {
            description: 'Get all clinics details',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    const data = await doctorsService.getClinics();
                    logger.info('Clinics details fetched successfully');
                    return h.response(data);
                }
                catch (error) {
                    logger.error('An error occurred while fetching clinics details:', error);
                    return h.response({ error: 'An internal server error occurred' }).code(500);
                }
            }
        }
    });

});
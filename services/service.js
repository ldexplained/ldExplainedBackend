const { Model } = require('objection')
const Doctors = require('../models/doctors')
const DoctorsDegree = require('../models/doctorsDegree')
const DoctorsAward = require('../models/doctorsAward')
const DoctorsService = require('../models/doctorsServices')
const DoctorsSpecialization = require('../models/doctorsSpecialization')
const DoctorsExperience = require('../models/doctorsExperience')
const DoctorsClinic = require('../models/doctorsClinic')
const DoctorsClinicImages = require('../models/doctorsClinicImages')
const DoctorsClinicIds = require('../models/doctorsClinicIds');
const DoctorsBookingSlot = require('../models/doctorsBookingSlots');
const User = require('../models/parentUsers');
const Child = require('../models/children');
const FavouriteDoctors = require('../models/favouriteDoctors');
const DoctorsFeedback = require('../models/doctorsFeedback');
const logger = require('../config/logger');

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');
const { appEmitter } = require('../config/server'); // Adjust the path as needed

module.exports = class DoctorsServices extends Model {

    constructor() {
        super(); // Call the super constructor when extending a class
        // Initialize instance properties
        this.isReady = false;
        this.calendar = null;
        this.oauth2Client = null;
        this.scopes = null;

        // Set up listener for the 'ready' event
        appEmitter.on('ready', ({ calendar, knex, oauth2Client, scopes }) => {
            this.calendar = calendar;
            this.knex = knex;
            this.oauth2Client = oauth2Client;
            this.scopes = scopes;
            this.isReady = true;
        });

    }
    // -------------------google SERVICES-----------------------------------------------------
    // create a method getGoogleAuthUrl() that will return the URL to authenticate the user with Google with try catch error handing
    async getGoogleAuthUrl() {
        try {
            console.log('AAAAAAAAAAAAAa')
            const authUrl = this.oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: this.scopes
            });
            // console.log(authUrl, 'authUrl')
            return authUrl;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    // create a method getGoogleRedirectUrl(code) and set the credicentials
    async getGoogleRedirectUrl(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            let userInfo = await this.fetchUserProfile();
            const existingUser = await User.query().where('email', userInfo.email);

            if (existingUser.length === 0) {
                await User.query().insert({ name: userInfo.name, email: userInfo.email });
            }
            let user = await User.query().where('email', userInfo.email);

            const userDetails = {
                id: user[0].id,
                email: user[0].email,
            };

            const secretKey = process.env.JWT_SECRET;
            const options = {
                algorithm: 'HS256',
                expiresIn: '1h',
            };

            // Create the JWT
            const jwtToken = jwt.sign(userDetails, secretKey, options);
            return jwtToken;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async fetchUserProfile() {
        const oauth2 = google.oauth2({
            auth: this.oauth2Client,
            version: 'v2',
        });

        const res = await oauth2.userinfo.get();
        return res.data;
        // console.log(res.data); // User profile information
    }


    //---------------------------------------------------------------------
    async scheduleAppointments(appointmentDetails) {
        const user = await User.query().skipUndefined().where('id', appointmentDetails.parent_user_id);
        const doctor = await Doctors.query().where('id', appointmentDetails.dr_id);
        if (!user || !doctor) {
            throw new Error('User or Doctor not found');
        }

        const appointments = appointmentDetails.appointments;
        delete appointmentDetails.appointments;

        const eventResponses = [];

        const eventDescription = `Appointment between Dr. ${doctor.name} and ${user.name}`;
        for (const { start_time, end_time } of appointments) {
            const requestId = uuidv4();
            // Create the event for the doctor's calendar first to generate the Meet link
            const doctorEvent = {
                summary: appointmentDetails.purpose,
                description: eventDescription,
                start: { dateTime: start_time, timeZone: 'Asia/Kolkata' },
                end: { dateTime: end_time, timeZone: 'Asia/Kolkata' },
                attendees: [{ email: doctor[0].email }],
                conferenceData: { createRequest: { requestId } },
            };

            try {
                const doctorEventResponse = await this.calendar.events.insert({
                    calendarId: 'primary', // Assuming doctor's primary this.calendar. Replace if necessary.
                    resource: doctorEvent,
                    conferenceDataVersion: 1,
                    sendUpdates: 'all',
                    auth: this.oauth2Client,
                });

                const meetLink = doctorEventResponse.data.hangoutLink;

                // Assuming this function exists in your service to save appointment details
                appointmentDetails['booking_date'] = new Date().toISOString().split('T')[0];
                appointmentDetails['link'] = meetLink;
                appointmentDetails['start_time'] = start_time;
                appointmentDetails['end_time'] = end_time;

                await DoctorsBookingSlot.query().insert(appointmentDetails);

                eventResponses.push({
                    doctorEventLink: doctorEventResponse.data.htmlLink,
                    // userEventLink: userEvent.htmlLink, // This assumes successful event creation
                    meetLink: meetLink,
                });

            } catch (error) {
                console.error('Error creating calendar event:', error);
                throw error;
            }
        }
        return eventResponses;
    }

    // -------------------DOCTORS SERVICES-----------------------------------------------------
    async createDoctors(doctorDetails) {
        try {
            let checkdoctor = await Doctors.query().where('name', doctorDetails.name);
            if (checkdoctor.length > 0) {
                return `Doctor already exists with this ${doctorDetails.name}. Please try with another name`
            }
            doctorDetails['rating'] = 0;
            doctorDetails['total_feedback'] = 0;
            const data = await Doctors.query().insert(doctorDetails);
            return data;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async createDoctorDegree(degreeDetails) {
        degreeDetails['start_date'] = degreeDetails.degree_start_date;
        degreeDetails['end_date'] = degreeDetails.degree_end_date;
        delete degreeDetails.degree_start_date;
        delete degreeDetails.degree_end_date;
        try {
            const data = await DoctorsDegree.query().insert(degreeDetails);
            return data;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async createDoctorAward(award) {
        award['date'] = award.award_date;
        delete award.award_date;
        try {
            const data = await DoctorsAward.query().insert(award);
            return data;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async createDoctorService(service) {
        try {
            const { dr_id, service_name } = service;
            const jsonString = JSON.stringify(service_name);

            const data = await DoctorsService.query().insert({ dr_id, service_name: jsonString });
            return data;
        } catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async createDoctorSpecialization(specializations) {
        try {
            const { dr_id, specialization } = specializations;
            const jsonString = JSON.stringify(specialization);
            const data = await DoctorsSpecialization.query().insert({ dr_id, specialization: jsonString });

            return data;
        } catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    // Doctor Experince
    async createDoctorExperience(experience) {
        experience['start_date'] = experience.exp_start_date;
        experience['end_date'] = experience.exp_end_date;
        delete experience.exp_start_date;
        delete experience.exp_end_date;
        try {
            const data = await DoctorsExperience.query().insert(experience);
            return data;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async createDoctorClinic(clinicDetails) {
        delete clinicDetails.clinic_images_link;
        try {
            const data = await DoctorsClinic.query().insert(clinicDetails);
            return data;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async createClinicImages(clinicImages, dr_id, clinic_id) {
        try {
            const { clinic_images_link } = clinicImages;
            const jsonString = JSON.stringify(clinic_images_link);
            const data = await DoctorsClinicImages.query().insert({ clinic_id, clinic_images_link: jsonString });
            await DoctorsClinicIds.query().insert({ dr_id, clinic_id });
            return data;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }


    async getDoctorByName(gender, specialization) {
        try {
            let doctorsQuery = Doctors.query();

            if (gender !== undefined && gender !== null) {
                doctorsQuery = doctorsQuery.where('gender', gender);
            }

            if (specialization !== undefined && specialization !== null) {
                const drSpe = await DoctorsSpecialization.query().where('specialization', 'like', `%${specialization}%`);
                const drIds = drSpe.map((dr) => dr.dr_id);
                doctorsQuery = doctorsQuery.whereIn('id', drIds);
            }

            const data = await doctorsQuery.withGraphFetched('[degrees, awards, services, specialization, experience]');

            if (data.length === 0) {
                return [];
            }

            let finalData = [];
            for (let dr of data) {
                let clinicDetails = await DoctorsClinicIds.query().where('dr_id', dr.id);
                let clinicIds = clinicDetails.map((clinic) => clinic.clinic_id);

                let clinic = await DoctorsClinic.query().whereIn('id', clinicIds);
                let clinicImages = await DoctorsClinicImages.query().whereIn('clinic_id', clinicIds);

                // parse clinic images link from stringified array to actual array
                for (let i = 0; i < clinicImages.length; i++) {
                    clinicImages[i].clinic_images_link = JSON.parse(clinicImages[i].clinic_images_link);
                }

                let specialization = [];
                for (let i = 0; i < dr.specialization.length; i++) {
                    specialization.push(JSON.parse(dr.specialization[i].specialization));
                }

                let services = [];
                for (let i = 0; i < dr.services.length; i++) {
                    services.push(JSON.parse(dr.services[i].service_name));
                }
                finalData.push({ ...dr, specialization, clinic, clinicImages, services });
            }
            return finalData;
        } catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async getDoctorById(id, key) {
        try {
            const data = await Doctors.query().where('id', id).withGraphFetched('[degrees, awards, services, specialization, experience]');
            if (data.length === 0) {
                return [];
            }

            for (let i = 0; i < data[0].specialization.length; i++) {
                data[0].specialization[i].specialization = JSON.parse(data[0].specialization[i].specialization);
            }

            for (let i = 0; i < data[0].services.length; i++) {
                data[0].services[i].service_name = JSON.parse(data[0].services[i].service_name);
            }

            let clinicDetails = await DoctorsClinicIds.query().where('dr_id', id);
            let clinicIds = clinicDetails.map((clinic) => clinic.clinic_id);

            let clinic = await DoctorsClinic.query().whereIn('id', clinicIds);
            let clinicImages = await DoctorsClinicImages.query().whereIn('clinic_id', clinicIds);

            for (let i = 0; i < clinicImages.length; i++) {
                clinicImages[i].clinic_images_link = JSON.parse(clinicImages[i].clinic_images_link);
                clinicImages[i].clinicImagesLength = clinicImages[i].clinic_images_link.length;
            }

            // get only today date.
            let today = new Date();
            today = today.toISOString().split('T')[0];
            if (key === 'today') {
                let bookingSlots = await DoctorsBookingSlot.query().where('dr_id', id).andWhere('appointment_date', today);
                if (bookingSlots.length === 0) {
                    data[0] = { ...data[0], clinic, clinicImages, bookingSlots };
                    return data;
                } else {
                    for (let i = 0; i < bookingSlots.length; i++) {
                        let user = await User.query().where('id', bookingSlots[i].parent_user_id);
                        bookingSlots[i]['patient_name'] = user[0].name;
                    }
                    data[0] = { ...data[0], clinic, clinicImages, bookingSlots };
                    return data;
                }

            } else if (key === 'upcoming') {
                let bookingSlots = await DoctorsBookingSlot.query().where('dr_id', id).andWhere('appointment_date', '>', today);
                if (bookingSlots.length === 0) {
                    data[0] = { ...data[0], clinic, clinicImages, bookingSlots };
                    return data;
                } else {
                    for (let i = 0; i < bookingSlots.length; i++) {
                        let user = await User.query().where('id', bookingSlots[i].parent_user_id);
                        bookingSlots[i]['patient_name'] = user[0].name;
                    }
                    data[0] = { ...data[0], clinic, clinicImages, bookingSlots };
                    return data;
                }
            }
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async deleteDoctorById(id) {
        try {
            const data = await Doctors.query().delete().where('id', id);
            if (data !== 1) {
                return {
                    statusCode: 404,
                    message: `No record found with id ${id}`
                };
            }
            return {
                statusCode: 200,
                message: `Record deleted successfully with id ${id}`
            };
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async getDoctorsDetails() {
        try {
            const data = await Doctors.query().withGraphFetched('[degrees, awards, services, specialization, experience]');
            if (data.length === 0) {
                return [];
            }

            let finalData = [];
            for (let dr of data) {
                let clinicDetails = await DoctorsClinicIds.query().where('dr_id', dr.id);
                let clinicIds = clinicDetails.map((clinic) => clinic.clinic_id);
                let clinic = await DoctorsClinic.query().whereIn('id', clinicIds);
                let clinicImages = await DoctorsClinicImages.query().whereIn('clinic_id', clinicIds);

                for (let i = 0; i < clinicImages.length; i++) {
                    clinicImages[i].clinic_images_link = JSON.parse(clinicImages[i].clinic_images_link);
                }

                let specialization = [];
                for (let i = 0; i < dr.specialization.length; i++) {
                    specialization.push(JSON.parse(dr.specialization[i].specialization));
                }

                let services = [];
                for (let i = 0; i < dr.services.length; i++) {
                    services.push(JSON.parse(dr.services[i].service_name));
                }
                finalData.push({ ...dr, specialization, clinic, clinicImages, services });
            }
            return finalData;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async addFavouriteDoctor(addFavDetails) {
        try {
            let checkDoctor = await Doctors.query().where('id', addFavDetails.dr_id);
            if (checkDoctor.length === 0) {
                return `No Doctor found with id ${addFavDetails.dr_id}`;
            }

            let checkUser = await User.query().where('id', addFavDetails.parent_user_id);
            if (checkUser.length === 0) {
                return `No Parent found with id ${addFavDetails.parent_user_id}`;
            }
            let checkDoctorFav = await FavouriteDoctors.query().where('dr_id', addFavDetails.dr_id).andWhere('parent_user_id', addFavDetails.parent_user_id);
            if (checkDoctorFav.length > 0) {
                return `Doctor already exists in your favourite list`;
            }
            await FavouriteDoctors.query().insert(addFavDetails);
            return [{
                statusCode: 200,
                message: 'Doctor added to your favourite list'
            }];
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async getFavouriteDoctors(parent_user_id) {
        try {
            let checkUser = await User.query().where('id', parent_user_id);
            if (checkUser.length === 0) {
                return `No Parent found with id ${parent_user_id}`;
            }

            let drFav = await FavouriteDoctors.query().where('parent_user_id', parent_user_id);
            if (drFav.length === 0) {
                return [];
            }
            let drIds = drFav.map((dr) => dr.dr_id);

            const data = await Doctors.query().whereIn('id', drIds).withGraphFetched('[degrees, awards, services, specialization, experience]');
            if (data.length === 0) {
                return [];
            }
            let finalData = [];
            for (let dr of data) {
                let clinicDetails = await DoctorsClinicIds.query().where('dr_id', dr.id);
                let clinicIds = clinicDetails.map((clinic) => clinic.clinic_id);

                let clinic = await DoctorsClinic.query().whereIn('id', clinicIds);
                let clinicImages = await DoctorsClinicImages.query().whereIn('clinic_id', clinicIds);

                for (let i = 0; i < clinicImages.length; i++) {
                    clinicImages[i].clinic_images_link = JSON.parse(clinicImages[i].clinic_images_link);
                }

                let specialization = [];
                for (let i = 0; i < dr.specialization.length; i++) {
                    specialization.push(JSON.parse(dr.specialization[i].specialization));
                }

                let services = [];
                for (let i = 0; i < dr.services.length; i++) {
                    services.push(JSON.parse(dr.services[i].service_name));
                }

                finalData.push({ ...dr, specialization, clinic, clinicImages, services });
            }
            return finalData;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async removeFavouriteDoctor(removeFavDetails) {
        try {
            let checkDoctor = await Doctors.query().where('id', removeFavDetails.dr_id);
            if (checkDoctor.length === 0) {
                return `No Doctor found with id ${removeFavDetails.dr_id}`;
            }

            let checkUser = await User.query().where('id', removeFavDetails.parent_user_id);
            if (checkUser.length === 0) {
                return `No Parent found with id ${removeFavDetails.parent_user_id}`;
            }

            await FavouriteDoctors.query().delete().where('dr_id', removeFavDetails.dr_id).andWhere('parent_user_id', removeFavDetails.parent_user_id);
            return [{
                statusCode: 200,
                message: 'Doctor removed from your favourite list'
            }];
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async getUpcomingBookingSlotsByParentUserId(parent_user_id) {
        try {
            let checkUser = await User.query().where('id', parent_user_id);
            if (checkUser.length === 0) {
                return `No Parent found with id ${parent_user_id}`;
            }

            let today = new Date();
            today = today.toISOString().split('T')[0];
            const data = await DoctorsBookingSlot.query().where('parent_user_id', parent_user_id).andWhere('booking_date', '>=', today);
            if (data.length === 0) {
                return [];
            }
            let finalData = [];
            for (let dr of data) {
                let patient_name = await User.query().select('name').where('id', dr.parent_user_id);
                dr['patient_name'] = patient_name[0].name;
                let doctor = await Doctors.query().where('id', dr.dr_id);
                finalData.push({ ...dr, doctor });
            }
            return finalData;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async ratingToDoctor(ratingDetails) {
        try {
            let checkDoctor = await Doctors.query().where('id', ratingDetails.dr_id);
            if (checkDoctor.length === 0) {
                return `No Doctor found with id ${ratingDetails.dr_id}`;
            }

            let checkUser = await User.query().where('id', ratingDetails.parent_user_id);
            if (checkUser.length === 0) {
                return `No Parent found with id ${ratingDetails.parent_user_id}`;
            }

            let checkBooking = await DoctorsBookingSlot.query().where('dr_id', ratingDetails.dr_id).andWhere('parent_user_id', ratingDetails.parent_user_id);
            if (checkBooking.length === 0) {
                return `No booking found with dr_id ${ratingDetails.dr_id} and parent_user_id ${ratingDetails.parent_user_id}`;
            }

            if (ratingDetails.rating < 0 || ratingDetails.rating > 5) {
                return `Rating should be between 0 to 5`;
            }

            const insertedFeedback = await DoctorsFeedback.query().insert(ratingDetails);

            let drFeedback = await DoctorsFeedback.query().where('dr_id', ratingDetails.dr_id);
            let totalParents = drFeedback.length;

            let totalRating = 0;
            for (let i = 0; i < drFeedback.length; i++) {
                totalRating += drFeedback[i].rating;
            }
            let avgRating = totalRating / totalParents;
            avgRating = avgRating.toFixed(1);

            await Doctors.query().patchAndFetchById(ratingDetails.dr_id, { rating: avgRating, total_feedback: totalParents });

            return insertedFeedback;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async getRatingDetailsOfUsersByDoctorId(dr_id) {
        try {
            let checkDoctor = await Doctors.query().where('id', dr_id);
            if (checkDoctor.length === 0) {
                return `No Doctor found with id ${dr_id}`;
            }

            let drFeedback = await DoctorsFeedback.query().where('dr_id', dr_id);
            if (drFeedback.length === 0) {
                return [];
            }

            let finalData = [];
            finalData.push({ ...checkDoctor[0] });
            let patientDetails = [];
            for (let dr of drFeedback) {
                let patient_name = await User.query().select('name').where('id', dr.parent_user_id);
                dr['patient_name'] = patient_name[0].name;
                patientDetails.push(dr);
            }
            finalData.push({ patientDetails });
            return finalData;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async createChildren(childrenDetails) {
        try {
            let checkUser = await User.query().where('id', childrenDetails.user_id);
            if (checkUser.length === 0) {
                return `No Parent found with id ${childrenDetails.user_id}`;
            }
            else {
                childrenDetails['parent_name'] = checkUser[0].name;
                const data = await Child.query().insert(childrenDetails);
                return data;
            }
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async getChildrenByParentUserId(user_id) {
        try {
            let checkUser = await User.query().where('id', user_id);
            if (checkUser.length === 0) {
                return `No Parent found with id ${user_id}`;
            }
            else {
                const data = await Child.query().where('user_id', user_id);
                if (data.length === 0) {
                    return [];
                }

                let finalData = [];
                finalData.push({ ...checkUser[0] });
                finalData.push({ childrenDetails: data });
                return finalData;                
            }
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }
}

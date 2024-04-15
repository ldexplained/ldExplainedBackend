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
const Roles = require('../models/roles');
const logger = require('../config/logger');
const servicesMasterAll = require('../models/servicesMasterAll');
const specializationsMasterAll = require('../models/specializationMasterAll');
const degreesMasterAll = require('../models/degreesMasterAll');
const collegeMasterAll = require('../models/collegeMasterAll');
const hospitalMasterAll = require('../models/hospitalMasterAll');
const DoctorsLeave = require('../models/doctorsLeave');

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
            let checkRoles = await Roles.query().where('email', userInfo.email);

            const userDetails = {
                id: user[0].id,
                email: user[0].email,
            };

            if (checkRoles.length !== 0) {
                userDetails['role'] = checkRoles[0].role;
            }

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

        if (appointmentDetails.mode === 'online') {
            const appointments = appointmentDetails.appointments;
            delete appointmentDetails.appointments;

            const eventResponses = [];

            const eventDescription = `Online appointment between Dr. ${doctor[0].name} and ${user[0].name}`;
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
                    appointmentDetails['mode'] = appointmentDetails.mode;
                    appointmentDetails['address'] = null;
                    appointmentDetails['clinic_id'] = null;
                    appointmentDetails['event_id'] = doctorEventResponse.data.id;

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
            // return eventResponses;
            return [{
                statusCode: 200,
                message: `Online appointment between Dr. ${doctor[0].name} and ${user[0].name} created successfully`
            }]
        }
        else if (appointmentDetails.mode === 'home') {
            // create a new event for the doctor's calendar but without a Meet link and take a address from user and insert it into table
            const appointments = appointmentDetails.appointments;
            delete appointmentDetails.appointments;

            const eventResponses = [];

            const eventDescription = `Home appointment between Dr. ${doctor[0].name} and ${user[0].name}`;
            for (const { start_time, end_time } of appointments) {
                const requestId = uuidv4();
                // Create the event for the doctor's calendar first to generate the Meet link
                const doctorEvent = {
                    summary: appointmentDetails.purpose,
                    description: eventDescription,
                    start: { dateTime: start_time, timeZone: 'Asia/Kolkata' },
                    end: { dateTime: end_time, timeZone: 'Asia/Kolkata' },
                    attendees: [{ email: doctor[0].email }],
                    location: appointmentDetails.address,
                };

                try {
                    const doctorEventResponse = await this.calendar.events.insert({
                        calendarId: 'primary', // Assuming doctor's primary this.calendar. Replace if necessary.
                        resource: doctorEvent,
                        sendUpdates: 'all',
                        auth: this.oauth2Client,
                    });

                    // Assuming this function exists in your service to save appointment details
                    appointmentDetails['booking_date'] = new Date().toISOString().split('T')[0];
                    appointmentDetails['link'] = null;
                    appointmentDetails['start_time'] = start_time;
                    appointmentDetails['end_time'] = end_time;
                    appointmentDetails['mode'] = appointmentDetails.mode;
                    appointmentDetails['address'] = appointmentDetails.address;
                    appointmentDetails['clinic_id'] = null;
                    appointmentDetails['event_id'] = doctorEventResponse.data.id;

                    await DoctorsBookingSlot.query().insert(appointmentDetails);

                    eventResponses.push({
                        doctorEventLink: doctorEventResponse.data.htmlLink,
                    });

                } catch (error) {
                    console.error('Error creating calendar event:', error);
                    throw error;
                }
            }
            return [{
                statusCode: 200,
                message: `Home appointment between Dr. ${doctor[0].name} and ${user[0].name} created successfully`
            }]
        }
        else {
            if (appointmentDetails.clinic_id === undefined || appointmentDetails.clinic_id === null) {
                throw new Error('Clinic id is required for in clinic appointment');
            }
            else {

                let clinic = await DoctorsClinic.query().where('id', appointmentDetails.clinic_id);

                const appointments = appointmentDetails.appointments;
                delete appointmentDetails.appointments;

                const eventResponses = [];

                const eventDescription = `In clinic appointment between Dr. ${doctor[0].name} and ${user[0].name}`;
                for (const { start_time, end_time } of appointments) {
                    const requestId = uuidv4();
                    // Create the event for the doctor's calendar first to generate the Meet link
                    const doctorEvent = {
                        summary: appointmentDetails.purpose,
                        description: eventDescription,
                        start: { dateTime: start_time, timeZone: 'Asia/Kolkata' },
                        end: { dateTime: end_time, timeZone: 'Asia/Kolkata' },
                        attendees: [{ email: doctor[0].email }],
                        location: clinic[0].clinic_address,
                    };

                    try {
                        const doctorEventResponse = await this.calendar.events.insert({
                            calendarId: 'primary', // Assuming doctor's primary this.calendar. Replace if necessary.
                            resource: doctorEvent,
                            sendUpdates: 'all',
                            auth: this.oauth2Client,
                        });

                        // Assuming this function exists in your service to save appointment details
                        appointmentDetails['booking_date'] = new Date().toISOString().split('T')[0];
                        appointmentDetails['link'] = null;
                        appointmentDetails['start_time'] = start_time;
                        appointmentDetails['end_time'] = end_time;
                        appointmentDetails['mode'] = appointmentDetails.mode;
                        appointmentDetails['address'] = null;
                        appointmentDetails['clinic_id'] = appointmentDetails.clinic_id;
                        appointmentDetails['event_id'] = doctorEventResponse.data.id;

                        await DoctorsBookingSlot.query().insert(appointmentDetails);

                        eventResponses.push({
                            doctorEventLink: doctorEventResponse.data.htmlLink,
                        });

                    } catch (error) {
                        console.error('Error creating calendar event:', error);
                        throw error;
                    }
                }
            }
            return [{
                statusCode: 200,
                message: `In clinic appointment between Dr. ${doctor[0].name} and ${user[0].name} created successfully`
            }]

        }
    }

    // create a method with named deleteAppointments(event_id, parent_user_id)

    async deleteAppointments(event_id, parent_user_id) {
        try {
            let checkUser = await User.query().where('id', parent_user_id);
            if (checkUser.length === 0) {
                return `No User found with id ${parent_user_id}`;
            }

            let checkEvent = await DoctorsBookingSlot.query().where('event_id', event_id);
            if (checkEvent.length === 0) {
                return `No event found with id ${event_id}`;
            }

            // Retrieve the event details including the eventId
            const eventDetails = await this.calendar.events.get({
                calendarId: 'primary', // Calendar ID where the event exists
                eventId: event_id, // Event ID of the event to be deleted
                auth: this.oauth2Client,
            });

            // Delete the event from Google Calendar
            await this.calendar.events.delete({
                calendarId: 'primary', // Calendar ID where the event exists
                eventId: event_id, // Event ID of the event to be deleted
                auth: this.oauth2Client,
            });

            // Delete the event data from the database
            await DoctorsBookingSlot.query().delete().where('event_id', event_id);

            return {
                statusCode: 200,
                message: `Event deleted successfully with id ${event_id}`
            };
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    // create a method with named updateAppointments(event_id,parent_user_id, request.payload);
    async updateAppointments(event_id, parent_user_id, payload) {
        try {
            let appointmentDetails = await DoctorsBookingSlot.query().where('event_id', event_id);
            if (appointmentDetails.length === 0) {
                return `No event found with id ${event_id}`;
            }
            else {

                if (payload.start_time !== undefined && payload.start_time !== null) {
                    appointmentDetails[0].start_time = payload.start_time;
                }
                if (payload.end_time !== undefined && payload.end_time !== null) {
                    appointmentDetails[0].end_time = payload.end_time;
                }
                if (payload.purpose !== undefined && payload.purpose !== null) {
                    appointmentDetails[0].purpose = payload.purpose;
                }

                if (payload.mode === 'online') {
                    appointmentDetails[0]['address'] = null;
                    appointmentDetails[0]['clinic_id'] = null;
                }
                if (payload.mode === 'home') {
                    if (payload.address === undefined || payload.address === null) {
                        throw new Error('Address is required for home appointment');
                    }
                    appointmentDetails[0]['address'] = payload.address;
                    appointmentDetails[0]['clinic_id'] = null;
                }
                if (payload.mode !== undefined && payload.mode !== null) {
                    appointmentDetails[0].mode = payload.mode;
                }
                if (payload.mode === 'in_clinic') {
                    if (payload.clinic_id === undefined || payload.clinic_id === null) {
                        throw new Error('Clinic id is required for in clinic appointment');
                    }
                    appointmentDetails[0]['address'] = null;
                    appointmentDetails[0]['clinic_id'] = payload.clinic_id;
                }

                if (appointmentDetails[0].start_time !== undefined && appointmentDetails[0].end_time !== undefined) {
                    if (!(appointmentDetails[0].start_time < appointmentDetails[0].end_time)) {
                        throw new Error('Start time should be less than end time');
                    }
                    appointmentDetails[0].appointments = [{ start_time: appointmentDetails[0].start_time, end_time: appointmentDetails[0].end_time }];

                    delete appointmentDetails[0].start_time;
                    delete appointmentDetails[0].end_time;

                    await this.deleteAppointments(event_id, parent_user_id);
                    // create new appointment
                    await this.scheduleAppointments(appointmentDetails[0]);
                }
            }
            return {
                statusCode: 200,
                message: `Event updated successfully with id ${event_id}`
            };
        }

        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
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
            const { dr_id, service_id } = service;
            const data = await DoctorsService.query().insert({ dr_id, service_id });
            return data;
        } catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async createDoctorSpecialization(specializations) {
        try {
            const { dr_id, specialization_id } = specializations;
            const data = await DoctorsSpecialization.query().insert({ dr_id, specialization_id });

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

    async getSpelizationServicesDegreeHospitalsDetails(data) {
        try {
            let finalData = [];
            for (let dr of data) {
                let clinicDetails = await DoctorsClinicIds.query().where('dr_id', dr.id);
                let clinicIds = clinicDetails.map((clinic) => clinic.clinic_id);

                let clinic = await DoctorsClinic.query().whereIn('id', clinicIds);
                let clinicImages = await DoctorsClinicImages.query().whereIn('clinic_id', clinicIds);

                // parse clinic images link from stringified array to actual array
                // for (let i = 0; i < clinicImages.length; i++) {
                //     clinicImages[i].clinic_images_link = JSON.parse(clinicImages[i].clinic_images_link);
                // }

                let services = await DoctorsService.query().where('dr_id', dr.id);
                let specialization = await DoctorsSpecialization.query().where('dr_id', dr.id);
                let degrees = await DoctorsDegree.query().where('dr_id', dr.id);
                let experiences = await DoctorsExperience.query().where('dr_id', dr.id);

                // put loop on serivicess then take service_id and get service name from servicesMasterAll
                for (let i = 0; i < services.length; i++) {
                    let service = await servicesMasterAll.query().where('id', services[i].service_id);
                    services[i]['service_name'] = service[0].services;
                }

                for (let i = 0; i < specialization.length; i++) {
                    let specializations = await specializationsMasterAll.query().where('id', specialization[i].specialization_id);
                    specialization[i]['specialization'] = specializations[0].specializations;
                }

                for (let i = 0; i < degrees.length; i++) {
                    let degree = await degreesMasterAll.query().where('id', degrees[i].degree_id);
                    let college = await collegeMasterAll.query().where('id', degrees[i].college_id);
                    degrees[i]['college_name'] = college[0].college_name;
                    degrees[i]['degree'] = degree[0].degrees;
                }

                for (let i = 0; i < experiences.length; i++) {
                    let hospital = await hospitalMasterAll.query().where('id', experiences[i].hospital_id);
                    experiences[i]['hospital_name'] = hospital[0].hospital_name;
                }

                finalData.push({ ...dr, clinic, clinicImages, services, degrees, specialization, experiences });
            }
            return finalData;
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async getDoctorByName(name, specialization, city) {
        try {

            // specilisation with city
            if (specialization !== undefined && specialization !== null && city !== undefined && city !== null) {
                let specializationId = await specializationsMasterAll.query().where('specializations', 'like', `%${specialization}%`);
                if (specializationId.length > 0) {
                    let checkSpecialization = await DoctorsSpecialization.query().where('specialization_id', specializationId[0].id);
                    if (checkSpecialization.length === 0) {
                        return `No Doctor found with specialization ${specialization}`;
                    }
                    let drIds = checkSpecialization.map((dr) => dr.dr_id);

                    const data = await Doctors.query()
                        .whereIn('id', drIds)
                        .andWhere('city', 'like', `%${city}%`)
                        .withGraphFetched('[ awards ]');
                    if (data.length === 0) {
                        return `No Doctor found with specialization ${specialization} and city ${city}`;
                    }
                    let modifiedData = await this.getSpelizationServicesDegreeHospitalsDetails(data);
                    return modifiedData;
                }
                else
                    return [];
            }

            // city and name
            else if (city !== undefined && city !== null && name !== undefined && name !== null) {
                const data = await Doctors.query()
                    .where('city', 'like', `%${city}%`)
                    .andWhere('name', 'like', `%${name}%`)
                    .withGraphFetched('[ awards ]');
                if (data.length === 0) {
                    return `No Doctor found with city ${city} and name ${name}`;
                }
                let modifiedData = await this.getSpelizationServicesDegreeHospitalsDetails(data);
                return modifiedData;
            }

            //specialization
            else if (specialization !== undefined && specialization !== null) {
                let specializationId = await specializationsMasterAll.query().where('specializations', 'like', `%${specialization}%`);
                if (specializationId.length === 0) {
                    return `No specialization found with name ${specialization}`;
                }
                let checkSpecialization = await DoctorsSpecialization.query().where('specialization_id', specializationId[0].id);
                if (checkSpecialization.length === 0) {
                    return `No Doctor found with specialization ${specialization}`;
                }

                let drIds = checkSpecialization.map((dr) => dr.dr_id);
                const data = await Doctors.query()
                    .whereIn('id', drIds)
                    .withGraphFetched('[ awards ]');
                if (data.length === 0) {
                    return `No Doctor found with specialization ${specialization}`;
                }
                let modifiedData = await this.getSpelizationServicesDegreeHospitalsDetails(data);
                return modifiedData;
            }

            //city
            else if (city !== undefined && city !== null) {
                const data = await Doctors.query()
                    .where('city', 'like', `%${city}%`)
                    .withGraphFetched('[ awards ]');
                if (data.length === 0) {
                    return `No Doctor found with city ${city}`;
                }
                let modifiedData = await this.getSpelizationServicesDegreeHospitalsDetails(data);
                return modifiedData;
            }

            //name
            else if (name !== undefined && name !== null) {
                const data = await Doctors.query().where('name', 'like', `%${name}%`).withGraphFetched('[ awards ]');
                if (data.length === 0) {
                    return `No Doctor found with name ${name}`;
                }
                let modifiedData = await this.getSpelizationServicesDegreeHospitalsDetails(data);
                return modifiedData;
            }

            // all
            else {
                const data = await Doctors.query().withGraphFetched('[ awards ]');
                if (data.length === 0) {
                    return [];
                }
                let modifiedData = await this.getSpelizationServicesDegreeHospitalsDetails(data);
                return modifiedData;
            }

        } catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }

    async getDoctorById(id, key) {
        try {
            const data = await Doctors.query().where('id', id).withGraphFetched('[ awards]');
            if (data.length === 0) {
                return [];
            }

            let clinicDetails = await DoctorsClinicIds.query().where('dr_id', id);
            let clinicIds = clinicDetails.map((clinic) => clinic.clinic_id);

            let clinic = await DoctorsClinic.query().whereIn('id', clinicIds);
            let clinicImages = await DoctorsClinicImages.query().whereIn('clinic_id', clinicIds);

            // for (let i = 0; i < clinicImages.length; i++) {
            //     clinicImages[i].clinic_images_link = JSON.parse(clinicImages[i].clinic_images_link);
            //     clinicImages[i].clinicImagesLength = clinicImages[i].clinic_images_link.length;
            // }

            let services = await DoctorsService.query().where('dr_id', id);
            let specialization = await DoctorsSpecialization.query().where('dr_id', id);
            let degrees = await DoctorsDegree.query().where('dr_id', id);
            let experiences = await DoctorsExperience.query().where('dr_id', id);

            // put loop on serivicess then take service_id and get service name from servicesMasterAll
            for (let i = 0; i < services.length; i++) {
                let service = await servicesMasterAll.query().where('id', services[i].service_id);
                services[i]['service_name'] = service[0].services;
            }

            for (let i = 0; i < specialization.length; i++) {
                let specializations = await specializationsMasterAll.query().where('id', specialization[i].specialization_id);
                specialization[i]['specialization'] = specializations[0].specializations;
            }

            for (let i = 0; i < degrees.length; i++) {
                let degree = await degreesMasterAll.query().where('id', degrees[i].degree_id);
                let college = await collegeMasterAll.query().where('id', degrees[i].college_id);
                degrees[i]['college_name'] = college[0].college_name;
                degrees[i]['degree'] = degree[0].degrees;
            }

            for (let i = 0; i < experiences.length; i++) {
                let hospital = await hospitalMasterAll.query().where('id', experiences[i].hospital_id);
                experiences[i]['hospital_name'] = hospital[0].hospital_name;
            }


            // get only today date.
            let today = new Date();
            today = today.toISOString().split('T')[0];
            if (key === 'today') {
                let bookingSlots = await DoctorsBookingSlot.query().where('dr_id', id).andWhere('booking_date', today);
                if (bookingSlots.length === 0) {
                    data[0] = { ...data[0], services, specialization, degrees, experiences, clinic, clinicImages, bookingSlots };
                    return data;
                } else {
                    for (let i = 0; i < bookingSlots.length; i++) {
                        let user = await User.query().where('id', bookingSlots[i].parent_user_id);
                        bookingSlots[i]['patient_name'] = user[0].name;
                    }
                    data[0] = { ...data[0], services, specialization, degrees, experiences, clinic, clinicImages, bookingSlots };
                    return data;
                }

            } else if (key === 'upcoming') {
                let bookingSlots = await DoctorsBookingSlot.query().where('dr_id', id).andWhere('booking_date', '>', today);
                if (bookingSlots.length === 0) {
                    data[0] = { ...data[0], services, specialization, degrees, experiences, clinic, clinicImages, bookingSlots };
                    return data;
                } else {
                    for (let i = 0; i < bookingSlots.length; i++) {
                        let user = await User.query().where('id', bookingSlots[i].parent_user_id);
                        bookingSlots[i]['patient_name'] = user[0].name;
                    }
                    data[0] = { ...data[0], services, specialization, degrees, experiences, clinic, clinicImages, bookingSlots };
                    return data;
                }
            }
        }
        catch (error) {
            console.log(error, 'errror')
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

    // create a func with name applyLeave(leaveDetails)
    async applyLeave(leaveDetails) {
        try {
            let checkDoctor = await Doctors.query().where('id', leaveDetails.dr_id);
            if (checkDoctor.length === 0) {
                return `No Doctor found with id ${leaveDetails.dr_id}`;
            }

            let checkLeave = await DoctorsLeave.query().where('dr_id', leaveDetails.dr_id).andWhere('leave', leaveDetails.leave);
            if (checkLeave.length > 0) {
                return `Leave already applied for this date ${leaveDetails.leave}`;
            }

            await DoctorsLeave.query().insert(leaveDetails);
            return [{
                statusCode: 200,
                message: 'Leave applied successfully'
            }];
        }
        catch (error) {
            logger.error(JSON.stringify(error));
            return error;
        }
    }


    // // create a method with name and details updateDoctorById( dr_id, degree_id, college_id, specialization_id, service_id, consultation_fee, booking_fee);
    // async updateDoctorById( dr_id, degree_id, college_id, specialization_id, service_id, consultation_fee, booking_fee) {
    //     try {
    //         let degreeDetails = await degreesMasterAll.query().where('id', degree_id);
    //         let collegeDetails = await collegeMasterAll.query().where('id', college_id);
    //         let specializationDetails = await specializationsMasterAll.query().where('id', specialization_id);
    //         let serviceDetails = await servicesMasterAll.query().where('id', service_id);

    //         if (degreeDetails.length === 0) {
    //             return `No Degree found with id ${degree_id}`;
    //         }
    //         if (collegeDetails.length === 0) {
    //             return `No College found with id ${college_id}`;
    //         }
    //         if (specializationDetails.length === 0) {
    //             return `No Specialization found with id ${specialization_id}`;
    //         }
    //         if (serviceDetails.length === 0) {
    //             return `No Service found with id ${service_id}`;
    //         }

    //         let start_date = new Date().toISOString().split('T')[0];
    //         let end_date = new Date().toISOString().split('T')[0];

    //         await DoctorsDegree.query().insert({ dr_id, degree_id, college_id, start_date, end_date });
    //         await DoctorsSpecialization.query().insert({ dr_id, specialization_id });
    //         await DoctorsService.query().insert({ dr_id, service_id, consultation_fee, booking_fee });

    //         return {
    //             statusCode: 200,
    //             message: 'Doctor details updated successfully'
    //         };
    //     }
    //     catch (error) {
    //         logger.error(JSON.stringify(error));
    //         return error;
    //     }
    // }


    async getDoctorsDetails() {
        try {
            const data = await Doctors.query().withGraphFetched('[ awards ]');
            if (data.length === 0) {
                return [];
            }

            let modifiedData = await this.getSpelizationServicesDegreeHospitalsDetails(data);
            return modifiedData;
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

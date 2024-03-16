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


module.exports = class DoctorsServices extends Model {

    // -------------------DOCTORS SERVICES-----------------------------------------------------
    async createDoctors(doctorDetails) {
        try {
            let checkdoctor = await Doctors.query().where('name', doctorDetails.name);
            if (checkdoctor.length > 0) {
                return `Doctor already exists with this ${doctorDetails.name}. Please try with another name`
            }
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

    async bookingSlots(bookingDetails) {
        try {
            let checkDoctor = await Doctors.query().where('id', bookingDetails.dr_id);
            if (checkDoctor.length === 0) {
                return `No Doctor found with id ${bookingDetails.dr_id}`;
            }

            let checkUser = await User.query().where('id', bookingDetails.parent_user_id);
            if (checkUser.length === 0) {
                return `No Parent found with id ${bookingDetails.parent_user_id}`;
            }

            let checkChild = await Child.query().where('id', bookingDetails.child_id);
            if (checkChild.length === 0) {
                return `No Child found with id ${bookingDetails.child_id}`;
            }

            let checkRelation = await Child.query().where('id', bookingDetails.child_id).andWhere('user_id', bookingDetails.parent_user_id);
            if (checkRelation.length === 0) {
                return `No relation found between parent and child with id ${bookingDetails.parent_user_id} and ${bookingDetails.child_id}`;
            }

            const data = await DoctorsBookingSlot.query().insert(bookingDetails);
            return data;
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
            const data = await DoctorsBookingSlot.query().where('parent_user_id', parent_user_id).andWhere('appointment_date', '>=', today);
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

            await Doctors.query().patchAndFetchById(ratingDetails.dr_id, { rating: avgRating });

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
}

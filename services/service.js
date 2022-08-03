const { Model } = require('objection')
const UserModel = require('../models/user')

module.exports = class Demo_services extends Model {

    // Create Data
    createDataFun = async (req, h) => {
        // console.log(req.payload);            
        const { name, email, password } = req.payload;

        try {
            await UserModel.query().insert({
                name,
                email,
                password
            })
            return h.response('User signup succefully');
        } catch (error) {
            // console.log(error)
            return h.response('Duplicate error are not allowed');
        }
    }


    // Read data by ID
    ReadData = async (req, h) => {
        try {
            const data = await UserModel.query()
                .select("*").from('hapi')
                .where('id', req.params.id);
            return h.response(data)
        } catch (error) {
            return h.response('data  is not present')
        }
    }

    // Update data by ID
    UpdateData = async (req, h) => {
        const { name, email, password } = req.payload;
        try {
            const data = await UserModel.query()
                .select('*').from('hapi')
                .where('id', req.params.id).update({
                    name,
                    email,
                    password
                })
                return h.response('Data is UPDATED')
        } catch (error) {
            return h.response('Data is NOT Updated')
        }
    }


    // DELETE DATA BY ID
    DeleteData = async (req, h ) => {
        try {
            const data = await UserModel.query()
            .select('*').from('hapi')
            .where('id', req.params.id).delete();
            return h.response('Your data is DELETED')
        } catch (error) {
            return h.response("data is NOT DELETED")
        }
    }
}

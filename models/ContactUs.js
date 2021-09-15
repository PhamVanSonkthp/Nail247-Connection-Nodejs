const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    contact_us: {
        ...helper.schemaString,
    },
    terms_of_use: {
        ...helper.schemaString,
    },
    privacy_policy: {
        ...helper.schemaString,
    },
    phone_support: {
        ...helper.schemaString,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('ContactUs', object);
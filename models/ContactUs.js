const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    contact_us: {
        type: String,
        maxLength: 10000000,
    },
    terms_of_use: {
        type: String,
        maxLength: 10000000,
    },
    privacy_policy: {
        type: String,
        maxLength: 10000000,
    },
    phone_support: {
        type: String,
        maxLength: 10000000,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('ContactUs', object);
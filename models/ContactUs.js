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
    title_email_remind: {
        type: String,
        maxLength: 10000000,
    },
    content_email_remind: {
        type: String,
        maxLength: 10000000,
    },
    keyword: {
        type: String,
        maxLength: 10000000,
    },
    description: {
        type: String,
        maxLength: 10000000,
    },
    promotion: {
        type: String,
        maxLength: 10000000,
    },
    option_header: {
        type: String,
        maxLength: 10000000,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('ContactUs', object);
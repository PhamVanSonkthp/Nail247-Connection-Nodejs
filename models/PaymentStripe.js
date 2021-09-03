const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    name: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    public_key: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    secret_key: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('PaymentStripe', object);
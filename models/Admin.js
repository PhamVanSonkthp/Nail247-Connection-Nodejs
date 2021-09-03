const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    name: {
        ...helper.schemaString,
    },
    phone: {
        ...helper.schemaString,
        ...helper.schemaRequired,
        ...helper.schemaUnique,
    },
    password: {
        ...helper.schemaString,
        ...helper.schemaRequired,
        minlength: 1,
    },
    permission: {
        ...helper.schemaNumber,
        ...helper.schemaRequired,
        default: 0,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('Admin', object);
const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    name: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    content: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    status: {
        ...helper.schemaNumber,
        ...helper.schemaRequired,
        min:0,
        max:1,
    },
    options: {
        ...helper.schemaJson,
        ...helper.schemaRequired,
    },
    type: {
        ...helper.schemaNumber,
        ...helper.schemaRequired,
        min:0,
        max:2,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('OptionsPosts', object);
const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    name: {
        ...helper.schemaString,
    },
    status: {
        ...helper.schemaNumber,
        ...helper.schemaRequired,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('Traffic', object);
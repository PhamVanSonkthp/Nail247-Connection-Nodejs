const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    welcome: {
        ...helper.schemaString,
    },
    name: {
        ...helper.schemaString,
    },
    title: {
        ...helper.schemaString,
    },
    contents: {
        ...helper.schemaJson,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('Welcome', object);
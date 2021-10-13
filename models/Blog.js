const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    title: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    image_title: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    content: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    tag: {
        ...helper.schemaJson,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('Blog', object);
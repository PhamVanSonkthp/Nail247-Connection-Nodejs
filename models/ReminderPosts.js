const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    id_post: {
        ...helper.schemaString,
        ...helper.schemaRequired,
        ...helper.schemaUnique,
    }
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('ReminderPosts', object);
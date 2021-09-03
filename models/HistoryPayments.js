const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    cost: {
        ...helper.schemaNumber,
        ...helper.schemaRequired,
    },
    id_post: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    type: {
        ...helper.schemaNumber,
        ...helper.schemaRequired,
    },
    package: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    id_agency: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });

module.exports = mongoose.model('HistoryPayments', object);
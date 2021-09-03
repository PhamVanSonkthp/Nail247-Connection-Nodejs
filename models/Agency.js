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
    email: {
        ...helper.schemaString,
    },
    password: {
        ...helper.schemaString,
        ...helper.schemaRequired,
        minlength: 4,
    },
    location:{
        type: { 
            type: String,
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            default: [0,0],
        },
    },
    code: {
        ...helper.schemaNumber,
    },
    country: {
        ...helper.schemaString,
    },
    city: {
        ...helper.schemaString,
    },
    state: {
        ...helper.schemaString,
    },
    link_slug: {
        ...helper.schemaString,
    },
    status : {
        ...helper.schemaNumber,
        default:1,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });
object.index({location: '2dsphere' });

module.exports = mongoose.model('Agency', object);
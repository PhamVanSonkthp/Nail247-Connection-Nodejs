const mongoose = require('mongoose');
const helper = require('../helper/helper');

const object = mongoose.Schema({
    name_salon: {
        ...helper.schemaString,
    },
    address_salon: {
        ...helper.schemaString,
    },
    phone: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    country: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    city: {
        ...helper.schemaString,
    },
    state: {
        ...helper.schemaString,
    },
    code: {
        ...helper.schemaNumber,
        ...helper.schemaRequired,
    },
    location:{
        type: { 
            type: String,
            ...helper.schemaRequired,
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            ...helper.schemaRequired,
            default: [0,0],
        },
    },
    title: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    content: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    email: {
        ...helper.schemaString,
    },
    link_slug: {
        ...helper.schemaString,
        ...helper.schemaRequired,
        ...helper.schemaUnique,
    },
    price: {
        ...helper.schemaNumber,
        ...helper.schemaRequired,
    },
    options: {
        ...helper.schemaJson,
    },
    images: {
        ...helper.schemaJson,
    },
    status: {
        ...helper.schemaNumber,
        default:1,
    },
    package: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
    months_provider: {
        ...helper.schemaNumber,
        ...helper.schemaRequired,
        default: 1,
    },
    expiration_date: {
        ...helper.schemaDatetime,
        ...helper.schemaRequired,
    },
    id_agency: {
        ...helper.schemaString,
        ...helper.schemaRequired,
    },
}, { timestamps: true });

object.set('toObject', { getters: true, setters: true });
object.set('toJSON', { getters: true, setters: true });
object.index({location: '2dsphere' });

module.exports = mongoose.model('NailSupply', object);
const encryptpwd = require('encrypt-with-password')
const { FormatMoney } = require('format-money-js')
const sanitize = require('mongo-sanitize')
const isDebug = true;

const maxNumber = 10000000000;
const minNumber = -10000000000;
const maxLength = 10000;

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

exports.getDistanceFromLatLonInKm = function (lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d.toFixed(2) + ' km';
}

exports.isDefine = function (val) {
    try {
        if (val == undefined) return false;
        if (val == null) return false;
        return true;
    } catch (err) {
        return false;
    }
}

exports.isNumber = function (val) {
    return !isNaN(val)
}

exports.contains = function (input, val) {
    if (exports.isDefine(input) && exports.isDefine(val)) {
        for (let i = 0; i < val.length; i++) {
            if (!input.toUpperCase().includes(val[i].toUpperCase())) return false
        }
        return true
    } else {
        return false
    }
}

exports.saveTraffics = function (name, status) {
    const trafficsModel = require('../models/Traffic');
    const object = new trafficsModel({
        name: 'name',
        status: status,
    });
    try {
        object.save();
    } catch (err) {
        helper.throwError(err)
    }
}

function empty(val) {

    // test results
    //---------------
    // []        true, empty array
    // {}        true, empty object
    // null      true
    // undefined true
    // ""        true, empty string
    // ''        true, empty string
    // 0         false, number
    // true      false, boolean
    // false     false, boolean
    // Date      false
    // function  false

    if (val === undefined)
        return true;

    if (typeof (val) == 'function' || typeof (val) == 'number' || typeof (val) == 'boolean' || Object.prototype.toString.call(val) === '[object Date]')
        return false;

    if (val == null || val.length === 0)        // null or 0 length array
        return true;

    if (typeof (val) == "object") {
        // empty object

        var r = true;

        for (var f in val)
            r = false;

        return r;
    }

    return false;
}

exports.stringToSlug = function (str) {
    // remove accents
    if (empty(str)) return null;
    var from = "àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ",
        to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy";
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(RegExp(from[i], "gi"), to[i]);
    }

    str = str.toLowerCase()
        .trim()
        .replace(/[^a-z0-9\-]/g, '-')
        .replace(/-+/g, '-');

    return str;
}

exports.tryParseInt = function (str) {
    try {
        if (!exports.isDefine(str)) return 0
        return parseInt(str.toString().replaceAll(',', '')) || 0;
    } catch (e) {
        return 0;
    }
}

exports.tryParseFloat = function (str) {
    try {
        if (!exports.isDefine(str)) return 0
        return parseFloat(str.toString().replaceAll(',', '')) || 0;
    } catch (e) {
        return 0;
    }
}

exports.tryParseJson = function (str) {
    try {
        return JSON.parse(str.toString())
    } catch (e) {
        return null;
    }
}

exports.getDate = function () {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();

    return yyyy + '-' + mm + '-' + dd;
}


exports.encrypt = function (str) {
    const password = 'shopinfinity';
    return encryptpwd.encrypt(str, password);
}

exports.decrypt = function (str) {
    const password = 'shopinfinity';
    return encryptpwd.decrypt(str, password);
}

exports.checkLogin = async function (_id, password, permission) {

    const ObjectModel = require('../models/Admin')
    try {
        let query = { _id: sanitize(_id), password: sanitize(exports.decrypt(password)) };

        const object = await ObjectModel.findOne(query)
        if (exports.isDefine(permission)) {
            return object.permission == 0
        }

        return object != null
    } catch (e) {
        exports.throwError(e)
        return false;
    }
}

exports.checkLoginAgency = async function (_id, password) {
    const ObjectModel = require('../models/Agency');
    try {
        let query = { _id: sanitize(_id), password: sanitize(exports.decrypt(password)) };

        const object = await ObjectModel.findOne(query);
        return object != null;
    } catch (e) {
        return false;
    }
}

exports.throwError = function (error) {
    if (error && isDebug) {
        console.error(error);
    }
}

fm = new FormatMoney({
    amount: 2
})

function setNumber(num) {
    return exports.tryParseInt(num);
}

function capitalizeFirstLetter(string) {
    if (exports.isDefine(string)) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    } else {
        return null
    }
}

function isArray(val) {
    try {
        return Array.isArray(val)
    } catch (e) {
        exports.throwError(e)
        return false;
    }

}

function isJsonString(str) {
    try {
        JSON.parse(str)
    } catch (e) {
        return false;
    }
    return true;
}

function setJson(json) {
    if (isArray(json)) return json

    if (isJsonString(json)) {
        return exports.tryParseJson(json)
    } else {
        return null
    }
}

function getNumber(num) {
    //return fm.from(num, true);
    return num;
}

exports.schemaNumber = {
    type: Number,
    default: 0,
    trim: true,
    min: minNumber,
    max: maxNumber,
    set: setNumber,
    get: getNumber,
}

exports.schemaString = {
    type: String,
    trim: true,
    default: null,
    maxLength: maxLength,
}

exports.schemaCapitalizeFirstLetter = {
    set: capitalizeFirstLetter,
}

exports.schemaDatetime = {
    type: Date,
    trim: true,
    default: Date.now,
    maxLength: maxLength,
}

exports.schemaUnique = {
    unique: true,
    dropDups: true,
}

exports.schemaPoint = {
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true
    },
}

exports.schemaRequired = {
    required: true,
}

exports.schemaJson = {
    type: JSON,
    trim: true,
    default: null,
    maxLength: 10000,
    set: setJson,
}

exports.schemaAutoIndex = {
    autoIndex: true,
    required: true,
}

exports.schemaNumberSale = {
    type: Number,
    trim: true,
    default: 0,
    min: 0,
    max: 100,
}
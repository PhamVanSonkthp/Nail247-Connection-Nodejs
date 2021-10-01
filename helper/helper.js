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
        exports.throwError(err)
    }
}

exports.optsValidatorFindAndUpdate = {
    runValidators: true,
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
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

exports.formatZipCode = function (code) {
    code = code.toString()
    if (code.length < 5) {
        return exports.formatZipCode('0' + code)
    }
    return code
}

exports.optsValidator = {
    runValidators: true,
    new: true,
}

exports.getOnlyNumber = function (str) {
    var num = str.replace(/[^0-9]/g, '');
    return num
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

// start get files country

exports.codeCountrys = []
exports.fs = require('fs')

exports.fs.readFile('./helper/country.csv', function (err, data) {
    if (err) {
        throw err;
    }
    exports.successFunction(data.toString())
});

exports.successFunction = function (data) {
    var allRows = data.split(/\r?\n|\r/);
    for (var singleRow = 0; singleRow < allRows.length; singleRow++) {
        if (singleRow === 0) {
            continue
        }
        var rowCells = allRows[singleRow].replaceAll('\"', '').replaceAll('}', '').replaceAll('{', '').split(',')
        exports.codeCountrys.push(rowCells)
    }
}

exports.getStateByCode = function (code) {
    for (let i = 0; i < exports.codeCountrys.length; i++) {
        if (exports.tryParseInt(code) == exports.tryParseInt(exports.codeCountrys[i][0])) {
            return exports.codeCountrys[i][4]
        }
    }
    return null
}

// end get files country

exports.paymentPostJob = async function (req, res) {
    const helpers = require('helpers')
    const multer = require('multer')
    const path = require('path')
    const sharp = require('sharp')

    let pathStorage

    if (exports.tryParseJson(req.headers.stripe).type_post == '0') {
        pathStorage = 'public/images-jobs/'
    } else if (exports.tryParseJson(req.headers.stripe).type_post == '1') {
        pathStorage = 'public/images-sells-salons/'
    } else if (exports.tryParseJson(req.headers.stripe).type_post == '2') {
        pathStorage = 'public/images-nail-supplies/'
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, pathStorage);
        },
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    });

    let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).array('avatar', 100);
    upload(req, res, function (err) {
        (async () => {
            let ObjectModel;

            if (exports.tryParseJson(req.headers.stripe).type_post == '0') {
                ObjectModel = require('../models/Job')
            } else if (exports.tryParseJson(req.headers.stripe).type_post == '1') {
                ObjectModel = require('../models/SellSalon')
            } else if (exports.tryParseJson(req.headers.stripe).type_post == '2') {
                ObjectModel = require('../models/NailSupply')
            }

            if (exports.tryParseJson(req.headers.stripe).is_repost) {
                try {
                    if (exports.tryParseJson(req.headers.stripe).cost_post_job && exports.tryParseJson(req.headers.stripe).cost_post_job > 0) {
                        const HistoryPaymentObject = require('../models/HistoryPayments')
                        const objectHistoryPayment = new HistoryPaymentObject({
                            cost: exports.tryParseJson(req.headers.stripe).cost_post_job,
                            id_post: exports.tryParseJson(req.headers.stripe).id_post,
                            type: exports.tryParseJson(req.headers.stripe).type_post,
                            package: exports.tryParseJson(req.headers.stripe).package_post_job,
                            id_agency: exports.tryParseJson(req.headers.stripe).id_agency,
                        })
                        await objectHistoryPayment.save()
                    }
                    let objForUpdate = {}
                    if (exports.isDefine(exports.tryParseJson(req.headers.stripe).package_post_job)) objForUpdate.package = exports.tryParseJson(req.headers.stripe).package_post_job
                    if (exports.isDefine(exports.tryParseJson(req.headers.stripe).months_provider_post_job)) objForUpdate.months_provider = exports.tryParseJson(req.headers.stripe).months_provider_post_job
                    //if (exports.isDefine(exports.tryParseJson(req.headers.stripe).months_provider_post_job)) objForUpdate.expiration_date = Date.now() + exports.tryParseInt(exports.tryParseJson(req.headers.stripe).months_provider_post_job) * 30 * 24 * 60 * 60 * 1000
                    if (exports.isDefine(exports.tryParseJson(req.headers.stripe).months_provider_post_job)) objForUpdate.expiration_date = Date.now() + exports.tryParseInt(exports.tryParseJson(req.headers.stripe).months_provider_post_job) * 60 * 1000
    
                    objForUpdate = { $set: objForUpdate }
    
                    await ObjectModel.updateOne(
                        { _id: exports.tryParseJson(req.headers.stripe).id_post }, objForUpdate, exports.optsValidator
                    )
    
                    return res.redirect("/agency/posts?sort=" + (exports.tryParseJson(req.headers.stripe).type_post + 1))

                } catch (err) {
                    exports.throwError(err)
                    return res.status(500)
                }
            }

            const index = await ObjectModel.countDocuments()

            let location = {
                "type": "Point",
                "coordinates": [
                    0,
                    0,
                ]
            }

            let modelSave = {
                name_salon: req.body.name_salon,
                address_salon: req.body.address_salon,
                phone: req.body.phone,
                country: req.body.country,
                city: req.body.city,
                state: req.body.state,
                code: req.body.code,
                location: location,
                title: req.body.title,
                content: req.body.content,
                email: req.body.email,
                link_slug: exports.stringToSlug(req.body.title) + '-' + index,
                cost: req.body.cost,
                options: exports.tryParseJson(req.body.options),
                status: req.body.status,
                months_provider: req.body.months_provider,
                images: [],
                package: req.body.package,
                id_agency: req.body.id_agency,
                //expiration_date: Date.now() + exports.tryParseInt(req.body.months_provider) * 30 * 24 * 60 * 60 * 1000,
                expiration_date: Date.now() + exports.tryParseInt(req.body.months_provider) * 60 * 1000,
            }

            if (exports.tryParseJson(req.headers.stripe).type_post == '0') {
                modelSave = {
                    ...modelSave,
                    cost: req.body.cost
                }
            } else if (exports.tryParseJson(req.headers.stripe).type_post == '1') {
                modelSave = {
                    ...modelSave,
                    price: req.body.cost
                }
            } else if (exports.tryParseJson(req.headers.stripe).type_post == '2') {
                modelSave = {
                    ...modelSave,
                    price: req.body.cost
                }
            }

            const object = new ObjectModel(modelSave)

            try {
                const savedObject = await object.save()

                const ReminderPostModel = require('../models/ReminderPosts')

                const query = {
                    id_post: savedObject._id,
                }
    
                await ReminderPostModel.findOneAndUpdate(query, query, helper.optsValidatorFindAndUpdate)

                try {
                    if (exports.isDefine(req.body.cost_package) && req.body.cost_package > 0) {
                        const HistoryPaymentObject = require('../models/HistoryPayments')
                        const objectHistoryPayment = new HistoryPaymentObject({
                            cost: req.body.cost_package,
                            id_post: savedObject._id,
                            type: exports.tryParseJson(req.headers.stripe).type_post,
                            package: req.body.package,
                            id_agency: req.body.id_agency,
                        })
                        await objectHistoryPayment.save()
                    }

                } catch (err) {
                    exports.throwError(err)
                }

                if (req.fileValidationError) {
                    return res.json({ message: 'Successfully purchased items' })
                } else {
                    const files = req.files;

                    if (!exports.isDefine(files) || files.length <= 0) {
                        return res.json({ message: 'Successfully purchased items' })
                    }
                    // start upload images
                    let arr = [];
                    for (let index = 0; exports.isDefine(files) && index < files.length; index++) {
                        sharp(files[index].path).resize(250, 250).withMetadata().toFile(pathStorage + 'icon-' + files[index].filename.split('.')[0] + '.jpg' )
                        sharp(files[index].path).resize({ width: 1000 }).withMetadata().toFile(pathStorage + files[index].filename.split('.')[0] + '.jpg' )
                        arr.push( files[index].filename.split('.')[0] + '.jpg' )
                    }
                    // end upload images
                    for (let i = 0; i < arr.length; i++) {
                        await ObjectModel.updateOne(
                            { _id: savedObject._id },
                            {
                                $push: { images: arr[i] },
                            }
                        )

                        savedObject.images.push(arr[i])
                    }
                    return res.json({ message: 'Successfully purchased items' })
                }
            } catch (e) {
                exports.throwError(e)
                res.status(500).end()
            }
        })();
    });
};
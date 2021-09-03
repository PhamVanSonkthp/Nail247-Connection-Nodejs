const express = require('express');
const router = express.Router();
const ObjectModel = require('../models/SellSalon');
const helper = require('../helper/helper');

router.post('/', async (req, res) => {
    return await uploadImage(req , res)
})

async function uploadImage(req, res, isWeb) {
    const helpers = require('helpers')
    const multer = require('multer')
    const path = require('path')
    const sharp = require('sharp')

    const pathStorage = 'public/images-sells-salons/'

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

            let result = {}

            let location = {
                "type": "Point",
                "coordinates": [
                    0,
                    0,
                ]
            }

            if (helper.isDefine(req.body.location)) {
                location = {
                    "type": "Point",
                    "coordinates": [
                        helper.tryParseFloat(req.body.location.toString().replaceAll('{', '').replaceAll('}', '').split(',')[0]),
                        helper.tryParseFloat(req.body.location.toString().replaceAll('{', '').replaceAll('}', '').split(',')[1]),
                    ]
                }
            }

            const index = await ObjectModel.countDocuments()
            result.name_salon = req.body.name_salon
            result.address_salon = req.body.address_salon
            result.phone = req.body.phone
            result.country = req.body.country
            result.city = req.body.city
            result.state = req.body.state
            result.code = req.body.code
            result.location = req.body.location
            result.title = req.body.title
            result.content = req.body.content
            result.email = req.body.email
            result.link_slug = helper.stringToSlug(req.body.title) + '-' + index
            result.price = helper.isDefine(req.body.cost) ? req.body.cost : req.body.price
            result.options = req.body.options
            result.status = req.body.status
            result.months_provider = req.body.months_provider
            result.package = req.body.package
            result.id_agency = req.body.id_agency
            result.expiration_date = Date.now() + helper.tryParseInt(req.body.months_provider) * 30 * 24 * 60 * 60 * 1000

            const object = new ObjectModel({
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
                link_slug: helper.stringToSlug(req.body.title) + '-' + index,
                price: helper.isDefine(req.body.cost) ? req.body.cost : req.body.price,
                options: helper.tryParseJson(req.body.options),
                status: req.body.status,
                months_provider: req.body.months_provider,
                images: [],
                package: req.body.package,
                id_agency: req.body.id_agency,
                expiration_date: Date.now() + helper.tryParseInt(req.body.months_provider) * 30 * 24 * 60 * 60 * 1000,
            })

            try {
                const savedObject = await object.save()

                try {
                    if (helper.isDefine(req.body.cost_package) && req.body.cost_package > 0) {
                        const HistoryPaymentObject = require('../models/HistoryPayments');
                        const objectHistoryPayment = new HistoryPaymentObject({
                            cost: req.body.cost_package,
                            id_post: savedObject._id,
                            type: 1,
                            package: req.body.package,
                            id_agency: req.body.id_agency,
                        })
                        await objectHistoryPayment.save()
                    }
                } catch (err) {
                    helper.throwError(err)
                }
                if (req.fileValidationError) {
                    if (isWeb) {
                        return res.redirect("/agency/posts?sort=2")
                    } else {
                        return res.json(savedObject)
                    }
                } else {
                    const files = req.files;

                    if (!helper.isDefine(files) || files.length <= 0) {
                        if (isWeb) {
                            return res.redirect("/agency/posts?sort=2")
                        } else {
                            return res.json(savedObject)
                        }
                    }
                    // start upload images
                    let arr = [];
                    for (let index = 0; helper.isDefine(files) && index < files.length; index++) {
                        sharp(files[index].path).resize(250, 250).toFile(pathStorage + 'icon-' + files[index].filename);
                        arr.push(files[index].filename);
                    }
                    // end upload images
                    try {
                        for (let i = 0; i < arr.length; i++) {
                            await ObjectModel.updateOne(
                                { _id: savedObject._id },
                                {
                                    $push: { images: arr[i] },
                                }
                            );
                            savedObject.images.push(arr[i])
                        }

                        if (isWeb) {
                            return res.redirect("/agency/posts?sort=2")
                        } else {
                            res.json(savedObject);
                        }
                    } catch (err) {
                        if (isWeb) {
                            return res.redirect("/agency/posts?sort=2")
                        } else {
                            return res.json(savedObject);
                        }
                    }
                }
            } catch (e) {
                helper.throwError(e)
                if (isWeb) {
                    return res.redirect("/agency/posts?sort=2")
                } else {
                    return res.status(400).json(e)
                }
            }

        })();

    });
};

router.put('/:objectId', async (req, res) => {
    try {
        let objForUpdate = {};
        if (helper.isDefine(req.body.name_salon)) objForUpdate.name_salon = req.body.name_salon
        if (helper.isDefine(req.body.address_salon)) objForUpdate.address_salon = req.body.address_salon;
        if (helper.isDefine(req.body.phone)) objForUpdate.phone = req.body.phone;
        if (helper.isDefine(req.body.country)) objForUpdate.country = req.body.country;
        if (helper.isDefine(req.body.city)) objForUpdate.city = req.body.city;
        if (helper.isDefine(req.body.state)) objForUpdate.state = req.body.state;
        if (helper.isDefine(req.body.code)) objForUpdate.code = req.body.code;
        if (helper.isDefine(req.body.location)) objForUpdate.location = helper.tryParseJson(helper.isDefine(req.body.location));
        if (helper.isDefine(req.body.title)) objForUpdate.title = req.body.title;
        if (helper.isDefine(req.body.content)) objForUpdate.content = req.body.content;
        if (helper.isDefine(req.body.email)) objForUpdate.email = req.body.email;
        if (helper.isDefine(req.body.price)) objForUpdate.price = req.body.price;
        if (helper.isDefine(req.body.options)) objForUpdate.options = helper.tryParseJson(helper.isDefine(req.body.options));
        if (helper.isDefine(req.body.images)) objForUpdate.images = helper.tryParseJson(helper.isDefine(req.body.images));
        if (helper.isDefine(req.body.status)) objForUpdate.status = req.body.status;
        if (helper.isDefine(req.body.package)) objForUpdate.package = req.body.package;
        if (helper.isDefine(req.body.months_provider)) objForUpdate.months_provider = req.body.months_provider;
        if (helper.isDefine(req.body.expiration_date)) objForUpdate.expiration_date = req.body.expiration_date;

        objForUpdate = { $set: objForUpdate }

        const object = await ObjectModel.updateOne(
            { _id: req.params.objectId }, objForUpdate
        );
        return res.json(object);
    } catch (err) {
        return res.status(400).json(err);
    }
});

router.delete('/:objectId', async (req, res) => {
    try {
        const object = await ObjectModel.deleteOne({ _id: req.params.objectId });
        return res.json(object);
    } catch (err) {
        return res.status(400).json(err);
    }
});

router.get('/featured', async (req, res) => {
    try {
        const limit = 10;
        const page = 0;
        const latitude = req.query.latitude;
        const longitude = req.query.longitude;

        let query = { expiration_date: { $gte: new Date() }, package: 'Gold', status: 1 }

        if (helper.isDefine(latitude) && helper.isDefine(longitude) && helper.isNumber(latitude) && helper.isNumber(longitude)) {
            query = {
                ...query,
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [latitude, longitude],
                        },
                        $minDistance: 0,
                    }
                }
            }
        }

        const result = await ObjectModel.find(query).limit(limit).skip(page);

        if (helper.isDefine(latitude) && helper.isDefine(longitude) && helper.isNumber(latitude) && helper.isNumber(longitude)) {
            for (let i = 0; i < result.length; i++) {
                result[i] = {
                    ...result[i]._doc,
                    distance: helper.getDistanceFromLatLonInKm(result[i].location.coordinates[0], result[i].location.coordinates[1], latitude, longitude)
                }
            }
        } else {
            for (let i = 0; i < result.length; i++) {
                result[i] = {
                    ...result[i]._doc,
                    distance: 'Unknown'
                }
            }
        }

        return res.json(result);
    } catch (err) {
        helper.throwError(err)
        return res.status(400).json(err);
    }
});

router.get('/', async (req, res) => {
    try {
        const limit = helper.tryParseInt(req.query.limit) || 25;
        const page = helper.tryParseInt(req.query.page) || 0;
        const latitude = req.query.latitude;
        const longitude = req.query.longitude;
        const code = req.query.code;
        const price = req.query.price;

        let query = { expiration_date: { $gte: new Date() }, status: 1 }

        if (helper.isDefine(code) && helper.isNumber(code)) {
            query = {
                ...query,
                code: code
            }
        }

        if (helper.isDefine(latitude) && helper.isDefine(longitude) && helper.isNumber(latitude) && helper.isNumber(longitude)) {
            query = {
                ...query,
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [latitude, longitude],
                        },
                        $minDistance: 0,
                    }
                }
            }
        }

        if (helper.isDefine(price)) {

            if (price == 0) {
                query = {
                    ...query,
                    $and: [{ price: { $gte: 0 } }, { price: { $lte: 500 } }],
                }
            } else if (price == 1) {
                query = {
                    ...query,
                    $and: [{ price: { $gte: 500 } }, { price: { $lte: 1000 } }],
                }
            } else if (price == 2) {
                query = {
                    ...query,
                    $and: [{ price: { $gte: 1000 } }, { price: { $lte: 2000 } }],
                }
            } else if (price == 3) {
                query = {
                    ...query,
                    $and: [{ price: { $gte: 2000 } }],
                }
            }
        }

        const result = await ObjectModel.find(query).limit(limit).skip(page);

        if (helper.isDefine(latitude) && helper.isDefine(longitude) && helper.isNumber(latitude) && helper.isNumber(longitude)) {
            for (let i = 0; i < result.length; i++) {
                result[i] = {
                    ...result[i]._doc,
                    distance: helper.getDistanceFromLatLonInKm(result[i].location.coordinates[0], result[i].location.coordinates[1], latitude, longitude)
                }
            }
        } else {
            for (let i = 0; i < result.length; i++) {
                result[i] = {
                    ...result[i]._doc,
                    distance: 'Unknown'
                }
            }
        }
        return res.json(result);
    } catch (err) {
        helper.throwError(err)
        return res.status(400).json(err);
    }
});

router.post('/form-web/', async (req, res) => {
    return await uploadImage(req , res , true)
});

module.exports = router;
const express = require('express');
const router = express.Router();
const ObjectModel = require('../models/Job');
const helper = require('../helper/helper');
const ReminderPostModel = require('../models/ReminderPosts')

router.post('/', async (req, res) => {
    return await uploadImage(req, res)
})

async function uploadImage(req, res, isWeb) {
    const helpers = require('helpers')
    const multer = require('multer')
    const path = require('path')
    const sharp = require('sharp')

    const pathStorage = 'public/images-jobs/'

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, pathStorage);
        },
        filename: function (req, file, cb) {
            console.log(file)
            cb(null, file.fieldname + '-' + Date.now().toString() + path.extname(file.originalname))
        }
    });

    let upload = multer({ storage: storage }).array('avatar', 100);
    upload(req, res, function (err) {
        (async () => {

            const index = await ObjectModel.countDocuments()

            const object = new ObjectModel({
                name_salon: req.body.name_salon,
                address_salon: req.body.address_salon,
                phone: req.body.phone,
                country: req.body.country,
                city: req.body.city,
                state: req.body.state,
                code: req.body.code,
                location: helper.tryParseLocation(req.body.location),
                title: req.body.title,
                content: req.body.content,
                email: req.body.email,
                link_slug: helper.stringToSlug(req.body.title) + '-' + index,
                cost: req.body.cost,
                options: helper.tryParseJson(req.body.options),
                status: req.body.status,
                months_provider: req.body.months_provider,
                images: [],
                package: req.body.package,
                id_agency: req.body.id_agency,
                expiration_date: Date.now() + helper.tryParseInt(req.body.months_provider) * 30 * 24 * 60 * 60 * 1000,
                //expiration_date: Date.now() + helper.tryParseInt(req.body.months_provider) * 60 * 1000,
            })

            try {
                const savedObject = await object.save()

                const query = {
                    id_post: savedObject._id,
                }

                await ReminderPostModel.findOneAndUpdate(query, query, helper.optsValidatorFindAndUpdate)

                try {
                    if (helper.isDefine(req.body.cost_package) && req.body.cost_package > 0) {
                        const HistoryPaymentObject = require('../models/HistoryPayments');
                        const objectHistoryPayment = new HistoryPaymentObject({
                            cost: req.body.cost_package,
                            id_post: savedObject._id,
                            type: 0,
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
                        return res.redirect("/agency/posts")
                    } else {
                        return res.json(savedObject)
                    }
                } else {
                    const files = req.files;

                    if (!helper.isDefine(files) || files.length <= 0) {
                        if (isWeb) {
                            return res.redirect("/agency/posts")
                        } else {
                            return res.json(savedObject)
                        }
                    }
                    // start upload images
                    let arr = [];
                    for (let index = 0; helper.isDefine(files) && index < files.length; index++) {
                        await sharp(files[index].path).resize(250, 250).withMetadata().toFile(pathStorage + 'icon-' + files[index].filename.split('.')[0] + '.jpg')
                        try {
                            await sharp(files[index].path).resize({ width: 1000 }).withMetadata().toFile(pathStorage + files[index].filename.split('.')[0] + '.jpg')
                        } catch (err) {

                        }
                        arr.push(files[index].filename.split('.')[0] + '.jpg')
                    }



                    // end upload images
                    try {
                        for (let i = 0; i < arr.length; i++) {
                            await ObjectModel.updateOne(
                                { _id: savedObject._id },
                                {
                                    $push: { images: arr[i] },
                                }
                            )

                            savedObject.images.push(arr[i])
                        }

                        if (isWeb) {
                            return res.redirect("/agency/posts")
                        } else {
                            res.json(savedObject);
                        }
                    } catch (err) {
                        if (isWeb) {
                            return res.redirect("/agency/posts")
                        } else {
                            return res.json(savedObject);
                        }
                    }
                }
            } catch (e) {
                helper.throwError(e)
                if (isWeb) {
                    return res.redirect("/agency/posts")
                } else {
                    return res.status(400).json(e)
                }
            }
        })();
    });
};

router.put('/re-post', async (req, res) => {
    try {
        if (helper.isDefine(helper.tryParseJson(req.headers.values))) {
            if (helper.tryParseJson(req.headers.values).cost && helper.tryParseJson(req.headers.values).cost > 0) {
                const HistoryPaymentObject = require('../models/HistoryPayments')
                const objectHistoryPayment = new HistoryPaymentObject({
                    cost: helper.tryParseJson(req.headers.values).cost,
                    id_post: helper.tryParseJson(req.headers.values).id_post,
                    type: 0,
                    package: helper.tryParseJson(req.headers.values).package,
                    id_agency: helper.tryParseJson(req.headers.values).id_agency,
                })
                await objectHistoryPayment.save()
            }
            let objForUpdate = {}
            if (helper.isDefine(helper.tryParseJson(req.headers.values).package)) objForUpdate.package = helper.tryParseJson(req.headers.values).package
            if (helper.isDefine(helper.tryParseJson(req.headers.values).months_provider)) objForUpdate.months_provider = helper.tryParseJson(req.headers.values).months_provider
            if (helper.isDefine(helper.tryParseJson(req.headers.values).months_provider)) objForUpdate.expiration_date = Date.now() + helper.tryParseInt(helper.tryParseJson(req.headers.values).months_provider) * 30 * 24 * 60 * 60 * 1000
            //if (helper.isDefine(helper.tryParseJson(req.headers.values).months_provider)) objForUpdate.expiration_date = Date.now() + helper.tryParseInt(helper.tryParseJson(req.headers.values).months_provider) * 60 * 1000

            objForUpdate = { $set: objForUpdate }

            const result = await ObjectModel.updateOne(
                { _id: helper.tryParseJson(req.headers.values).id_post }, objForUpdate, helper.optsValidator
            )

            const query = {
                id_post: helper.tryParseJson(req.headers.values).id_post,
            }

            await ReminderPostModel.findOneAndUpdate(query, query, helper.optsValidatorFindAndUpdate)

            return res.json(result)
        } else {
            if (req.body.cost && req.body.cost > 0) {
                const HistoryPaymentObject = require('../models/HistoryPayments')
                const objectHistoryPayment = new HistoryPaymentObject({
                    cost: req.body.cost,
                    id_post: req.body.id_post,
                    type: 0,
                    package: req.body.package,
                    id_agency: req.body.id_agency,
                })
                await objectHistoryPayment.save()
            }
            let objForUpdate = {}
            if (helper.isDefine(req.body.package)) objForUpdate.package = req.body.package
            if (helper.isDefine(req.body.months_provider)) objForUpdate.months_provider = req.body.months_provider
            if (helper.isDefine(req.body.months_provider)) objForUpdate.expiration_date = Date.now() + helper.tryParseInt(req.body.months_provider) * 30 * 24 * 60 * 60 * 1000
            //if (helper.isDefine(req.body.months_provider)) objForUpdate.expiration_date = Date.now() + helper.tryParseInt(req.body.months_provider) * 60 * 1000

            objForUpdate = { $set: objForUpdate }

            const result = await ObjectModel.updateOne(
                { _id: req.body.id_post }, objForUpdate, helper.optsValidator
            )

            const query = {
                id_post: req.body.id_post,
            }

            await ReminderPostModel.findOneAndUpdate(query, query, helper.optsValidatorFindAndUpdate)

            return res.json(result)
        }
    } catch (err) {
        helper.throwError(err)
        return res.status(500)
    }
})

router.put('/:objectId', async (req, res) => {
    return await updatePostMobile(req, res)
})

async function updatePostMobile(req, res) {
    const helpers = require('helpers')
    const multer = require('multer')
    const path = require('path')
    const sharp = require('sharp')

    const pathStorage = 'public/images-jobs/'

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, pathStorage);
        },
        filename: function (req, file, cb) {
            console.log(file)
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    });

    let upload = multer({ storage: storage }).array('avatar', 100);
    upload(req, res, function (err) {
        (async () => {
            try {

                let objForUpdate = {}
                if (helper.isDefine(req.body.name_salon)) objForUpdate.name_salon = req.body.name_salon
                if (helper.isDefine(req.body.address_salon)) objForUpdate.address_salon = req.body.address_salon
                if (helper.isDefine(req.body.phone)) objForUpdate.phone = req.body.phone;
                if (helper.isDefine(req.body.country) && req.body.country) objForUpdate.country = req.body.country;
                if (helper.isDefine(req.body.city) && req.body.city) objForUpdate.city = req.body.city;
                if (helper.isDefine(req.body.state) && req.body.state) objForUpdate.state = req.body.state;
                if (helper.isDefine(req.body.code)) objForUpdate.code = req.body.code;
                if (helper.isDefine(req.body.title)) objForUpdate.title = req.body.title;
                if (helper.isDefine(req.body.content)) objForUpdate.content = req.body.content;
                if (helper.isDefine(req.body.email)) objForUpdate.email = req.body.email;
                if (helper.isDefine(req.body.cost)) objForUpdate.cost = req.body.cost;
                if (helper.isDefine(req.body.options)) objForUpdate.options = helper.tryParseJson(helper.isDefine(req.body.options));
                if (helper.isDefine(req.body.images)) objForUpdate.images = helper.tryParseJson(req.body.images) || '[]'
                if (helper.isDefine(req.body.status)) objForUpdate.status = req.body.status;
                if (helper.isDefine(req.body.months_provider)) objForUpdate.months_provider = req.body.months_provider
                if (helper.isDefine(req.body.months_provider)) objForUpdate.expiration_date = Date.now() + helper.tryParseInt(req.body.months_provider) * 30 * 24 * 60 * 60 * 1000
                //if (helper.isDefine(req.body.months_provider)) objForUpdate.expiration_date = Date.now() + helper.tryParseInt(req.body.months_provider) * 60 * 1000

                objForUpdate = { $set: objForUpdate }

                const savedObject = await ObjectModel.findOneAndUpdate(
                    { _id: req.params.objectId }, objForUpdate, helper.optsValidator
                )

                const query = {
                    id_post: savedObject._id,
                }

                await ReminderPostModel.findOneAndUpdate(query, query, helper.optsValidatorFindAndUpdate)

                if (req.fileValidationError) {
                    return res.json(savedObject)
                } else {
                    const files = req.files;

                    if (!helper.isDefine(files) || files.length <= 0) {
                        return res.json(savedObject)
                    }
                    // start upload images
                    let arr = []
                    for (let index = 0; helper.isDefine(files) && index < files.length; index++) {
                        await sharp(files[index].path).resize(250, 250).withMetadata().toFile(pathStorage + 'icon-' + files[index].filename.split('.')[0] + '.jpg')
                        try {
                            await sharp(files[index].path).resize({ width: 1000 }).withMetadata().toFile(pathStorage + files[index].filename.split('.')[0] + '.jpg')
                        } catch (err) {

                        }
                        arr.push(files[index].filename.split('.')[0] + '.jpg')
                    }



                    // end upload images

                    try {
                        for (let i = 0; i < arr.length; i++) {
                            await ObjectModel.updateOne(
                                { _id: req.params.objectId },
                                {
                                    $push: { images: arr[i] },
                                }
                            )

                            savedObject.images.push(arr[i])
                        }

                        return res.json(savedObject)
                    } catch (err) {
                        helper.throwError(err)
                        return res.json(savedObject)
                    }
                }
            } catch (e) {
                helper.throwError(e)
                return res.json(savedObject)
            }

        })();

    });
}

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
        const limit = helper.tryParseInt(req.query.limit)
        const page = helper.tryParseInt(req.query.page)
        const latitude = req.query.latitude
        const longitude = req.query.longitude
        const code = helper.tryParseInt(req.query.code) || 0

        let query = { expiration_date: { $gte: new Date() }, package: 'Gold', status: 1 }

        const result = await ObjectModel.find(query).sort({ _id: -1 }).limit(limit).skip(page);

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
        const limit = helper.tryParseInt(req.query.limit)
        const page = helper.tryParseInt(req.query.page)
        const code = req.query.code;
        const cost = req.query.cost;

        let query = { status: 1 }

        if (helper.isDefine(code) && code != 'null' && code != 0 && code != '0') {
            let state = helper.getStateByCode(code)
            if (state != null) {
                query = {
                    ...query,
                    state: (state),
                }
            } else {
                query = {
                    ...query,
                    $and: [{ code: { $gte: (helper.tryParseInt(code) - 1000) } }, { code: { $lte: (helper.tryParseInt(code) + 1000) } }],
                }
            }
        }

        if (helper.isDefine(cost)) {

            if (cost == 0) {
                query = {
                    ...query,
                    $and: [{ cost: { $gte: 0 } }, { cost: { $lte: 500 } }],
                }
            } else if (cost == 1) {
                query = {
                    ...query,
                    $and: [{ cost: { $gte: 500 } }, { cost: { $lte: 1000 } }],
                }
            } else if (cost == 2) {
                query = {
                    ...query,
                    $and: [{ cost: { $gte: 1000 } }, { cost: { $lte: 2000 } }],
                }
            } else if (cost == 3) {
                query = {
                    ...query,
                    $and: [{ cost: { $gte: 2000 } }],
                }
            }
        }

        if (helper.isDefine(req.query.code) && helper.isDefine(req.query.range)) {

            const lat = helper.getLocationCityByCode(req.query.code).lat
            const lng = helper.getLocationCityByCode(req.query.code).lng

            if (helper.isDefine(lat) && helper.isDefine(lng)) {
                let maxDistance = helper.tryParseInt(req.query.range) * 1000 * 1.6

                if (req.query.range == 0) {
                    maxDistance = 10000000 * 1.6
                }
                query = {
                    ...query,
                    location: {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: [(lng), (lat)],
                            },
                            $minDistance: 0,
                            $maxDistance: maxDistance,
                        }
                    }
                }
            }
        }

        let result = await ObjectModel.find(query).sort({ _id: -1 }).limit(limit).skip(page)

        let leftObjects = []
        let rightObjects = []
        for (let i = 0; i < result.length; i++) {
          if (new Date(result[i]._doc.createdAt).getDay() == new Date().getDay() && result[i]._doc.package == 'Gold') {
            leftObjects.push(result[i])
          } else {
            rightObjects.push(result[i])
          }
        }
        result = leftObjects.concat(rightObjects)

        if (helper.isDefine(req.query.code) && helper.isDefine(req.query.range)) {
            const lat = helper.getLocationCityByCode(req.query.code).lat
            const lng = helper.getLocationCityByCode(req.query.code).lng

            if (helper.isDefine(lat) && helper.isDefine(lng)) {
                for (let i = 0; i < result.length; i++) {
                    result[i] = {
                        ...result[i]._doc,
                        distance: helper.getDistanceFromLatLonInKm(result[i]._doc.location.coordinates[0], result[i]._doc.location.coordinates[1], lng, lat)
                    }
                }
            }
        }

        for (let i = 0; i < result.length; i++) {

            if ((new Date(Date.now())) > (new Date(result[i].expiration_date))) {
                result[i].status = 0
            }

        }

        return res.json(result);
    } catch (err) {
        helper.throwError(err)
        return res.status(400).json(err);
    }
});

router.post('/form-web/', async (req, res) => {
    return await uploadImage(req, res, true)
})

async function updateImage(req, res, isWeb) {

    console.log('req.body.location')

    const helpers = require('helpers')
    const multer = require('multer')
    const path = require('path')
    const sharp = require('sharp')

    const pathStorage = 'public/images-jobs/'

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, pathStorage);
        },
        filename: function (req, file, cb) {
            console.log(file)
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    });

    let upload = multer({ storage: storage }).array('avatar', 100);
    upload(req, res, function (err) {
        (async () => {
            try {

                console.log(req.body)

                let objForUpdate = {}
                if (helper.isDefine(req.body.name_salon)) objForUpdate.name_salon = req.body.name_salon
                if (helper.isDefine(req.body.address_salon)) objForUpdate.address_salon = req.body.address_salon
                if (helper.isDefine(req.body.phone)) objForUpdate.phone = req.body.phone;
                if (helper.isDefine(req.body.country) && req.body.country) objForUpdate.country = req.body.country;
                if (helper.isDefine(req.body.city) && req.body.city) objForUpdate.city = req.body.city;
                if (helper.isDefine(req.body.state) && req.body.state) objForUpdate.state = req.body.state;
                if (helper.isDefine(req.body.code)) objForUpdate.code = req.body.code;
                if (helper.isDefine(req.body.location)) objForUpdate.location = helper.tryParseLocation(req.body.location)
                if (helper.isDefine(req.body.title)) objForUpdate.title = req.body.title;
                if (helper.isDefine(req.body.content)) objForUpdate.content = req.body.content;
                if (helper.isDefine(req.body.email)) objForUpdate.email = req.body.email;
                if (helper.isDefine(req.body.cost)) objForUpdate.cost = req.body.cost;
                if (helper.isDefine(req.body.options)) objForUpdate.options = helper.tryParseJson(helper.isDefine(req.body.options));
                if (helper.isDefine(req.body.status)) objForUpdate.status = req.body.status;

                objForUpdate = { $set: objForUpdate }

                const savedObject = await ObjectModel.findOneAndUpdate(
                    { _id: req.body.id_post }, objForUpdate, helper.optsValidator
                )

                if (req.fileValidationError) {
                    if (isWeb) {
                        return res.redirect("/agency/posts?sort=1")
                    } else {
                        return res.json(savedObject)
                    }
                } else {
                    const files = req.files;

                    if (!helper.isDefine(files) || files.length <= 0) {
                        if (isWeb) {
                            return res.redirect("/agency/posts?sort=1")
                        } else {
                            return res.json(savedObject)
                        }
                    }
                    // start upload images
                    let arr = []
                    for (let index = 0; helper.isDefine(files) && index < files.length; index++) {
                        await sharp(files[index].path).resize(250, 250).withMetadata().toFile(pathStorage + 'icon-' + files[index].filename.split('.')[0] + '.jpg')
                        try {
                            await sharp(files[index].path).resize({ width: 1000 }).withMetadata().toFile(pathStorage + files[index].filename.split('.')[0] + '.jpg')
                        } catch (err) {

                        }
                        arr.push(files[index].filename.split('.')[0] + '.jpg')
                    }

                    // end upload images

                    try {
                        for (let i = 0; i < arr.length; i++) {
                            await ObjectModel.updateOne(
                                { _id: req.body.id_post },
                                {
                                    $push: { images: arr[i] },
                                }
                            )

                            savedObject.images.push(arr[i])
                        }

                        if (isWeb) {
                            return res.redirect("/agency/posts?sort=1")
                        } else {
                            res.json(savedObject);
                        }
                    } catch (err) {
                        helper.throwError(err)
                        if (isWeb) {
                            return res.redirect("/agency/posts?sort=1")
                        } else {
                            return res.json(savedObject);
                        }
                    }
                }
            } catch (e) {
                helper.throwError(e)
                if (isWeb) {
                    return res.redirect("/agency/posts?sort=1")
                } else {
                    return res.status(400).json(e)
                }
            }

        })();

    });
}

router.post('/update-post/', async (req, res) => {
    return await updateImage(req, res)
})

module.exports = router
const express = require('express');
const router = express.Router();
const ObjectModel = require('../models/Agency');
const helper = require('../helper/helper');

router.post('/', async (req, res) => {
    const object = new ObjectModel({
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
        location: helper.tryParseJson(req.body.location),
        code: req.body.code,
        country: req.body.country,
        city: req.body.city,
        state: req.body.state,
        link_slug: helper.stringToSlug(req.body.name),
        status: req.body.status,
    });

    try {
        const savedObject = await object.save();
        res.json(savedObject);
    } catch (err) {
        res.status(400).json(err);
    }
});

router.put('/:objectId', async (req, res) => {
    try {
        let objForUpdate = {};
        if (req.body.name) {
            objForUpdate.name = req.body.name;
            objForUpdate.link_slug = helper.stringToSlug(req.body.name);
        }
        if (req.body.phone) objForUpdate.phone = req.body.phone;
        if (req.body.email) objForUpdate.email = req.body.email;
        if (req.body.password) objForUpdate.password = req.body.password;
        if (req.body.location) objForUpdate.location = helper.tryParseJson(req.body.location);
        if (req.body.code) objForUpdate.code = req.body.code;
        if (req.body.country) objForUpdate.country = req.body.country;
        if (req.body.city) objForUpdate.city = req.body.city;
        if (req.body.state) objForUpdate.state = req.body.state;
        if (req.body.status) objForUpdate.status = req.body.status;

        objForUpdate = { $set: objForUpdate }

        const object = await ObjectModel.updateOne(
            { _id: req.params.objectId }, objForUpdate
        );
        res.json(object);
    } catch (err) {
        res.status(400).json(err);
    }
});

router.delete('/:objectId', async (req, res) => {
    try {
        const object = await ObjectModel.deleteOne({ _id: req.params.objectId });
        res.json(object);
    } catch (err) {
        res.status(400).json(err);
    }
});

router.get('/sign-in', async (req, res) => {
    try {
        let query = { phone: req.query.phone, password: req.query.password }
        const object = await ObjectModel.findOne(query);
        res.json(object);
    } catch (err) {
        res.status(400).json(err);
    }
});

router.get('/job/:objectId', async (req, res) => {
    try {

        const limit = helper.tryParseInt(req.query.limit) || 25;
        const page = helper.tryParseInt(req.query.page) || 0;
        const id_agency = req.params.objectId
        const status = req.query.status

        let query = { id_agency: id_agency }
        if (helper.isDefine(status)) {
            query = {
                ...query,
                status: status
            }
        }

        const Model = require('../models/Job');

        const result = await Model.find(query).limit(limit).skip(page);

        res.json(result)
    } catch (err) {
        helper.throwError(err)
        res.status(400).json(err);
    }
});

router.get('/sell-salon/:objectId', async (req, res) => {
    try {

        const limit = helper.tryParseInt(req.query.limit) || 25;
        const page = helper.tryParseInt(req.query.page) || 0;
        const id_agency = req.params.objectId
        const status = req.query.status

        let query = { id_agency: id_agency }
        if (helper.isDefine(status)) {
            query = {
                ...query,
                status: status
            }
        }

        const Model = require('../models/SellSalon');

        const result = await Model.find(query).limit(limit).skip(page);

        res.json(result)
    } catch (err) {
        helper.throwError(err)
        res.status(400).json(err);
    }
});

router.get('/nail-supply/:objectId', async (req, res) => {
    try {

        const limit = helper.tryParseInt(req.query.limit) || 25;
        const page = helper.tryParseInt(req.query.page) || 0;
        const id_agency = req.params.objectId
        const status = req.query.status

        let query = { id_agency: id_agency }
        if (helper.isDefine(status)) {
            query = {
                ...query,
                status: status
            }
        }

        const Model = require('../models/NailSupply');

        const result = await Model.find(query).limit(limit).skip(page);

        res.json(result)
    } catch (err) {
        helper.throwError(err)
        res.status(400).json(err);
    }
});

// router.get('/', async (req, res) => {
//     try {
//         const limit = parseInt(req.query.limit, 10) || 25;
//         const page = parseInt(req.query.page, 10) || 0;
//         const object = await ObjectModel.find().skip(page).limit(limit);
//         res.json(object);
//     } catch (err) {
//         res.status(400).json(err);
//     }
// });

module.exports = router;
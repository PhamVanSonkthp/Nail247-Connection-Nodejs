const express = require('express');
const router = express.Router();
const ObjectModel = require('../models/PaymentStripe');
const helper = require('../helper/helper');

router.post('/', async (req, res) => {
    const object = new ObjectModel({
        name: req.body.name,
        public_key: req.body.public_key,
        secret_key: req.body.secret_key,
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
        if (helper.isDefine(req.body.name)) objForUpdate.name = req.body.name;
        if (helper.isDefine(req.body.public_key)) public_key.phone = req.body.public_key;
        if (helper.isDefine(req.body.secret_key)) objForUpdate.secret_key = req.body.secret_key;

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

router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 25;
        const page = parseInt(req.query.page, 10) || 0;

        const result = await ObjectModel.find().limit(limit).skip(page);
        
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

module.exports = router;
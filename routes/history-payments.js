const express = require('express');
const router = express.Router();
const ObjectModel = require('../models/HistoryPayments');
const helper = require('../helper/helper');
const objectId = require('mongodb').ObjectId;

router.post('/', async (req, res) => {
    const object = new ObjectModel({
        cost: req.body.cost,
        id_post: req.body.id_post,
        type: req.body.type,
        package: req.body.package,
        id_agency: req.body.id_agency,
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
        if (helper.isDefine(req.body.cost)) objForUpdate.cost = req.body.cost;
        if (helper.isDefine(req.body.id_post)) objForUpdate.id_post = req.body.id_post;
        if (helper.isDefine(req.body.type)) objForUpdate.type = req.body.type;
        if (helper.isDefine(req.body.package)) objForUpdate.package = req.body.package;
        if (helper.isDefine(req.body.id_agency)) objForUpdate.id_agency = req.body.id_agency;

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
        let query = {}

        if(helper.isDefine(req.query.type)){
            query = {
                ...query,
                type:req.query.type
            }
        }
        const result = await ObjectModel.find(query).limit(limit).skip(page);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

router.get('/:objectId', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 25;
        const page = parseInt(req.query.page, 10) || 0;
        let query = {id_agency : objectId(req.params.objectId)}
        const result = await ObjectModel.find(query).limit(limit).skip(page);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

module.exports = router;
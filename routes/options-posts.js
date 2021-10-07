const express = require('express');
const router = express.Router();
const ObjectModel = require('../models/OptionsPosts');
const helper = require('../helper/helper');

router.post('/', async (req, res) => {
    const object = new ObjectModel({
        name: req.body.name,
        content: req.body.content,
        status: req.body.status,
        options: helper.tryParseJson(req.body.options),
        type: req.body.type,
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
        if (helper.isDefine(req.body.content)) objForUpdate.content = req.body.content;
        if (helper.isDefine(req.body.status)) objForUpdate.status = req.body.status;
        if (helper.isDefine(req.body.options)) objForUpdate.options = helper.tryParseJson(req.body.options);
        if (helper.isDefine(req.body.type)) objForUpdate.type = req.body.type;

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
        const type = req.query.type || 0;
        let query = {type : type , status : 1}
        const result = await ObjectModel.find(query).limit(limit).skip(page);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

module.exports = router;
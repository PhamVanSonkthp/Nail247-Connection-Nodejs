const express = require('express');
const router = express.Router();
const ObjectModel = require('../models/Blog');
const helper = require('../helper/helper');

router.post('/', async(req, res) => {
    const object = new ObjectModel({
        title: req.body.title,
        image_title: req.body.image_title,
        content: req.body.content,
        tag: req.body.tag,
    });

    try {
        const savedObject = await object.save();
        res.json(savedObject);
    } catch (err) {
        res.status(500).json(err);
    }
});

// router.put('/:objectId', async (req, res) => {
//     try {
//         let objForUpdate = {};
//         if (helper.isDefine(req.body.password)) objForUpdate.password = req.body.password;
//         if (helper.isDefine(req.body.name)) objForUpdate.name = req.body.name;
//         if (helper.isDefine(req.body.permission)) objForUpdate.permission = req.body.permission;

//         objForUpdate = { $set: objForUpdate }

//         const object = await ObjectModel.updateOne(
//             { _id: req.params.objectId }, objForUpdate
//         );
//         res.json(object);
//     } catch (err) {
//         res.status(400).json(err);
//     }
// });

// router.delete('/:objectId', async (req, res) => {
//     try {
//         const object = await ObjectModel.deleteOne({ _id: req.params.objectId });
//         res.json(object);
//     } catch (err) {
//         res.status(400).json(err);
//     }
// });

// router.get('/sign-in', async (req, res) => {
//     try {
//         const user_name = req.query.username;
//         const password = req.query.password;
//         let query = { user_name: user_name, password: password }
//         const result = await ObjectModel.findOne(query);
//         res.json(result);

//     } catch (err) {
//         res.status(400).json(err);
//     }
// });

module.exports = router;
const express = require('express')
const router = express.Router()
const ObjectModel = require('../models/Blog')
const helper = require('../helper/helper')

router.post('/', async(req, res) => {
    return await uploadImage(req, res)
})

async function uploadImage(req, res) {
    const multer = require('multer')
    const path = require('path')
    const sharp = require('sharp')

    const pathStorage = 'public/images-blogs/'

    const storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, pathStorage);
        },
        filename: function(req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now().toString() + path.extname(file.originalname))
        }
    });

    let upload = multer({ storage: storage }).array('avatar', 100);
    upload(req, res, function(err) {
        (async() => {

            const index = await ObjectModel.countDocuments()

            let tags = []
            if (helper.isDefine(req.body.tags)) {
                let arrTags = req.body.tags.split(',')
                for (let i = 0; i < arrTags.length; i++) {
                    if (arrTags[i].trim().length > 0) {
                        tags.push(arrTags[i].trim())
                    }
                }
            }
            const object = new ObjectModel({
                title: req.body.title,
                image_title: '',
                content: req.body.content,
                link_slug: helper.stringToSlug(req.body.title) + '-' + index,
                tag: tags,
            })

            try {
                const savedObject = await object.save()

                if (req.fileValidationError) {
                    return res.redirect("/admin/blogs")
                } else {
                    const files = req.files;

                    if (!helper.isDefine(files) || files.length <= 0) {
                        return res.redirect("/admin/blogs")
                    }
                    // start upload images
                    let arr = [];
                    for (let index = 0; helper.isDefine(files) && index < files.length; index++) {
                        try {
                            await sharp(files[index].path).resize({ width: 1280 }).withMetadata().toFile(pathStorage + files[index].filename.split('.')[0] + '.jpg')
                        } catch (err) {

                        }
                        arr.push(files[index].filename.split('.')[0] + '.jpg')
                    }

                    // end upload images
                    try {
                        for (let i = 0; i < arr.length; i++) {
                            await ObjectModel.updateOne({ _id: savedObject._id }, {
                                image_title: arr[i]
                            })
                        }

                        return res.redirect("/admin/blogs")
                    } catch (err) {
                        return res.redirect("/admin/blogs")
                    }
                }
            } catch (e) {
                helper.throwError(e)
                return res.redirect("/admin/blogs")
            }
        })();
    });
};

router.put('/', async(req, res) => {
    return await updateImage(req, res)
})

async function updateImage(req, res) {
    const multer = require('multer')
    const path = require('path')
    const sharp = require('sharp')

    const pathStorage = 'public/images-blogs/'

    const storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, pathStorage);
        },
        filename: function(req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now().toString() + path.extname(file.originalname))
        }
    });

    let upload = multer({ storage: storage }).array('avatar', 100);
    upload(req, res, function(err) {
        (async() => {
            try {
                const files = req.files

                // start upload images
                let arr = []
                for (let index = 0; helper.isDefine(files) && index < files.length; index++) {
                    try {
                        await sharp(files[index].path).resize({ width: 1280 }).withMetadata().toFile(pathStorage + files[index].filename.split('.')[0] + '.jpg')
                    } catch (err) {

                    }
                    arr.push(files[index].filename.split('.')[0] + '.jpg')
                }

                let tags = []
                if (helper.isDefine(req.body.tags)) {
                    let arrTags = req.body.tags.split(',')
                    for (let i = 0; i < arrTags.length; i++) {
                        if (arrTags[i].trim().length > 0) {
                            tags.push(arrTags[i].trim())
                        }
                    }
                }

                let objForUpdate = {}
                if (helper.isDefine(req.body.title)) objForUpdate.title = req.body.title
                if (helper.isDefine(req.body.content)) objForUpdate.content = req.body.content
                if (arr.length) objForUpdate.image_title = arr[0]
                objForUpdate.tag = tags
                objForUpdate = { $set: objForUpdate }

                const result = await ObjectModel.updateOne({ _id: req.body.id_post }, objForUpdate, helper.optsValidator)

                return res.json(result)

            } catch (e) {
                helper.throwError(e)
                return res.redirect("/admin/blogs")
            }
        })();
    });
};

module.exports = router;
//#region 
require('dotenv/config')
const hash = require('js-sha512')
const cors = require('cors');
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const logger = require('morgan')
const sanitize = require('mongo-sanitize')
const mongoSanitize = require('express-mongo-sanitize');
const helper = require('./helper/helper')
const server = require('http').createServer(app)
const io = require('socket.io')(server, { cors: { origin: "*" } })
const croner = require('node-cron')
const nodemailer = require('nodemailer')
const domain = process.env.DOMAIN
const ReminderPostModel = require('./models/ReminderPosts')
const JobPostModel = require('./models/Job')
const SellSalonPostModel = require('./models/SellSalon')
const NailSupplyPostModel = require('./models/NailSupply')
const AgencyModel = require('./models/Agency')
const ContactModel = require('./models/ContactUs')
const BlogModel = require('./models/Blog')

//#endregion
app.set('views', './views')
app.set('view engine', 'ejs')

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(mongoSanitize())
app.use(logger('dev'))
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

//app.use(express.static("views"));
app.use(express.static(__dirname));

app.get('/admin/sign-in', function(req, res) {
    res.render('./admin/sign-in');
});

app.get('/admin/home', function(req, res) {
    res.render('./admin/home');
});

app.get('/admin', function(req, res) {
    res.render('./admin/home');
});

app.get('/admin/posts-jobs', function(req, res) {
    res.render('./admin/posts-jobs');
});

app.get('/admin/posts-sell-salons', function(req, res) {
    res.render('./admin/posts-sell-salons');
});

app.get('/admin/posts-nail-supplies', function(req, res) {
    res.render('./admin/posts-nail-supplies');
});

app.get('/admin/options-posts', function(req, res) {
    res.render('./admin/options-posts');
});

app.get('/admin/payments-stripe', function(req, res) {
    res.render('./admin/payments-stripe');
});

app.get('/admin/users', function(req, res) {
    res.render('./admin/users');
});

app.get('/admin/users-profile', function(req, res) {
    res.render('./admin/users-profile');
});

app.get('/admin/history-payments', function(req, res) {
    res.render('./admin/history-payments');
});

app.get('/admin/blogs', function(req, res) {
    res.render('./admin/blogs');
});

app.get('/admin/wellcome-nail', function(req, res) {
    res.render('./admin/wellcome-nail')
})

app.get('/admin/contact-us', function(req, res) {
    res.render('./admin/contact-us')
})

app.get('/admin/terms-of-use', function(req, res) {
    res.render('./admin/terms-of-use')
})

app.get('/admin/privacy-policy', async function(req, res) {
    res.render('./admin/privacy-policy')
})

app.get('/admin/phone-support', function(req, res) {
    res.render('./admin/phone-support')
})

app.get('/admin/remind-email', function(req, res) {
    res.render('./admin/remind-email')
})

app.get('/admin/seo-keyword', function(req, res) {
    res.render('./admin/seo-keyword')
})

//----------Start Clients Area---------//

app.get('/', async function(req, res) {
    let result
    try {
        const UserModel = require('./models/ContactUs')
        result = await UserModel.findOne()
    } catch (e) {
        helper.throwError(e)
    }

    res.render('./client/home', { url: domain, title: result.keyword, content: result.description, image: domain + 'views/client/dist/images/banner.jpg', keyword: result.keyword, description: result.description, promotion: result.promotion })
})

app.get('/forgot-password', function(req, res) {
    res.render('./client/forgot-password', { url: domain + 'search/', title: 'Forgot password', content: 'Find a job, sell salon, nail supply', image: domain });
})

app.get('/search', function(req, res) {
    res.render('./client/search', { url: domain + 'search/', title: 'Find a job | sell salon | nail supply', content: 'Find a job, sell salon, nail supply', image: domain });
})

function nearCountryByCode(code) {
    code = helper.tryParseInt(code)
    let counter = 0
    let result = []

    for (let i = 0; i < helper.codeCountrys.length; i++) {
        if ((helper.isDefine(helper.codeCountrys[i][0]) && Math.abs(helper.tryParseInt(helper.codeCountrys[i][0]) - code) < 10)) {
            if (counter > 5) {
                break
            } else {
                ++counter
            }
            result.push(helper.codeCountrys[i])
        }
    }

    for (let i = 0; i < result.length - 1; i++) {
        for (let j = i; j < result.length; j++) {
            if (Math.abs(helper.tryParseInt(result[i].code) - helper.tryParseInt(code)) < Math.abs(helper.tryParseInt(result[j].code) - helper.tryParseInt(code))) {
                let temp = result[i]
                result[i] = result[j]
                result[j] = temp
            }
        }
    }

    return result
}

app.get('/posts-jobs/:slug', async function(req, res) {
    try {
        const jobModel = require('./models/Job')
        let query = { link_slug: sanitize(req.params.slug.split('?')[0]), status: 1 }

        let object = await jobModel.findOne(query)


        if ((new Date(Date.now())) > (new Date(object.expiration_date))) {
            object.status = 0
        }

        object.code = helper.formatZipCode(object.code)
        let queryRelated = { status: 1 }
        let resultRelated

        queryRelated = {
            ...queryRelated,
            state: helper.getStateByCode(object.code)
        }

        resultRelated = await jobModel.aggregate([{ $match: queryRelated }, { $sample: { size: 5 } }])

        const lat = helper.getLocationCityByCode(object.code).lat
        const lng = helper.getLocationCityByCode(object.code).lng

        for (let i = 0; i < resultRelated.length; i++) {
            if ((new Date(Date.now())) > (new Date(resultRelated[i].expiration_date))) {
                resultRelated[i].status = 0
            }

            resultRelated[i].distance = helper.getDistanceFromLatLonInKm(resultRelated[i].location.coordinates[0], resultRelated[i].location.coordinates[1], lng, lat)
            if (helper.isDefine(resultRelated[i].content)) resultRelated[i].content = resultRelated[i].content.replaceAll("\"", "").replaceAll("\'", "")
            if (helper.isDefine(resultRelated[i].title)) resultRelated[i].title = resultRelated[i].title.replaceAll("\"", "").replaceAll("\'", "")
            if (helper.isDefine(resultRelated[i].name_salon)) resultRelated[i].name_salon = resultRelated[i].name_salon.replaceAll("\"", "").replaceAll("\'", "")
            if (helper.isDefine(resultRelated[i].address_salon)) resultRelated[i].address_salon = resultRelated[i].address_salon.replaceAll("\"", "").replaceAll("\'", "")
        }

        const nearCountry = nearCountryByCode(object.code)
        if (helper.isDefine(object.content)) object.content = object.content.replaceAll("\"", "").replaceAll("\'", "")
        if (helper.isDefine(object.title)) object.title = object.title.replaceAll("\"", "").replaceAll("\'", "")
        if (helper.isDefine(object.name_salon)) object.name_salon = object.name_salon.replaceAll("\"", "").replaceAll("\'", "")
        if (helper.isDefine(object.address_salon)) object.address_salon = object.address_salon.replaceAll("\"", "").replaceAll("\'", "")

        object = {
            post: object,
            related: resultRelated,
            nearCountry: nearCountry
        }
        res.render('./client/posts-jobs', { object: JSON.stringify(object).replaceAll("\'", ""), url: domain + 'posts-jobs/' + object.post.link_slug, title: object.post.title, content: object.post.content, image: domain + 'public/images-jobs/' + object.post.images[0] })
    } catch (err) {
        helper.throwError(err)
        res.redirect(domain + 'search?categories=find-job')
    }
})

app.get('/posts-sell-salons/:slug', async function(req, res) {
    try {
        const jobModel = require('./models/SellSalon')
        let query = { link_slug: sanitize(req.params.slug.split('?')[0]), status: 1 }

        let object = await jobModel.findOne(query)

        if ((new Date(Date.now())) > (new Date(object.expiration_date))) {
            object.status = 0
        }

        object.code = helper.formatZipCode(object.code)

        let queryRelated = { status: 1 }
        let resultRelated

        queryRelated = {
            ...queryRelated,
            state: helper.getStateByCode(object.code)
        }

        resultRelated = await jobModel.aggregate([{ $match: queryRelated }, { $sample: { size: 5 } }])

        const lat = helper.getLocationCityByCode(object.code).lat
        const lng = helper.getLocationCityByCode(object.code).lng

        for (let i = 0; i < resultRelated.length; i++) {
            if ((new Date(Date.now())) > (new Date(resultRelated[i].expiration_date))) {
                resultRelated[i].status = 0
            }
            resultRelated[i].distance = helper.getDistanceFromLatLonInKm(resultRelated[i].location.coordinates[0], resultRelated[i].location.coordinates[1], lng, lat)
            if (helper.isDefine(resultRelated[i].content)) resultRelated[i].content = resultRelated[i].content.replaceAll("\"", "").replaceAll("\'", "")
            if (helper.isDefine(resultRelated[i].title)) resultRelated[i].title = resultRelated[i].title.replaceAll("\"", "").replaceAll("\'", "")
            if (helper.isDefine(resultRelated[i].name_salon)) resultRelated[i].name_salon = resultRelated[i].name_salon.replaceAll("\"", "").replaceAll("\'", "")
            if (helper.isDefine(resultRelated[i].address_salon)) resultRelated[i].address_salon = resultRelated[i].address_salon.replaceAll("\"", "").replaceAll("\'", "")
        }

        const nearCountry = nearCountryByCode(object.code)
        if (helper.isDefine(object.content)) object.content = object.content.replaceAll("\"", "").replaceAll("\'", "")
        if (helper.isDefine(object.title)) object.title = object.title.replaceAll("\"", "").replaceAll("\'", "")
        if (helper.isDefine(object.name_salon)) object.name_salon = object.name_salon.replaceAll("\"", "").replaceAll("\'", "")
        if (helper.isDefine(object.address_salon)) object.address_salon = object.address_salon.replaceAll("\"", "").replaceAll("\'", "")

        object = {
            post: object,
            related: resultRelated,
            nearCountry: nearCountry
        }
        res.render('./client/posts-sell-salons', { object: JSON.stringify(object).replaceAll("\'", ""), url: domain + 'posts-sell-salons/' + object.post.link_slug, title: object.post.title, content: object.post.content, image: domain + 'public/images-sells-salons/' + object.post.images[0] })
    } catch (err) {
        helper.throwError(err)
        res.redirect(domain + 'search?categories=sell-salon')
    }
})

app.get('/posts-nail-supplies/:slug', async function(req, res) {
    try {
        const jobModel = require('./models/NailSupply')
        let query = { link_slug: sanitize(req.params.slug.split('?')[0]), status: 1 }

        let object = await jobModel.findOne(query)

        if ((new Date(Date.now())) > (new Date(object.expiration_date))) {
            object.status = 0
        }

        object.code = helper.formatZipCode(object.code)
        let queryRelated = { status: 1 }
        let resultRelated

        queryRelated = {
            ...queryRelated,
            state: helper.getStateByCode(object.code)
        }

        resultRelated = await jobModel.aggregate([{ $match: queryRelated }, { $sample: { size: 5 } }])

        const lat = helper.getLocationCityByCode(object.code).lat
        const lng = helper.getLocationCityByCode(object.code).lng

        for (let i = 0; i < resultRelated.length; i++) {
            if ((new Date(Date.now())) > (new Date(resultRelated[i].expiration_date))) {
                resultRelated[i].status = 0
            }

            resultRelated[i].distance = helper.getDistanceFromLatLonInKm(resultRelated[i].location.coordinates[0], resultRelated[i].location.coordinates[1], lng, lat)
            if (helper.isDefine(resultRelated[i].content)) resultRelated[i].content = resultRelated[i].content.replaceAll("\"", "").replaceAll("\'", "")
            if (helper.isDefine(resultRelated[i].title)) resultRelated[i].title = resultRelated[i].title.replaceAll("\"", "").replaceAll("\'", "")
            if (helper.isDefine(resultRelated[i].name_salon)) resultRelated[i].name_salon = resultRelated[i].name_salon.replaceAll("\"", "").replaceAll("\'", "")
            if (helper.isDefine(resultRelated[i].address_salon)) resultRelated[i].address_salon = resultRelated[i].address_salon.replaceAll("\"", "").replaceAll("\'", "")
        }

        const nearCountry = nearCountryByCode(object.code)
        if (helper.isDefine(object.content)) object.content = object.content.replaceAll("\"", "").replaceAll("\'", "")
        if (helper.isDefine(object.title)) object.title = object.title.replaceAll("\"", "").replaceAll("\'", "")
        if (helper.isDefine(object.name_salon)) object.name_salon = object.name_salon.replaceAll("\"", "").replaceAll("\'", "")
        if (helper.isDefine(object.address_salon)) object.address_salon = object.address_salon.replaceAll("\"", "").replaceAll("\'", "")
        object = {
            post: object,
            related: resultRelated,
            nearCountry: nearCountry
        }

        res.render('./client/posts-nail-supplies', { object: JSON.stringify(object).replaceAll("\'", ""), url: domain + 'posts-nail-supplies/' + object.post.link_slug, title: object.post.title, content: object.post.content, image: domain + 'public/images-nail-supplies/' + object.post.images[0] })
    } catch (err) {
        helper.throwError(err)
        res.redirect(domain + 'search?categories=nail-supply')
    }
})

app.get('/agency/account', function(req, res) {
    res.render('./client/agency-account');
});

app.get('/agency/change-password', function(req, res) {
    res.render('./client/agency-change-password');
});

app.get('/agency/posts', function(req, res) {
    res.render('./client/agency-posts')
})

app.get('/contact-us', function(req, res) {
    res.render('./client/contact-us')
})

app.get('/terms-of-use', async function(req, res) {
    try {
        const UserModel = require('./models/ContactUs');
        const result = await UserModel.findOne()
        res.render('./client/terms-of-use', { content: result.terms_of_use })
    } catch (e) {
        helper.throwError(e)
        res.render('./client/terms-of-use', { content: 'none' })
    }
})

app.get('/privacy-policy', async function(req, res) {
    try {
        const UserModel = require('./models/ContactUs');
        const result = await UserModel.findOne()
        res.render('./client/privacy-policy', { content: result.privacy_policy })
    } catch (e) {
        helper.throwError(e)
        res.render('./client/privacy-policy', { content: 'none' })
    }
})

app.get('/blog', async function(req, res) {
    const relate = await BlogModel.find().sort({ _id: -1 }).limit(9)

    for (let i = 0; i < relate.length; i++) {
        if (helper.isDefine(relate[i].title)) relate[i].title = relate[i].title.replaceAll("\"").replaceAll("\'")
        if (helper.isDefine(relate[i].image_title)) relate[i].image_title = relate[i].image_title.replaceAll("\"").replaceAll("\'")
        if (helper.isDefine(relate[i].content)) relate[i].content = relate[i].content.replaceAll("\"").replaceAll("\'")
        if (helper.isDefine(relate[i].tag)) {
            for (let j = 0; j < relate[i].tag.length; j++) {
                relate[i].tag[j] = relate[i].tag[j].replaceAll("\"").replaceAll("\'")
            }
        }
    }

    res.render('./client/blog', { url: domain + 'blog', title: '247NailSalons Blogs', content: '247NailSalons Blogs', image: domain, blogs: JSON.stringify(relate) })
})

app.get('/blog/:slug', async function(req, res) {
    try {
        const result = await BlogModel.findOne({ link_slug: req.params.slug })
        if (!result) {
            const relate = await BlogModel.find().sort({ _id: -1 }).limit(9)

            for (let i = 0; i < relate.length; i++) {
                if (helper.isDefine(relate[i].title)) relate[i].title = relate[i].title.replaceAll("\"").replaceAll("\'")
                if (helper.isDefine(relate[i].image_title)) relate[i].image_title = relate[i].image_title.replaceAll("\"").replaceAll("\'")
                if (helper.isDefine(relate[i].content)) relate[i].content = relate[i].content.replaceAll("\"").replaceAll("\'")
                if (helper.isDefine(relate[i].tag)) {
                    for (let j = 0; j < relate[i].tag.length; j++) {
                        relate[i].tag[j] = relate[i].tag[j].replaceAll("\"").replaceAll("\'")
                    }
                }
            }

            res.render('./client/blog', { url: domain + 'blog', title: '247NailSalons Blogs', content: '247NailSalons Blogs', image: domain, blogs: JSON.stringify(relate) })
        }

        const relate = await BlogModel.aggregate([{ $sample: { size: 5 } }])

        for (let i = 0; i < relate.length; i++) {
            if (helper.isDefine(relate[i].title)) relate[i].title = relate[i].title.replaceAll("\"").replaceAll("\'")
            if (helper.isDefine(relate[i].image_title)) relate[i].image_title = relate[i].image_title.replaceAll("\"").replaceAll("\'")
            if (helper.isDefine(relate[i].content)) relate[i].content = relate[i].content.replaceAll("\"").replaceAll("\'")
            if (helper.isDefine(relate[i].tag)) {
                for (let j = 0; j < relate[i].tag.length; j++) {
                    relate[i].tag[j] = relate[i].tag[j].replaceAll("\"").replaceAll("\'")
                }
            }
        }

        res.render('./client/detail-blog', { url: domain + 'blog' + result.link_slug, title: result.title, content: result.content, image: domain + 'public/images-blogs/' + result.image_title, tags: result.tag, createdAt: result.createdAt, relate: JSON.stringify(relate) })
    } catch (err) {
        helper.throwError(err)
        res.render('./client/blog', { url: domain + 'blog', title: '247NailSalons Blogs', content: '247NailSalons Blogs', image: domain })
    }

})

app.get('/contact', async(req, res) => {
    try {
        const UserModel = require('./models/ContactUs');

        const result = await UserModel.findOne()
        res.json(result)
    } catch (e) {
        helper.throwError(e)
        res.status(500).json(null)
    }
})

//----------End Clients Area---------//



const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    autoIndex: true, //this is the code I added that solved it all
    keepAlive: true,
    poolSize: 10,
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    useFindAndModify: false,
    useUnifiedTopology: true
}

const optsValidator = {
    runValidators: true,
    new: true,
}

const optsValidatorFindAndUpdate = {
    runValidators: true,
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
}

//Firebase
const admin = require("firebase-admin")
const serviceAccount = require("./nailsalons-60488-firebase-adminsdk-d1npz-70c3ffd06d.json")
var token
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})
const dbFirebase = admin.firestore();
(async() => {
    //const doc = await dbFirebase.collection('ruler').doc('ruler').get()

    // token = doc._fieldsProto.key.stringValue

    // console.log('token: ' + token)
    // connectDatabase()

    const doc = await dbFirebase.collection('ruler')
    doc.onSnapshot(docSnapshot => {
        token = docSnapshot.docs[0].data().key

        server.listen(process.env.PORT || 8000)
        console.log('nail 247 listening port: ' + (process.env.PORT || 8000))

        console.log('token: ' + token)

        connectDatabase()
    }, err => {
        token = '247nailsalons'
        console.log('token: ' + token)

        server.listen(process.env.PORT || 8000)
        console.log('nail 247 listening port: ' + (process.env.PORT || 8000))

        connectDatabase()
    });

})()


function connectDatabase() {
    // connect db
    mongoose.connect(process.env.DB_CONNECTION + process.env.DB_NAME, options).then(() => {
        console.log('nail 247 connected database!')

        app.use(function(req, res, next) {
            if (!req.headers.token || req.headers.token != token) {
                res.status(403).json({ error: 'authorization' });
            } else {
                fetchAPI(req, res)
                next()
            }

            // fetchAPI(req, res)
            // next()

        });

    }).catch(err => console.log(err))
}

function fetchAPI(req, res) {
    helper.saveTraffics(req, 0)

    const adminRoute = require('./routes/admin');
    app.use('/admin', adminRoute);

    const optionsPostsRoute = require('./routes/options-posts');
    app.use('/options-posts', optionsPostsRoute);

    const agencyRoute = require('./routes/agency');
    app.use('/agency', agencyRoute);

    const jobRoute = require('./routes/job');
    app.use('/job', jobRoute);

    const sellSalonRoute = require('./routes/sell-salon');
    app.use('/sell-salon', sellSalonRoute);

    const nailSuppliesRoute = require('./routes/nail-supplies');
    app.use('/nail-supplies', nailSuppliesRoute);

    const historyPaymentsRoute = require('./routes/history-payments');
    app.use('/history-payments', historyPaymentsRoute);

    const paymentsStripesRoute = require('./routes/payments-stripes');
    app.use('/payments-stripes', paymentsStripesRoute);

    const blogRoute = require('./routes/blog');
    app.use('/blog', blogRoute);

    app.post('/purchase', async(req, res) => {

        const UserModel = require('./models/PaymentStripe')
        const result = await UserModel.findOne()
        const stripe = require('stripe')(result.secret_key)

        if (helper.tryParseJson(req.headers.stripe).amount == 0) {
            return helper.paymentPostJob(req, res)
        } else {
            stripe.charges.create({
                amount: helper.tryParseJson(req.headers.stripe).amount,
                source: helper.tryParseJson(req.headers.stripe).stripeTokenId,
                currency: 'usd'
            }).then(function() {
                return helper.paymentPostJob(req, res)
            }).catch(function(e) {
                console.log('charge fail')
                console.log(e)
                res.status(500).end()
            })
        }

    })

}

var banderIP = []
var accessIP = []

// banderIP.push('::ffff:103.90.234.25')

function trafficsSocket(socket) {
    helper.saveTraffics('', 1)

    //var socketId = socket.id;
    //var clientIp = ;

    //console.log(clientIp);
    // accessIP.push(socket.request.connection.remoteAddress)

    // socket.clients[socketId].connection.end();

}

io.sockets.on('connection', (socket) => {

    //----------Start Admin Area---------//

    socket.on('welcomes', async(data, callback) => {
        trafficsSocket(socket)
        try {
            const UserModel = require('./models/Welcome');
            const result = await UserModel.findOne()
            callback(result)
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('save-welcome', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {
                const UserModel = require('./models/Welcome')
                let objForUpdate = {}
                objForUpdate.welcome = sanitize(data.welcome)
                objForUpdate.name = sanitize(data.name)
                objForUpdate.title = sanitize(data.title)
                objForUpdate.contents = sanitize(data.contents)
                objForUpdate = { $set: objForUpdate }

                UserModel.findOneAndUpdate({}, objForUpdate, optsValidatorFindAndUpdate, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('login', async(obj, callback) => {
        trafficsSocket(socket)
        try {
            if (obj != undefined && obj != null) {
                const UserModel = require('./models/Admin');
                let query = { phone: sanitize(obj.phone), password: sanitize(obj.password) };
                const object = await UserModel.findOne(query);
                if (object != null) {
                    callback({ _id: object._id, name: object.name, password: helper.encrypt(object.password), phone: object.phone, permission: object.permission });
                } else {
                    callback(null);
                }
            } else {
                callback(null)
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('recent-login', async(obj, callback) => {
        trafficsSocket(socket)
        if (obj != undefined && obj != null) {
            try {
                const UserModel = require('./models/Admin');
                let query = { _id: sanitize(obj._id), password: sanitize(helper.decrypt(obj.password)) };
                const object = await UserModel.findOne(query);
                if (object != null) {

                    callback({ name: object.name });
                } else {
                    callback(null);
                }
            } catch (e) {
                callback(null);
            }
        } else {
            callback(null);
        }
    });

    socket.on('recent-login-agency', async(obj, callback) => {
        trafficsSocket(socket)
        if (helper.isDefine(obj)) {
            try {
                const UserModel = require('./models/Agency');
                let query = { _id: sanitize(obj._id), password: sanitize(helper.decrypt(obj.password)), status: 1 };
                const object = await UserModel.findOne(query);
                if (object != null) {

                    callback({ name: object.name });
                } else {
                    callback(null);
                }
            } catch (e) {
                callback(null);
            }
        } else {
            callback(null);
        }
    });

    socket.on('post-jobs', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Job');
                //let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                let query = {}
                if (helper.isDefine(data.input) && data.input.length > 0) {
                    let title = data.input
                    title = title.trim()
                    title = helper.stringToSlug(title).replaceAll('-', ' ')
                    let menus = title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ link_slug: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }


                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.status)) {
                    if (data.status == 1) {
                        query = {
                            ...query,
                            $and: [{ expiration_date: { $gt: new Date(Date.now()) } }, { status: 1 }],
                        }
                    } else {
                        query = {
                            ...query,
                            $or: [{ expiration_date: { $lte: new Date(Date.now()) } }, { status: 0 }],
                        }
                    }
                }

                let filter = { _id: -1 }

                if (helper.isDefine(data.cost)) {
                    filter = {
                        cost: sanitize(data.cost)
                    }
                }

                let result = await UserModel.find(query).limit(data.limit).skip(data.offset).sort(filter)

                for (let i = 0; i < result.length; i++) {
                    if (new Date(result[i].expiration_date) < new Date(Date.now())) {
                        result[i].status = 0
                    }

                    const agency = await AgencyModel.findById(result[i].id_agency)
                    if (helper.isDefine(agency)) {
                        result[i] = {
                            ...result[i]._doc,
                            agency: agency
                        }

                    }
                }

                callback(result)
            } else {
                callback(null);
            }
        } catch (err) {
            helper.throwError(err);
            callback(null);
        }
    })

    socket.on('post-sell-salons', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/SellSalon');
                //let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                let query = {}
                if (helper.isDefine(data.input) && data.input.length > 0) {
                    let title = data.input
                    title = title.trim()
                    title = helper.stringToSlug(title).replaceAll('-', ' ')
                    let menus = title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ link_slug: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }

                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.status)) {
                    if (data.status == 1) {
                        query = {
                            ...query,
                            $and: [{ expiration_date: { $gt: new Date(Date.now()) } }, { status: 1 }],
                        }
                    } else {
                        query = {
                            ...query,
                            $or: [{ expiration_date: { $lte: new Date(Date.now()) } }, { status: 0 }],
                        }
                    }
                }

                let filter = { _id: -1 }

                if (helper.isDefine(data.price)) {
                    filter = {
                        price: sanitize(data.price)
                    }
                }

                // UserModel.find(query, (err, result) => {
                //     helper.throwError(err)
                //     for (let i = 0; i < result.length; i++) {
                //         if (new Date(result[i].expiration_date) < new Date(Date.now())) {
                //             result[i].status = 0
                //         }
                //         result[i].code = helper.formatZipCode(result[i].code)
                //     }

                //     callback(result)
                // }).limit((data.limit)).skip((data.offset)).sort(filter);


                let result = await UserModel.find(query).limit(data.limit).skip(data.offset).sort(filter)

                for (let i = 0; i < result.length; i++) {
                    if (new Date(result[i].expiration_date) < new Date(Date.now())) {
                        result[i].status = 0
                    }

                    const agency = await AgencyModel.findById(result[i].id_agency)
                    if (helper.isDefine(agency)) {
                        result[i] = {
                            ...result[i]._doc,
                            agency: agency
                        }
                    }
                }
                callback(result)
            } else {
                callback(null);
            }
        } catch (err) {
            helper.throwError(err);
            callback(null);
        }
    });

    socket.on('post-nail-supplies', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/NailSupply');
                //let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                let query = {}
                if (helper.isDefine(data.input) && data.input.length > 0) {
                    let title = data.input
                    title = title.trim()
                    title = helper.stringToSlug(title).replaceAll('-', ' ')
                    let menus = title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ link_slug: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }

                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.status)) {
                    if (data.status == 1) {
                        query = {
                            ...query,
                            $and: [{ expiration_date: { $gt: new Date(Date.now()) } }, { status: 1 }],
                        }
                    } else {
                        query = {
                            ...query,
                            $or: [{ expiration_date: { $lte: new Date(Date.now()) } }, { status: 0 }],
                        }
                    }
                }

                let filter = { _id: -1 }

                if (helper.isDefine(data.price)) {
                    filter = {
                        price: sanitize(data.price)
                    }
                }

                // UserModel.find(query, (err, result) => {
                //     helper.throwError(err)
                //     for (let i = 0; i < result.length; i++) {
                //         if (new Date(result[i].expiration_date) < new Date(Date.now())) {
                //             result[i].status = 0
                //         }
                //         result[i].code = helper.formatZipCode(result[i].code)
                //     }
                //     callback(result)
                // }).limit((data.limit)).skip((data.offset)).sort(filter);;
                let result = await UserModel.find(query).limit(data.limit).skip(data.offset).sort(filter)

                for (let i = 0; i < result.length; i++) {
                    if (new Date(result[i].expiration_date) < new Date(Date.now())) {
                        result[i].status = 0
                    }

                    const agency = await AgencyModel.findById(result[i].id_agency)
                    if (helper.isDefine(agency)) {
                        result[i] = {
                            ...result[i]._doc,
                            agency: agency
                        }

                    }
                }

                callback(result)
            } else {
                callback(null);
            }
        } catch (err) {
            helper.throwError(err);
            callback(null);
        }
    })

    socket.on('post-blogs', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Blog');
                //let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } }

                let query = {}
                if (helper.isDefine(data.input) && data.input.length > 0) {
                    let title = data.input
                    title = title.trim()
                    title = helper.stringToSlug(title).replaceAll('-', ' ')
                    let menus = title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ link_slug: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }

                let filter = { _id: -1 }

                let result = await UserModel.find(query).limit(data.limit).skip(data.offset).sort(filter)

                callback(result)
            } else {
                callback(null);
            }
        } catch (err) {
            helper.throwError(err);
            callback(null);
        }
    })

    socket.on('count-post-blogs', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {

                const UserModel = require('./models/Blog');
                //let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } }

                let query = {}
                if (helper.isDefine(data.input) && data.input.length > 0) {
                    let title = data.input
                    title = title.trim()
                    title = helper.stringToSlug(title).replaceAll('-', ' ')
                    let menus = title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ link_slug: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }

                const object = await UserModel.find(query).countDocuments();
                callback(object)
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('options-posts', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {
                const UserModel = require('./models/OptionsPosts');
                let query = { name: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" }, type: data.type };

                UserModel.find(query, (err, result) => {
                    helper.throwError(err);
                    callback(result);
                }).limit((data.limit)).skip((data.offset)).sort({ _id: -1 });;
            } else {
                callback(null);
            }
        } catch (err) {
            helper.throwError(err);
            callback(null);
        }
    });

    socket.on('history-payments', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {
                const UserModel = require('./models/HistoryPayments');
                let query = {};

                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.type)) {
                    query = {
                        ...query,
                        type: sanitize(data.type)
                    }
                }

                let filter = { _id: -1 }

                if (helper.isDefine(data.cost)) {
                    filter = {
                        cost: sanitize(data.cost)
                    }
                }

                UserModel.find(query, (err, result) => {
                    helper.throwError(err);
                    callback(result);
                }).limit((data.limit)).skip((data.offset)).sort(filter);;
            } else {
                callback(null);
            }
        } catch (err) {
            helper.throwError(err);
            callback(null);
        }
    });

    socket.on('agencies', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Agency');
                let query = {}

                if (helper.isDefine(data.input) && data.input.length > 0) {
                    query = {
                        ...query,
                        name: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" }
                    }
                }

                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                if (helper.isDefine(data.status)) {
                    query = {
                        ...query,
                        status: sanitize(data.status)
                    }
                }

                UserModel.find(query, (err, result) => {
                    helper.throwError(err);
                    callback(result);
                }).limit((data.limit)).skip((data.offset)).sort({ _id: -1 });;
            } else {
                callback(null);
            }
        } catch (err) {
            helper.throwError(err);
            callback(null);
        }
    });

    socket.on('count-post-jobs', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {

                const UserModel = require('./models/Job');
                //let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };

                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                let query = {}
                if (helper.isDefine(data.input) && data.input.length > 0) {
                    let title = data.input
                    title = title.trim()
                    title = helper.stringToSlug(title).replaceAll('-', ' ')
                    let menus = title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ link_slug: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }


                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.status)) {
                    if (data.status == 1) {
                        query = {
                            ...query,
                            $and: [{ expiration_date: { $gt: new Date(Date.now()) } }, { status: 1 }],
                        }
                    } else {
                        query = {
                            ...query,
                            $or: [{ expiration_date: { $lte: new Date(Date.now()) } }, { status: 0 }],
                        }
                    }
                }

                const object = await UserModel.find(query).countDocuments();
                callback(object);
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('post-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {

                let UserModel
                if (data.type == 0) {
                    UserModel = require('./models/Job');
                } else if (data.type == 1) {
                    UserModel = require('./models/SellSalon');
                } else if (data.type == 2) {
                    UserModel = require('./models/NailSupply');
                }

                let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" }, id_agency: data._id };

                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.status)) {
                    if (data.status == 1) {
                        query = {
                            ...query,
                            $and: [{ expiration_date: { $gt: new Date(Date.now()) } }, { status: 1 }],
                        }
                    } else {
                        query = {
                            ...query,
                            $or: [{ expiration_date: { $lte: new Date(Date.now()) } }, { status: 0 }],
                        }
                    }
                }

                let filter = { _id: -1 }

                if (helper.isDefine(data.cost)) {
                    filter = {
                        cost: sanitize(data.cost)
                    }
                }

                const result = await UserModel.find(query).sort(filter).limit(data.limit).skip(data.offset)

                for (let i = 0; i < result.length; i++) {
                    if (result[i].expiration_date < new Date(Date.now())) {
                        result[i].status = 0
                    }
                }
                callback(result)

            } else {
                callback(null);
            }
        } catch (err) {
            helper.throwError(err);
            callback(null);
        }
    });

    socket.on('count-post-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {

                const JobModel = require('./models/Job');
                const SellSalonModel = require('./models/SellSalon');
                const NailSupplyModel = require('./models/NailSupply');
                let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" }, id_agency: data._id };

                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.status)) {
                    if (data.status == 1) {
                        query = {
                            ...query,
                            $and: [{ expiration_date: { $gt: new Date(Date.now()) } }, { status: 1 }],
                        }
                    } else {
                        query = {
                            ...query,
                            $or: [{ expiration_date: { $lte: new Date(Date.now()) } }, { status: 0 }],
                        }
                    }
                }

                const resultJob = await JobModel.find(query).countDocuments();
                const resultSellSalon = await SellSalonModel.find(query).countDocuments();
                const resultNailSupply = await NailSupplyModel.find(query).countDocuments();

                const results = [resultJob, resultSellSalon, resultNailSupply]
                callback(results);
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('count-post-sell-salons', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {

                const UserModel = require('./models/SellSalon');
                //let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                let query = {}
                if (helper.isDefine(data.input) && data.input.length > 0) {
                    let title = data.input
                    title = title.trim()
                    title = helper.stringToSlug(title).replaceAll('-', ' ')
                    let menus = title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ link_slug: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }

                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.status)) {
                    if (data.status == 1) {
                        query = {
                            ...query,
                            $and: [{ expiration_date: { $gt: new Date(Date.now()) } }, { status: 1 }],
                        }
                    } else {
                        query = {
                            ...query,
                            $or: [{ expiration_date: { $lte: new Date(Date.now()) } }, { status: 0 }],
                        }
                    }
                }

                const object = await UserModel.find(query).countDocuments();
                callback(object);
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('count-post-nail-supplies', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {

                const UserModel = require('./models/NailSupply');
                //let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                let query = {}
                if (helper.isDefine(data.input) && data.input.length > 0) {
                    let title = data.input
                    title = title.trim()
                    title = helper.stringToSlug(title).replaceAll('-', ' ')
                    let menus = title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ link_slug: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }

                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.status)) {
                    if (data.status == 1) {
                        query = {
                            ...query,
                            $and: [{ expiration_date: { $gt: new Date(Date.now()) } }, { status: 1 }],
                        }
                    } else {
                        query = {
                            ...query,
                            $or: [{ expiration_date: { $lte: new Date(Date.now()) } }, { status: 0 }],
                        }
                    }
                }

                const object = await UserModel.find(query).countDocuments();
                callback(object);
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('count-options-posts', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {

                const UserModel = require('./models/OptionsPosts');
                let query = {}

                if (helper.isDefine(data.input) && data.input.length > 0) {
                    query = {
                        ...query,
                        name: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" }
                    }
                }
                let results = [0, 0, 0]

                const object = await UserModel.find(query);

                for (let i = 0; i < object.length; i++) {
                    results[object[i].type]++
                }

                callback(results);
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('count-history-payments', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {

                const UserModel = require('./models/HistoryPayments');

                let results = [0, 0, 0, 0]

                let query = {}
                    // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                    //     query = {
                    //         ...query,
                    //         $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                    //     }
                    // }

                if (helper.isDefine(data.package)) {
                    query = {
                        ...query,
                        package: sanitize(data.package)
                    }
                }

                if (helper.isDefine(data.type)) {
                    query = {
                        ...query,
                        type: sanitize(data.type)
                    }
                }

                const object = await UserModel.find(query);

                for (let i = 0; i < object.length; i++) {
                    results[object[i].type + 1]++
                        results[0]++
                }

                callback(results);
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('count-agencies', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {

                const UserModel = require('./models/Agency');
                let query = {}

                if (helper.isDefine(data.input) && data.input.length > 0) {
                    query = {
                        ...query,
                        name: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" }
                    }
                }

                // if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
                //   query = {
                //     ...query,
                //     $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
                //   }
                // }

                if (helper.isDefine(data.status)) {
                    query = {
                        ...query,
                        status: sanitize(data.status)
                    }
                }

                const object = await UserModel.find(query).countDocuments();
                callback(object);
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('total-money-history-payments', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {

                const UserModel = require('./models/HistoryPayments');

                const object = await UserModel.find();

                let totalMoney = 0
                for (let i = 0; i < object.length; i++) {
                    totalMoney += object[i].cost
                }

                callback(totalMoney);
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('update-posts-jobs', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Job');
                let query = { _id: sanitize(data.id_product) }
                let objForUpdate = {}
                if (helper.isDefine(data.status)) objForUpdate.status = sanitize(data.status)

                objForUpdate = { $set: objForUpdate }
                UserModel.updateOne(query, objForUpdate, optsValidator, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('update-posts-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {
                let UserModel
                if (data.type == 0) {
                    UserModel = require('./models/Job');
                } else if (data.type == 1) {
                    UserModel = require('./models/SellSalon');
                } else if (data.type == 2) {
                    UserModel = require('./models/NailSupply');
                }

                let query = { _id: sanitize(data.id_product) }
                let objForUpdate = {}
                if (data.status) objForUpdate.status = sanitize(data.status);

                objForUpdate = { $set: objForUpdate };
                UserModel.updateOne(query, objForUpdate, optsValidator, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('update-posts-sell-salons', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/SellSalon');
                let query = { _id: sanitize(data.id_product) }
                let objForUpdate = {}
                if (helper.isDefine(data.status)) objForUpdate.status = sanitize(data.status)

                objForUpdate = { $set: objForUpdate };
                UserModel.updateOne(query, objForUpdate, optsValidator, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('update-posts-nail-supplies', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/NailSupply');
                let query = { _id: sanitize(data.id_product) }
                let objForUpdate = {}
                if (helper.isDefine(data.status)) objForUpdate.status = sanitize(data.status)

                objForUpdate = { $set: objForUpdate };
                UserModel.updateOne(query, objForUpdate, optsValidator, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('update-agencies', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Agency');
                let query = { _id: sanitize(data.id_product) }
                let objForUpdate = {}
                if (helper.isDefine(data.status)) objForUpdate.status = sanitize(data.status)

                objForUpdate = { $set: objForUpdate };

                const result = await UserModel.updateOne(query, objForUpdate, optsValidator);

                if (data.status == 0) {
                    const postJobModel = require('./models/Job');
                    const postSellSalonModel = require('./models/SellSalon');
                    const postNailSupplyModel = require('./models/NailSupply');
                    await postJobModel.updateMany({ id_agency: sanitize(data.id_product) }, { $set: { status: 0 } }, optsValidator);
                    await postSellSalonModel.updateMany({ id_agency: sanitize(data.id_product) }, { $set: { status: 0 } }, optsValidator);
                    await postNailSupplyModel.updateMany({ id_agency: sanitize(data.id_product) }, { $set: { status: 0 } }, optsValidator);
                }

                callback(result);

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('delete-agencies', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Agency');
                let query = { _id: sanitize(data.id_product) }

                UserModel.deleteOne(query, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('delete-posts-jobs', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Job');
                let query = { _id: sanitize(data.id_product) }

                UserModel.deleteOne(query, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('delete-posts-blog', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Blog');
                let query = { _id: sanitize(data.id_product) }

                UserModel.deleteOne(query, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('delete-posts-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {
                let UserModel
                if (data.type == 0) {
                    UserModel = require('./models/Job');
                } else if (data.type == 1) {
                    UserModel = require('./models/SellSalon');
                } else if (data.type == 2) {
                    UserModel = require('./models/NailSupply');
                }
                let query = { _id: sanitize(data.id_product) }

                UserModel.deleteOne(query, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('delete-posts-sell-salons', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/SellSalon');
                let query = { _id: sanitize(data.id_product) }

                UserModel.deleteOne(query, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('delete-posts-nail-supplies', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/NailSupply');
                let query = { _id: sanitize(data.id_product) }

                UserModel.deleteOne(query, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('counter-dashboard', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const postJobModel = require('./models/Job');
                const postSellSalonModel = require('./models/SellSalon');
                const postNailSuppliesModel = require('./models/NailSupply');
                const postUserModel = require('./models/Agency');
                let object = [0, 0, 0, 0]
                const query = { status: 1 }
                object[0] = await postJobModel.countDocuments(query);
                object[1] = await postSellSalonModel.countDocuments(query);
                object[2] = await postNailSuppliesModel.countDocuments(query);
                object[3] = await postUserModel.countDocuments(query);
                callback(object)
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('change-password-admin', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Admin');

                let query = { _id: sanitize(data._id), password: sanitize(data.old_password) }

                let result = await UserModel.findOne(query);

                if (result == null) {
                    return callback(null);
                }

                query = { _id: sanitize(data._id) }
                let objForUpdate = {}
                if (helper.isDefine(data.new_password)) objForUpdate.password = sanitize(data.new_password)

                objForUpdate = { $set: objForUpdate };

                result = await UserModel.updateOne(query, objForUpdate, optsValidator);

                callback(result);

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('update-options-posts', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {
                const UserModel = require('./models/OptionsPosts');
                let query = { _id: sanitize(data.id_product) }
                let objForUpdate = {}
                objForUpdate.options = sanitize(data.options_posts)
                objForUpdate.content = sanitize(data.content)
                objForUpdate.name = sanitize(data.name)
                objForUpdate = { $set: objForUpdate }
                result = await UserModel.findOneAndUpdate(query, objForUpdate, optsValidatorFindAndUpdate, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('delete-options-posts', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {
                const UserModel = require('./models/OptionsPosts');
                let query = { _id: sanitize(data.id_product) }

                UserModel.deleteOne(query, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('enable-options-posts', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {
                const UserModel = require('./models/OptionsPosts');
                let query = { _id: sanitize(data.id_product) }

                let objForUpdate = {}
                objForUpdate.status = sanitize(data.status)
                objForUpdate = { $set: objForUpdate }

                UserModel.updateOne(query, objForUpdate, optsValidator, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('update-payments-stripe', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {
                const UserModel = require('./models/PaymentStripe');

                let objForUpdate = {}
                objForUpdate.name = 'name'
                objForUpdate.public_key = sanitize(data.public_key)
                objForUpdate.secret_key = sanitize(data.secret_key)
                objForUpdate = { $set: objForUpdate }

                UserModel.findOneAndUpdate({}, objForUpdate, optsValidatorFindAndUpdate, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('payments-stripe', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {
                const UserModel = require('./models/PaymentStripe');

                const result = await UserModel.findOne()
                callback(result)

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('contact-us', async(data, callback) => {
        trafficsSocket(socket)
        try {
            const UserModel = require('./models/ContactUs');

            const result = await UserModel.findOne()
            callback(result)
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('update-contact-us', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password, true)) {
                const UserModel = require('./models/ContactUs');

                let objForUpdate = {}
                if (helper.isDefine(data.contact_us)) objForUpdate.contact_us = sanitize(data.contact_us)
                if (helper.isDefine(data.terms_of_use)) objForUpdate.terms_of_use = sanitize(data.terms_of_use)
                if (helper.isDefine(data.privacy_policy)) objForUpdate.privacy_policy = sanitize(data.privacy_policy)
                if (helper.isDefine(data.phone_support)) objForUpdate.phone_support = sanitize(data.phone_support)
                if (helper.isDefine(data.title_email_remind)) objForUpdate.title_email_remind = sanitize(data.title_email_remind)
                if (helper.isDefine(data.content_email_remind)) objForUpdate.content_email_remind = sanitize(data.content_email_remind)
                if (helper.isDefine(data.keyword)) objForUpdate.keyword = sanitize(data.keyword)
                if (helper.isDefine(data.description)) objForUpdate.description = sanitize(data.description)
                if (helper.isDefine(data.promotion)) objForUpdate.promotion = sanitize(data.promotion)
                objForUpdate = { $set: objForUpdate }

                UserModel.findOneAndUpdate({}, objForUpdate, optsValidatorFindAndUpdate, (err, result) => {
                    helper.throwError(err)
                    callback(result);
                });

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('chart-sales', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/HistoryPayments');

                const object = [0, 0, 0, 0, 0, 0, 0]

                const result = await UserModel.find()

                for (let i = 0; i < result.length; i++) {
                    object[result[i].type]++
                        object[result[i].type + 3] += result[i].cost
                    object[6] += result[i].cost
                }

                callback(object)

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('traffics', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLogin(data._id, data.password)) {
                const UserModel = require('./models/Traffic');

                let minDate, maxDate
                let object = { labels: [], datas: [{ label: 'App service', datas: [] }, { label: 'Web service', datas: [] }] }

                if (helper.isDefine(data.status) && data.status == 1) {
                    minDate = helper.getDate() + ' 00:00:00'
                    maxDate = helper.getDate() + ' 23:59:59'

                    for (let i = 0; i <= 23; i++) {
                        object.labels.push(i + ' h')
                        object.datas[0].datas.push(0)
                        object.datas[1].datas.push(0)
                    }
                } else if (helper.isDefine(data.status) && data.status == 2) {
                    minDate = helper.getDate().substr(0, 8) + '01' + ' 00:00:00'
                    maxDate = helper.getDate().substr(0, 8) + '31' + ' 23:59:59'

                    for (let i = 1; i <= 31; i++) {
                        object.labels.push(i + '')
                        object.datas[0].datas.push(0)
                        object.datas[1].datas.push(0)
                    }
                } else if (helper.isDefine(data.status) && data.status == 3) {
                    minDate = helper.getDate().substr(0, 5) + '01-01' + ' 00:00:00'
                    maxDate = helper.getDate().substr(0, 5) + '12-31' + ' 23:59:59'

                    for (let i = 1; i <= 12; i++) {
                        object.labels.push('M ' + i)
                        object.datas[0].datas.push(0)
                        object.datas[1].datas.push(0)
                    }
                }

                let query = {
                    createdAt: { $gte: sanitize(minDate), $lte: sanitize(maxDate) }
                }
                UserModel.find(query, (err, result) => {
                    helper.throwError(err)
                    if (data.status == 1) {
                        for (let i = 0; i < result.length; i++) {
                            let date = new Date(result[i].createdAt)
                            if (result[i].status == 0) {
                                object.datas[0].datas[helper.tryParseInt(date.getUTCHours())]++
                            } else {
                                object.datas[1].datas[helper.tryParseInt(date.getUTCHours())]++
                            }
                        }
                    } else if (data.status == 2) {
                        for (let i = 0; i < result.length; i++) {
                            let date = new Date(result[i].createdAt)
                            if (result[i].status == 0) {
                                object.datas[0].datas[helper.tryParseInt(date.getDate())]++
                            } else {
                                object.datas[1].datas[helper.tryParseInt(date.getDate())]++
                            }

                        }
                    } else if (data.status == 3) {
                        for (let i = 0; i < result.length; i++) {
                            let date = new Date(result[i].createdAt)
                            if (result[i].status == 0) {
                                object.datas[0].datas[helper.tryParseInt(date.getMonth())]++
                            } else {
                                object.datas[1].datas[helper.tryParseInt(date.getMonth())]++
                            }

                        }
                    }

                    callback(object)
                })
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    //----------End Clients Area---------//

    //----------Start Clients Area---------//

    socket.on('check-exist-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null) {
                const UserModel = require('./models/Agency');

                let query = { phone: sanitize(data.phone) }
                const result = await UserModel.findOne(query);
                callback(result)

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('sign-up-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null) {
                const UserModel = require('./models/Agency');

                let query = { phone: sanitize(data.phone), email: sanitize(data.email), password: sanitize(data.password) }

                const object = new UserModel(query);

                const savedObject = await object.save();

                callback(savedObject != null)

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('sign-in-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null) {
                const UserModel = require('./models/Agency');

                let query = { phone: sanitize(data.phone), password: sanitize(data.password), status: 1 }

                const result = await UserModel.findOne(query)
                if (helper.isDefine(result)) result.password = helper.encrypt(result.password)
                callback(result)
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('reset-password-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null) {
                const UserModel = require('./models/Agency')

                let query = { phone: sanitize(data.phone) }

                let objForUpdate = {}
                if (helper.isDefine(data.phone)) objForUpdate.phone = sanitize(data.phone)
                if (helper.isDefine(data.password)) objForUpdate.password = sanitize(data.password)

                objForUpdate = { $set: objForUpdate };
                UserModel.updateOne(query, objForUpdate, optsValidator, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('search', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (helper.isDefine(data)) {

                let UserModel

                if (data.categories.includes('sell-salon')) {
                    UserModel = require('./models/SellSalon')
                } else if (data.categories.includes('nail-supply')) {
                    UserModel = require('./models/NailSupply')
                } else {
                    UserModel = require('./models/Job')
                }

                //let query = { expiration_date: { $gte: new Date(Date.now()) }, status: 1 }
                let query = { status: 1, title: { $ne: data.title } }
                    //let querySearched = { expiration_date: { $gte: new Date(Date.now()) }, status: 1, title: data.title }
                let querySearched = { title: data.title, status: 1 }

                if (helper.isDefine(data.title) && data.title.length > 0) {
                    data.title = data.title.trim()
                    data.title = helper.stringToSlug(data.title).replaceAll('-', ' ')
                    let menus = data.title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ title_search: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }

                if (helper.isDefine(data.salary) && helper.tryParseInt(data.salary) != 0) {
                    let salary
                    if (data.categories.includes('sell-salon') || data.categories.includes('nail-supply')) {
                        salary = 'price'
                    } else {
                        salary = 'cost'
                    }

                    if (data.salary == 1) {
                        query = {
                            ...query,
                            $and: [{
                                [salary]: { $gte: 0 }
                            }, {
                                [salary]: { $lte: 500 }
                            }],
                        }
                        querySearched = {
                            ...querySearched,
                            $and: [{
                                [salary]: { $gte: 0 }
                            }, {
                                [salary]: { $lte: 500 }
                            }],
                        }
                    } else if (data.salary == 2) {
                        query = {
                            ...query,
                            $and: [{
                                [salary]: { $gte: 500 }
                            }, {
                                [salary]: { $lte: 1000 }
                            }],
                        }
                        querySearched = {
                            ...querySearched,
                            $and: [{
                                [salary]: { $gte: 500 }
                            }, {
                                [salary]: { $lte: 1000 }
                            }],
                        }
                    } else if (data.salary == 3) {
                        query = {
                            ...query,
                            $and: [{
                                [salary]: { $gte: 1000 }
                            }, {
                                [salary]: { $lte: 2000 }
                            }],
                        }
                        querySearched = {
                            ...querySearched,
                            $and: [{
                                [salary]: { $gte: 1000 }
                            }, {
                                [salary]: { $lte: 2000 }
                            }],
                        }
                    } else if (data.salary == 4) {
                        query = {
                            ...query,
                            $and: [{
                                [salary]: { $gte: 2000 }
                            }],
                        }
                        querySearched = {
                            ...querySearched,
                            $and: [{
                                [salary]: { $gte: 2000 }
                            }],
                        }
                    }
                }

                if (helper.isDefine(data.code) && data.code != 'null' && data.code != 0 && data.code != '0' && !helper.isDefine(data.title)) {
                    let state = helper.getStateByCode(data.code)
                    if (state != null) {
                        query = {
                            ...query,
                            state: sanitize(state),
                        }
                    } else {
                        query = {
                            ...query,
                            $and: [{ code: { $gte: sanitize(helper.tryParseInt(data.code) - 1000) } }, { code: { $lte: sanitize(helper.tryParseInt(data.code) + 1000) } }],
                        }
                    }
                }

                if (helper.isDefine(data.code) && helper.isDefine(data.distance)) {

                    const lat = helper.getLocationCityByCode(data.code).lat
                    const lng = helper.getLocationCityByCode(data.code).lng

                    if (helper.isDefine(lat) && helper.isDefine(lng)) {
                        let maxDistance

                        if (data.distance == 1) {
                            maxDistance = 20000 * 1.6
                        } else if (data.distance == 2) {
                            maxDistance = 50000 * 1.6
                        } else if (data.distance == 3) {
                            maxDistance = 100000 * 1.6
                        } else {
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

                let object
                if (helper.isDefine(data.type_search) && data.type_search) {
                    //object = await UserModel.find(query).limit(data.limit).skip(data.offset)
                    object = await UserModel.find(query)
                } else {
                    object = await UserModel.find(query).sort({ _id: -1 }).limit(data.limit).skip(data.offset)
                }

                let leftObjects = []
                let rightObjects = []
                for (let i = 0; i < object.length; i++) {
                    if (new Date(object[i]._doc.createdAt).getDay() == new Date().getDay() && object[i]._doc.package == 'Gold') {
                        leftObjects.push(object[i])
                    } else {
                        rightObjects.push(object[i])
                    }
                }
                object = leftObjects.concat(rightObjects)

                if (helper.isDefine(data.code) && data.code > 0 && helper.isDefine(data.distance)) {
                    const lat = helper.getLocationCityByCode(data.code).lat
                    const lng = helper.getLocationCityByCode(data.code).lng

                    if (helper.isDefine(lat) && helper.isDefine(lng)) {
                        for (let i = 0; i < object.length; i++) {
                            object[i] = {
                                ...object[i]._doc,
                                distance: helper.getDistanceFromLatLonInKm(object[i]._doc.location.coordinates[0], object[i]._doc.location.coordinates[1], lng, lat)
                            }
                        }

                        if (helper.isDefine(data.type_search) && helper.tryParseInt(data.type_search) > 0)
                            object.sort(function(a, b) {
                                return parseFloat(a.distance) - parseFloat(b.distance);
                            })
                    }
                }

                if (helper.isDefine(data.title) && data.title.length > 0) {
                    const objectSearched = await UserModel.findOne(querySearched)

                    if (helper.isDefine(objectSearched)) {
                        object.unshift(objectSearched)
                    }
                }

                let hightLights = []
                let normals = []

                for (let i = 0; i < object.length; i++) {
                    if ((new Date(Date.now())) > (new Date(object[i].expiration_date))) {
                        object[i].status = 0
                    }

                    // higlt light time
                    if (new Date(Date.now()).getTime() < (new Date(object[i].createdAt).getTime() + (1 * 60 * 60 * 1000))) {
                        hightLights.push(object[i])
                    } else {
                        normals.push(object[i])
                    }
                }

                object = hightLights.concat(normals)

                if (helper.isDefine(data.type_search) && data.type_search) {
                    let tempObject = []
                    for (let i = data.offset; i < data.limit + data.offset && i < object.length; i++) {
                        tempObject.push(object[i])
                    }
                    object = tempObject
                }

                callback(object)

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('count-search', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (helper.isDefine(data)) {

                let UserModel

                if (data.categories.includes('sell-salon')) {
                    UserModel = require('./models/SellSalon')
                } else if (data.categories.includes('nail-supply')) {
                    UserModel = require('./models/NailSupply')
                } else {
                    UserModel = require('./models/Job')
                }

                //let query = { expiration_date: { $gte: new Date(Date.now()) }, status: 1 }
                let query = { status: 1, title: { $ne: data.title } }
                    //let querySearched = { expiration_date: { $gte: new Date(Date.now()) }, status: 1, title: data.title }
                let querySearched = { title: data.title, status: 1 }

                if (helper.isDefine(data.title) && data.title.length > 0) {
                    data.title = data.title.trim()
                    data.title = helper.stringToSlug(data.title).replaceAll('-', ' ')
                    let menus = data.title.split(' ')
                    let queryTitle = []
                    for (let i = 0; i < menus.length; i++) {
                        queryTitle.push({ title_search: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                    }
                    query = {
                        ...query,
                        $or: queryTitle,
                    }
                }

                if (helper.isDefine(data.salary) && helper.tryParseInt(data.salary) != 0) {
                    let salary
                    if (data.categories.includes('sell-salon') || data.categories.includes('nail-supply')) {
                        salary = 'price'
                    } else {
                        salary = 'cost'
                    }

                    if (data.salary == 1) {
                        query = {
                            ...query,
                            $and: [{
                                [salary]: { $gte: 0 }
                            }, {
                                [salary]: { $lte: 500 }
                            }],
                        }
                        querySearched = {
                            ...querySearched,
                            $and: [{
                                [salary]: { $gte: 0 }
                            }, {
                                [salary]: { $lte: 500 }
                            }],
                        }
                    } else if (data.salary == 2) {
                        query = {
                            ...query,
                            $and: [{
                                [salary]: { $gte: 500 }
                            }, {
                                [salary]: { $lte: 1000 }
                            }],
                        }
                        querySearched = {
                            ...querySearched,
                            $and: [{
                                [salary]: { $gte: 500 }
                            }, {
                                [salary]: { $lte: 1000 }
                            }],
                        }
                    } else if (data.salary == 3) {
                        query = {
                            ...query,
                            $and: [{
                                [salary]: { $gte: 1000 }
                            }, {
                                [salary]: { $lte: 2000 }
                            }],
                        }
                        querySearched = {
                            ...querySearched,
                            $and: [{
                                [salary]: { $gte: 1000 }
                            }, {
                                [salary]: { $lte: 2000 }
                            }],
                        }
                    } else if (data.salary == 4) {
                        query = {
                            ...query,
                            $and: [{
                                [salary]: { $gte: 2000 }
                            }],
                        }
                        querySearched = {
                            ...querySearched,
                            $and: [{
                                [salary]: { $gte: 2000 }
                            }],
                        }
                    }
                }

                if (helper.isDefine(data.code) && data.code != 'null' && data.code != 0 && data.code != '0' && !helper.isDefine(data.title)) {
                    let state = helper.getStateByCode(data.code)
                    if (state != null) {
                        query = {
                            ...query,
                            state: sanitize(state),
                        }
                    } else {
                        query = {
                            ...query,
                            $and: [{ code: { $gte: sanitize(helper.tryParseInt(data.code) - 1000) } }, { code: { $lte: sanitize(helper.tryParseInt(data.code) + 1000) } }],
                        }
                    }
                }

                if (helper.isDefine(data.code) && helper.isDefine(data.distance)) {

                    const lat = helper.getLocationCityByCode(data.code).lat
                    const lng = helper.getLocationCityByCode(data.code).lng

                    if (helper.isDefine(lat) && helper.isDefine(lng)) {
                        let maxDistance

                        if (data.distance == 1) {
                            maxDistance = 20000 * 1.6
                        } else if (data.distance == 2) {
                            maxDistance = 50000 * 1.6
                        } else if (data.distance == 3) {
                            maxDistance = 100000 * 1.6
                        } else {
                            maxDistance = 10000000 * 1.6
                        }
                        query = {
                            ...query,
                            location: {
                                $near: {
                                    $geometry: {
                                        type: "Point",
                                        coordinates: [sanitize(lng), sanitize(lat)],
                                    },
                                    $minDistance: 0,
                                    $maxDistance: maxDistance,
                                }
                            }
                        }
                    }
                }

                let object = await UserModel.find(query)
                object = object.length

                if (helper.isDefine(data.title) && data.title.length > 0) {
                    const objectSearched = await UserModel.findOne(querySearched)

                    if (helper.isDefine(objectSearched)) {
                        object++
                    }
                }

                callback(object)
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })



    socket.on('search-country', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (helper.isDefine(data)) {
                data.val = data.val.trim().toUpperCase()
                let counter = 0
                let result = []

                for (let i = 0; i < helper.codeCountrys.length; i++) {
                    if ((helper.isDefine(helper.codeCountrys[i][4]) && helper.codeCountrys[i][4].toUpperCase().includes(data.val.split(' ')[data.val.split(' ').length - 1])) || (helper.isDefine(helper.codeCountrys[i][3]) && helper.codeCountrys[i][3].toUpperCase().includes(data.val)) || (helper.isDefine(helper.codeCountrys[i][0]) && helper.getOnlyNumber(data.val) && helper.codeCountrys[i][0].includes(helper.getOnlyNumber(data.val)))) {
                        if (counter > 100) {
                            break
                        } else {
                            ++counter
                        }
                        result.push(helper.codeCountrys[i])
                    }
                }

                if (counter < 100) {
                    for (let i = 0; i < helper.codeCountrys.length; i++) {
                        if (helper.contains(helper.codeCountrys[i][3], data.val) || helper.contains(helper.codeCountrys[i][0], data.val)) {
                            if (counter > 100) {
                                break
                            } else {
                                ++counter
                            }
                            result.push(helper.codeCountrys[i])
                        }
                    }
                }

                let bestResult = []
                for (let i = 0; i < result.length; i++) {
                    if ((result[i][3] + "").substring(0, 1).toUpperCase().includes((data.val + "").substring(0, 1).toUpperCase())) {
                        bestResult.push(result[i])
                    }
                }

                for (let i = 0; i < result.length; i++) {
                    bestResult.push(result[i])
                }

                let bestFinalResult = []

                counter = 0
                for (let i = 0; i < bestResult.length; i++) {
                    if (++counter > 100) {
                        break
                    }
                    bestFinalResult.push(bestResult[i])
                }

                callback(bestFinalResult)
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('search-nail-supply', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (helper.isDefine(data)) {
                //let query = { title: { $regex: ".*" + sanitize(data.val != undefined ? data.val : '') + ".*", $options: "$i" }, expiration_date: { $gte: new Date(Date.now()) }, status: 1 }


                //let query = { title: { $regex: ".*" + sanitize(data.val != undefined ? data.val : '') + ".*", $options: "$i" }, status: 1 }

                let query = { status: 1 }
                let title = data.val
                title = title.trim()
                title = helper.stringToSlug(title).replaceAll('-', ' ')
                let menus = title.split(' ')
                let queryTitle = []
                for (let i = 0; i < menus.length; i++) {
                    queryTitle.push({ title_search: { $regex: ".*" + (menus[i]) + ".*", $options: "$i" } })
                }
                query = {
                    ...query,
                    $or: queryTitle,
                }

                const nailSupplyModel = require('./models/NailSupply')
                const results = await nailSupplyModel.find(query).limit(10)
                callback(results)
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('name-country-by-code', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (helper.isDefine(data)) {
                let indexSearch = 5000

                let relateCities = []
                let nameCity

                for (let i = 0; i < helper.codeCountrys.length; i++) {
                    if (helper.tryParseInt(helper.codeCountrys[i][0]) == helper.tryParseInt(data.code)) {
                        indexSearch = i
                        nameCity = helper.codeCountrys[i][3] + ', ' + helper.codeCountrys[i][4] + ' ' + helper.codeCountrys[i][0]
                        break
                    }
                }
                for (let j = indexSearch - 10000; j < indexSearch + 10000; j++) {
                    if (helper.isDefine(helper.codeCountrys[j]) && indexSearch != j) {
                        let isHave = false
                        for (let k = 0; k < relateCities.length; k++) {
                            if (helper.codeCountrys[j][4] == relateCities[k][4]) {
                                isHave = true
                                break
                            }
                        }
                        if (!isHave) {
                            relateCities.push(helper.codeCountrys[j])
                        }
                    }
                }

                callback({ name_city: nameCity, relateCities: relateCities })

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    });

    socket.on('featured', async(data, callback) => {
        trafficsSocket(socket)
        try {
            const jobModel = require('./models/Job')
            const sellSalonModel = require('./models/SellSalon')
            const nailSupplyModel = require('./models/NailSupply')

            let query = { expiration_date: { $gte: new Date() }, package: 'Gold', status: 1 }

            let resultJobs = await jobModel.aggregate([{ $match: query }, { $sample: { size: 5 } }])
            let resultSellSalon = await sellSalonModel.aggregate([{ $match: query }, { $sample: { size: 5 } }])
            let resultNailSupply = await nailSupplyModel.aggregate([{ $match: query }, { $sample: { size: 5 } }])

            for (let i = 0; i < resultJobs.length; i++) {
                resultJobs[i] = {
                    ...resultJobs[i],
                    type: 1
                }
            }

            for (let i = 0; i < resultSellSalon.length; i++) {
                resultSellSalon[i] = {
                    ...resultSellSalon[i],
                    type: 2
                }
            }

            for (let i = 0; i < resultNailSupply.length; i++) {
                resultNailSupply[i] = {
                    ...resultNailSupply[i],
                    type: 3
                }
            }
            callback(resultJobs.concat(resultSellSalon).concat(resultNailSupply))

        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('update-changed-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {
                const UserModel = require('./models/Agency');
                let query = { _id: sanitize(data._id) }
                let objForUpdate = {}
                if (helper.isDefine(data.name)) objForUpdate.name = data.name;
                if (helper.isDefine(data.email)) objForUpdate.email = data.email;
                if (helper.isDefine(data.country)) objForUpdate.country = data.country;

                objForUpdate = { $set: objForUpdate };
                UserModel.updateOne(query, objForUpdate, optsValidator, (err, result) => {
                    if (err) helper.throwError(err);
                    callback(result);
                });
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('options-posts-jobs-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {
                const UserModel = require('./models/OptionsPosts')

                let query = { type: 0, status: 1 }
                const result = await UserModel.find(query)

                callback(result)

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('options-posts-sell-salon-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {
                const UserModel = require('./models/OptionsPosts')

                let query = { type: 1, status: 1 }
                const result = await UserModel.find(query)

                callback(result)

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('options-posts-nail-supply-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {
                const UserModel = require('./models/OptionsPosts')

                let query = { type: 2, status: 1 }
                const result = await UserModel.find(query)

                callback(result)

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('payments-stripes', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {
                const UserModel = require('./models/PaymentStripe')

                const result = await UserModel.findOne()

                callback(result.public_key)

            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('change-password-agency', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null) {
                const UserModel = require('./models/Agency')
                const result = await UserModel.findOne({ _id: data._id, password: data.password })
                if (!helper.isDefine(result)) {
                    callback(null)
                } else {
                    let query = { _id: sanitize(data._id) }

                    let objForUpdate = {}
                    if (helper.isDefine(data.password)) objForUpdate.password = data.new_password

                    objForUpdate = { $set: objForUpdate }
                    UserModel.updateOne(query, objForUpdate, optsValidator, (err, result) => {
                        if (err) helper.throwError(err)
                        callback(result);
                    })
                }
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    socket.on('on-update-images-post', async(data, callback) => {
        trafficsSocket(socket)
        try {
            if (data != null && await helper.checkLoginAgency(data._id, data.password)) {

                let pathImage
                let UserModel
                if (data.type == 1) {
                    UserModel = require('./models/Job')
                    pathImage = 'public/images-jobs/'
                } else if (data.type == 2) {
                    UserModel = require('./models/SellSalon')
                    pathImage = 'public/images-sells-salons/'
                } else if (data.type == 3) {
                    UserModel = require('./models/NailSupply')
                    pathImage = 'public/images-nail-supplies/'
                }

                const result = await UserModel.findById(sanitize(data.id_post))

                let query = { _id: sanitize(data.id_post) }
                let objForUpdate = {}
                objForUpdate.images = sanitize(data.images)
                objForUpdate = { $set: objForUpdate }

                await UserModel.updateOne(query, objForUpdate, optsValidator)

                let resultNeedDelete = []
                for (let i = 0; i < result.images.length; i++) {
                    for (let j = 0; j < data.images.length; j++) {
                        if (result.images[i] == data.images[j]) {
                            break
                        }
                        if (j == data.images.length - 1) {
                            resultNeedDelete.push(result.images[i])
                        }
                    }
                }

                for (let i = 0; i < resultNeedDelete.length; i++) {
                    helper.fs.unlinkSync(pathImage + resultNeedDelete[i])
                    helper.fs.unlinkSync(pathImage + 'icon-' + resultNeedDelete[i])
                }

                callback(result)
            } else {
                callback(null);
            }
        } catch (e) {
            helper.throwError(e);
            callback(null);
        }
    })

    //----------END Clients Area---------//

})

const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'hi@247nailsalons.com',
        pass: 'Tomhotro247@',
    },
});

croner.schedule('* * * * *', async() => {
    try {
        const results = await ReminderPostModel.find()
        const resultContact = await ContactModel.findOne()

        for (let i = 0; i < results.length; i++) {
            let query = { _id: results[i].id_post, expiration_date: { $lt: new Date(Date.now()) } }
            const job = await JobPostModel.findOne(query)
            const sellSalon = await SellSalonPostModel.findOne(query)
            const nailSupply = await NailSupplyPostModel.findOne(query)

            let name, email, title, content

            if (job) {
                title = job.title
                content = job.content
                const agency = await AgencyModel.findById(job.id_agency)
                email = agency.email
                name = agency.name
            }

            if (sellSalon) {
                title = sellSalon.title
                content = sellSalon.content
                const agency = await AgencyModel.findById(sellSalon.id_agency)
                email = agency.email
                name = agency.name
            }

            if (nailSupply) {
                title = nailSupply.title
                content = nailSupply.content
                const agency = await AgencyModel.findById(nailSupply.id_agency)
                email = agency.email
                name = agency.name
            }

            if (helper.isDefine(email)) {
                await transporter.sendMail({
                    from: 'hi@247nailsalons.com',
                    to: email,
                    subject: resultContact.title_email_remind,
                    text: resultContact.title_email_remind,
                    html: "<b>Hi " + name + "</b>" + resultContact.content_email_remind,
                })

                await ReminderPostModel.deleteOne({ _id: results[i]._id })
            }

        }
    } catch (err) {
        helper.throwError(err)
    }
})

croner.schedule('23 * * * *', async() => {
    try {
        const fs = require('fs')

        let page = '<?xml version="1.0" encoding="UTF-8"?>' + '\n'
        page += '<urlset' + '\n'
        page += 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' + '\n'
        page += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' + '\n'
        page += 'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9' + '\n'
        page += 'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">' + '\n'

        page += '<url>' + '\n'
        page += '<loc>' + domain + '</loc>' + '\n'
        page += '<lastmod>' + new Date().toString() + '</lastmod>' + '\n'
        page += '<priority>1.00</priority>' + '\n'
        page += '</url>' + '\n'

        page += '<url>' + '\n'
        page += '<loc>' + domain + 'search?categories=find-job</loc>' + '\n'
        page += '<lastmod>' + new Date().toString() + '</lastmod>' + '\n'
        page += '<priority>0.80</priority>' + '\n'
        page += '</url>' + '\n'

        page += '<url>' + '\n'
        page += '<loc>' + domain + 'search?categories=sell-salon</loc>' + '\n'
        page += '<lastmod>' + new Date().toString() + '</lastmod>' + '\n'
        page += '<priority>0.80</priority>' + '\n'
        page += '</url>' + '\n'

        page += '<url>' + '\n'
        page += '<loc>' + domain + 'search?categories=nail-supply</loc>' + '\n'
        page += '<lastmod>' + new Date().toString() + '</lastmod>' + '\n'
        page += '<priority>0.80</priority>' + '\n'
        page += '</url>' + '\n'


        const JobModel = require('./models/Job')
        const SellSalonModel = require('./models/SellSalon')
        const NailSupplyModel = require('./models/NailSupply')

        const jobs = await JobModel.find().sort({ _id: -1 }).limit(50)
        const sellSalons = await SellSalonModel.find().sort({ _id: -1 }).limit(50)
        const nailSupplys = await NailSupplyModel.find().sort({ _id: -1 }).limit(50)

        for (let i = 0; i < jobs.length; i++) {
            page += '<url>' + '\n'
            page += '<loc>' + domain + 'posts-jobs/' + jobs[i].link_slug + '</loc>' + '\n'
            page += '<lastmod>' + new Date(jobs[i].updateAt).toString() + '</lastmod>' + '\n'
            page += '<priority>0.70</priority>' + '\n'
            page += '</url>' + '\n'
        }

        for (let i = 0; i < sellSalons.length; i++) {
            page += '<url>' + '\n'
            page += '<loc>' + domain + 'posts-sell-salons/' + sellSalons[i].link_slug + '</loc>' + '\n'
            page += '<lastmod>' + new Date(sellSalons[i].updateAt).toString() + '</lastmod>' + '\n'
            page += '<priority>0.70</priority>' + '\n'
            page += '</url>' + '\n'
        }

        for (let i = 0; i < nailSupplys.length; i++) {
            page += '<url>' + '\n'
            page += '<loc>' + domain + 'posts-nail-supplies/' + nailSupplys[i].link_slug + '</loc>' + '\n'
            page += '<lastmod>' + new Date(nailSupplys[i].updateAt).toString() + '</lastmod>' + '\n'
            page += '<priority>0.70</priority>' + '\n'
            page += '</url>' + '\n'
        }

        page += '<url>' + '\n'
        page += '<loc>' + domain + 'privacy-policy</loc>' + '\n'
        page += '<lastmod>' + new Date().toString() + '</lastmod>' + '\n'
        page += '<priority>0.10</priority>' + '\n'
        page += '</url>' + '\n'

        page += '<url>' + '\n'
        page += '<loc>' + domain + 'terms-of-use</loc>' + '\n'
        page += '<lastmod>' + new Date().toString() + '</lastmod>' + '\n'
        page += '<priority>0.10</priority>' + '\n'
        page += '</url>' + '\n'

        page += '<url>' + '\n'
        page += '<loc>' + domain + 'terms-of-use</loc>' + '\n'
        page += '<lastmod>' + new Date().toString() + '</lastmod>' + '\n'
        page += '<priority>0.10</priority>' + '\n'
        page += '</url>' + '\n'

        page += '</urlset>'

        fs.writeFile('sitemap.xml', page, function(err) {

        })
    } catch (err) {
        helper.throwError(err)
    }
})
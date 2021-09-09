require('dotenv/config')
const hash = require('js-sha512')
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const logger = require('morgan')
const sanitize = require('mongo-sanitize')
const mongoSanitize = require('express-mongo-sanitize');
const helper = require('./helper/helper')
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } })

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(mongoSanitize());
app.use(logger('dev'));
//app.use(express.static("views"));
app.use(express.static(__dirname));

app.get('/admin/sign-in', function (req, res) {
  res.render('./admin/sign-in');
});

app.get('/admin/home', function (req, res) {
  res.render('./admin/home');
});

app.get('/admin', function (req, res) {
  res.render('./admin/home');
});

app.get('/admin/posts-jobs', function (req, res) {
  res.render('./admin/posts-jobs');
});

app.get('/admin/posts-sell-salons', function (req, res) {
  res.render('./admin/posts-sell-salons');
});

app.get('/admin/posts-nail-supplies', function (req, res) {
  res.render('./admin/posts-nail-supplies');
});

app.get('/admin/options-posts', function (req, res) {
  res.render('./admin/options-posts');
});

app.get('/admin/payments-stripe', function (req, res) {
  res.render('./admin/payments-stripe');
});

app.get('/admin/users', function (req, res) {
  res.render('./admin/users');
});

app.get('/admin/users-profile', function (req, res) {
  res.render('./admin/users-profile');
});

app.get('/admin/history-payments', function (req, res) {
  res.render('./admin/history-payments');
});

app.get('/admin/wellcome-nail', function (req, res) {
  res.render('./admin/wellcome-nail');
});

//----------Start Clients Area---------//

app.get('/', function (req, res) {
  res.render('./client/home');
});

app.get('/forgot-password', function (req, res) {
  res.render('./client/forgot-password');
});

app.get('/search', function (req, res) {
  res.render('./client/search');
});

app.get('/posts-jobs/*', function (req, res) {
  res.render('./client/posts-jobs');
});

app.get('/posts-jobs', function (req, res) {
  res.render('./client/posts-jobs');
});

app.get('/posts-sell-salons/*', function (req, res) {
  res.render('./client/posts-sell-salons');
});

app.get('/posts-sell-salons', function (req, res) {
  res.render('./client/posts-sell-salons');
});

app.get('/posts-nail-supplies/*', function (req, res) {
  res.render('./client/posts-nail-supplies');
});

app.get('/posts-nail-supplies', function (req, res) {
  res.render('./client/posts-nail-supplies');
});

app.get('/agency/account', function (req, res) {
  res.render('./client/agency-account');
});

app.get('/agency/change-password', function (req, res) {
  res.render('./client/agency-change-password');
});

app.get('/agency/posts', function (req, res) {
  res.render('./client/agency-posts');
});


app.post('/purchase', async (req, res) => {

  const UserModel = require('./models/PaymentStripe')
  const result = await UserModel.findOne()
  const stripe = require('stripe')(result.secret_key)

  stripe.charges.create({
    amount: req.body.amount,
    source: req.body.stripeTokenId,
    currency: 'usd'
  }).then(function () {
    console.log('charge successful')
    res.json({ message: 'Successfully purchased items' })

  }).catch(function () {
    console.log('charge fail')
    res.status(500).end()
  })
})

//----------End Clients Area---------//

// start get files country

var codeCountrys = []
var fs = require('fs')

fs.readFile('./helper/country.csv', function (err, data) {
  if (err) {
    throw err;
  }
  successFunction(data.toString())
});

function successFunction(data) {
  var allRows = data.split(/\r?\n|\r/);
  for (var singleRow = 0; singleRow < allRows.length; singleRow++) {
    if (singleRow === 0) {
      continue
    }
    var rowCells = allRows[singleRow].replaceAll('\"', '').replaceAll('}', '').replaceAll('{', '').split(',')
    codeCountrys.push(rowCells)
  }
}

// end get files country

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
};

//Firebase
const admin = require("firebase-admin")
const serviceAccount = require("./sms-schedule-infinity-720fd-firebase-adminsdk-zllw3-83b5b6f682.json")
const { type } = require('os')
var token
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
const dbFirebase = admin.firestore();
(async () => {
  const doc = await dbFirebase.collection('ruler').doc('ruler').get();
  token = doc._fieldsProto.key.stringValue

  console.log('token: ' + token)
  connectDatabase()
})()


function connectDatabase() {
  // connect db
  mongoose.connect(process.env.DB_CONNECTION + process.env.DB_NAME, options).then(() => {
    console.log('nail 247 connected database!')

    app.use(function (req, res, next) {
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

}

server.listen(process.env.PORT || 8000)
console.log('nail 247 listening port: ' + (process.env.PORT || 8000))

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

  socket.on('welcomes', async (data, callback) => {
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

  socket.on('save-welcome', async (data, callback) => {
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

        UserModel.updateOne({}, objForUpdate, optsValidator, (err, result) => {
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

  socket.on('login', async (obj, callback) => {
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

  socket.on('recent-login', async (obj, callback) => {
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

  socket.on('recent-login-agency', async (obj, callback) => {
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

  socket.on('post-jobs', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password)) {
        const UserModel = require('./models/Job');
        let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
        if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
          query = {
            ...query,
            $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
          }
        }

        if (helper.isDefine(data.package)) {
          query = {
            ...query,
            package: sanitize(data.package)
          }
        }

        if (helper.isDefine(data.status)) {
          query = {
            ...query,
            status: sanitize(data.status)
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
        }).limit(data.limit).skip(data.offset).sort(filter);;
      } else {
        callback(null);
      }
    } catch (err) {
      helper.throwError(err);
      callback(null);
    }
  });

  socket.on('post-sell-salons', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password)) {
        const UserModel = require('./models/SellSalon');
        let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
        if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
          query = {
            ...query,
            $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
          }
        }

        if (helper.isDefine(data.package)) {
          query = {
            ...query,
            package: sanitize(data.package)
          }
        }

        if (helper.isDefine(data.status)) {
          query = {
            ...query,
            status: sanitize(data.status)
          }
        }

        let filter = { _id: -1 }

        if (helper.isDefine(data.price)) {
          filter = {
            price: sanitize(data.price)
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

  socket.on('post-nail-supplies', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password)) {
        const UserModel = require('./models/NailSupply');
        let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
        if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
          query = {
            ...query,
            $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
          }
        }

        if (helper.isDefine(data.package)) {
          query = {
            ...query,
            package: sanitize(data.package)
          }
        }

        if (helper.isDefine(data.status)) {
          query = {
            ...query,
            status: sanitize(data.status)
          }
        }

        let filter = { _id: -1 }

        if (helper.isDefine(data.price)) {
          filter = {
            price: sanitize(data.price)
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

  socket.on('options-posts', async (data, callback) => {
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

  socket.on('history-payments', async (data, callback) => {
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

  socket.on('agencies', async (data, callback) => {
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

  socket.on('count-post-jobs', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password)) {

        const UserModel = require('./models/Job');
        let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };

        if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
          query = {
            ...query,
            $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
          }
        }

        if (helper.isDefine(data.package)) {
          query = {
            ...query,
            package: sanitize(data.package)
          }
        }

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

  socket.on('post-agency', async (data, callback) => {
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
        if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
          query = {
            ...query,
            $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
          }
        }

        if (helper.isDefine(data.package)) {
          query = {
            ...query,
            package: sanitize(data.package)
          }
        }

        if (helper.isDefine(data.status)) {
          query = {
            ...query,
            status: sanitize(data.status)
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

  socket.on('count-post-agency', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLoginAgency(data._id, data.password)) {

        const JobModel = require('./models/Job');
        const SellSalonModel = require('./models/SellSalon');
        const NailSupplyModel = require('./models/NailSupply');
        let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" }, id_agency: data._id };

        if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
          query = {
            ...query,
            $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
          }
        }

        if (helper.isDefine(data.package)) {
          query = {
            ...query,
            package: sanitize(data.package)
          }
        }

        if (helper.isDefine(data.status)) {
          query = {
            ...query,
            status: sanitize(data.status)
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

  socket.on('count-post-sell-salons', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password)) {

        const UserModel = require('./models/SellSalon');
        let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
        if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
          query = {
            ...query,
            $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
          }
        }

        if (helper.isDefine(data.package)) {
          query = {
            ...query,
            package: sanitize(data.package)
          }
        }

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

  socket.on('count-post-nail-supplies', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password)) {

        const UserModel = require('./models/NailSupply');
        let query = { title: { $regex: ".*" + sanitize(data.input != undefined ? data.input : '') + ".*", $options: "$i" } };
        if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
          query = {
            ...query,
            $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
          }
        }

        if (helper.isDefine(data.package)) {
          query = {
            ...query,
            package: sanitize(data.package)
          }
        }

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

  socket.on('count-options-posts', async (data, callback) => {
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

  socket.on('count-history-payments', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password, true)) {

        const UserModel = require('./models/HistoryPayments');

        let results = [0, 0, 0, 0]

        let query = {};
        if (helper.isDefine(data.minDate) && helper.isDefine(data.maxDate)) {
          query = {
            ...query,
            $and: [{ createdAt: { $gte: sanitize(data.minDate) } }, { createdAt: { $lte: sanitize(data.maxDate) } }],
          }
        }

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

  socket.on('count-agencies', async (data, callback) => {
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

  socket.on('total-money-history-payments', async (data, callback) => {
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

  socket.on('update-posts-jobs', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password)) {
        const UserModel = require('./models/Job');
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

  socket.on('update-posts-agency', async (data, callback) => {
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

  socket.on('update-posts-sell-salons', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password)) {
        const UserModel = require('./models/SellSalon');
        let query = { _id: sanitize(data.id_product) }
        let objForUpdate = {}
        if (data.status) objForUpdate.status = sanitize(data.status)

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

  socket.on('update-posts-nail-supplies', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password)) {
        const UserModel = require('./models/NailSupply');
        let query = { _id: sanitize(data.id_product) }
        let objForUpdate = {}
        if (data.status) objForUpdate.status = sanitize(data.status)

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

  socket.on('update-agencies', async (data, callback) => {
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

  socket.on('delete-agencies', async (data, callback) => {
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

  socket.on('delete-posts-jobs', async (data, callback) => {
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

  socket.on('delete-posts-agency', async (data, callback) => {
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

  socket.on('delete-posts-sell-salons', async (data, callback) => {
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

  socket.on('delete-posts-nail-supplies', async (data, callback) => {
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

  socket.on('counter-dashboard', async (data, callback) => {
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

  socket.on('change-password-admin', async (data, callback) => {
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

  socket.on('update-options-posts', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password, true)) {
        const UserModel = require('./models/OptionsPosts');
        let query = { _id: sanitize(data.id_product) }
        let objForUpdate = {}
        objForUpdate.options = sanitize(data.options_posts)
        objForUpdate.content = sanitize(data.content)
        objForUpdate = { $set: objForUpdate };
        result = await UserModel.findOneAndUpdate(query, objForUpdate, optsValidator, (err, result) => {
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

  socket.on('delete-options-posts', async (data, callback) => {
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

  socket.on('enable-options-posts', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password, true)) {
        const UserModel = require('./models/OptionsPosts');
        let query = { _id: sanitize(data.id_product) }

        let objForUpdate = {}
        objForUpdate.status = sanitize(data.status)
        objForUpdate = { $set: objForUpdate }

        UserModel.findOneAndUpdate(query, objForUpdate, optsValidator, (err, result) => {
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

  socket.on('update-payments-stripe', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLogin(data._id, data.password, true)) {
        const UserModel = require('./models/PaymentStripe');

        let objForUpdate = {}
        objForUpdate.public_key = sanitize(data.public_key)
        objForUpdate.secret_key = sanitize(data.secret_key)
        objForUpdate = { $set: objForUpdate }

        UserModel.updateOne({}, objForUpdate, optsValidator, (err, result) => {
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

  socket.on('payments-stripe', async (data, callback) => {
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
  });

  socket.on('chart-sales', async (data, callback) => {
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

  socket.on('traffics', async (data, callback) => {
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

  socket.on('check-exist-agency', async (data, callback) => {
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

  socket.on('sign-up-agency', async (data, callback) => {
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

  socket.on('sign-in-agency', async (data, callback) => {
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

  socket.on('reset-password-agency', async (data, callback) => {
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

  socket.on('search', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (helper.isDefine(data)) {

        let UserModel

        if (data.categories == 'sell-salon') {
          UserModel = require('./models/SellSalon')
        } else if (data.categories == 'nail-supply') {
          UserModel = require('./models/NailSupply')
        } else {
          UserModel = require('./models/Job')
        }

        let query = { expiration_date: { $gte: new Date() }, status: 1 }

        if (helper.isDefine(data.code) && data.code) {
          query = {
            ...query,
            code: sanitize(data.code)
          }
        }

        if (helper.isDefine(data.title) && data.title.length) {
          query = {
            ...query,
            title: sanitize(data.title)
          }
        }

        // if (helper.isDefine(data.distance) && helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {

        //   let maxDistance = 100000000
        //   if (data.distance == 1) {
        //     maxDistance = 2000
        //   } else if (data.distance == 2) {
        //     maxDistance = 5000
        //   } else if (data.distance == 3) {
        //     maxDistance = 100000
        //   }

        //   query = {
        //     ...query,
        //     location: {
        //       $near: {
        //         $geometry: {
        //           type: "Point",
        //           coordinates: [data.longitude, data.latitude],
        //         },
        //         $minDistance: 0,
        //         $maxDistance: maxDistance,
        //       }
        //     }
        //   }
        // }

        if (helper.isDefine(data.salary)) {
          let salary
          if (data.categories == 'sell-salon') {
            salary = 'price'
          } else if (data.categories == 'nail-supply') {
            salary = 'price'
          } else {
            salary = 'cost'
          }

          if (data.salary == 1) {
            query = {
              ...query,
              $and: [{ [salary]: { $gte: 0 } }, { [salary]: { $lte: 500 } }],
            }
          } else if (data.salary == 2) {
            query = {
              ...query,
              $and: [{ [salary]: { $gte: 500 } }, { [salary]: { $lte: 1000 } }],
            }
          } else if (data.salary == 3) {
            query = {
              ...query,
              $and: [{ [salary]: { $gte: 1000 } }, { [salary]: { $lte: 2000 } }],
            }
          } else if (data.salary == 4) {
            query = {
              ...query,
              $and: [{ [salary]: { $gte: 2000 } }],
            }
          }
        }

        const object = await UserModel.find(query).limit(data.limit).skip(data.offset)

        if (helper.isDefine(data.distance) && helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {
          for (let i = 0; i < object.length; i++) {
            object[i] = {
              ...object[i]._doc,
              distance: helper.getDistanceFromLatLonInKm(object[i].location.coordinates[0], object[i].location.coordinates[1], data.longitude, data.latitude).replaceAll('km', 'mile')
            }
          }
        } else {
          for (let i = 0; i < object.length; i++) {
            object[i] = {
              ...object[i]._doc,
              distance: 'Unknown'
            }
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
  });

  socket.on('count-search', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (helper.isDefine(data)) {

        let UserModel

        if (data.categories == 'sell-salon') {
          UserModel = require('./models/SellSalon')
        } else if (data.categories == 'nail-supply') {
          UserModel = require('./models/NailSupply')
        } else {
          UserModel = require('./models/Job')
        }

        let query = { expiration_date: { $gte: new Date() }, status: 1 }

        if (helper.isDefine(data.code) && data.code) {
          query = {
            ...query,
            code: sanitize(data.code)
          }
        }

        if (helper.isDefine(data.title) && data.title.length) {
          query = {
            ...query,
            title: sanitize(data.title)
          }
        }

        // if (helper.isDefine(data.distance) && helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {
        //   let maxDistance = 100000000
        //   if (data.distance == 1) {
        //     maxDistance = 2000
        //   } else if (data.distance == 2) {
        //     maxDistance = 5000
        //   } else if (data.distance == 3) {
        //     maxDistance = 100000
        //   }

        //   query = {
        //     ...query,
        //     location: {
        //       $near: {
        //         $geometry: {
        //           type: "Point",
        //           coordinates: [data.longitude, data.latitude],
        //         },
        //         $minDistance: 0,
        //         $maxDistance: maxDistance,
        //       }
        //     }
        //   }
        // }

        if (helper.isDefine(data.salary)) {

          let salary
          if (data.categories == 'sell-salon') {
            salary = 'price'
          } else if (data.categories == 'nail-supply') {
            salary = 'price'
          } else {
            salary = 'cost'
          }

          if (data.salary == 1) {
            query = {
              ...query,
              $and: [{ [salary]: { $gte: 0 } }, { [salary]: { $lte: 500 } }],
            }
          } else if (data.salary == 2) {
            query = {
              ...query,
              $and: [{ [salary]: { $gte: 500 } }, { [salary]: { $lte: 1000 } }],
            }
          } else if (data.salary == 3) {
            query = {
              ...query,
              $and: [{ [salary]: { $gte: 1000 } }, { [salary]: { $lte: 2000 } }],
            }
          } else if (data.salary == 4) {
            query = {
              ...query,
              $and: [{ [salary]: { $gte: 2000 } }],
            }
          }
        }

        //const object = await UserModel.find(query).countDocuments()
        const object = await UserModel.find(query)

        callback(object.length || 0);
      } else {
        callback(null);
      }
    } catch (e) {
      helper.throwError(e);
      callback(null);
    }
  })

  socket.on('search-country', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (helper.isDefine(data)) {
        data.val = data.val.trim().toUpperCase()
        let counter = 0
        let result = []

        for (let i = 0; i < codeCountrys.length; i++) {
          if ((helper.isDefine(codeCountrys[i][3]) && codeCountrys[i][3].toUpperCase().includes(data.val)) || (helper.isDefine(codeCountrys[i][0]) && codeCountrys[i][0].includes(data.val))) {
            if (counter > 100) {
              break
            } else {
              ++counter
            }
            result.push(codeCountrys[i])
          }
        }

        if (counter < 100) {
          for (let i = 0; i < codeCountrys.length; i++) {
            if (helper.contains(codeCountrys[i][3], data.val) || helper.contains(codeCountrys[i][0], data.val)) {
              if (counter > 100) {
                break
              } else {
                ++counter
              }
              result.push(codeCountrys[i])
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

  socket.on('search-nail-supply', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (helper.isDefine(data)) {
        let query = { title: { $regex: ".*" + sanitize(data.val != undefined ? data.val : '') + ".*", $options: "$i" } }
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

  socket.on('name-country-by-code', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (helper.isDefine(data)) {
        let indexSearch = 50

        let relateCities = []
        let nameCity

        for (let i = 0; i < codeCountrys.length; i++) {
          if (helper.tryParseInt(codeCountrys[i][0]) == helper.tryParseInt(data.code)) {
            indexSearch = i
            nameCity = codeCountrys[i][3] + ',' + codeCountrys[i][4]
            break
          }
        }
        for (let j = indexSearch - 10; j < indexSearch + 10; j++) {
          if (helper.isDefine(codeCountrys[j]) && indexSearch != j) relateCities.push(codeCountrys[j])
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

  socket.on('featured', async (data, callback) => {
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
  });

  socket.on('detail-posts-jobs', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (helper.isDefine(data)) {
        const jobModel = require('./models/Job')
        let query = { expiration_date: { $gte: new Date() }, link_slug: sanitize(data.link_slug), status: 1 }

        if (helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {

          query = {
            ...query,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [sanitize(data.longitude), sanitize(data.latitude)],
                },
                $minDistance: 0,
              }
            }
          }
        }

        let object = await jobModel.findOne(query)

        if (helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {
          object = {
            ...object._doc,
            distance: helper.getDistanceFromLatLonInKm(object.location.coordinates[0], object.location.coordinates[1], data.longitude, data.latitude)
          }
        } else {
          object = {
            ...object._doc,
            distance: 'Unknown'
          }
        }

        let queryRelated = { expiration_date: { $gte: new Date() } }
        let resultRelated
        if (helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {
          queryRelated = {
            ...queryRelated,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [sanitize(data.longitude), sanitize(data.latitude)],
                },
                $minDistance: 0,
              }
            }
          }
          resultRelated = await jobModel.find(queryRelated).limit(5)
          for (let i = 0; i < resultRelated.length; i++) {
            resultRelated[i] = {
              ...resultRelated[i]._doc,
              distance: helper.getDistanceFromLatLonInKm(resultRelated[i].location.coordinates[0], resultRelated[i].location.coordinates[1], data.longitude, data.latitude)
            }
          }
        } else {
          resultRelated = await jobModel.find(queryRelated).limit(5)
          for (let i = 0; i < resultRelated.length; i++) {
            resultRelated[i] = {
              ...resultRelated[i]._doc,
              distance: 'Unknown'
            }
          }
        }

        object = {
          post: object,
          related: resultRelated
        }
        callback(object)
      } else {
        callback(null);
      }
    } catch (e) {
      helper.throwError(e)
      callback(null)
    }
  })

  socket.on('detail-posts-sell-salons', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (helper.isDefine(data)) {
        const jobModel = require('./models/SellSalon')
        let query = { expiration_date: { $gte: new Date() }, link_slug: sanitize(data.link_slug), status: 1 }

        if (helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {

          query = {
            ...query,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [sanitize(data.longitude), sanitize(data.latitude)],
                },
                $minDistance: 0,
              }
            }
          }
        }

        let object = await jobModel.findOne(query)

        if (helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {
          object = {
            ...object._doc,
            distance: helper.getDistanceFromLatLonInKm(object.location.coordinates[0], object.location.coordinates[1], data.longitude, data.latitude)
          }
        } else {
          object = {
            ...object._doc,
            distance: 'Unknown'
          }
        }

        let queryRelated = { expiration_date: { $gte: new Date() } }
        let resultRelated
        if (helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {
          queryRelated = {
            ...queryRelated,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [sanitize(data.longitude), sanitize(data.latitude)],
                },
                $minDistance: 0,
              }
            }
          }
          resultRelated = await jobModel.find(queryRelated).limit(5)
          for (let i = 0; i < resultRelated.length; i++) {
            resultRelated[i] = {
              ...resultRelated[i]._doc,
              distance: helper.getDistanceFromLatLonInKm(resultRelated[i].location.coordinates[0], resultRelated[i].location.coordinates[1], data.longitude, data.latitude)
            }
          }
        } else {
          resultRelated = await jobModel.find(queryRelated).limit(5)
          for (let i = 0; i < resultRelated.length; i++) {
            resultRelated[i] = {
              ...resultRelated[i]._doc,
              distance: 'Unknown'
            }
          }
        }

        object = {
          post: object,
          related: resultRelated
        }
        callback(object)
      } else {
        callback(null);
      }
    } catch (e) {
      helper.throwError(e)
      callback(null)
    }
  })

  socket.on('detail-posts-nail-supplies', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (helper.isDefine(data)) {
        const jobModel = require('./models/NailSupply')
        let query = { expiration_date: { $gte: new Date() }, link_slug: data.link_slug, status: 1 }

        if (helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {

          query = {
            ...query,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [sanitize(data.longitude), sanitize(data.latitude)],
                },
                $minDistance: 0,
              }
            }
          }
        }

        let object = await jobModel.findOne(query)

        if (helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {
          object = {
            ...object._doc,
            distance: helper.getDistanceFromLatLonInKm(object.location.coordinates[0], object.location.coordinates[1], data.longitude, data.latitude)
          }
        } else {
          object = {
            ...object._doc,
            distance: 'Unknown'
          }
        }

        let queryRelated = { expiration_date: { $gte: new Date() } }
        let resultRelated
        if (helper.isDefine(data.latitude) && helper.isDefine(data.longitude)) {
          queryRelated = {
            ...queryRelated,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [sanitize(data.longitude), sanitize(data.latitude)],
                },
                $minDistance: 0,
              }
            }
          }
          resultRelated = await jobModel.find(queryRelated).limit(5)
          for (let i = 0; i < resultRelated.length; i++) {
            resultRelated[i] = {
              ...resultRelated[i]._doc,
              distance: helper.getDistanceFromLatLonInKm(resultRelated[i].location.coordinates[0], resultRelated[i].location.coordinates[1], data.longitude, data.latitude)
            }
          }
        } else {
          resultRelated = await jobModel.find(queryRelated).limit(5)
          for (let i = 0; i < resultRelated.length; i++) {
            resultRelated[i] = {
              ...resultRelated[i]._doc,
              distance: 'Unknown'
            }
          }
        }

        object = {
          post: object,
          related: resultRelated
        }
        callback(object)
      } else {
        callback(null);
      }
    } catch (e) {
      helper.throwError(e)
      callback(null)
    }
  })

  socket.on('update-changed-agency', async (data, callback) => {
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

  socket.on('options-posts-jobs-agency', async (data, callback) => {
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

  socket.on('options-posts-sell-salon-agency', async (data, callback) => {
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

  socket.on('options-posts-nail-supply-agency', async (data, callback) => {
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

  socket.on('payments-stripes', async (data, callback) => {
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

  socket.on('change-password-agency', async (data, callback) => {
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

  socket.on('on-update-images-post', async (data, callback) => {
    trafficsSocket(socket)
    try {
      if (data != null && await helper.checkLoginAgency(data._id, data.password)) {

        let UserModel
        if (data.type == 1) {
          UserModel = require('./models/Job')
        } else if (data.type == 2) {
          UserModel = require('./models/SellSalon')
        } else if (data.type == 3) {
          UserModel = require('./models/NailSupply')
        }

        let query = { _id: sanitize(data.id_post) }
        let objForUpdate = {}
        objForUpdate.images = sanitize(data.images)
        objForUpdate = { $set: objForUpdate }

        await UserModel.updateOne(query, objForUpdate, optsValidator)
      } else {
        callback(null);
      }
    } catch (e) {
      helper.throwError(e);
      callback(null);
    }
  })

  //----------END Clients Area---------//

});


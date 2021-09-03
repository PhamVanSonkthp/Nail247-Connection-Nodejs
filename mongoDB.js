var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

exports.getConnect = function (callback) {
	MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, db) {
		if (err)
			console.log(err);
		else {
			var kq = db.db("nail247");
			return callback(kq);
		}
	});
}

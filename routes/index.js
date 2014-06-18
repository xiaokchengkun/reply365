var reply365 = require('../models/reply365Model.js');

module.exports = function(app) {

	app.get('/', function (req, res) {
        res.render("index",{
            title: "首页"
        });
    });

    app.get('/reply365', function (req, res) {
        res.render("index",{
            title: "365评论"
        });
    });

    app.post("/ajax/reply365/getdata", function(req, res){
    	console.log("post!");
        reply365.init(req, function(data){
            res.send(data);
        });
    });

};


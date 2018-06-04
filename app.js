var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.listen((process.env.PORT || 5000));

//default route
app.get('/',(req,res)=>{
    res.send("Hello");
});

app.get("/webhook", function (req, res) {
    if (req.query["hub.verify_token"] === "ineedGodshelpinmylife96") {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});

console.log("hello");
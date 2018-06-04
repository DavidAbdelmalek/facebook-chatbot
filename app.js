var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen((process.env.PORT || 5000));

//default route
app.get('/',(req,res)=>{
    res.send("Hello");
});


//Validate that Facebook webhook is correct!
app.get("/webhook", function (req, res) {
    if (req.query['hub.mode'] && req.query["hub.verify_token"] === process.env.Verify_TOKEN) {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403).end();
    }
});

//Handling Messages
app.post('/webhook',function(req,res){
    console.log(req.body);
    //if the trigger comes from Page
    if (req.body.object === 'page') {
        //check if we have multiple entries
        req.body.entry.forEach(function (entry) {
            entry.messaging.forEach(function( event){
                if (event.message && event.message.text) {
                    sendMessage(event);
                }
            });
        });
        res.status(200).end();
    }
});


function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;

    let apiai = apiaiApp.textRequest(text, {
        sessionId: 'tabby_cat' // use any arbitrary id
    });

    apiai.on('response', (response) => {
        // Got a response from api.ai. Let's POST to Facebook Messenger
    });

    apiai.on('error', (error) => {
        console.log(error);
    });

    apiai.end();
}

//setting configuration between API.AI and Facebook Messanger
const apiaiApp = require('apiai')(CLIENT_ACCESS_TOKEN);


function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;


    let request = apiaiApp.textRequest(text, {
        sessionId: 'David' 
    });

    //get the response from apiAi
    request.on('response', function (response) {
        console.log(response);
        let aiText = response.result.fulfillment.speech;

        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: PAGE_ACCESS_TOKEN
            },
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: {
                    text: aiText
                }
            }
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });
    });


    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: {
                text: text
            }
        }
    }, function (error, response) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}


console.log("hello");
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const config = require('./config');
const apiai = require('apiai');
const sessionIds = new Map();
const uuid = require('uuid')

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen((process.env.PORT || 5000));


//Connecting between Facebook messenger and API.AI
const apiAiService = apiai(config.API_AI_CLIENT_ACCESS_TOKEN, {
    language: "en",
    requestSource: "fb"
});


//default route
app.get('/',(req,res)=>{
    res.send("Hello");
});


//Validate that Facebook webhook is correct!
app.get("/webhook", function (req, res) {
    if (req.query['hub.mode'] && req.query["hub.verify_token"] === process.env.Verify_TOKEN) {
      //  console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403).end();
    }
});

//Handling Messages
app.post('/webhook',function(req,res){
	console.log(JSON.stringify(req.body));
   
    //if the trigger comes from Page
    if (req.body.object === 'page') {
   
        //check if we have multiple entries
        req.body.entry.forEach(function (entry) {
            entry.messaging.forEach(function( event){
                if (event.message && event.message.text) {
                    console.log("Berrrr");
                    receivedMessage(event);
                }
            });
        });
        res.status(200).end();
    }
});

function sendTextMessage(recipientId, text) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text
        }
    }
    callSendAPI(messageData);
}



function receivedMessage(event) {

    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;


    console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    //if sender is not exists in map, set the sender as a key to random number as a value;
    if (!sessionIds.has(senderID)) {
        sessionIds.set(senderID, uuid.v1());
    }
    //Handling Quick Reply
    //var quickReply = message.quick_reply;
    // if (quickReply) {
     //   handleQuickReply(senderID, quickReply, messageId);
     //   return;
   // }

    //Handling message Text
    var messageText = message.text;
    sendToApiAi(senderID, messageText);
}



function sendToApiAi(sender, text) {

    //to make a request to api, we set a text and session it
    //https://dialogflow.com/docs/reference/api-v2/rest/v2beta1/WebhookRequest
    let apiaiRequest = apiAiService.textRequest(text, {
        sessionId: sessionIds.get(sender)
    });

    apiaiRequest.on('response', (response) => {
            handleApiAiResponse(sender, response);
    });

    apiaiRequest.on('error', (error) => console.error(error));
    apiaiRequest.end();
}



function handleApiAiResponse(sender, response) {
    let responseText = response.result.fulfillment.speech;
    let responseData = response.result.fulfillment.data;
    let messages = response.result.fulfillment.messages;
  //  let action = response.result.action;
  //  let contexts = response.result.contexts;
   // let parameters = response.result.parameters;

   if (responseText == '' && !isDefined(action)) {
        //api ai could not evaluate input.
        console.log('Unknown query' + response.result.resolvedQuery);
        sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
    } else if (isDefined(responseData) && isDefined(responseData.facebook)) {
        try {
            console.log('Response as formatted message' + responseData.facebook);
            sendTextMessage(sender, responseData.facebook);
        } catch (err) {
            sendTextMessage(sender, err.message);
        }
    } else if (isDefined(responseText)) {

        sendTextMessage(sender, responseText);
    }
}

function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: config.PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            if (messageId) {
                console.log("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
            } else {
                console.log("Successfully called Send API for recipient %s",
                    recipientId);
            }
        } else {
            console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
    });
}

function isDefined(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj != null;
}



console.log("hello");
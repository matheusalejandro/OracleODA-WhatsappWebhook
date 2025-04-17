const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const https = require('https');
const fs = require('fs');
const path = require('path');
const WhatsApp = require('./lib/whatsApp');
const Config = require('./config/Config');
const log4js = require('log4js');
const mytoken = Config.VERIFY_TOKEN;
let logger = log4js.getLogger('Server');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const OracleBot = require('@oracle/bots-node-sdk');
const { WebhookClient, WebhookEvent } = OracleBot.Middleware;
const { MessageModel } = require('@oracle/bots-node-sdk/lib');

// SSL certificate options
const options = {
    key: fs.readFileSync(path.join(__dirname, 'certificates', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificates', 'cert.pem'))
};

const webhook = new WebhookClient({
    channel: {
        url: Config.ODA_WEBHOOK_URL,
        secret: Config.ODA_WEBHOOK_SECRET
    }
});

OracleBot.init(app, {
    logger: logger,
});

// Init WhatsApp Connector
const whatsApp = new WhatsApp();


webhook
    .on(WebhookEvent.ERROR, err => console.log('Ansh webhook Error:', err.message))
    .on(WebhookEvent.MESSAGE_SENT, message => console.log('Ansh Message to chatbot:', message));
//app.post('/bot/message', webhook.receiver()); // receive bot messages

// Handle incoming messages from ODA
app.post('/bot/message', async (req, res) => {
    try {
        logger.info('Received a message from ODA, processing message before sending to WhatsApp.');

        // Log the complete request body
        logger.info('COMPLETE ODA PAYLOAD:', JSON.stringify(req.body, null, 2));

        // Log specific parts you're interested in
        if (req.body.messagePayload) {
            logger.info('ODA Message Payload:', JSON.stringify(req.body.messagePayload, null, 2));

            // Log actions specifically if they exist
            if (req.body.messagePayload.actions) {
                logger.info('ODA Actions:', JSON.stringify(req.body.messagePayload.actions, null, 2));
            }

            // Log global actions if they exist
            if (req.body.messagePayload.globalActions) {
                logger.info('ODA Global Actions:', JSON.stringify(req.body.messagePayload.globalActions, null, 2));
            }
        }

      await whatsApp._send(req.body);
      logger.info('Message Sent successfully to WhatsApp.');
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
});

app.post("/webhook", async (req, res) => {
    try {
        logger.info('Received a message from WhatsApp, processing message before sending to ODA.');
        let response = await whatsApp._receive(req.body.entry);
        
        if (response) {
            if (response.length > 0) {
                response.forEach(async message => {
                    await webhook.send(message);
                    logger.info('Message Sent successfully to ODA.');
                })
            } else {
                logger.error('Unsupported message type');
                return res.status(400).send('Unsupported message type');  
            }
        }
        res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
});

app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let challange = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];
    
    console.log('Webhook verification request:', { mode, token });
    
    if (mode && token) {
        if (mode === "subscribe" && token === mytoken) {
            console.log('Webhook verified successfully');
            res.status(200).send(challange);
        } else {
            console.log('Webhook verification failed');
            res.sendStatus(403);
        }
    }
});

app.get("/", (req, res) => {
    res.status(200).send("Webhook setup is running with HTTPS");
});

const PORT = process.env.PORT || 3000;
const server = https.createServer(options, app);

server.listen(PORT, () => {
    console.log(`Webhook is listening on https://localhost:${PORT}`);
});






































/*

const PORT = process.env.PORT || 3000;
// Create HTTPS server
const server = https.createServer(options, app);

server.listen(PORT, () => {
    console.log("Hi Ansh. your Webhook is listening");
});

//to verify the callback url from cloud api side
app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let challange = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];
    if (mode && token) {
        if (mode === "subscribe" && token === mytoken) {
            res.status(200).send(challange);
        } else {
            res.status(403);
        }
    }
});

webhook.on(WebhookEvent.MESSAGE_RECEIVED, recievedMessage => {
    console.log('Received a message from ODA, processing message before sending to WhatsApp. *****************>');
    console.log(recievedMessage.messagePayload.text);

    axios({
        method: "POST",
        url: "https://graph.facebook.com/v13.0/" + phon_no_id + "/messages?access_token=" + token,
        data: {
            messaging_product: "whatsapp",
            to: from,
            text: {
                body: recievedMessage.messagePayload.text
            }
        },
        headers: {
            "Content-Type": "application/json"
        }
    });
});

app.post("/webhook", (req, res) => { //i want some 
    let body_param = req.body;
    console.log(JSON.stringify(body_param, null, 2));
    if (body_param.object) {
        console.log("Ansh i am inside body");
        if (body_param.entry &&
            body_param.entry[0].changes &&
            body_param.entry[0].changes[0].value.messages &&
            body_param.entry[0].changes[0].value.messages[0]
        ) {
            phon_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
            from = body_param.entry[0].changes[0].value.messages[0].from;
            let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;
            let userName = body_param.entry[0].changes[0].value.contacts[0].profile.name;
            console.log("Ansh i am inside details -------------------------------------->");
            console.log("phone number " + phon_no_id);
            console.log("from " + from);
            console.log("Message from sender is --> " + msg_body);
            console.log("User name of the sender-->" + userName);
            // Ansh Sending Message from Whats app to ODA
            const MessageModel = webhook.MessageModel();
            const message = {
                //userId: 'anonymous',
                userId: '3489422',
                profile: {firstName: 'Curtis', lastName:'Feitty'},
                //profile: {firstName: userName, lastName:from},
                messagePayload: MessageModel.textConversationMessage(msg_body)
            };
            console.log("Ansh your Message before sending to ODA is ------>" + message);
            webhook.send(message)
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    }
});

app.get("/", (req, res) => {
    res.status(200).send("Hello Ansh this is webhook setup");
});

*/
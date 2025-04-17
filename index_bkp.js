const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OracleBot = require('@oracle/bots-node-sdk');
const {
    WebhookClient,
    WebhookEvent
} = OracleBot.Middleware;

const app = express().use(body_parser.json());
OracleBot.init(app);

// SSL certificate options
const options = {
    key: fs.readFileSync(path.join(__dirname, 'certificates', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificates', 'cert.pem'))
};

const token = 'EAAM5f0LR0YoBO0gQdVpSTDBZAg3KDcdaAmk4V3crMp7LTIWx4J2M6HRFoJ0p8P8OWEUe1UbtPw5ak52a58OgxZBZAZAa3i9pKssGYWqQSwJJEoVpY7jw0w13M1i2ZARP2K4T4FExa8yqufB1egGJT59l9mvZBbry4PdZBI7vsL1jNdFTYYml91us8FlAFi2bYZAlX807gCmXMlvEZBrW1UYXokpOi'; //process.env.TOKEN;
const mytoken = 'MatheusAlejandro'; //process.env.MYTOKEN; //Ansh_token
let phon_no_id;
let from;

// add webhook integration to Oracle Cloud
const webhook = new WebhookClient({
    channel: {
        url: 'https://idcs-oda-c998e83e40244886b5bbacac765f125e-da3.data.digitalassistant.oci.oraclecloud.com/connectors/v2/listeners/webhook/channels/0db15432-6e21-4dab-a9e7-213d184c3547',
        secret: 'OC36L60q0EyZOlNZG1w2lAc94oLFBaNS'
    }
});

webhook
    .on(WebhookEvent.ERROR, err => console.log('Ansh webhook Error:', err.message))
    .on(WebhookEvent.MESSAGE_SENT, message => console.log('Ansh Message to chatbot:', message));
app.post('/bot/message', webhook.receiver()); // receive bot messages



webhook.on(WebhookEvent.MESSAGE_RECEIVED, async receivedMessage => {
    try {
        console.log('Received a message from ODA, processing message before sending to WhatsApp. *****************>');
        
        // Validate message payload
        if (!receivedMessage?.messagePayload?.text) {
            console.error('Invalid or empty message payload:', receivedMessage);
            return;
        }
        
        console.log('Message text:', receivedMessage.messagePayload.text);
        
        // Validate required parameters
        if (!phon_no_id || !from) {
            console.error('Missing required parameters. Phone ID:', phon_no_id, 'From:', from);
            return;
        }

        const response = await axios({
            method: "POST",
            url: `https://graph.facebook.com/v22.0/${phon_no_id}/messages?access_token=${token}`,
            data: {
                messaging_product: "whatsapp",
                to: from,
                text: {
                    body: receivedMessage.messagePayload.text
                }
            },
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log('WhatsApp API Response:', response.data);
    } catch (error) {
        console.error('Error sending message to WhatsApp:');
        if (error.response) {
            console.error('Response error data:', error.response.data);
            console.error('Response error status:', error.response.status);
        } else if (error.request) {
            console.error('Request error:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
    }
});

app.post("/webhook", (req, res) => {
    try {
        let body_param = req.body;
        console.log('Webhook request body:', JSON.stringify(body_param, null, 2));
        
        if (body_param.object) {
            console.log("Processing webhook body");
            
            // Check if this is a status update
            if (body_param.entry?.[0]?.changes?.[0]?.value?.statuses) {
                console.log("Received status update - ignoring");
                return res.sendStatus(200);
            }
            
            // Process only actual messages
            if (body_param.entry &&
                body_param.entry[0].changes &&
                body_param.entry[0].changes[0].value.messages &&
                body_param.entry[0].changes[0].value.messages[0]
            ) {
                phon_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
                from = body_param.entry[0].changes[0].value.messages[0].from;
                let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;
                let userName = body_param.entry[0].changes[0].value.contacts[0].profile.name;
                
                console.log("Message details -------------------------------------->");
                console.log("Phone number ID:", phon_no_id);
                console.log("From:", from);
                console.log("Message body:", msg_body);
                console.log("User name:", userName);
                
                const MessageModel = webhook.MessageModel();
                const message = {
                    userId: '3489422',
                    profile: {firstName: 'Curtis', lastName:'Feitty'},
                    messagePayload: MessageModel.textConversationMessage(msg_body)
                };
                
                console.log("Message to be sent to ODA:", JSON.stringify(message, null, 2));
                webhook.send(message);
                res.sendStatus(200);
            } else {
                console.log('Invalid webhook payload structure');
                res.sendStatus(404);
            }
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
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
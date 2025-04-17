//Rename this file to Config.js and add the details

// ODA Details
exports.ODA_WEBHOOK_URL = process.env.ODA_WEBHOOK_URL || 'ODA CHANNEL WEBHOOK LINK'; 
exports.ODA_WEBHOOK_SECRET = process.env.ODA_WEBHOOK_SECRET || 'ODA CHANNEL WEBHOOK SECRET'; 

// WhatsApp Details
exports.API_URL = 'https://graph.facebook.com';
exports.ENDPOINT_API = 'messages';
exports.VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'VERIFY TOKEN ON WHATSAPP API'; 
exports.ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'WHATSAPP API ACCESS TOKEN';
exports.API_VERSION = process.env.VERSION || 'v22.0';
exports.PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || 'PHONE NUMBER IDENTIFICATION';
exports.LIST_TITLE_DEFAULT_LABEL = 'Select one';

// General Detail
exports.port = process.env.port || 3000;
exports.FILES_URL = ''; //your app server url
exports.LOG_LEVEL = 'info'


// WhatsApp Sender event IDs
exports.EVENT_QUEUE_MESSAGE_TO_WHATSAPP = "100";
exports.EVENT_WHATSAPP_MESSAGE_DELIVERED = "1000";
exports.EVENT_PROCESS_NEXT_WHATSAPP_MESSAGE = "2000";
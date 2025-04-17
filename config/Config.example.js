// ⚠️ This is a SAMPLE config file with placeholder values.
// No real secrets are present. Used for demonstration only.
// Rename this file to Config.js and add your real details

// ODA Details
exports.ODA_WEBHOOK_URL = process.env.ODA_WEBHOOK_URL || 'your-oda-webhook-url';
exports.ODA_WEBHOOK_SECRET = process.env.ODA_WEBHOOK_SECRET || 'your-oda-webhook-secret';

// WhatsApp Details
exports.API_URL = 'https://graph.facebook.com';
exports.ENDPOINT_API = 'messages';
exports.VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your-whatsapp-verify-token';
exports.ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'your-whatsapp-access-token';
exports.API_VERSION = process.env.VERSION || 'v22.0';
exports.PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || 'your-phone-number-id';
exports.LIST_TITLE_DEFAULT_LABEL = 'Select one';

// General Details
exports.port = process.env.port || 3000;
exports.FILES_URL = ''; // your app server url
exports.LOG_LEVEL = 'info';

// WhatsApp Sender Event IDs
exports.EVENT_QUEUE_MESSAGE_TO_WHATSAPP = "100";
exports.EVENT_WHATSAPP_MESSAGE_DELIVERED = "1000";
exports.EVENT_PROCESS_NEXT_WHATSAPP_MESSAGE = "2000";

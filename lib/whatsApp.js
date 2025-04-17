const WhatsAppSender = require('./whatsAppSender');
const _ = require('underscore');
const {
    MessageModel
} = require('@oracle/bots-node-sdk/lib');
const log4js = require('log4js');
let logger = log4js.getLogger('WhatsApp');
const Config = require('../config/Config');
logger.level = Config.LOG_LEVEL;

/**
 * Utility Class to send and receive messages from WhatsApp.
 */
class WhatsApp {
    constructor() {
        this.whatsAppSender = new WhatsAppSender();
    }

    /**
    * Receives a message from WhatsApp and convert to ODA payload
    * @returns {object []} array of messages in ODA format.
    * @param {object} payload - WhatsApp Message Object
    */
    async _receive(payload) {
        let self = this;
        let response = await self._getWhatsAppMessages(payload);
        return response;
    }

    /**
    * Process WhatsApp messages and convert to ODA message format.
    * @returns {object []} Array of ODA messages.
    * @param {object[]} payload - Whatsapp Messages array to be processed.
    */
    async _getWhatsAppMessages(payload) {
        let self = this;
        let odaMessages = [];
        const entries = payload;
        for (const entry of entries) {
          const changes = entry.changes;
          for (const change of changes) {
            if (!change.value.messages) {
              return;
            }
            logger.info('Message: ', JSON.stringify(change.value.messages));

            const messages = change.value.messages;
            const userId = change.value.contacts[0].wa_id || '';
            const contactName = change.value.contacts[0].profile.name || '';
    
            for (const message of messages) {
              let odaMessage = await self._processMessage(message, userId, contactName);
              if (odaMessage) {
                odaMessages.push(odaMessage); 
              }
            }
          }
        }
        return odaMessages;
    }    

    /**
    * Process WhatsApp message per type and convert to ODA message format.
    * @returns {object []} ODA message.
    * @param {object[]} payload - Whatsapp Message.
    * @param {String} userId - Phone number from user.
    * @param {String} contactName - Name (if exists) from user.
    */    
    async _processMessage(message, userId, contactName) {
        let self = this;
        let odaMessage = null;
      
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;
            const postbackData = getPostbackData(buttonId);
            
            if (postbackData) {
                odaMessage = {
                    userId: userId,
                    messagePayload: {
                        type: 'postback',
                        postback: postbackData
                    },
                    profile: {
                        whatsAppNumber: userId,
                        contactName: contactName
                    }
                };
            }
        } else if (message.type === 'text') {
            // Handle regular text messages
            odaMessage = {
                userId: userId,
                messagePayload: {
                    type: 'text',
                    text: message.text.body
                },
                profile: {
                    whatsAppNumber: userId,
                    contactName: contactName
                }
            };
        } else if (message.type === 'location') {
            odaMessage = self._createLocationMessage(userId, contactName, message.location);
        } else if (message.type === 'audio') {
            odaMessage = await self._createAttachmentMessage(userId, contactName, message.audio, message.type);
        } else if (message.type === 'image') {
            odaMessage = await self._createAttachmentMessage(userId, contactName, message.image, message.type);
        } else if (message.type === 'video') {
            odaMessage = await self._createAttachmentMessage(userId, contactName, message.video, message.type);
        } else if (message.type === 'document') {
            odaMessage = await self._createAttachmentMessage(userId, contactName, message.document, message.type);
        }
        return odaMessage;
    }  

    /**
    * Process text message from WhatsApp and convert to ODA message format.
    * @returns {object []} ODA message.
    * @param {String} userId - Phone number from user.
    * @param {String} contactName - Name (if exists) from user.
    * @param {object[]} body - Whatsapp text message.
    */    
    _createTextMessage(userId, contactName, body) {
        return {
            userId: userId,
            messagePayload: MessageModel.textConversationMessage(body),
            profile: { 
                // whatsAppNumber: userId,
                // contactName: contactName 
                firstName: "Matheus"
                , lastName: "Alejandro"
                , locale: "pt-BR"
            }
        };
    }    

    /**
    * Process text message from WhatsApp and convert to ODA message format.
    * @returns {object []} ODA message.
    * @param {String} userId - Phone number from user.
    * @param {String} contactName - Name (if exists) from user.
    * @param {object[]} interactive - Whatsapp interactive message.
    */    
    async _createInteractiveMessage(userId, contactName, interactive) {
        let odaMessage = {};
      
        switch (interactive.type) {
          case 'button_reply':
            odaMessage = {
              userId: userId,
              messagePayload: {
                'type': 'postback',
                'postback': {
                  'action': interactive.button_reply.id
                }
              },
              profile: { 
                'whatsAppNumber': userId,
                'contactName': contactName 
              }
            };
            break;
      
          case 'list_reply':
            odaMessage = {
              userId: userId,
              messagePayload: {
                'type': 'postback',
                'postback': {
                  'action': interactive.list_reply.id
                }
              },
              profile: { 
                'whatsAppNumber': userId,
                'contactName': contactName 
              }
            };
            break;
      
          default:
            // Unsupported interactive message type
            console.error('Unsupported interactive message type:', interactive.type);
            break;
        }   
        return odaMessage;
    }

    /**
    * Process text message from WhatsApp and convert to ODA message format.
    * @returns {object []} ODA message.
    * @param {String} userId - Phone number from user.
    * @param {String} contactName - Name (if exists) from user.
    * @param {object[]} location - Whatsapp location message.
    */      
    _createLocationMessage(userId, contactName, location) {
        return {
            userId: userId,
            messagePayload: {
                'type': 'location',
                'location': {
                    'latitude': location.latitude,
                    'longitude': location.longitude
                }
            },
            profile: { 
                'whatsAppNumber': userId,
                'contactName': contactName 
            }
    
        };
    }

    /**
    * Process text message from WhatsApp and convert to ODA message format.
    * @returns {object []} ODA message.
    * @param {String} userId - Phone number from user.
    * @param {String} contactName - Name (if exists) from user.
    * @param {object[]} attachment - Whatsapp attachment message.
    * @param {String} type - Message type.
    */     
    async _createAttachmentMessage(userId, contactName, attachment, type) {
        let self = this;
        let file = await self.whatsAppSender._downloadAndSaveWhatsAppAttachmentMessage(attachment);
        let odaMessage = {};
      
        switch (type) {
          case 'audio':
            odaMessage = {
              userId: userId,
              messagePayload: {
                'type': 'attachment',
                'attachment': {
                    'type': 'audio',
                    'url': Config.FILES_URL + '/' + file
                }
              },
              profile: { 
                'whatsAppNumber': userId,
                'contactName': contactName 
              }
            };
            break;
      
          case 'image':
            odaMessage = {
              userId: userId,
              messagePayload: {
                'type': 'attachment',
                'attachment': {
                    'type': 'image',
                    'url': Config.FILES_URL + '/' + file
                }
              },
              profile: { 
                'whatsAppNumber': userId,
                'contactName': contactName 
              }
            };
            break;
    
          case 'video':
            odaMessage = {
                userId: userId,
                messagePayload: {
                    'type': 'attachment',
                    'attachment': {
                        'type': 'video',
                        'url': Config.FILES_URL + '/' + file
                    }
                },
                profile: { 
                    'whatsAppNumber': userId,
                    'contactName': contactName 
                }
            };
            break;
    
          case 'document':
            odaMessage = {
                userId: userId,
                messagePayload: {
                    'type': 'attachment',
                    'attachment': {
                        'type': 'file',
                        'url': Config.FILES_URL + '/' + file
                    }
                },
                profile: { 
                    'whatsAppNumber': userId,
                    'contactName': contactName 
                }
            };
            break;
                
          default:
            // Unsupported attachment message type
            console.error('Unsupported attachment message type:', attachment.type);
            break;
        }
    
        return odaMessage;
    }

    /**
    * Send ODA message to WhatsApp. Converts message from ODA format to WhatsApp message format.
    * @param {object} payload - ODA Message Payload
    */
    async _send(payload) {
        let self = this;
        logger.info('ODA COMPLETE PAYLOAD TO WHATSAPP:', JSON.stringify(payload, null, 2));

        const { userId, messagePayload } = payload;
        const { type, actions, globalActions, headerText, footerText, channelExtensions } = messagePayload;
  
        // Log extracted parts
        logger.info('ODA MESSAGE TYPE:', type);
        logger.info('ODA ACTIONS:', JSON.stringify(actions, null, 2));
        logger.info('ODA GLOBAL ACTIONS:', JSON.stringify(globalActions, null, 2));
        
        // Check for OAuth flow
        if (channelExtensions && channelExtensions.isOAuthLoginMessage) {
            // Handle OAuth flow specially
            await self._handleOAuthFlow(messagePayload, userId);
            return;
        } 

        let data = {
            messaging_product: 'whatsapp',
            preview_url: false,
            recipient_type: 'individual',
            to: userId
        };
        
        // Check the message type and handle accordingly
        if (type === 'text' && messagePayload.text.includes('href=')) {
            await this._handleTextMessageWithUrl(messagePayload, data);
        } else if (self._isTextOrLocationMessageWithoutActions(type, actions, globalActions)) {
          // Handle text or location message without actions
          await self._handleTextOrLocationMessageWithoutActions(channelExtensions, messagePayload, data);
        } else if (self._isTextMessageWithActions(type, actions, globalActions)) {
          // Handle text message with actions
          await self._handleTextMessageWithActions(actions, globalActions, headerText, footerText, messagePayload, data);
        } else if (self._isCardMessage(type, messagePayload.cards)) {
          // Handle card message
          await self._handleCardMessage(messagePayload.cards, actions, headerText, footerText, data);
        } else if (self._isAttachmentMessage(type, messagePayload.attachment)) {
          // Handle attachment message
          await self._handleAttachmentMessage(messagePayload.attachment, data);
        } else {
            // Handle other message types as before
            data.type = 'text';
            data.text = {
                body: messagePayload.text || ''
            };
        }

        if (data.type) {  // Only send if data type is set
            await this._sendToWhatsApp(data);
        }
    }

    async _handleOAuthFlow(messagePayload, userId) {
        // Get the card with the URL
        const card = messagePayload.cards[0];
        const urlAction = card.actions.find(action => action.type === 'url');
        
        if (urlAction) {
            const data = {
                messaging_product: 'whatsapp',
                preview_url: true, // Enable URL preview
                recipient_type: 'individual',
                to: userId,
                type: 'text',
                text: {
                    body: `${card.title}\n\n${urlAction.label}: ${urlAction.url}`
                }
            };
            
            this._sendToWhatsApp(data);
        }
    }

    /**
    * Helper function to check if it's a text or location message without actions
    * @param {String} type - message type
    * @param {object} actions - ODA Message actions
    * @param {object} globalActions - ODA Message global actions
    */    
    _isTextOrLocationMessageWithoutActions(type, actions, globalActions) {
        return type === 'text' && (!actions || actions.length === 0) && (!globalActions || globalActions.length === 0);
    }

    /**
    * Helper function to check if it's a text message with actions
    * @param {String} type - message type
    * @param {object} actions - ODA Message actions
    * @param {object} globalActions - ODA Message global actions
    */    
    _isTextMessageWithActions(type, actions, globalActions) {
        return type === 'text' && (actions || globalActions);
    }

    /**
    * Helper function to check if it's a card message
    * @param {String} type - message type
    * @param {object} actions - ODA Message actions
    * @param {object} globalActions - ODA Message global actions
    */     
    _isCardMessage(type, cards) {
        return type === 'card' && cards;
    }

    /**
    * Helper function to check if it's an attachment message
    * @param {String} type - message type
    * @param {object} attachment - ODA attachment object
    */
    _isAttachmentMessage(type, attachment) {
        return type === 'attachment' && attachment;
    }

    /**
    * Handle text or location message without actions
    * @param {object} channelExtensions - ODA channel extensions object
    * @param {object} messagePayload - ODA message payload
    * @param {object} data - WhatsApp message payload
    */    
    async _handleTextOrLocationMessageWithoutActions(channelExtensions, messagePayload, data) {
        logger.info('Handle text or location message without actions');
        if (channelExtensions && channelExtensions.special_field_type && channelExtensions.special_field_type === 'location') {
            const loc = JSON.parse(channelExtensions.location);
            data.type = 'location';
            data.location = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            name: loc.name,
            address: loc.address
            };
        } else {
            data.type = 'text';
            data.text = { body: messagePayload.text };
        }
    }

    /**
    * Handle actions as a button items
    * @param {object} actions - ODA actions object
    * @param {String} headerText - ODA header text
    * @param {String} footerText - ODA footer text
    * @param {String} bodyText - ODA body text
    * @param {String} image - ODA image
    * @param {object} data - WhatsApp message payload
    */    
    async _handlePostbackActionsButtonItems(actions, headerText, footerText, bodyText, image, data) {
        logger.info('Handle actions as a button items');
        data.type = 'interactive';
        data.interactive = {
            type: 'button',
            body: { text: bodyText },
            action: {
            buttons: []
            }
        };

        actions && actions.forEach(action => {
            data.interactive.action.buttons.push({
                type: 'reply',
                reply: {
                    id: action.postback.action,
                    title: truncateButtonTitle(action.label)
                }
            });
        });

        //image and header    
        if (image) {
            data.interactive.header = {
            type: 'image',
            image: { link: image }
            };
        } else if (headerText) {
            data.interactive.header = { 'type': 'text', text: headerText };
        }

        //footer
        if (footerText) {
            data.interactive.footer = { text: footerText };
        }
    }

    /**
    * Handle actions as a list items
    * @param {object} actions - ODA actions object
    * @param {String} headerText - ODA header text
    * @param {String} footerText - ODA footer text
    * @param {String} messagePayload - ODA body text
    * @param {String} image - ODA image
    * @param {object} data - WhatsApp message payload
    */      
    async _handlePostbackActionsListItems(actions, headerText, footerText, messagePayload, image, data) {
        logger.info('Handle actions as a list items');
        data.type = 'interactive';
        data.interactive = {
            type: 'list',
            body: { text: messagePayload.text },
            action: { button: Config.LIST_TITLE_DEFAULT_LABEL, sections: [] } //max 20 chars
        };

        let rows = [];
        actions && actions.forEach(action => {
            rows.push({ id: action.postback.action, title: action.label.length < 24 ? action.label : action.label.substr(0, 20).concat('...')}); // max 24 chars
        });

        let section = { rows: rows };
        data.interactive.action.sections.push(section);

        //image and header    
        if (image) {
            data.interactive.header = {
                type: 'image',
                image: { link: image }
            };
        } else if (headerText) {
            data.interactive.header = { 
                'type': 'text', 
                text: headerText 
            };
        }  
        
        //footer
        if (footerText) {
            data.interactive.footer = { text: footerText };
        }
    }

    /**
    * Handle other actions (url, phone, etc) and ten more items
    * @param {object} actions - ODA actions object
    * @param {String} headerText - ODA header text
    * @param {String} footerText - ODA footer text
    * @param {String} bodyText - ODA body text
    * @param {object} data - WhatsApp message payload
    */    
    async _handlePostbackActionsTextItems(actions, headerText, footerText, bodyText, data) {
        logger.info('Handle other actions (url, phone, etc) and ten more items');
        let self = this;
        let response = '';   
        if (headerText) {
            response = response.concat(headerText).concat('\n\n');
        } 
        response = response.concat(bodyText).concat('\n');    
        for (var key in actions) {
            actions[key].forEach(action => {
                let actionAstext = self._createWhatsAppAction(action, data)
                if (actionAstext) {
                    response = response.concat('\n').concat(actionAstext);
                }
            });
        }
        //footer
        if (footerText) {
            response = response.concat('\n\n').concat(footerText);
        }
        data.text = { body: response };    
    }

    /**
    * Convert ODA Action to WhatsApp Action. 'Share' actions are not supported.
    * @param {object} odaAction - ODA action object
    * @param {object} data - WhatsApp message payload
    */     
    _createWhatsAppAction(odaAction, data) {
        let { type, label, url, phoneNumber } = odaAction;

        if (type == 'share') {
            return;
        }
        let result = label ? label : '';
        switch (type) {
            case 'url':
                {
                    data.preview_url = true;

                    result = result.concat(": ").concat(url);
                    break;
                }
            case 'call':
                {
                    result = result.concat(": ").concat(phoneNumber);
                    break;
                }
                // Share buttons not supported
            case 'share':
                {
                    return null;
                }
        }
        return result;
    }

    /**
    * Handle text message with actions
    * @param {object} actions - ODA actions object
    * @param {String} headerText - ODA header text
    * @param {String} footerText - ODA footer text
    * @param {String} messagePayload - ODA body text
    * @param {String} image - ODA image
    * @param {object} data - WhatsApp message payload
    */     
    async _handleTextMessageWithActions(actions, globalActions, headerText, footerText, messagePayload, data) {
        logger.info('Handle text message with actions');
        
        if (globalActions && globalActions.length > 0) {
            logger.info('Handle actions as a button items');
            
            data.type = 'interactive';
            data.interactive = {
                type: 'button',
                body: {
                    text: messagePayload.text || 'Selecione uma opção:'
                },
                action: {
                    buttons: globalActions.slice(0, 3).map(action => {
                        const buttonId = createValidButtonId(action.postback.action);
                        // Store the full postback data
                        storePostbackData(buttonId, action.postback);
                        
                        return {
                            type: 'reply',
                            reply: {
                                id: buttonId,
                                title: createButtonTitle(action.label)
                            }
                        };
                    })
                }
            };
        }
    }

    /**
    * Get total of postback actions
    * @param {object} actions - ODA actions object
    * @param {object} globalActions - ODA global actions object
    * @param {String} type - ODA message type
    */      
    async _getPostbackActions(actions, globalActions, type) {
        // Combine Actions and Global Actions
        actions = actions ? actions : [];
        globalActions = globalActions ? globalActions : [];
        actions = actions.concat(globalActions);
        // Group Actions by type;
        actions = _.groupBy(actions, 'type');
        if (type === 'postback') { 
            return _.pick(actions, ['postback']);
        } else {
            return _.omit(actions, ['postback']);
        }
    }

    /**
    * Handle card message with actions
    * @param {object} cards - ODA cards object
    * @param {object} actions - ODA actions object
    * @param {String} headerText - ODA header text
    * @param {String} footerText - ODA footer text
    * @param {object} data - WhatsApp message payload
    */ 
    async _handleCardMessage(cards, actions, headerText, footerText, data) {
        logger.info('Handle card message with actions');

        // Send initial message if there are cards
        if (cards && cards.length > 0) {
            // Send each card as a separate message with image and formatted text
            for (const card of cards) {
                // First send the image if available
                if (card.imageUrl) {
                    await this._sendToWhatsApp({
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: data.to,
                        type: 'image',
                        image: {
                            link: card.imageUrl,  // Changed from url to link
                            caption: card.title
                        }
                    });
                }

                // Extract URL if it exists in the description
                let description = card.description.replace(/<[^>]*>/g, '');
                const linkInfo = extractUrlAndLabel(card.description);
                
                // Format text message with URL if found
                let bodyText = `*${card.title}*\n\n${description}`;
                
                // Add the link if found
                if (linkInfo) {
                    bodyText = bodyText.replace('Visualizar detalhes', `Visualizar detalhes: ${linkInfo.url}`);
                }

                // Send card text
                await this._sendToWhatsApp({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: data.to,
                    type: 'text',
                    preview_url: true, // Enable URL preview for links
                    text: {
                        body: bodyText
                    }
                });
            }

            // Add navigation buttons if there are actions
            if (actions && actions.length > 0) {
                const buttonData = {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: data.to,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: {
                            text: 'Opções de navegação:'
                        },
                        action: {
                            buttons: actions.map(action => ({
                                type: 'reply',
                                reply: {
                                    id: createValidButtonId(action.postback.action),
                                    title: createButtonTitle(action.label)
                                }
                            }))
                        }
                    }
                };

                // Store postback data for each button
                actions.forEach(action => {
                    storePostbackData(
                        createValidButtonId(action.postback.action),
                        action.postback
                    );
                });

                await this._sendToWhatsApp(buttonData);
            }
        }
    }

    // Update the _handleTextMessageWithUrl method
    async _handleTextMessageWithUrl(messagePayload, data) {
        const text = messagePayload.text;
        
        if (text.includes('<a')) {
            // Split the text into parts (before link, link, after link)
            const parts = text.split(/<a[^>]*>.*?<\/a>/);
            const linkInfo = extractUrlAndLabel(text);
            
            if (linkInfo) {
                // Combine the parts with the formatted link
                const formattedText = `${parts[0].trim()}${parts[0] ? '\n\n' : ''}${linkInfo.label}:\n${linkInfo.url}${parts[1] ? '\n\n' + parts[1].trim() : ''}`;
                
                data.type = 'text';
                data.text = {
                    body: formattedText
                };
                return;
            }
        }

        // Default handling if no URL is found or if processing fails
        data.type = 'text';
        data.text = {
            body: text.replace(/<[^>]*>/g, '') // Remove any HTML tags as fallback
        };
    }

    /**
    * Handle attachment message
    * @param {object} attachment - ODA attachment object
    * @param {object} data - WhatsApp message payload
    */     
    async _handleAttachmentMessage(attachment, data) {
        logger.info('Handle attachment message');
        const { type, url, title } = attachment;
    
        switch (type) {
            case 'image':
                data.type = 'image';
                data.image = { link: url };
                if (title) {
                    data.image.caption = title;
                }
                break;
            case 'video':
                data.type = 'video';
                data.video = { link: url };
                if (title) {
                data.video.caption = title;
                }
                break;
            case 'audio':
                data.type = 'audio';
                data.audio = { link: url };
                if (title) {
                data.audio.caption = title;
                }
                break;
            case 'file':
                data.type = 'document';
                data.document = { link: url };
                if (title) {
                    data.document.caption = title;
                }
                break;            
            default:
                console.error('Unsupported attachment type:', type);
                break;
        }
    }

    /**
    * Send Message to WhatsApp
    * @param {object[]} message - WhatsApp message payload to be send
    */
    _sendToWhatsApp(message) {
        let self = this;
        self.whatsAppSender._queueMessage(message);
    }
};

function truncateButtonTitle(title) {
    const MAX_BUTTON_LENGTH = 20;
    return title.length > MAX_BUTTON_LENGTH 
        ? title.substring(0, MAX_BUTTON_LENGTH - 3) + '...'
        : title;
}

function createValidButtonId(action) {
    // WhatsApp requires button IDs to be alphanumeric and underscore only
    // Convert any dots or special characters to underscores
    return action.replace(/[^a-zA-Z0-9_]/g, '_');
}

// Add this helper function to store and retrieve postback data
const postbackStore = new Map();

function storePostbackData(buttonId, postbackData) {
    postbackStore.set(buttonId, postbackData);
}

function getPostbackData(buttonId) {
    return postbackStore.get(buttonId);
}

// Add this helper function at the top of the file
function createButtonTitle(label) {
    // Create distinct abbreviated titles that fit WhatsApp's requirements
    const titleMap = {
        'Visualizar ausências anteriores': 'Ver ausências ant.',
        'Visualizar ausências por uma duração específica': 'Ver por período',
        'Visualizar saldo de ausências': 'Ver saldo'
    };

    // Return mapped title or truncate if not in map
    return titleMap[label] || label.substring(0, 19);
}

// Add this helper function to format the learning item description
function formatLearningItemDescription(description) {
    // Remove HTML tags and format the description
    return description
        .replace(/<[^>]*>/g, '')  // Remove HTML tags
        .replace(/\n\n/g, '\n')   // Reduce multiple newlines
        .trim();
}

// Add this helper function to create a clickable URL
function formatClickableUrl(url, label) {
    return url;  // WhatsApp will automatically make this clickable
}

// Update the extractUrlAndLabel function to handle complex URLs and HTML entities
function extractUrlAndLabel(text) {
    // First, decode HTML entities
    function decodeHtmlEntities(str) {
        return str
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/&amp;/g, '&')
            .replace(/&#47;/g, '/')
            .replace(/&#61;/g, '=')
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ');
    }

    // Extract URL and label from HTML-style link
    const linkMatch = text.match(/<a[^>]+href=(['"']?)([^'"'\s>]+)\1[^>]*>(.*?)<\/a>/i);
    
    if (linkMatch) {
        const url = decodeHtmlEntities(linkMatch[2]);
        const label = decodeHtmlEntities(linkMatch[3]);
        return { url, label };
    }

    return null;
}

module.exports = WhatsApp;
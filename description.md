(BASE) https://blogs.oracle.com/digitalassistant/post/integrating-oracle-digital-assistant-with-whatsapp-api
(Evolução) https://blogs.oracle.com/digitalassistant/post/how-to-create-a-custom-integration-between-oracle-digital-assistant-and-whatsapp-cloud-api-using-rich-elements-such-as-buttons-lists-attachments-and-other-components

Passo a passo:
1. Abrir o https://developers.facebook.com/apps/907643674808714/whatsapp-business/wa-dev-console/?business_id=556117877255131 gerar um novo token e atualizar no index.js
2. Abrir o powershell e rodar "ngrok http https://localhost:3000 ". Talvez seja necessário atualizar o link no https://developers.facebook.com/apps/907643674808714/whatsapp-business/wa-settings/?business_id=556117877255131 e no channel https://idcs-oda-c998e83e40244886b5bbacac765f125e-da3.data.digitalassistant.oci.oraclecloud.com/botsui/(botId:BBA327C8-1906-4E64-830E-2C17BF85D3E7)/bot
3. Abrir as configurações dentro de Whatsapp no Facebook e atualizar o link do ngrok.
4. Abrir outro powershell na pasta D:\Oracle Content\Oracle - HCM\Projetos\Andar conceito\Whatsapp\WhatsAppWebhook e rodar "node .\index.js"
5. Abrir as configurações do ODA e atualizar o link do ngrok


##VER##
(Ver as sugestões https://chatgpt.com/c/67815f52-c574-800c-be4e-d75985852f7f)
(Ver como aparece em https://dashboard.ngrok.com/usage)
(Entender https://blogs.oracle.com/digitalassistant/post/how-to-create-a-custom-integration-between-oracle-digital-assistant-and-whatsapp-cloud-api-using-rich-elements-such-as-buttons-lists-attachments-and-other-components)

PS D:\Oracle Content\Oracle - HCM\Projetos\Andar conceito\Whatsapp\WhatsAppWebhook> node .\index.js
(node:19188) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Webhook is listening on https://localhost:3000
Webhook request body: {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "541088089080389",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551623598",
              "phone_number_id": "531639366694001"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Matheus Alejandro"
                },
                "wa_id": "5511941470471"
              }
            ],
            "messages": [
              {
                "from": "5511941470471",
                "id": "wamid.HBgNNTUxMTk0MTQ3MDQ3MRUCABIYFjNFQjBFMDUxNzc5QzFDRTNFQzI4QzgA",
                "timestamp": "1736536325",
                "text": {
                  "body": "hi"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
Processing webhook body
Message details -------------------------------------->
Phone number ID: 531639366694001
From: 5511941470471
Message body: hi
User name: Matheus Alejandro
Message to be sent to ODA: {
  "userId": "3489422",
  "profile": {
    "firstName": "Curtis",
    "lastName": "Feitty"
  },
  "messagePayload": {
    "type": "text",
    "text": "hi"
  }
}
Ansh Message to chatbot: {
  userId: '3489422',
  profile: { firstName: 'Curtis', lastName: 'Feitty' },
  messagePayload: { type: 'text', text: 'hi' }
}
Received a message from ODA, processing message before sending to WhatsApp. *****************>
Invalid or empty message payload: {
  messagePayload: {
    layout: 'horizontal',
    cards: [ [Object] ],
    type: 'card',
    channelExtensions: { isOAuthLoginMessage: true }
  },
  endOfTurn: true,
  userId: '3489422'
}
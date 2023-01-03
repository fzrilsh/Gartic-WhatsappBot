const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const Gartic = require('./lib/gartic')

const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    },
    authStrategy: new LocalAuth({ clientId: "client" })
});
const config = require('./config/config.json');

client.on('qr', async (qr) => {
    console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Scan the QR below : `);
    qrcode.generate(qr, { small: true });
});

client.on('message', async (message) => {
    let chatId = message.from;
    let args = message.body.substring(config.prefix).split(' ');
    let quoted = await message.getQuotedMessage();
    switch(args) {
        case `${config.prefix}join`:
            new Gartic(client, chatId)
        break;
    }
});

client.on('ready', () => {
    console.clear();
    console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} is Already!`);
});

client.initialize();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const Gartic = require('./lib/gartic');
global.gameSections = {}

const isAdmin = (chat, jid) => chat.participants.find(v => v.id._serialized === jid)?.isAdmin

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
    console.clear()
    qrcode.generate(qr, { small: true });
    console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Scan the QR : `);
});

client.on('group_join', async (group) => {
    if(group.id.participant == client.info.wid._serialized){
        let chat = await group.getChat();
        if(!isAdmin(chat, client.info.wid._serialized)) group.reply("BOT MUST BE AN ADMIN")
        // for(let participant of chat.participants) {
        //     if(participant.id._serialized === client.info.wid._serialized && !participant.isAdmin) {
        //         group.reply(`BOT MUST BE AN ADMIN`);
        //         break;
        //     }
        // }
    }
})

client.on('message', async (message) => {
    let chatId = message.from;
    let args = message.body.substring(config.prefix).split(' ');
    switch(args[0]) { 
        case `${config.prefix}open`:
            if(!chatId.endsWith('g.us')) return
            if(!isAdmin(await message.getChat(), client.info.wid._serialized)) return message.reply("BOT MUST BE AN ADMIN")
            if(global.gameSections[chatId]) return message.reply(global.gameSections[chatId])
            let msg = await message.reply("Opened games. please enter the game by react this message with any emojis")
            new Gartic(client, chatId, msg.id)
        break;
    }
});

client.on('ready', () => {
    console.clear();
    console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} is Already!`);
});

client.initialize();

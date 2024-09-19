const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');

const { isAdmin, isGroup } = require('./lib/Utils/Util');
const config = require('./config/config.json');
const messages = require('./config/messages.json')
// const Gartic = require('./lib/gartic');
const Gartic = require('./Gartic')

global.messageEvent = []

const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    authStrategy: new LocalAuth({ clientId: "gartic" })
});

client.on('qr', async (qr) => {
    console.clear()
    qrcode.generate(qr, { small: true });
    console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Scan the QR : `);
});

client.on('group_join', async (group) => {
    if (group.id.participant == client.info.wid._serialized) {
        let chat = await group.getChat();
        if (!isAdmin(chat, client.info.wid._serialized)) group.reply("BOT MUST BE AN ADMIN")
    }
})

client.on('message', async (message) => {
    let chat = await message.getChat()
    let chatId = message.from;
    let args = message.body.substring(1).split(' ');

    switch(args[0].toLowerCase()){
        case 'start':
            if(!isGroup(chatId)) return false
            if(!isAdmin(chat, client.info.wid._serialized)) return message.reply(messages.bot_must_admin)
            if(Gartic.findSection(chatId)) return message.reply(messages.game_started)
            
            const reactMessage = await message.reply(messages.react_message)
            new Gartic(chatId, client, reactMessage)

            break
        case 'end':
            if(!(section = Gartic.findSection(chatId))) return false
            if((await section.reactedMessage.getQuotedMessage()).id.participant._serialized !== message.id.participant) return message.reply(messages.not_host)

            section.destroy()
            message.reply(messages.destroy_game)
            break
    }

    global.messageEvent.forEach(async(participant) => await participant.func(message));



    // switch (args[0]) {
    //     case 'start':
    //         if (!chatId.endsWith('g.us')) return
    //         if (!isAdmin(await message.getChat(), client.info.wid._serialized)) return message.reply("BOT MUST BE AN ADMIN")
    //         if (global.gameSections[chatId]) return message.reply(global.gameSections[chatId].status)
    //         let msg = await message.reply("Opened games. please enter the game by react this message with any emojis")
    //         new Gartic(client, chatId, msg.id)
    //         break;
    //     case 'end':
    //         if (!(chatId in global.gameSections)) return message.reply('This group has not started the game yet.')
    //         let gartic = global.gameSections[chatId].game

    //         clearInterval(gartic.gameStatus)
    //         clearTimeout(gartic.reqplayersTm)
    //         clearTimeout(gartic.game.theme?.timer)

    //         gartic.reqplayers = null
    //         gartic.game = null
    //         gartic.client = null

    //         delete global.gameSections[chatId]
    //         message.reply("Game ended, thanks for playing.")

    //         break;
    // }
});

client.on('ready', () => {
    console.clear();
    console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} is Already!`);
});

client.initialize();

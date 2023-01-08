const { randomTheme, validateAnswer } = require('./Utils/theme')
const { Buttons, MessageMedia } = require('whatsapp-web.js')
const { clockString } = require('./Utils/Util')
const { EventEmitter } = require('events')

class Gartic{
    instanceTimer = setTimeout(()=>{}).constructor

    constructor(client, groupid, id){
        this.score = {}
        this.id = groupid
        this.client = client
        this.players = []
        this.queue = []
        this.queueIndex = -1
        this.ends = false
        this.reqplayers = false
        this.game = { theme: null, event: new EventEmitter(), caches: {message: [], message_reaction: []} }
        
        this.eventMessageHandler()
        this.open(id)

        const gartic = this
        setInterval(() => {
            if(gartic.reqplayers || gartic.game.theme){
                global.gameSections[groupid] = (gartic.reqplayers ? "In this group are gathering players" : "Game is starting in this group")
            }else{
                clearInterval(this)
            }
        }, 1000)
    }

    restartEvent(eventname){
        const gartic = this
        this.client.once(eventname, async(result) => {
            for (const arr of this.game.caches[eventname]) {
                if(typeof(arr) !== 'object') continue
                const [func, id] = arr
                func(result)
                gartic.restartEvent(eventname)
            }
        })
    }

    removeEventByID(id){
        for (const key of Object.keys(this.game.caches)) {
            let index = this.game.caches[key].findIndex(v => v[1] == id)
            if(index>-1) {
                delete this.game.caches[key][index]
                break
            }
        }
    }

    messageHandler(){
        const gartic = this
        this.client.once('message', async(message) => {
            for (const [func, id] of gartic.game.caches.message) {
                func(message)
                gartic.restartEvent('message')
            }
        })
        this.client.once('message_reaction', async(message) => {
            for (const [func, id] of gartic.game.caches.message_reaction) {
                func(message)
                gartic.restartEvent('message_reaction')
            }
        })
    }
    
    eventMessageHandler(){
        const gartic = this
        this.game.event.on(`message`, async(func, id) => {
            if(typeof(func) == 'function') gartic.game.caches.message.push([func, id])
        })
        
        this.game.event.on('message_reaction', async(func, id) => {
            if(typeof(func) == 'function') gartic.game.caches.message_reaction.push([func, id])
        })

        this.messageHandler()
    }

    get playersQueue(){
        return this.queue[this.queueIndex]
    }

    resetTimeout(timeout, func, time){
        if(!(timeout instanceof this.instanceTimer && func).constructor) return setTimeout(func, time);
        else if(!func) return false
        else return setTimeout(timeout._onTimeout, timeout._idleTimeout)
    }

    newSection(){
        this.initQueue()
        this.setDraw(() => {
            this.newGuess()
        })
    }

    open(msg){
        const gartic = this
        const id = Date.now().toString(14)
        gartic.reqplayers = true

        this.reqplayersTm = setTimeout(async() => {
            gartic.rptmi = 0
            if(gartic.players.length<1){
                if(gartic.rptmi == 5){
                    gartic.client.sendMessage(gartic.id, "[!] No player wants to play, the session is forcibly terminated")
                    gartic.client = null
                    gartic.id = null
                    gartic.reqplayers = false
                    gartic.game = {}
                }else{
                    gartic.rptmi++
                    gartic.client.sendMessage(gartic.id, `[!] No player wants to play, the session rollback.\n(${gartic.rptmi} - 5 attempts)`)
                    return gartic.resetTimeout(this)
                }
            }else{
                gartic.client.sendMessage(gartic.id, `[!] ${gartic.players.length} players are ready to participate, the game starts 5 seconds away`)
                setTimeout(() => {
                    gartic.reqplayers = false
                    gartic.removeEventByID(id)
                    gartic.newSection()
                }, 5000);
            }
        }, 30000)

        this.game.event.emit('message_reaction', async(react) => {
            if(react.msgId.id == msg.id && gartic.reqplayers && !gartic.players.find(v => v == react.senderId)){
                gartic.players.push(react.senderId)
                gartic.score[react.senderId] = 0
                gartic.client.sendMessage(gartic.id, `[+] _@${react.senderId.split('@')[0]}_ ready for draw and guess`, { mentions: [await gartic.client.getContactById(react.senderId)] })
            }
        }, id)
    }

    initQueue(){
        if(this.queue.length < 1) this.queue.push(...this.players)
        if(this.queueIndex == this.queue.length) this.queueIndex = -1
        this.queueIndex++
        
        return this.queue[this.queueIndex]
    }


    async setDraw(cb){
        this.game.theme = randomTheme()
        const gartic = this
        const [ object0, object1 ] = this.game.theme.Object
        const id = Date.now().toString(14)

        this.client.sendMessage(this.id, `[/] Game started, _@${this.playersQueue.split('@')[0]}'s_ turn to draw`, { mentions: [await this.client.getContactById(this.playersQueue)] })

        let button = new Buttons(`Theme is ${this.game.theme.theme}, select the object for you to draw:`,[{ id: object0, body: object0.toUpperCase() }, { id: object1, body: object1.toUpperCase() }]);
        await this.client.sendMessage(this.playersQueue, button);

        this.game.event.emit('message', async(message) => {
            if(message.from !== gartic.playersQueue || gartic.game.theme?.timer?._destroyed) return
            if (gartic.game.theme.timer && message.hasMedia) {
                clearTimeout(gartic.game.theme.timer)
                gartic.game.time = + new Date()
    
                const media = await message.downloadMedia();
                await gartic.client.sendMessage(gartic.id, media, { caption: `Your friends _(@${gartic.playersQueue.split('@')[0]})_ have finished drawing, now it's time for you to guess this picture. We only have 4 minutes to guess\nTheme: *${gartic.game.theme.theme}*`, mentions: await Promise.all([...gartic.players].map(async(v) => await gartic.client.getContactById(v))) })
                message.reply("Thank you, please don't type anything while your friends are trying to guess your picture")
                gartic.removeEventByID(id)
                cb()
            }else if(message.type == 'buttons_response'){
                const { selectedButtonId } = message;
                gartic.game.theme.Object = selectedButtonId
                const media = MessageMedia.fromFilePath('./lib/img/blank.png');
                gartic.client.sendMessage(gartic.playersQueue, media, { caption: "You have selected object: *"+selectedButtonId.toUpperCase()+"*\nNow please draw a *"+selectedButtonId.toUpperCase()+"* and send it here, you have 1 minute for draw it" })
    
                gartic.game.theme.timer = setTimeout(() => {
                    gartic.client.sendMessage(gartic.playersQueue, "*TIMEOUT*\nYour time is up, your turn will be skipped and the point will be reduced by 10 (-10)")
                    gartic.score[gartic.playersQueue]-=10
                    gartic.removeEventByID(id)
                    gartic.newSection()
                }, 60000);
            }else if(message.author == gartic.playersQueue && message.from.endsWith('g.us') && gartic.game.theme?.timer?._destroyed) return message.delete(true)
        }, id)
    }

    async newGuess(){
        const gartic = this
        const id = Date.now().toString(14)

        this.game.timer = setTimeout(async() => {
            gartic.removeEventByID(id)
            gartic.sendMessage("*SCORE SEMENTARA*"+(Object.keys(gartic.score).sort((a,b) => gartic.score[a]+gartic.score[b]).map((v, i) => {
                return `[${i}] _@${v}_ : ${gartic.score[v]} Point`
            }).join('\n')), { mentions: await Promise.all([...gartic.players].map(async(v) => await gartic.client.getContactById(v))) })
        }, 60000*4);

        this.game.event.emit('message', async(message) => {
            const chat = await message.getChat()
            if(!gartic.game.theme?.timer?._destroyed && !gartic.game.time) return
            if(gartic.players.includes(message.author) && message.from == gartic.id && message.author !== gartic.playersQueue && validateAnswer(gartic.game.theme.theme, message.body)){
                if(!gartic.players[message.author]?.endsWith('true')){
                    message.delete(true)
    
                    let second = clockString(new Date() - gartic.game.time)[2]
                    let point = (second<10 ? 20 : second<18 ? 18 : second<28 ? 15 : 10)
                    gartic.score[message.author]+=point
                    gartic.score[gartic.playersQueue]+=Math.floor(point/3)
    
                    chat.sendMessage(`_@${message.author.split('@')[0]}_ Your answer is correct!\nScore: +${point}`, { mentions: [await gartic.client.getContactById(message.author)] })
                    gartic.players[message.author]+='-true'
                }else{
                    message.delete(true)
                }
            }
        }, id)
    }
}

module.exports = Gartic
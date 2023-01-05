const { randomTheme, validateAnswer } = require('./Utils/theme')
const { Buttons } = require('whatsapp-web.js')

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
        this.game = { theme: null }
        
        this.open(id)
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
                    gartic.client.sendMessage(gartic.id, `[!] No player wants to play, the session rollback. type /join to connect\n(${gartic.rptmi} - 5 attempts)`)
                    return gartic.resetTimeout(this)
                }
            }else{
                gartic.client.sendMessage(gartic.id, `[!] ${gartic.players.length} players are ready to participate, the game starts 5 seconds away`)
                setTimeout(() => {
                    gartic.newSection()
                }, 5000);
            }
        }, 30000)

        this.client.on('message_reaction', async(react) => {
            if(react.msgId.id == msg.id && gartic.reqplayers && !gartic.players.find(v => v == react.senderId)){
                gartic.players.push(react.senderId)
                gartic.score[react.senderId] = 0
                gartic.client.sendMessage(gartic.id, `[+] @${react.senderId} ready for draw and guess`, { mentions: await this.client.getContactById(react.senderId) })
            }
        })
    }

    initQueue(){
        if(this.queue.length < 1) this.queue.push(...this.players)
        if(this.queueIndex == this.queue.length) this.queueIndex = -1
        this.queueIndex++
        
        return this.queue[this.queueIndex]
    }


    setDraw(cb){
        this.game.theme = randomTheme()
        const [ object0, object1 ] = this.game.theme.Object

        let button = new Buttons(`Theme is ${this.game.theme.theme}, select the object for you to draw:`,[{ id: object0, body: object0.toUpperCase() }, { id: object1, body: object1.toUpperCase() }]);
        this.client.sendMessage(this.playersQueue, button);

        this.client.on('message', async(message) => {
            if(message.from !== this.playersQueue) return
            if (this.game.theme.timer && message.hasMedia) {
                clearTimeout(this.game.theme.timer)

                const media = await message.downloadMedia();
                this.client.sendMessage(this.id, media, { caption: `Your friends _(@${this.playersQueue.split('@')[0]})_ have finished drawing, now it's time for you to guess this picture. We only have 4 minutes to guess\nTheme: *${this.game.theme.Object}*`, mentions: [...this.players] })
                message.reply("Thank you, please don't type anything while your friends are trying to guess your picture")
            }else if(message.type == 'buttons_response'){
                const { selectedButtonId } = message;
                this.game.theme.Object = selectedButtonId
                this.client.sendMessage(this.playersQueue, "You have selected object: *"+selectedButtonId.toUpperCase()+"*\nNow please draw a *"+selectedButtonId.toUpperCase()+"8 and send it here, you have 1 minute for draw it")

                const gartic = this
                this.game.theme.timer = setTimeout(() => {
                    gartic.client.sendMessage(gartic.playersQueue, "*TIMEOUT*\nYour time is up, your turn will be skipped and the point will be reduced by 10 (-10)")
                    gartic.score[gartic.playersQueue]-=10
                    gartic.skipTurn()
                }, 60000);
            }
        })
    }

    newGuess(){
        
    }
}

module.exports = Gartic
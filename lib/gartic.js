const { randomTheme, validateAnswer } = require('./Utils/theme')
const { Buttons } = require('whatsapp-web.js')

class Gartic{
    constructor(client, groupid, id){
        this.score = {}
        this.id = groupid
        this.client = client
        this.players = []
        this.queue = []
        this.queueIndex = -1
        this.ends = false
        this.reqplayers = false
        this.game = { id: null, theme: null }
        
        this.open(id)
    }

    get playersQueue(){
        return this.queue[this.queueIndex]
    }

    resetTimeout(timeout, func, time){
        if(!(timeout instanceof setTimeout(()=>{}).constructor && func).constructor) return setTimeout(func, time);
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

        this.client.on('message_reaction', (react) => {
            if(react.msgId.id == msg.id && gartic.reqplayers && !gartic.players.find(v => v == react.senderId)){
                gartic.players.push(react.senderId)
                gartic.score[react.senderId] = 0
                gartic.client.sendMessage(gartic.id, `[+] @${react.senderId.split('@')[0]} ready for draw and guess`)
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
        this.game = { id: this.playersQueue, theme: randomTheme() }
        const [ object0, object1 ] = this.game.theme.Object

        let button = new Buttons(`Theme is ${this.game.theme.theme}, select the object for you to draw:`,[{ id: object0, body: object0.toUpperCase() }, { id: object1, body: object1.toUpperCase() }]);
        this.client.sendMessage(this.playersQueue, button);

        this.client.on('message', async(message) => {
            if(message.from !== this.game.id) return
            if (message.type == 'buttons_response') {
                const { selectedButtonId } = message;
                this.game.theme.Object = selectedButtonId
                this.client.sendMessage(this.playersQueue, "You have selected object: "+selectedButtonId.toUpperCase()+"\nNow please draw a "+selectedButtonId.toUpperCase()+" and send it here, you have 1 minute for draw it")
            }
        })
    }

    newGuess(){
        
    }
}

module.exports = Gartic
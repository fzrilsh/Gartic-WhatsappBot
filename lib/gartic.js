const { randomTheme, validateAnswer } = require('./Utils/theme')

class Gartic{
    constructor(client, groupid){
        this.score = []
        this.id = groupid
        this.client = client
        this.players = []
        this.queue = []
        this.ends = false
        this.reqplayers = false
        const gartic = this
        this.reqplayersTm = setTimeout(() => {
            gartic.reqplayers = true
            gartic.client.sendMessage(gartic.id, `[!] All players are ready to participate, the game starts 5 seconds away`)
            setTimeout(() => {
                gartic.initialize()
            }, 5000);
        }, 30000)
    }

    open(){
        this.client.on('message', async (message) => {
            if(message.from !== this.id && !this.reqplayers && !message.from.endsWith('g.us')) return
            this.players.push(message.sender)
            this.client.sendMessage(this.id, `[+] @${message.sender} ready for draw and guess`)
        })
    }

    initialize(){
        
    }
}
const { randomTheme, validateAnswer } = require('./Utils/theme')
const { MessageMedia } = require('whatsapp-web.js')
const { clockString } = require('./Utils/Util')
const { EventEmitter } = require('events')

class Gartic {
    instanceTimer = setTimeout(() => { }).constructor

    constructor(client, groupid, id) {
        this.score = {}
        this.id = groupid
        this.client = client
        this.players = []
        this.queue = []
        this.queueIndex = -1
        this.ends = false
        this.reqplayers = false
        this.game = { theme: null, event: new EventEmitter(), caches: { message: [], message_reaction: [] } }

        this.eventMessageHandler()
        this.open(id)

        const gartic = this
        gartic.gameStatus = setInterval(function () {
            if (gartic.reqplayers || gartic.game.theme) {
                global.gameSections[groupid] = {
                    status: (gartic.reqplayers ? "In this group are gathering players" : "Game is starting in this group"),
                    game: gartic
                }
            } else {
                delete global.gameSections[groupid]
                clearInterval(this)
            }
        }, 1000)
    }

    restartEvent(eventname) {
        const gartic = this
        this.client.once(eventname, async (result) => {
            for (const arr of this.game.caches[eventname]) {
                if (typeof (arr) !== 'object') continue
                const [func, id] = arr
                func(result)
                gartic.restartEvent(eventname)
            }
        })
    }

    removeEventByID(id) {
        for (const key of Object.keys(this.game.caches)) {
            let index = this.game.caches[key].findIndex(v => v?.[1] == id)
            if (index > -1) {
                delete this.game.caches[key][index]
                break
            }
        }
    }

    removeAllEvent(){
        for (const key of Object.keys(this.game.caches)) {
            delete this.game.caches[key]
        }
    }

    messageHandler() {
        const gartic = this
        this.client.once('message', async (message) => {
            for (const [func, id] of gartic.game.caches.message) {
                func(message)
                gartic.restartEvent('message')
            }
        })
        this.client.once('message_reaction', async (message) => {
            for (const [func, id] of gartic.game.caches.message_reaction) {
                func(message)
                gartic.restartEvent('message_reaction')
            }
        })
    }

    eventMessageHandler() {
        const gartic = this
        this.game.event.on(`message`, async (func, id) => {
            if (typeof (func) == 'function') gartic.game.caches.message.push([func, id])
        })

        this.game.event.on('message_reaction', async (func, id) => {
            if (typeof (func) == 'function') gartic.game.caches.message_reaction.push([func, id])
        })

        this.messageHandler()
    }

    get playersQueue() {
        return this.queue[this.queueIndex]
    }

    resetTimeout(timeout, func, time) {
        if (!(timeout instanceof this.instanceTimer && func).constructor) return setTimeout(func, time);
        else if (!func) return false
        else return setTimeout(timeout._onTimeout, timeout._idleTimeout)
    }

    newSection() {
        this.initQueue()
        this.setDraw(() => {
            this.newGuess()
        })
    }

    open(msg) {
        const gartic = this
        const id = Date.now().toString(14)
        gartic.reqplayers = true
        gartic.rptmi = 0

        this.reqplayersTm = setTimeout(async () => {
            if (gartic.players.length < 1) {
                if (gartic.rptmi == 5) {
                    gartic.reqplayers = null
                    gartic.game = null
                    delete gartic.rptmi
                    await gartic.client.sendMessage(gartic.id, "[!] No player wants to play, the session is forcibly terminated")
                    gartic.client = null
                } else {
                    gartic.rptmi++
                    gartic.client.sendMessage(gartic.id, `[!] No player wants to play, the session rollback.\n_(${gartic.rptmi} - 5 attempts)_`)
                    gartic.reqplayersTm = setTimeout(gartic.reqplayersTm._onTimeout, gartic.reqplayersTm._idleTimeout)
                    return gartic.resetTimeout(this)
                }
            } else {
                gartic.client.sendMessage(gartic.id, `[!] ${gartic.players.length} players are ready to participate, the game starts 5 seconds away`)
                setTimeout(() => {
                    gartic.reqplayers = false
                    gartic.removeEventByID(id)
                    gartic.newSection()
                    delete gartic.rptmi
                }, 5000);
            }
        }, 30000)

        this.game.event.emit('message_reaction', (react) => {
            if (react.msgId.id == msg.id && gartic.reqplayers && !gartic.players.find(v => v == react.senderId)) {
                gartic.players.push(react.senderId)
                gartic.score[react.senderId] = 0
                gartic.client.sendMessage(gartic.id, `[+] _@${react.senderId.split('@')[0]}_ ready for draw and guess`, { mentions: [react.senderId] })
            }
        }, id)
    }

    initQueue() {
        if (this.queue.length < 1) this.queue.push(...(
            this.players
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value)))
        if (this.queueIndex == this.queue.length - 1) this.queueIndex = -1
        this.queueIndex++

        return this.queue[this.queueIndex]
    }


    async setDraw(cb) {
        this.game.theme = randomTheme()
        const objects = this.game.theme.object

        const id = Date.now().toString(14)
        const gartic = this

        this.client.sendMessage(this.id, `[/] _@${this.playersQueue.split('@')[0]}'s_ turn to draw`, { mentions: [this.playersQueue] })

        let themeConfirmationMessage = `Theme is ${this.game.theme.theme}, select the object for you to draw: \n${objects.map((v, i) => i + 1 + '. ' + v.toUpperCase()).join('\n')}`
        await this.client.sendMessage(this.playersQueue, themeConfirmationMessage);

        let timeout = setTimeout(() => {
            gartic.client.sendMessage(gartic.id, `_@${gartic.playersQueue.split('@')[0]}'s_ is suspected to be afk, he has been skipped and we will move on to the next turn`, { mentions: [gartic.playersQueue] })
            gartic.client.sendMessage(gartic.playersQueue, "*TIMEOUT*\nYour time is up, your turn will be skipped and the point will be reduced by 10 (-10)")
            gartic.score[gartic.playersQueue] -= 10
            gartic.removeEventByID(id)
            gartic.newSection()
        }, 1000 * 60);

        this.game.event.emit('message', async (message) => {
            if (message.from !== gartic.playersQueue || !gartic.reqplayersTm?._destroyed) return
            if (message.author == gartic.playersQueue && message.from.endsWith('g.us') && !gartic.game.theme?.timer?._destroyed) return message.delete(true)
            if (!gartic.game.theme.timer?._destroyed && message.hasMedia) {
                try {
                    const media = await message.downloadMedia();
                    await gartic.client.sendMessage(gartic.id, media, { caption: `Your friends _(@${gartic.playersQueue.split('@')[0]})_ have finished drawing, now it's time for you to guess this picture. We only have 4 minutes to guess\nTheme: *${gartic.game.theme.theme}*`, mentions: gartic.players })
                    message.reply("Thank you, please don't type anything while your friends are trying to guess your picture")

                    clearTimeout(timeout)
                    clearTimeout(gartic.game.theme.timer)
                    gartic.game.time = + new Date()
                    gartic.removeEventByID(id)
                    cb()
                } catch (error) {
                    message.reply('Please send a valid image.')
                }
            } else {
                let selectedObject = parseInt(message.body) - 1 in objects ? objects[parseInt(message.body) - 1] : objects.find(v => v === message.body.toLowerCase()) ? objects.find(v => v === message.body.toLowerCase()) : false
                if (!selectedObject) return false

                gartic.game.theme.object = selectedObject
                const media = MessageMedia.fromFilePath('./lib/img/blank.png');
                gartic.client.sendMessage(gartic.playersQueue, media, { caption: "You have selected object: *" + selectedObject.toUpperCase() + "*\nNow please draw a *" + selectedObject.toUpperCase() + "* and send it here, you have 1 minute for draw it" })

                gartic.game.theme.timer = setTimeout(() => {
                    gartic.client.sendMessage(gartic.id, `_@${gartic.playersQueue.split('@')[0]}'s_ is suspected to be afk, he has been skipped and we will move on to the next turn`, { mentions: [gartic.playersQueue] })
                    gartic.client.sendMessage(gartic.playersQueue, "*TIMEOUT*\nYour time is up, your turn will be skipped and the point will be reduced by 10 (-10)")
                    gartic.score[gartic.playersQueue] -= 10
                    gartic.removeEventByID(id)
                    gartic.newSection()
                }, 60000);
            }
        }, id)
    }

    async newGuess() {
        const gartic = this
        const id = Date.now().toString(14)

        this.game.timer = setTimeout(async () => {
            gartic.removeEventByID(id)
            gartic.newSection()

            gartic.client.sendMessage(gartic.id, "*SCORE SEMENTARA*\n" + (Object.keys(gartic.score).sort((a, b) => gartic.score[a] + gartic.score[b]).map((v, i) => {
                return `[${i + 1}] _@${v.split('@')[0]}_ : ${gartic.score[v]} Point`
            }).join('\n')), { mentions: gartic.players })
        }, 60000 * 2);

        this.game.event.emit('message', async (message) => {
            const chat = await message.getChat()
            if (!gartic.game.theme?.timer?._destroyed && !gartic.game.time) return
            if (gartic.players.includes(message.author) && message.from == gartic.id && validateAnswer(gartic.game.theme.theme, message.body)) {
                if (message.author == gartic.playersQueue || gartic.players[message.author]?.endsWith('true')) return message.delete(true)
                message.delete(true)

                let second = clockString(new Date() - gartic.game.time)[2]
                let point = (second < 10 ? 20 : second < 18 ? 18 : second < 28 ? 15 : 10)
                gartic.score[message.author] += point
                gartic.score[gartic.playersQueue] += Math.floor(point / 3)

                chat.sendMessage(`_@${message.author.split('@')[0]}_ Your answer is correct!\nScore: +${point}`, { mentions: [message.author] })
                gartic.players[message.author] += '-true'
            }
        }, id)
    }
}

module.exports = Gartic
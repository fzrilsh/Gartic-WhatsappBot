const { randomTheme, validateAnswer } = require("./lib/Utils/theme");
const { clockString, isGroup, stringSimilarity } = require("./lib/Utils/Util");
const messages = require('./config/messages.json');
const { MessageMedia } = require("whatsapp-web.js");
const sections = []

class Gartic {
    WAITING = 1
    STARTED = 2
    GUESSES = 3
    END = 4

    MIN_PLAYER = 2

    /**
     * @param {String} groupid 
     * @param {import('whatsapp-web.js').Client} client
     * @param {import('whatsapp-web.js').Message} reactedMessage
     */
    constructor(groupid, client, reactedMessage) {
        this.client = client
        this.id = groupid
        this.reactedMessage = reactedMessage

        this.score = {}
        this.players = []
        this.queue = []
        this.queueTurn = -1
        this.playerTurn = null

        this.theme = null
        this.timeStartedGuess = null
        this.state = this.WAITING
        this.caches = { messages: [], message_reactions: [], timeout: {} }

        this.recrutPlayer()
    }

    static findSection(id) {
        return sections.find(v => v.id === id)
    }

    removeEvent(eventName, id) {
        global[eventName + 'Event'].splice(global[eventName + 'Event'].findIndex(event => event.id === id), 1)
    }

    destroy() {
        sections.splice(sections.findIndex(section => section.id === this.id), 1)
        this.state = this.END

        global.messageEvent.forEach((v, i) => {
            if (v.classId === this.id) global.messageEvent.splice(i, 1)
        })
    }

    findPlayer(id) {
        return this.players.find(playerID => playerID === id)
    }

    resetPlayer() {
        this.players = this.players.map(player => player.replace('-true', ''))
    }

    checkGameover() {
        let scores = Object.values(this.score).find(v => v >= 500)
        let formattedScore = Object.keys(this.score).map(v => ({ id: v, score: this.score[v] }))

        if (scores) {
            this.client.sendMessage(this.id, 'Game Over')
            return true
        }
    }

    recrutPlayer() {
        sections.push(this)

        const closeGame = () => {
            sections.splice(sections.findIndex(section => section.id === this.id), 1)
            this.client.sendMessage(this.id, messages.not_enough_player)
        }

        setTimeout(() => {
            if (this.state !== this.WAITING) return false
            if (this.players.length < this.MIN_PLAYER) return closeGame()

            this.client.sendMessage(this.id, messages.game_starting.replace(':total', this.players.length))
            this.queue = this.players.map((value) => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value)

            this.state = this.STARTED
            setTimeout(this.turnDraw.bind(this), 5000);
        }, 30000);

        /**
         * @param {import('whatsapp-web.js').Reaction} react 
         */
        this.client.on('message_reaction', (react) => {
            if (react.msgId.id !== this.reactedMessage.id.id) return false
            if (this.findPlayer(react.senderId)) return false

            if (this.state !== this.END) this.players.push(react.senderId)
            if (this.state === this.GUESSES) this.queue.push(react.senderId)

            if (this.state !== this.END) this.client.sendMessage(this.id, messages.player_joined.replace(':tag', react.senderId.split('@')[0]), { mentions: [react.senderId] })
        })
    }

    turnDraw() {
        if (this.checkGameover()) return false

        this.theme = randomTheme()
        const id = Date.now().toString(14)

        if (this.queueTurn >= this.players.length - 1) this.queueTurn = 0
        else this.queueTurn++

        this.queue.forEach(player => {
            if (!(player in this.score)) this.score[player] = 0
        })

        this.playerTurn = this.queue[this.queueTurn]
        this.client.sendMessage(this.id, messages.player_turn.replace(':tag', this.playerTurn.split('@')[0]), { mentions: [this.playerTurn] })

        this.state = this.STARTED
        this.client.sendMessage(this.playerTurn, messages.choose_object.replace(':theme', this.theme.name).replace(':options', this.theme.object.map((v, i) => '\n' + (i + 1) + '. ' + v.toUpperCase()).join('')))
        setTimeout(() => {
            if (this.state === this.END) return false
            if (this.state === this.STARTED) {
                global.messageEvent.splice(global.messageEvent.findIndex(v => v.id === id), 1)
                this.resetPlayer()

                this.client.sendMessage(this.id, messages.suspected_afk.replace(':tag', this.playerTurn.split('@')[0]), { mentions: [this.playerTurn] })
                setTimeout(this.turnDraw.bind(this), 5000);
            }
        }, 30000);

        /**
         * @param {import('whatsapp-web.js').Message} message 
         */
        let messageHandler = async (message) => {
            if (typeof (this.theme.object) === 'object' && message.from === this.playerTurn) {
                let selected = parseInt(message.body) - 1 in this.theme.object ? this.theme.object[parseInt(message.body) - 1] : this.theme.object.find(v => v === message.body.toLowerCase()) ? this.theme.object.find(v => v === message.body.toLowerCase()) : false
                if (!selected) return false

                this.state = this.GUESSES
                this.theme.object = selected
                this.client.sendMessage(this.playerTurn, MessageMedia.fromFilePath('./lib/img/blank.png'), { caption: messages.object_choosen.replaceAll(':object', selected.toUpperCase()) })
                this.client.sendMessage(this.id, messages.guess_drawed.replace(':tag', this.playerTurn.split('@')[0]), { mentions: [this.playerTurn] })

                this.timeStartedGuess = + new Date()
                this.caches.timeout[id] = setTimeout(() => {
                    if (this.state === this.END) return false

                    global.messageEvent.splice(global.messageEvent.findIndex(v => v.id === id), 1)
                    this.resetPlayer()

                    this.client.sendMessage(this.id, messages.guess_timeout.replace(':object', this.theme.object.toUpperCase()))
                    this.client.sendMessage(this.id, "*SCORE SEMENTARA*\n" + (Object.keys(this.score).sort((a, b) => this.score[a] + this.score[b]).map((v, i) => {
                        return `[${i + 1}] _@${v.split('@')[0]}_ : ${this.score[v]} Point`
                    }).join('\n')), { mentions: this.queue })

                    setTimeout(this.turnDraw.bind(this), 5000);
                }, 1000 * 60 * 3);

                // setTimeout(() => {
                //     if(this.state === this.END) return false

                //     this.client.sendMessage(this.id, messages.guess_timeout_1_minute_left)
                //     setTimeout(() => {
                //         if(this.state === this.END) return false

                //         global.messageEvent.splice(global.messageEvent.findIndex(v => v.id === id), 1)
                //         this.resetPlayer()

                //         this.client.sendMessage(this.id, messages.guess_timeout.replace(':object', this.theme.object.toUpperCase()))
                //         this.client.sendMessage(this.id, "*SCORE SEMENTARA*\n" + (Object.keys(this.score).sort((a, b) => this.score[a] + this.score[b]).map((v, i) => {
                //             return `[${i + 1}] _@${v.split('@')[0]}_ : ${this.score[v]} Point`
                //         }).join('\n')), { mentions: this.queue })

                //         setTimeout(this.turnDraw.bind(this), 5000);
                //     }, 1000 * 60);
                // }, 1000 * 60 * 2);
            }

            if (isGroup(message.from) && message.from === this.id && this.state === this.GUESSES) {
                if (validateAnswer(this.theme, message.body)) {
                    message.delete(true)

                    if (this.players.includes(message.author) && message.author !== this.playerTurn) {
                        let secondAnswered = clockString(new Date() - this.timeStartedGuess)[2]
                        let point = (secondAnswered < 10 ? 20 : secondAnswered < 18 ? 18 : secondAnswered < 28 ? 15 : 10)

                        this.score[message.author] += point
                        this.score[this.playerTurn] += Math.floor(point / 3)

                        this.players[this.players.findIndex(v => v === message.author)] += '-true'
                        this.client.sendMessage(this.id, messages.correct_answer.replace(':tag', message.author.split('@')[0]).replace('score', point), { mentions: [message.author] })

                        if (this.players.filter(v => v.includes('-true')).length === this.players.length - 2) {
                            this.caches.timeout[id]._onTimeout()
                            clearTimeout(this.caches.timeout[id])
                        }
                    }
                }else if(stringSimilarity(message.body, this.theme) >= 0.6){
                    message.reply('[!] Jawaban kamu hampir benar!')
                }
            }
        }

        global.messageEvent.push({
            id,
            classId: this.id,
            func: messageHandler.bind(this)
        })
    }
}

module.exports = Gartic
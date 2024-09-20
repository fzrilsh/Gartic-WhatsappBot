module.exports = {
  clockString: (ms, join = false) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    if (join) return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
    else return [h, m, s]
  },

  isGroup: (chatId) => chatId.endsWith('g.us'),
  
  /**
   * @param {import("whatsapp-web.js").Chat} chat 
   * @param {String} jid 
   * @returns {Boolean}
   */
  isAdmin: (chat, jid) => chat.participants.find(v => v.id._serialized === jid)?.isAdmin,

  stringSimilarity: (a, b) => {
    let aSet = new Set(a)
    let bSet = new Set(b)

    let intersection = new Set([...aSet].filter(x => bSet.has(x)))
    let union = new Set([...aSet, ...bSet])

    return intersection.size / union.size
  }
}
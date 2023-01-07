function clockString(ms, join = false) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    if(join) return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
    else return [h, m, s]
  }

  module.exports = {
    clockString
  }
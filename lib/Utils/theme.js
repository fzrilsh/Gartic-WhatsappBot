const theme = require('../../config/themes')

module.exports = {
    randomTheme: function(){
        return {...theme[Math.floor(Math.random()*theme.length)]}
    },
    validateAnswer: function(theme, ans){
        return theme.object === ans.toLowerCase()
    }
}
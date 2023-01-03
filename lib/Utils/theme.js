const theme = [{
    theme: "lebaran",
    Object: ["ketupat", "ied"]
}]

module.exports = {
    randomTheme: function(){
        return theme[Math.floor(Math.random()*theme.length)]
    },
    validateAnswer: function(them, ans){
        return theme.find(v => (v.theme == them) && v.Object.find(r => r == ans))
    }
}
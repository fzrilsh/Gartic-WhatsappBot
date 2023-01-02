const theme = [{
    theme: "lebaran",
    Object: ["ketupat", "ied"]
}]

module.exports = function randomTheme(){
    return theme[Math.floor(Math.random()*theme.length)]
}

module.exports = function validateAnswer(them, ans){
    return theme.find(v => (v.theme == them) && v.Object.find(r => r == ans))
}
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

if(!fs.existsSync('./build')) fs.mkdirSync('./build')

const copy = function(src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if(!fs.existsSync(dest)) fs.mkdirSync(dest, { overwrite: true });
        fs.readdirSync(src).forEach(function(childItemName) {
            copy(path.join(src, childItemName),
            path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest, );
    }
};

fs.readdirSync('./').forEach(file => {
    if(['.wwebjs_auth', 'node_modules', 'build', 'build.js'].includes(file)) return
    copy(path.join(__dirname, file), path.join(__dirname, 'build', file))
})

exec('cd build')
exec('git add .')
exec('git commit -m "update"')
exec('git push')
var path = require('path');
var express = require('express');
var morgan = require('morgan');

var app = express();

app.use(morgan('dev'));
app.use((req, res, next) => {
    res.set({
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
    });
    next();
})
app.use(express.static(__dirname + '/dist/GIFmakr'));

app.listen(process.env.PORT, () => {
    console.log('GIFmakr is up on port ', process.env.PORT);
});

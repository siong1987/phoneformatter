var phoneNumberFormat = require('google-libphonenumber').PhoneNumberFormat;

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));

var oneDay = 86400000;
app.use(express.static(__dirname + '/public', { maxAge: oneDay }));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 5000))

app.get('/', function(request, response) {
  console.log(request.headers);
  console.log(request.get('CF-IPCountry'));
  response.render('main');
});

app.post('/', function(request, response) {
  response.send('phone ' + request.body.number);
});

app.get('/:number', function(request, response) {
  response.send('phone ' + request.params.number);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running at localhost:' + app.get('port'));
});

var PNF = require('google-libphonenumber').PhoneNumberFormat;
var PNV = require('google-libphonenumber').ValidationResult;
var PNT = require('google-libphonenumber').PhoneNumberType;

var phoneUtil = require('google-libphonenumber').phoneUtil;
var AsYouTypeFormatter = require('google-libphonenumber').AsYouTypeFormatter;

var geoIP = require('geoip-lite');

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));

var oneDay = 86400000;
app.use(express.static(__dirname + '/public', { maxAge: oneDay }));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 5000))

var ipLookupCountryCode = function(ip) {
  if (typeof ip !== 'undefined' && ip !== null) {
    var geo = geoIP.lookup(ip);
    return geo.country;
  } else {
    return 'US';
  }
};

var parseNumber = function(regionCode, phoneNumber) {
  var number = phoneUtil.parseAndKeepRawInput(phoneNumber, regionCode);
  var isPossible = phoneUtil.isPossibleNumber(number);
  var invalid_reason = 'UNKNOWN';
  var isNumberValid = false;
  var isNumberValidForRegion = false;
  var regionCode = regionCode;
  var numberType = 'UNKNOWN';
  if (!isPossible) {
    switch (phoneUtil.isPossibleNumberWithReason(number)) {
      case PNV.INVALID_COUNTRY_CODE:
        invalid_reason = 'INVALID_COUNTRY_CODE';
        break;
      case PNV.TOO_SHORT:
        invalid_reason = 'TOO_SHORT';
        break;
      case PNV.TOO_LONG:
        invalid_reason = 'TOO_LONG';
        break;
    }
    invalid_reason = 'UNKNOWN';
  } else {
    isNumberValid = phoneUtil.isValidNumber(number);
    if (isNumberValid && regionCode && regionCode != 'ZZ') {
      isNumberValidForRegion = phoneUtil.isValidNumberForRegion(number, regionCode);
    }
    regionCode = phoneUtil.getRegionCodeForNumber(number);
    switch (phoneUtil.getNumberType(number)) {
      case PNT.FIXED_LINE:
        numberType = 'FIXED_LINE';
        break;
      case PNT.MOBILE:
        numberType = 'MOBILE';
        break;
      case PNT.FIXED_LINE_OR_MOBILE:
        numberType = 'FIXED_LINE_OR_MOBILE';
        break;
      case PNT.TOLL_FREE:
        numberType = 'TOLL_FREE';
        break;
      case PNT.PREMIUM_RATE:
        numberType = 'PREMIUM_RATE';
        break;
      case PNT.SHARED_COST:
        numberType = 'SHARED_COST';
        break;
      case PNT.VOIP:
        numberType = 'VOIP';
        break;
      case PNT.PERSONAL_NUMBER:
        numberType = 'PERSONAL_NUMBER';
        break;
      case PNT.PAGER:
        numberType = 'PAGER';
        break;
      case PNT.UAN:
        numberType = 'UAN';
        break;
      case PNT.UNKNOWN:
        numberType = 'UNKNOWN';
        break;
    }
  }

  var originalFormat = isNumberValid ? phoneUtil.formatInOriginalFormat(number, regionCode) : 'invalid';
  var e164Format = isNumberValid ? phoneUtil.format(number, PNF.E164) : 'invalid';
  var nationalFormat = isNumberValid ? phoneUtil.format(number, PNF.NATIONAL) : 'invalid';
  var internationalFormat = isNumberValid ? phoneUtil.format(number, PNF.INTERNATIONAL) : 'invalid';

  var formatter = new AsYouTypeFormatter(regionCode);
  var phoneNumberLength = phoneNumber.length;
  var inputChars = [];
  for (var i = 0; i < phoneNumberLength; ++i) {
    var inputChar = phoneNumber.charAt(i);
    inputChars.push({
      input_char: inputChar,
      output: formatter.inputDigit(inputChar)
    });
  }

  return {
    raw_input: phoneNumber,
    is_possible: isPossible,
    invalid_reason: invalid_reason,
    is_valid: isNumberValid,
    is_valid_for_region: isNumberValidForRegion,
    region_code: regionCode,
    number_type: numberType,
    original_format: originalFormat,
    e164_format: e164Format,
    national_format: nationalFormat,
    international_format: internationalFormat,
    as_you_type_formatter: inputChars
  }
};

app.get('/', function(request, response) {
  response.render('main');
});

app.options('/', cors());
app.post('/', cors(), function(request, response) {
  var countryCode = request.body.country_code;
  var phoneNumber = request.body.phone_number;
  if (typeof countryCode === 'undefined' || countryCode === null) {
    countryCode = ipLookupCountryCode(request.get('x-forwarded-for'));
  }
  response.json(parseNumber(countryCode, phoneNumber));
});

app.listen(app.get('port'), function() {
  console.log('Node app is running at localhost:' + app.get('port'));
});

var handlebars = require( 'handlebars' );
var fs = require( 'fs' );
var path = require( 'path' );
var outputJson = require( '../output2.json' );
var util = require( 'util' );
var nodemailer = require( 'nodemailer' );
var juice = require( 'juice' );
var peliasConfig = require( 'pelias-config' ).generate()[ 'acceptance-tests' ].email;

handlebars.registerHelper( 'json', JSON.stringify );
handlebars.registerHelper( 'testCase', function ( res ){
  var id = res.testCase.id;
  var input = JSON.stringify( res.testCase.in, undefined, 4 );
  var status = (res.progress === undefined) ? '' :
    util.format( '<span class="status">%s</span> ', res.progress );

  var out;
  switch( res.result ){
    case 'pass':
      out = new handlebars.SafeString( util.format( '✔ %s[%s] "%s"', status, id, input ) );
      break;

    case 'fail':
      out = new handlebars.SafeString( util.format( '✘ %s[%s] "%s": %s', status, id, input, res.msg ) );
      break;

    case 'placeholder':
      return util.format( '! [%s] "%s": %s', id, input, res.msg );

    default:
      console.error( util.format( 'Result type `%s` not recognized.', res.result ) );
      process.exit( 1 );
  }

  return out;
});

var emailTemplate = fs.readFileSync( path.join( __dirname, 'email_static/email.html' ) ).toString();
var emailHtml = juice( handlebars.compile( emailTemplate )( outputJson ) );
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: peliasConfig
});

var emailOpts = {
  from: 'pelias-acceptance-tests',
  to: peliasConfig.recipients.join( ', ' ),
  subject: 'pelias acceptance-tests results ' + new Date().toString(),
  html: emailHtml
};

transporter.sendMail( emailOpts, function( err, info ){
  if( err ){
    console.error( err );
  }
  else {
    console.log( 'Sent: ', info );
  }
});
// module.exports = function ( suiteResults ){
  // console.log( handlebars.compile( emailTemplate )( suiteResults ) );
// };

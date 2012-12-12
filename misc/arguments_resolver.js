/**
 Copyright (c) 2012 aixigo AG <info@aixigo.de>
 All rights reserved.

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the 'Software'), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*jshint strict:false*//*global exports*/
var optimist = require( 'optimist' );

exports.get = get;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var args_;
function get( optionalKey ) {
   if( !args_ ) {
      args_ = assembleConfiguration();
   }

   if( optionalKey ) {
      if( optionalKey.indexOf( '.' ) === -1 ) {
         return args_[ optionalKey ];
      }

      return resolveNestedValue( optionalKey.split( '.' ), args_ );
   }

   return args_;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resolveNestedValue( keyArr, conf ) {
   var node = conf;
   for( var i = 0, len = keyArr.length; i < len; ++i ) {
      if( !( keyArr[ i ] in node ) ) {
         return null;
      }

      node = node[ keyArr[ i ] ];
   }
   return node;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function assembleConfiguration() {
   var argv = resolveArgv( optimist );
   var args = {};
   if( argv[ 'config-file' ] ) {
      args = require( process.cwd() + '/' + argv[ 'config-file' ] );
   }

   args.rootDir = argv['root-dir'].replace( /\/$/, '' );

   return args;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resolveArgv( optimist ) {
   var opt = optimist
      .usage( 'Starts a development web server.\n Usage: $0 --root-dir=<path> --config-file=<path>' )
      .demand( [ 'root-dir' ] )
      .describe( 'root-dir', 'The root directory of the application' )
      .describe( 'config-file', 'A JSON file for the application and plugin configuration.' );

   opt[ 'default' ]( { port: 8666 } );

   return opt.argv;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function toCamelCase( str ) {
   return str.replace( /(\-[a-z])/g, function( $1 ) {return $1.toUpperCase().replace( '-', '' );} );
}

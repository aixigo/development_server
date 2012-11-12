/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2000-2012
//    by aixigo AG, Aachen, Germany.
//
//  All rights reserved. This material is confidential and proprietary to AIXIGO AG and no part of this
//  material should be reproduced, published in any form by any means, electronic or mechanical including
//  photocopy or any information storage or retrieval system nor should the material be disclosed to third
//  parties without the express written authorization of AIXIGO AG.
//
//  aixigo AG
//  http://www.aixigo.de
//  Aachen, Germany
//
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
      return args_[ optionalKey ];
   }

   return args_;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function assembleConfiguration() {
   var argv = resolveArgv( optimist );
   var args = {};
   if( argv[ 'config-file' ] ) {
      args = require( argv[ 'config-file' ] );
   }

   [ 'port', 'entry-file' ].forEach( function( key ) {
      if( key in argv ) {
         args[ key ] = argv[ key ];
      }
   } );

   [ 'export-dir', 'watch-dir' ].forEach( function( key ) {
      if( key in argv ) {
         args[ toCamelCase( key ) ] = resolvePossibleArrayArgument( argv, key );
      }
   } );

   args.rootDir = argv['root-dir'].replace( /\/$/, '' );

   return args;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resolvePossibleArrayArgument( argv, key ) {
   if( !argv[ key ] ) {
      return [];
   }

   if( typeof argv[ key ] === 'string' ) {
      return [ argv[ key ] ];
   }
   else {
      // assume it is an array provided by optimist
      return argv[ key ];
   }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resolveArgv( optimist ) {
   var opt = optimist
      .usage( 'Starts a development web server.\n' +
      'Usage: $0 --root-dir=<path>\n' +
      '       The export-dir argument can be given multiple times for different directories' )
      .demand( [ 'root-dir' ] )
      .describe( 'root-dir', 'The root directory of the application' )
      .describe( 'config-file', 'A JSON file to read the arguments from. Overridden by process args' )
      .describe( 'entry-file', 'If given reloading code is injected in its body' )
      .describe( 'watch-dir', 'A directory to watch for changes and reload <entry-file> if necessary' )
      .describe( 'export-dir', 'A directory to serve as http://localhost:<port>/var/listing/<directory>' )
      .describe( 'port', 'The port to start the server with' );

   opt[ 'default' ]( { port: 8666 } );

   return opt.argv;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function toCamelCase( str ) {
   return str.replace( /(\-[a-z])/g, function( $1 ) {return $1.toUpperCase().replace( '-', '' );} );
}
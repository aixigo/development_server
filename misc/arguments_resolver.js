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
      args = require( argv[ 'config-file' ] );
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
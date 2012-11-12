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
var express = require( 'express' );
var http = require( 'http' );
var socketIo = require( 'socket.io' );
var optimist = require( 'optimist' );

var page_reloader = require( './page_reloader' );
var static_server = require( './static_server' );
var directory_tree_provider = require( './directory_tree_provider' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// read arguments

var argv = resolveArgv( optimist );
var port = argv.port;
var rootDir = argv['web-dir'].replace( /\/$/, '' );
var exportDirs = resolvePossibleArrayArgument( argv, 'export-dir' );
var watchDirs = resolvePossibleArrayArgument( argv, 'watch-dir' );
var entryFile = argv[ 'entry-file' ];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// setup application

var app = express();
var server = http.createServer( app );
var io = socketIo.listen( server );

io.set( 'log level', 1 /* 0: error, 1: warn, 2: info, 3: debug */ );

app.set( 'io', io );
app.set( 'port', port );
app.use( function( req, res, next ) {
   // during development caching is prevented
   res.header( 'Cache-Control', 'no-cache' );
   res.header( 'Expires', 'Fri, 31 Dec 1998 12:00:00 GMT' );

   next();
} );

console.log( 'Started with pid ' + process.pid );
console.log( 'Using root directory %s and port %s', rootDir, port );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// start helpers

directory_tree_provider.start( app, rootDir, exportDirs );

page_reloader.start( app, rootDir, entryFile, watchDirs );

static_server.start( app, rootDir );

server.listen( port );

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
      'Usage: $0 --web-dir=<path>\n' +
      '       The export-dir argument can be given multiple times for different directories' )
      .demand( [ 'web-dir' ] )
      .describe( 'web-dir', 'The directory to serve' )
      .describe( 'entry-file', 'If given reloading code is injected in its body' )
      .describe( 'watch-dir', 'A directory to watch for changes and reload <entry-file> if necessary' )
      .describe( 'export-dir', 'A directory to serve as http://localhost:<port>/var/listing/<directory>' )
      .describe( 'port', 'The port to start the server with' );

   opt[ 'default' ]( { port: 8666 } );

   return opt.argv;
}
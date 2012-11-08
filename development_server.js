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

var argv = optimist
   .usage( 'Starts a development web server.\n' +
      'Usage: $0 --web-dir=<path>\n' +
      '       The export-dir argument can be given multiple times for different directories' )
   .demand( [ 'web-dir' ] )
   .describe( 'web-dir', 'The directory to serve' )
   .describe( 'entry-file', 'If given reloading code is injected in its body' )
   .describe( 'watch-dir', 'A directory to watch for changes and reload <entry-file> if necessary' )
   .describe( 'export-dir', 'A directory to serve as http://localhost:<port>/var/listing/<directory>' )
   .describe( 'port', 'The port to start the server with' )
   .default( { port: 8666 } )
   .argv;

var app = express();
var server = http.createServer( app );
var io = socketIo.listen( server );
io.set( 'log level', 1 /* 0: error, 1: warn, 2: info, 3: debug */ );

var port = argv.port;
var rootDir = argv['web-dir'].replace( /\/$/, '' );
var exportDirs = [];
if( argv[ 'export-dir' ] ) {
   if( typeof argv[ 'export-dir' ] === 'string' ) {
      exportDirs = [ argv[ 'export-dir' ] ];
   }
   else {
      // assume it is an array provided by optimist
      exportDirs = argv[ 'export-dir' ];
   }
}

var watchDirs = [];
if( argv[ 'watch-dir' ] ) {
   if( typeof argv[ 'watch-dir' ] === 'string' ) {
      watchDirs = [ argv[ 'watch-dir' ] ];
   }
   else {
      // assume it is an array provided by optimist
      watchDirs = argv[ 'watch-dir' ];
   }
}
var entryFile = argv[ 'entry-file' ];

app.set( 'io', io );
app.set( 'port', port );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

console.log( 'Started with pid ' + process.pid );
console.log( 'Using root directory %s and port %s', rootDir, port );

exportDirs.forEach( function( dir ) {
   dir = dir.replace( /^\//, '' );
   var widgetDirectoryTreeProvider = directory_tree_provider.getInstance( rootDir, dir );
   app.get( '/var/listing/' + dir.replace( /\//g, '_' ) + '.json', function( req, res ) {
      res.json( widgetDirectoryTreeProvider.getTree() );
   } );
} );

if( entryFile && watchDirs.length > 0 ) {
   page_reloader.start( app, rootDir, entryFile, watchDirs );
}

static_server.start( app, rootDir );

server.listen( port );

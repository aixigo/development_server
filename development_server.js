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
var optimist = require( 'optimist' );
var static_server = require( './static_server' );
var directory_tree_provider = require( './directory_tree_provider' );


var argv = optimist
   .usage( 'Starts a development web server.\n' +
      'Usage: $0 --web-dir=<path>\n' +
      '       The export-dir argument can be given multiple times for different directories' )
   .demand( [ 'web-dir' ] )
   .describe( 'web-dir', 'The directory to serve' )
   .describe( 'export-dir', 'A directory to serve as http://localhost:<port>/var/listing/<directory>' )
   .describe( 'port', 'The port to start the server with' )
   .default( { port: 8666 } )
   .argv;
var app = express();
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

console.log( argv );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

console.log( 'Started with pid ' + process.pid );
console.log( 'Using root directory %s and port %s', rootDir, port );

static_server.start( app, rootDir );

exportDirs.forEach( function( dir ) {
   dir = dir.replace( /^\//, '' );
   var widgetDirectoryTreeProvider = directory_tree_provider.getInstance( rootDir, dir );
   app.get( '/var/listing/' + dir.replace( /\//g, '_' ) + '.json', function( req, res ) {
      res.json( widgetDirectoryTreeProvider.getTree() );
   } );
} );

app.listen( port );

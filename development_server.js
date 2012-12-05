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
/*jshint strict:false*//*global exports,process,console,__dirname*/


require( './misc/extended_amd_loader' ).config( {
   baseUrl: __dirname,
   paths: {
      'lib/': '../../../includes/lib/'
   }
} );
require( '../../../includes/lib/json/extended_json' );

var express = require( 'express' );
var http = require( 'http' );
var socketIo = require( 'socket.io' );

var argumentResolver = require( './misc/arguments_resolver' );
var pageReloader = require( './plugins/page_reloader' );
var staticServer = require( './plugins/static_server' );
var directoryTreeProvider = require( './plugins/directory_tree_provider' );
var portalAngularDependencyProvider = require( './plugins/portal_angular_dependency_provider' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// setup application

var rootDir = argumentResolver.get( 'rootDir' );
var port = argumentResolver.get( 'port' );
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

directoryTreeProvider.start( app, rootDir, argumentResolver.get( 'exportDirs' ) );

portalAngularDependencyProvider.start( app, rootDir, argumentResolver.get( 'flowFile' ), argumentResolver.get( 'angularDependenciesFile' ) );
portalAngularDependencyProvider.createDependencyFile( function() {
   console.log( 'Created %s', argumentResolver.get( 'angularDependenciesFile' ) );
} );

pageReloader.start( app, rootDir, argumentResolver.get( 'reloadFiles' ), argumentResolver.get( 'watchDirs' ) );

staticServer.start( app, rootDir );

server.listen( port );
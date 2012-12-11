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
/*jshint strict:false*//*global exports,process,console,__dirname*/


require( './misc/extended_amd_loader' ).config( {
   baseUrl: __dirname,
   paths: {
      'lib/': '../../../includes/lib/'
   }
} );

if( require( 'fs' ).existsSync( __dirname + '/../../../includes/lib/json/extended_json.js' ) ) {
   require( '../../../includes/lib/json/extended_json' );
}
else {
   console.warn( 'JSON extension not available' );
}

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
console.log( 'Using root directory %s. Listening on port %s', rootDir, port );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// start plugins

if( argumentResolver.get( 'plugins.directoryTreeProvider.enabled' ) ) {
   var exportDirs = argumentResolver.get( 'plugins.directoryTreeProvider.exportDirs' );
   var exportUriPrefix = argumentResolver.get( 'plugins.directoryTreeProvider.exportUriPrefix' );

   directoryTreeProvider.start( app, rootDir, exportUriPrefix, exportDirs );
}

if( argumentResolver.get( 'plugins.portalAngularDependencyProvider.enabled' ) ) {
   var flowFile = argumentResolver.get( 'plugins.portalAngularDependencyProvider.flowFile' );
   var angularDependenciesFile = argumentResolver.get( 'plugins.portalAngularDependencyProvider.angularDependenciesFile' );

   portalAngularDependencyProvider.start( app, rootDir, flowFile, angularDependenciesFile );
   portalAngularDependencyProvider.createDependencyFile( function() {
      console.log( 'Created %s', angularDependenciesFile );
   } );
}

if( argumentResolver.get( 'plugins.pageReloader.enabled' ) ) {
   var reloadFiles = argumentResolver.get( 'plugins.pageReloader.reloadFiles' );
   var watchDirs = argumentResolver.get( 'plugins.pageReloader.watchDirs' );

   pageReloader.start( app, rootDir, reloadFiles, watchDirs );
}

staticServer.start( app, rootDir );

server.listen( port );
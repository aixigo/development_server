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
/*jshint strict:false*//*global exports,console*/
var fsWatchTree = require( './../misc/multi_watch_tree' );
var fs = require( 'fs' );

exports.start = start;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var rootDir_;
var sockets_ = {};
function start( app, rootDir, reloadFiles, watchedDirs ) {
   if( !reloadFiles || !reloadFiles.length || !watchedDirs.length ) {
      console.log( 'no watched dirs or reload file given' );
      return;
   }

   rootDir_ = rootDir;

   watchedDirs.forEach( function( dir ) {
      fsWatchTree.watchTree( rootDir + '/' + dir.replace( /^\//, '' ), handleFileChanged );
   } );

   app.use( function( req, res, next ) {
      for( var i = 0; i < reloadFiles.length; ++i ) {
         if( stringEndsWith( req.url, '/' + reloadFiles[ i ] ) ) {
            injectReloadingCode( req, res );
            return;
         }
      }

      next();
   } );

   app.get( 'io' ).sockets.on( 'connection', function( socket ) {
      sockets_[ socket.id ] = socket;
      socket.on( 'disconnect', function() {
         delete sockets_[ socket.id ];
      } );
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var timeout_;
function handleFileChanged( event ) {
   if( timeout_ ) {
      return;
   }

   // multiple changes should not result in multiple reloads. Therefore we wait a bit before reloading.
   timeout_ = setTimeout( function() {
      timeout_ = null;
      for( var key in sockets_ ) {
         if( sockets_.hasOwnProperty( key ) ) {
            sockets_[ key ].emit( 'reload' );
         }
      }
   }, 200 );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function injectReloadingCode( req, res ) {
   fs.readFile( rootDir_ + req.path, function( err, data ) {
      if( err ) {
         res.send( 500, 'internal error: ' + err );
         return;
      }

      var html = String( data ).replace( /(<head[^>]*>)([\S\s]*)(<\/head>)/igm,
                                         function( match, headStart, headContent, headEnd ) {
         if( headContent.indexOf( '<script' ) === -1 ) {
            return headStart + headContent + '\n' + createInjectionCode() + headEnd;
         }

         return headStart +  headContent.replace( '<script', createInjectionCode() + '<script' ) + headEnd;
      } );
      res.type( 'text/html' );
      res.send( html );
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createInjectionCode() {
   return '<script src="/socket.io/socket.io.js"></script>\n' +
      '<script>\n' +
      'var socket = io.connect( "http://" + location.host );\n' +
      'socket.on( "reload", function ( data ) {\n' +
      '   location.reload();\n' +
      '} );\n' +
      '</script>';
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function stringEndsWith( str, suffix ) {
   return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
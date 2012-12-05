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
var Q = require( 'q' );
var fs = require( 'fs' );

exports.start = start;
exports.createDependencyFile = createDependencyFile;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var webRootPath_;
var flowFile_;
var outputPath_;

function start( app, webRootPath, flowFile, outputPath ) {
   webRootPath_ = webRootPath + '/';
   flowFile_ = flowFile;
   outputPath_ = outputPath;

   app.get( '/' + outputPath_, function( req, res ) {
      generateJavaScripteCode( webRootPath_, flowFile_, function( response ) {
         res.set( 'Content-Type', 'application/javascript' );
         res.end( response );


         writeFile( response );
      } );
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createDependencyFile( callback ) {
   generateJavaScripteCode( webRootPath_, flowFile_, function( response ) {
      writeFile( response );
      callback();
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function generateJavaScripteCode( webRootPath, flowFile, callback ) {
   var widgetCollector = require( webRootPath + '/includes/lib/portal_assembler/widget_collector' );
   widgetCollector.init( Q, httpClient() );

   widgetCollector.gatherWidgets( webRootPath, webRootPath + flowFile, function( requires, modules ) {

      // NEEDS FIX B: extract these hardcoded values
      requires.unshift( 'lib/angularjs/angular', 'portal/portal', 'portal/portal_dependencies' );
      modules.unshift( 'portal', 'portal.dependencies' );

      var requireString = '[ \'' + requires.join( '\', \'' ) + '\' ]';
      var modulesString = '[ \'' + modules.join( '\', \'' ) + '\' ]';

      var response = 'require( ' + requireString + ', function( angular, portal ) {\n' +
         '\n' +
         '   angular.element( document ).ready( function bootstrap() {\n' +
         '      angular.bootstrap( document, ' + modulesString + ' );\n' +
         '   } );\n' +
         '\n' +
         '} );';

      callback( response );
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function writeFile( data ) {
   var fullPath = webRootPath_ + outputPath_;
   var path = fullPath.substr( 0, fullPath.lastIndexOf( '/' ) );

   ensureDirectory( path );

   fs.writeFileSync( fullPath, data );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function ensureDirectory( dir ) {
   if( fs.existsSync( dir ) ) {
      return;
   }

   // NEEDS FIX C: this is not 'mkdir -p' but for now we can be sure 'var' exists and thus only 'static' needs to be created
   fs.mkdirSync( dir );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function httpClient() {
   return {
      get: function( url ) {
         var deferred = Q.defer();
         fs.readFile( url, function( err, data ) {
            if( err ) {
               console.error( err );
               deferred.reject( err );
               return;
            }
            deferred.resolve( {
               data: JSON.parse( ''+data )
            } );
         } );
         return deferred.promise;
      }
   };
}
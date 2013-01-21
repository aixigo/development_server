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
      generateJavaScriptCode( webRootPath_, flowFile_, function( response ) {
         res.set( 'Content-Type', 'application/javascript' );
         res.end( response );


         writeFile( response );
      } );
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createDependencyFile( callback ) {
   generateJavaScriptCode( webRootPath_, flowFile_, function( response ) {
      writeFile( response );
      callback();
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function generateJavaScriptCode( webRootPath, flowFile, callback ) {
   var widgetCollector = require( webRootPath + '/includes/lib/portal_assembler/widget_collector' );
   widgetCollector.init( Q, httpClient() );

   widgetCollector.gatherWidgets( webRootPath, webRootPath + flowFile ).then( function( result ) {

      // NEEDS FIX B: extract these hardcoded values
      result.requires.unshift( 'lib/angularjs/angular', 'portal/portal', 'portal/portal_dependencies' );
      result.modules.unshift( 'portal', 'portal.dependencies' );

      var requireString = '[ \'' + result.requires.join( '\', \'' ) + '\' ]';
      var modulesString = '[ \'' + result.modules.join( '\', \'' ) + '\' ]';

      var response = 'require( ' + requireString + ', function( angular, portal ) {\n' +
         '\n' +
         '   angular.element( document ).ready( function bootstrap() {\n' +
         '      angular.bootstrap( document, ' + modulesString + ' );\n' +
         '   } );\n' +
         '\n' +
         '} );';

      callback( response );
   }, function( e ) {
      var errorMessage = 'There was an error while collecting all relevant angular dependencies:\\n\\n' + e;
      if( e.stack ) {
         errorMessage += '\\n\\nStack:\\n\\n' + e.stack;
      }
      errorMessage = errorMessage.replace( /'/g, '"' );
      callback( 'require( [], function() {\n' +
         '   console.error( \'' + errorMessage + '\' );\n' +
         '   alert( \'' + errorMessage + '\' );\n' +
         '} );' );
      console.error( errorMessage );
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
   if( !dir || !dir.length ) {
      throw new Error( 'Cannot ensure empty directory' );
   }

   if( fs.existsSync( dir ) ) {
      return;
   }

   var parentFolder = dir.replace( /\/[^\/]*$/, '' );
   if( !fs.existsSync( parentFolder ) ) {
      ensureDirectory( parentFolder );
   }

   fs.mkdirSync( dir );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function httpClient() {
   return {
      get: function( url ) {
         return Q.ninvoke( fs, 'readFile', url ).then( function( data ) {
            try {
               return {
                  data: JSON.parse( '' + data )
               };
            }
            catch( e ) {
               throw new Error( 'Error: "' + e + '" in file "' + url + '"' );
            }
         } );
      }
   };
}
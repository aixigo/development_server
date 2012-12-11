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
var fsWatchTree = require( '../misc/multi_watch_tree' );

exports.start = start;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function start( app, rootDir, exportUriPrefix, exportDirs ) {
   if( !exportDirs.length ) {
      console.log( 'no export dirs given' );
      return;
   }

   exportDirs.forEach( function( dir ) {
      dir = dir.replace( /^\//, '' );
      var widgetDirectoryTreeProvider = getInstance( rootDir, dir );
      app.get( exportUriPrefix + dir.replace( /\//g, '_' ) + '.json', function( req, res ) {
         res.json( widgetDirectoryTreeProvider.getTree() );
      } );
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getInstance( rootDirectory, subDirectory ) {
   var watchedDirectory = rootDirectory + '/' + subDirectory;
   var fileTree;

   function updateFileTreeCache() {
      fileTree = {};
      var currTree = initWithSubDirectory( subDirectory, fileTree );

      buildTree( watchedDirectory ).then( function( tree ) {
         for( var key in tree ) {
            if( tree.hasOwnProperty( key ) ) {
               currTree[ key ] = tree[ key ];
            }
         }
      } );
   }
   updateFileTreeCache();

   fsWatchTree.watchTree( watchedDirectory, updateFileTreeCache );

   return {
      getTree: function() {
         return fileTree;
      }
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function initWithSubDirectory( subDirectory, fileTree ) {
   var currTree = fileTree;
   subDirectory.split( '/' ).forEach( function( dir ) {
      currTree[ dir ] = {};
      currTree = currTree[ dir ];
   } );
   return currTree;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function buildTree( path ) {
   var deferred = Q.defer();
   var tree = {};

   fs.readdir( path, function( err, files ) {
      if( err ) {
         deferred.reject( err );
         return;
      }

      var promises = [];
      files.forEach( function( dir ) {
         var fullPath = path + '/' + dir;
         var dirDeferred = Q.defer();
         promises.push( dirDeferred.promise );
         fs.stat( fullPath, function( err, stat ) {
            if( err ) {
               dirDeferred.reject( err );
               return;
            }

            if( stat.isDirectory() ) {
               buildTree( fullPath ).then( function( subDir ) {
                  tree[ dir ] = subDir;
                  dirDeferred.resolve();
               } );
            }
            else if( stat.isFile() ) {
               tree[ dir ] = 'file';
               dirDeferred.resolve();
            }
            else {
               // something else that we just ignore
               dirDeferred.resolve();
            }
         } );
      } );

      Q.all( promises ).then( function() {
         deferred.resolve( tree );
      } );
   } );

   return deferred.promise;
}
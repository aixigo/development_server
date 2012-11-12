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
var Q = require( 'q' );
var fs = require( 'fs' );
var fsWatchTree = require( './multi_watch_tree' );

exports.getInstance = getInstance;

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
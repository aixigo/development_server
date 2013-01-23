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
/*jshint strict:false*//*global exports*/
var fsWatchTree = require( 'fs-watch-tree' );

exports.watchTree = watchTree;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function watchTree( dir, callback ) {
   var callbacks = findCallbacksForDir( dir );
   if( callbacks.length === 0 ) {

      var options = {
         exclude: [ 'node_modules', /^\.git/, /(___jb_bak___|___jb_old___)$/ ]
      };

      fsWatchTree.watchTree( dir, options, function( event ) {
         enqueueCallbackCall( dir );
      } );
   }

   callbacks.push( callback );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var queue = [];
function enqueueCallbackCall( dir ) {
   console.log( 'enqueue ' + dir );
   if( queue.length === 0 ) {
      queue.push( dir );

      setTimeout( function() {
         var copy = queue.slice( 0 );
         queue = [];

         console.log( copy );

         copy.forEach( function( dir ) {
            callCallbacksForDir( dir );
         } );
      }, 100 );

      return;
   }

   if( queue.filter( function( element ) { return element.indexOf( dir ) === 0; } ).length === 0 ) {
      queue.push( dir );
   }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var dirTree = {};
function findCallbacksForDir( dir ) {
   var fragments = dir.split( '/' ).slice( 1 );

   var node = dirTree;
   for( var i = 0; i < fragments.length; ++i ) {
      var fragment = fragments[i];
      if( !( fragment in node ) ) {
         node[ fragment ] = {};
      }
      node = node[ fragment ];
   }

   if( !( '_callbacks' in node ) ) {
      node._callbacks = [];
   }

   return node._callbacks;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function callCallbacksForDir( dir ) {
   var fragments = dir.split( '/' ).slice( 1 );

   var node = dirTree;
   for( var i = 0; i < fragments.length; ++i ) {
      var fragment = fragments[i];
      if( !( fragment in node ) ) {
         return;
      }
      node = node[ fragment ];
   }

   invokeRecursively( node );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function invokeRecursively( node ) {
   Object.keys( node ).forEach( function( key ) {
      if( key === '_callbacks' ) {
         node[ key ].forEach( function( callback ) {
            invokeCallback( callback );
         } );
      }
      else  {
         invokeRecursively( node[ key ] );
      }
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function invokeCallback( callback ) {
   try {
      callback();
   }
   catch( e ) {
      console.error( 'Exception while delivering fs-watch event: ', e );
   }
}
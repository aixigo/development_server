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
/*jshint strict:false*//*global exports,global,__dirname*/
var amdLoader = require( 'amd-loader' );
var path = require( 'path' );

exports.config = config;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var configuration_ = {};
var configuredFromDir_;

function config( configuration ) {
   configuration_ = {
      baseUrl: configuration.baseUrl || __dirname,
      paths: {}
   };
   configuredFromDir_ = __dirname;

   Object.keys( configuration.paths ).forEach( function( source ) {
      configuration_.paths[ source ] = path.normalize( configuration_.baseUrl + '/' + configuration.paths[ source ] );
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var amdDefine = global.define;
global.define = function define( id, injects, definition ) {

   if( typeof injects === 'function' ) {
      definition = injects;
      injects = id;
      id = null;
   }
   else if( typeof id === 'function' ) {
      definition = id;
      injects = [];
      id = null;
   }

   // First we extend the amd loader to allow for RequireJS path configurations.
   if( configuration_.paths ) {
      injects = injects.map( function( injection ) {
         for( var prefix in configuration_.paths ) {
            if( injection.indexOf( prefix ) === 0 ) {
               return configuration_.paths[ prefix ] + injection.substring( prefix.length );
            }
         }

         if( injection.indexOf( 'lib/' ) === 0 ) {
            return '../../../includes/' + injection;
         }
         return injection;
      } );
   }

   // Second we prevent it from shifting our expected arguments.
   injects.unshift = injects.push;

   var args = [ injects, definition ];
   if( id ) {
      args.splice( 0, 0, id );
   }

   amdDefine.apply( global, args );
};
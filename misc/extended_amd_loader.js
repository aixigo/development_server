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
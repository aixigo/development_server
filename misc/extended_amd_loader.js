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
/*jshint strict:false*//*global exports,global*/
var amdLoader = require( 'amd-loader' );

exports.config = config;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var configuration_ = {};

function config( configuration ) {
   configuration_ = configuration;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var amdDefine = global.define;
global.define = function( id, injects, definition ) {
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

   var args = [ injects, definition ];
   if( id ) {
      args.splice( 0, 0, id );
   }

   return amdDefine.apply( {}, args );
};
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
var fsWatchTree = require( 'fs-watch-tree' );

exports.watchTree = watchTree;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var dirsToCallbacks_ = {};
function watchTree( dir, callback ) {
   if( !( dir in dirsToCallbacks_ ) ) {

      dirsToCallbacks_[ dir ] = [];

      fsWatchTree.watchTree( dir, function( event ) {
         dirsToCallbacks_[ dir ].forEach( function( cb ) {
            try {
               cb( event );
            }
            catch( e ) {
               console.error( 'Exception while delivering fs-watch event: ', e );
            }
         } );
      } );
   }

   dirsToCallbacks_[ dir ].push( callback );
}
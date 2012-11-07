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
var express = require( 'express' );
var static_server = require( './static_server' );

var app = express();

console.log( 'Using root directory %s', process.argv[ 2 ] );

if( process.argv.length < 3 ) {
   printHelp();
   process.exit();
}
static_server.start( app, process.argv[ 2 ] );

app.listen( 8666 );



function printHelp() {
   console.log( 'Usage: node development_server.js <path>' );
   console.log( ' where path is the root of the product' );
}
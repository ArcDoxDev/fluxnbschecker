'use strict';

var list = require("flux/list");
var math = require("flux/math"); 
var jsonpointer = require('json-pointer');
/**
 * Retrieves the row of a table at a specific index. As for the index input use Number type for 0-indexing, String type for table-indexing.
 * 
 * @param {String}  	    	codeToFind          Unclass of Ss or Pr as a string
 * @param {String}          	stringToFind        String to change
 * @param {String}  		    stringToReplace     Replacement string
 * @param {Object}  		    checkObjects        NBS json object           
 * @param {Object}  		    revObjects          Revit JSOn object   
 * @returns {object}
 */

/* 
--------------------modules required for testing code - should probably remove or comment out --------------------------
// use the expcdress module
var express = require('express');
// get access to all methods in express
var app = express();
------------------------------------------------------------------------------- 
Everything between here and next row of dashes is for testing JSON data for NBS checking
There are 3 functions
------------------------------------------------------------------------------- 
*/

// The next 5 variable inputs are required from flux env - not sure how to connect these up
var codeToFind = "Ss";
var stringToFind = "COBieType";
var stringToReplace = "COBie.Type.";

//These JSON strings should be coming from Flux env... but are loaded locally for testing
var checkObjects = app.locals.jsdata = require('./js/Checking.json'); // originally from nbs toolkit
var revObjects = app.locals.jsdata = require('./js/RevitObject.json'); // originally from revit

// Function 1 to loop through parameter keys, find and replace a string
function stringReplace(search, toReplace){

    // Function to search for a string inside of a string
    function contains(value, searchFor){
        return (value).indexOf(searchFor) > -1;
    };
    // Arrays for collecting keys and values for changing
    var revKeys = [];
    var revValues = [];
    // split out keys and values into two seperate arrays
    for (i = 0 ; i < revObjects.length ; i++){
        revKeys.push(Object.keys(revObjects[i]));
        // this is not used but might be handy at another point
        // revValues.push(Object.values(revObjects[i]));
    };

    // replace strings in the keys arrays
    for (i = 0 ; i < revKeys.length ; i++){
        for (j = 0 ; j < revKeys[i].length ; j++){
            if (contains (revKeys[i][j], search)){
                revKeys[i][j] = revKeys[i][j].replace(search, toReplace);
            };
        };
    };

    // return object with new keys, values are the same
    var handBack = [];
    var d = 0;
    for (i = 0 ; i < revObjects.length; i++){
        d = 0;
        Object.keys(revObjects[i]).forEach(function(key){
            var val=revObjects[i][key];
            delete revObjects[i][key];
            key = revKeys[i][d];
            revObjects[i][key]=val;
            d++
        });
        handBack.push(revObjects[i]);
    };
    return handBack;
};

/* 
Function 2 paramExist will take revit elements with a matching
classification and check for the required parameters.
The JSON object returned for each match:
var handBack = { notation ,  type ,  family, guid, cat, "missing" : [], "present" : []};

 */
function paramExist(reqParams, elem){
    /* 
    Make arrays to catch the missing and present parameters. With this
    the data can be checked if there are values in the parameters in the next
    function. 
    */
    var missing = [];
    var present = [];
        
        // loop thorugh objects and check for presents of parameters
        for (h = 0 ; h < reqParams.attributes.length; h++){
            
            if (reqParams.attributes[h] in elem){
                present.push(reqParams.attributes[h]);
            } else {
                missing.push(reqParams.attributes[h]);
            };
            
        };

    // ------------------ Get the object data together for returning to the function ---------------\\
    // Create variables for the return object
    var type, family, guid, cat, notation;
    // create return object
    var handBack = { notation ,  type ,  family, guid, cat, "missing" : [], "present" : []};
    // return arrays with the missing and present parameters 
    handBack.missing = missing;
    handBack.present = present;
    
    // return object info for later consumption
    handBack.notation = reqParams.name;
    handBack.type = (elem["Type Name"]);
    handBack.family = (elem["Family Name"]);
    handBack.guid = (elem["GUID"]);
    handBack.cat = (elem["Category"]);

    return handBack;
};      

/* 
Function 3 checks for a match between the required classification
and a revit object. When it finds a match, the function paramExist is
called for further checking.
 */
function run(revObjects, checkObjects, code){
    // b is for returning the data
    var b = [];
    var out;
    checkObjects.forEach(function(obj){
        //console.log("\n");
        var classification = "ClassificationUniclass" + code + "Number";
        for (i = 0; i < revObjects.length; i++){
            if (obj.name == revObjects[i][classification]){
                
                //This array takes the data
                b.push(paramExist(obj, revObjects[i]));
            };
        };
    });

    /* Not sure if the output javascript object needs to be stringified or not
    --------------------------------------------- 
    stringify the object*/
    var out = JSON.stringify(b);
    return out;
};

// This will return a new object with the new keys
var newObj = stringReplace(stringToFind, stringToReplace);

// output variable
var output;

// return data to the output variable
output = run(newObj, checkObjects, codeToFind);

// for testing the result
// console.log(output);

/* ----------------------------------------------------------- */

// As mentioned above(function 3), the returned object is stringified. Not sure if this is correct.
// Public API
module.exports = {
    run: run
};
/*
 * IMPORTANT
 * The variables and functions in this file make use of those defined in bakedGoods_test_externalStorageOperationUtilities.js,
 * as such, the variables and functions in that file must be visible to those in this file in order for those in this file to 
 * be defined and/or function as expected; such a relationship between the two files can be established by say, referencing that
 * file before this file in the html page in which the tests in this file are to be run.
 */

/*
 * The test runners in this file should be executed independant of one another (in other words, 
 * only one runner should be un-commented at any given time) in order to ensure that data produced
 * and/or modified by one does not affect the execution of any other.
 */


 
externalFileAssocAssetsWrapperObj.flash = createExternalFileAssociatedAssetsObj(9, flash_isSupportingVersionInstalled);

/**
 * Determines if the installed version of Flash plug-in can provide
 * all the functionality available in a given major version.
 * Code derived from: http://www.prodevtips.com/2008/11/20/detecting-flash-player-version-with-javascript/

 * @param majorVersionNum       a number (denoting a major version of Flash plug-in)
 * @return                      true if the version of the Flash plug-in installed
 *                              is >= {@code majorVersionNum}, false otherwise 
 */
function flash_isSupportingVersionInstalled(majorVersionNum)
{ 
    var installedMajorVersionNum;

    try  //Conduct IE-based version support determination procedure
    {
        try 
        {
            // avoid fp6 minor version lookup issues
            // see: http://blog.deconcept.com/2006/01/11/getvariable-setvariable-crash-internet-explorer-flash-6/
            var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');

            try { axo.AllowScriptAccess = 'always'; }
            catch(e) { installedMajorVersionNum =  6; }
        } 
        catch(e) {}

        if(installedMajorVersionNum === undefined)
            installedMajorVersionNum = new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').match(/\d+/)[0];
    } 
    catch(e) //Exception thrown due to attempted use of unavailable entities (most likely browser is not IE)
    {           //Conduct non-IE-based version support determination procedure
        try 
        {
            if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin)
                installedMajorVersionNum = parseInt((navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.match(/\d+/)[0]);
        } 
        catch(e) {}
    }
 
    return (installedMajorVersionNum !== undefined ? installedMajorVersionNum >= majorVersionNum : false);
}



/**
* Inserts a standards-compliant element in to the DOM 
* which contains the data defined in a flash file.

* @param optionsObj		an object containing a subset of desired attribute values of prospective plugin-based DOM elements 

*/
function flash_createDOMElement(optionsObj)
{
    var flashVars = "containerDomain=" + window.location.hostname;

    var flashDOMObjHTML = 
    "<object id='" + optionsObj.elementID + "' type='application/x-shockwave-flash' data='" + optionsObj.swfPath + "' style='" + optionsObj.elementStyle + "'>"
        + "<param name='movie' value='" + optionsObj.swfPath + "'/>"
        + "<param name='allowScriptAccess' value='" + optionsObj.allowScriptAccess + "'/>"
        + "<param name='flashVars' value='" + flashVars + "'/>"
    + "</object>"

    optionsObj.elementParent.innerHTML += flashDOMObjHTML;
}
   
   
   
/**
* Performs a sequence of operations which ensure the essential conditions for
* and commence the execution of an Locally Shared Object-based storage operation.

* @param asFuncName         a String denoting the name of the Javascript-accessible, ActionScript 
*                           function capable of carrying out the desired storage operation
* @param dataEntity         an object containing or specifying the data that is to be the subject of the storage operation
* @param optionsObj         an object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete           a function capable of utilizing the data resulting from the to-be-conducted operation
* @param errorComplete      a function capable of performing contingency processing if an 
*                           exception occurs during the conduction of the storage operation 
*/
function flash_conductStorageOperation(asFuncName, dataEntity, optionsObj, complete, errorComplete)
{
    //Obtain local handles to the objects which hold assets associated
    //with BakedGoods.swf and flash-based storage operations, respectively
    var flashAssetsObj = externalFileAssocAssetsWrapperObj.flash;
    var flashStorageOperationAssetsObj = externalStorageOperationAssetsWrapperObj.flash;
    /////
    
    var flashDOMElement;
    
    /**
     * Invokes the Javascript accessible, ActionScript method named 
     * {@code asFuncName} to carry out the desired storage operation 
     * inside the Locally Shared Object identified in {@code optionsObj}.
     
     * @param operationID       a String identifying {@code complete} in the object in 
     *                          {@code flashStorageOperationAssetsObj} that contains functions 
     *                          capable of utilizing data produced by flash-based storage operations                
     */
    function execute(operationID)
    {
        //If a handle to the DOM element referencing BakedGoods.swf hasn't been memoized, do so here (memoization 
        //cannot occur directly after the creation of the element due to the synchronous nature of swf loading;
        //execution will reach here before any statement appearing directly after the element creation statement)
        if(!flashDOMElement) 
            flashDOMElement = flashAssetsObj.domElement = document.getElementById(optionsObj.elementID);
        
        var specifiesTargetData = (asFuncName !== "lso_getAll");
        
        //Remove the (now disposable) reference to flashDOMElement's parent
        //from optionsObj. This will eliminate the chance of a 
        //stack overflow during the serialization of optionsObj
        delete optionsObj.elementParent;
        
        if(specifiesTargetData) 
            flashDOMElement[asFuncName](dataEntity, optionsObj, operationID);
        else
            flashDOMElement[asFuncName](optionsObj, operationID);
    }

    if(flashAssetsObj.canUse === undefined)
    {
        //Determine whether a requirement-satifying version of Flash is present, and memoize the result in flashAssetsObj
        flashAssetsObj.canUse = flashAssetsObj.isSupportingPluginVersionInstalled(flashAssetsObj.minMajorPluginVersionRequired);
        
        //Create a closure which, when invoked, will call flash_createDOMElement with the pertinent
        //configuration data specified in optionsObj, and reference the closure in flashAssetsObj
        flashAssetsObj.createDOMElement = function(){flash_createDOMElement(optionsObj)};
    }

    conductExternalStorageOperation(flashAssetsObj, flashStorageOperationAssetsObj, execute, complete, errorComplete);
}



/**
 * Defers to a compiled ActionScript method to perform a Locally Shared Object
 * (LSO) set operation on data items in a given collection.
 
 * @param dataArray         an Array of Objects eacn consisting of a data item 
 *                          to be stored in an LSO and the key to identify it
 * @param optionsObj        an Object consisting of auxiliary data pertinent to the to-be-conducted operation
 * @param complete          a function capable of utilizing the data resulting from the to-be-conducted storage operation
 */
function flash_set(dataArray, optionsObj, complete)
{
    var errorComplete = createExternalStorageErrorCompleteFunc("set", complete);
    flash_conductStorageOperation("lso_set", dataArray, optionsObj, complete, errorComplete); 
}



/**
* Defers to a compiled ActionScript method to perform a Locally Shared Object-based
* retrieval operation on data items identified by elements in a collection of keys.

* @param keyArray	an Array consisting of variables which key data items 
*                       persisted in the LSO specified in {@code optionsObj}
* @param optionsObj     an Object containing auxiliary data necessary for the to-be-conducted operation
* @param complete       a function capable of utilizing the data resulting from the to-be-conducted storage operation
*/
function flash_get(keyArray, optionsObj, complete)
{
    var errorComplete = createExternalStorageErrorCompleteFunc("get", complete);
    flash_conductStorageOperation("lso_get", keyArray, optionsObj, complete, errorComplete);
}
	
	
	
/**
* Defers to a compiled ActionScript method to perform a Locally Shared Object-based
* removal operation on data items identified by elements in a collection of keys.

* @param keyArray	an Array consisting of variables which key data items 
*                       persisted in the LSO specified in {@code optionsObj}
* @param optionsObj     an Object containing auxiliary data necessary for the to-be-conducted operation
* @param complete       a function capable of utilizing the data resulting from the to-be-conducted storage operation
*/
function flash_remove(keyArray, optionsObj, complete)
{
    var errorComplete = createExternalStorageErrorCompleteFunc("remove", complete);
    flash_conductStorageOperation("lso_remove", keyArray, optionsObj, complete, errorComplete);
}
	


/**
* Defers to a compiled ActionScript method which performs a Locally Shared Object-based
* retrieval operation on data items which meet criterea specified by a supplied expression.

* @param exprStr	a String representation of a Javascript boolean expression
* @param optionsObj     an Object containing auxiliary data necessary for the to-be-conducted operation
* @param complete       a function capable of utilizing the data resulting from the to-be-conducted storage operation
*/
function flash_getAll(exprStr, optionsObj, complete)
{
    var errorComplete = createExternalStorageErrorCompleteFunc("getAll", complete);
    
    complete = createConditionalGetAllCompleteFunc(exprStr, complete);
    flash_conductStorageOperation("lso_getAll", exprStr, optionsObj, complete, errorComplete);
}
	
        
	
/**
* Defers to a compiled ActionScript method which performs a Locally Shared Object-based
* removal operation on data items which meet criterea specified by a supplied expression.

* @param exprStr        a String representation of a Javascript boolean expression
* @param optionsObj     an Object containing auxiliary data necessary for the to-be-conducted operation
* @param complete       a function capable of utilizing the data resulting from the to-be-conducted storage operation
*/
function flash_removeAll(exprStr, optionsObj, complete)
{
    //Determine the type of storage operation associated with the complete() function that has a signature suitable for this operation.
    var errorCompleteFuncStorageType = (optionsObj.removeExpirationData ? "getAll" : "removeAll");   
    
    var errorComplete = createExternalStorageErrorCompleteFunc(errorCompleteFuncStorageType, complete);
     
    if(exprStr !== "true")
    {
        /**
         * Schedules an asynchronous Flash-based remove operation. This causes a new call stack to be created
         * for the (Actionscript-based) operation, bypassing a restriction in Opera on recursive ActionScript
         * function calls which would otherwise prevent it from being performed after the precursory retrieval. 
         
         * @param keyArray              an Array consisting of variables which key data items 
         *                              persisted in the LSO specified in {@code optionsObj}
         * @param innerOptionsObj       an Object containing auxiliary data necessary for the to-be-conducted operation
         * @param innerComplete         a function capable of utilizing the data resulting from the to-be-conducted storage operation
         */
        function asyncRemoveScheduler(keyArray, innerOptionsObj, innerComplete)
        {
            var asyncRemove = function(){flash_remove(keyArray, innerOptionsObj, innerComplete);}
            setTimeout(asyncRemove, 1);
        }

        complete = createConditionalRemoveAllCompleteFunc(exprStr, optionsObj, asyncRemoveScheduler, complete, false);
    }

    flash_conductStorageOperation("lso_removeAll", exprStr, optionsObj, complete, errorComplete);
}



/******************************Test functions**********************************/


var testNum = new Number(Math.random() * Number.MAX_VALUE).toPrecision(15).valueOf();
var testNumObj = new Number(Math.random() * Number.MAX_VALUE).toPrecision(15);

var testStr = "()<>@,;:<>/[]?={}";
var testDateObj = new Date();

var testObj = {num: testNum, numObj: testNumObj, str: testStr, dateObj: testDateObj};
var testArr = [testNum, testNumObj, testStr, testDateObj, testObj];

var testDataItemObjArray = [
    {key: 0, value: testNum}, 
    {key: 1, value: testNumObj},
    {key: 2, value: testStr}, 
    {key: 3, value: testDateObj}, 
    {key: 4, value: testObj},
    {key: 5, value: testArr}
];

var objCount = testDataItemObjArray.length;


var optionsObj = {
    swfPath: "ext_bin/BakedGoods.swf",
    lsoName: "Baked_Goods",
    lsoPath: null,
    elementID: "bakedGoods",
    elementParent: document.body,
    elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;",
    allowScriptAccess: "sameDomain"
};



function createAsynchronousOperationSchedulingFunc(operationFunc)
{
    return function(){ setTimeout(operationFunc, 1); }
}


function clear()
{
    var completeStub = function(){};
    flash_removeAll("true", optionsObj, completeStub);
}

/*
//This function establishes a conduit to the storage facility and primes it for 
//runners of tests on functions which carry out operations precursory to storage operations 
//(set, get, remove, etc.); as such, this function must be visible (i.e uncommented) 
//at the time any of those precursory tests are to be run (and should not be visible
//when tests other than those are run)
function setupPrecursoryActionTest(stubLoadComplete, failFunc)
{
    var originalLoadCompleteFunc = window.bakedGoods_changeExternalFileStatus;
    var timeoutMilliseconds =  20000;   //1/3rd of a minute
    var failTimeoutID
    
    var setupCompleteFunc = function(){
        window.bakedGoods_changeExternalFileStatus = originalLoadCompleteFunc;
        clearTimeout(failTimeoutID);
        QUnit.start();
    }
    
    var stubLoadCompleteWrapperFunc = function(isSuccessful, dummyStr){
        stubLoadComplete();
        setupCompleteFunc();
    }
  
    var failWrapperFunc = function(){
        failFunc();
        setupCompleteFunc();
    }
    
    window.bakedGoods_changeExternalFileStatus = stubLoadCompleteWrapperFunc;
    failTimeoutID = setTimeout(failWrapperFunc, timeoutMilliseconds);
    externalFileAssocAssetsWrapperObj.flash.domElement = flash_createDOMElement(optionsObj);
}
*/

/*
//The test executed by this test runner test evaluates a function, flash_createDOMElement,
//which it calls indirectly through a call to setupPrecursoryActionTest; as such,  
//setupPrecursoryActionTestmust be visible (i.e uncommented) whenever this test 
//is to be run
//
//flash_createDOMElement test runner
(function(){
    
    var testFunc = function(assert){  
        var stubLoadComplete = function(){assert.ok(true);};
        var failFunc = function(){assert.ok(false);};

        setupPrecursoryActionTest(stubLoadComplete, failFunc);
    }
    
    
    QUnit.asyncTest("flash_createDOMElement test", testFunc);
})()
*/





/*
//flash_set && flash_get test runner
(function(){

    var testFunc = function(assert){
        
        var testCompleteFunc = function(){
            createAsynchronousOperationSchedulingFunc(clear)();
            QUnit.start();
        }
        
        var checkFunc = function(processedItemCount, keyValuePairsObj){
            
            for(var i = 0; i < testDataItemObjArray.length; i++)
            {
                var currentTestDataObj = testDataItemObjArray[i];              
                var currentExpectedValue = currentTestDataObj.value;
                var currentRetrievedValue = keyValuePairsObj[currentTestDataObj.key];
                
                assert.deepEqual(currentRetrievedValue, currentExpectedValue);
            }
            
            assert.strictEqual(processedItemCount, testDataItemObjArray.length); 
            testCompleteFunc();
        }
        
        var getFunc = function(processedItemCount){
            var keyArray = [];
            for(var i = 0; i < testDataItemObjArray.length; i++) keyArray.push(i);

            var getOperationClosure = function(){flash_get(keyArray, optionsObj, checkFunc)};
            createAsynchronousOperationSchedulingFunc(getOperationClosure)();
        }
   
        flash_set(testDataItemObjArray, optionsObj, getFunc);
    }
    
    QUnit.asyncTest("flash_set & flash_get", testFunc);
})()
*/

/*
//flash_remove test runner
(function(){

    var testFunc = function(assert){
        var keyArray = [];
        for(var i = 0; i < testDataItemObjArray.length; i++) keyArray.push(i);
        
        var removedItemCount;
        
        var testCompleteFunc = function(){
            createAsynchronousOperationSchedulingFunc(clear)();
            QUnit.start();
        }
            
        var checkFunc = function(processedItemCount, keyValuePairsObj){
            
            var retrievedItemCount = 0;
            for(var key in keyValuePairsObj)
            {
                if(keyValuePairsObj[key] !== null) 
                    ++retrievedItemCount;
            }
            
            assert.strictEqual(removedItemCount, testDataItemObjArray.length);
            assert.strictEqual(processedItemCount, testDataItemObjArray.length);
            assert.strictEqual(retrievedItemCount, 0);
            
            testCompleteFunc();
        }
        
        var getFunc = function(processedItemCount){
            removedItemCount = processedItemCount;
            var getOperationClosure = function(){flash_get(keyArray, optionsObj, checkFunc)};
            createAsynchronousOperationSchedulingFunc(getOperationClosure)();
        }
        
        var removeFunc = function(processedItemCount){
            flash_remove(keyArray, optionsObj, getFunc);
        }
        
        flash_set(testDataItemObjArray, optionsObj, createAsynchronousOperationSchedulingFunc(removeFunc));
    }
    
    
    QUnit.asyncTest("flash_remove", testFunc);
})()
*/


/*
//flash_getAll test runner
(function(){
    
    var filterDataObjArray = [
        {filterStr: "true", expectedDataItemCount: 6},
        {filterStr: "valueObj != " + testNum, expectedDataItemCount: 5},
        {filterStr: "valueObj == '" + testDataItemObjArray[3].value + "' && keyObj == 3", expectedDataItemCount: 1},
        {filterStr: "keyObj == -1", expectedDataItemCount: 0}
    ];
    
    
    var testFunc = function(assert){

        var processingIndex = 0;
        var currentFilterDataObj;
        
        var testCompleteFunc = function(){
            
            if(++processingIndex >= filterDataObjArray.length)
            {
                createAsynchronousOperationSchedulingFunc(clear)();
                QUnit.start();
            }
            else
                createAsynchronousOperationSchedulingFunc(getAllFunc)();
        }
        
        var checkFunc = function(processedItemCount, dataItemObjArray){
            
            assert.strictEqual(processedItemCount, currentFilterDataObj.expectedDataItemCount);

            for(var i = 0; i < dataItemObjArray.length; i++)
            {
                var currentResultDataItemObj = dataItemObjArray[i];
                var currentResultDataItemKey = currentResultDataItemObj.key;
                var currentResultDataItemValue = currentResultDataItemObj.value;

                var expectedDataItemValue  = testDataItemObjArray[currentResultDataItemKey].value;
                assert.deepEqual(currentResultDataItemValue, expectedDataItemValue);
            }

            testCompleteFunc();
        }
        
        var getAllFunc = function(){
            currentFilterDataObj = filterDataObjArray[processingIndex];

            var getAllClosure = function(){flash_getAll(currentFilterDataObj.filterStr, optionsObj, checkFunc);};
            createAsynchronousOperationSchedulingFunc(getAllClosure)();
        }

        flash_set(testDataItemObjArray, optionsObj, getAllFunc);
    }
    
    QUnit.asyncTest("flash_getAll", testFunc);
})()
*/



//flash_removeAll test runner
(function(){
    
    var filterDataObjArray = [
        {filterStr: "false", removedDataItemKeyArray:[], expectedRemovedDataItemCount: 0},
        {filterStr: "keyObj == 5", removedDataItemKeyArray: ["5"], expectedRemovedDataItemCount: 1},
        {filterStr: "valueObj == " + testDataItemObjArray[0].value + " || valueObj == " + testDataItemObjArray[1].value, removedDataItemKeyArray: ["0", "1"], expectedRemovedDataItemCount: 2},
        {filterStr: "keyObj < 4 && (valueObj != " + testDataItemObjArray[0].value + " && valueObj != " + testDataItemObjArray[1].value + ")", removedDataItemKeyArray: ["2", "3"], expectedRemovedDataItemCount: 2},
        {filterStr: "true", removedDataItemKeyArray: ["4"], expectedRemovedDataItemCount: 1}
    ]
    
    var testFunc = function(assert){
        var processingIndex = 0;
        var currentFilterDataObj;
        
        var testCompleteFunc = function(){
            if(++processingIndex >= filterDataObjArray.length)
            {
                createAsynchronousOperationSchedulingFunc(clear)();
                QUnit.start();
            }
            else
                createAsynchronousOperationSchedulingFunc(removeAllFunc)();
        }
        
        var getCheckFunc = function(processedItemCount, keyValuePairsObj){
    
            var retrievedDataCount = 0;
            var removedDataItemKeyArray = currentFilterDataObj.removedDataItemKeyArray;
            for(var i = 0; i < removedDataItemKeyArray.length; i++)
            {
                var currentKey = removedDataItemKeyArray[i];
                if(keyValuePairsObj[currentKey] !== null)
                    ++retrievedDataCount;
            }
            
            assert.strictEqual(processedItemCount, removedDataItemKeyArray.length);
            assert.strictEqual(retrievedDataCount, 0);
            testCompleteFunc();
        }
        
        var getFunc = function(){
            flash_get(currentFilterDataObj.removedDataItemKeyArray, optionsObj, getCheckFunc);
        }
        
        var removeAllCompleteFunc = function(processedItemCount){
            var expectedRemovedDataItemCount = (currentFilterDataObj.filterStr === "true" ? 0 : currentFilterDataObj.expectedRemovedDataItemCount);
            assert.strictEqual(processedItemCount, expectedRemovedDataItemCount);
            createAsynchronousOperationSchedulingFunc(getFunc)();
        }
        
        
        var removeAllFunc = function(){
            currentFilterDataObj = filterDataObjArray[processingIndex];
            var removeAllClosure = function(){flash_removeAll(currentFilterDataObj.filterStr, optionsObj, removeAllCompleteFunc);};
            createAsynchronousOperationSchedulingFunc(removeAllClosure)();
        }
        
        flash_set(testDataItemObjArray, optionsObj, createAsynchronousOperationSchedulingFunc(removeAllFunc));
    }
   
    QUnit.asyncTest("flash_removeAll", testFunc);
})()

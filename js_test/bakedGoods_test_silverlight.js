externalFileAssocAssetsWrapperObj.silverlight = createExternalFileAssociatedAssetsObj(3, silverlight_isSupportingVersionInstalled);


/**
 * Determines if the installed version of Silverlight plug-in can
 * provide all the functionality available in a given major version.
 * Code derived from the Microsoft distributed Silverlight.js

 * @param majorVersionNum       a number (denoting a major version of Silverlight)
 * @return                      true if the version of the Silverlight plug-in installed
 *                              is >= {@code majorVersionNum}, false otherwise 
 */
function silverlight_isSupportingVersionInstalled(majorVersionNum)
{
    var isSupportingVersionInstalled = false;

    try
    {
        var control = null;

        try     //Conduct IE-based version support determination procedure
        {
            control = new ActiveXObject('AgControl.AgControl');
            var fullVersionString = majorVersionNum + ".0.0.0";
            isSupportingVersionInstalled = (majorVersionNum > 0 ? control.IsVersionSupported(fullVersionString) : true);
            control = null;
        }
        catch (e)   //Exception thrown due to attempted use of unavailable entities (most likely browser is not IE)
        {               //Conduct non-IE-based version support determination procedure
            var plugin = navigator.plugins["Silverlight Plug-In"];
            if (plugin)
            {
                if(majorVersionNum > 0)
                {
                    var actualVer = plugin.description;
                    if (actualVer === "1.0.30226.2")
                        actualVer = "2.0.30226.2";
                    
                    var installedMajorVersion = actualVer.substring(0, actualVer.indexOf("."));

                    isSupportingVersionInstalled =  parseInt(installedMajorVersion) >= majorVersionNum;
                }
                else
                    isSupportingVersionInstalled = true;
            }
        }
    }
    catch (e){}     //Known entities which contain Silverlight plug-in data are not present in browser

    return isSupportingVersionInstalled;
}



/**
* Inserts a standards-compliant element in to the DOM 
* which contains the data defined in a Silverlight package.

* @param optionsObj		an object containing a subset of desired attribute values of prospective plugin-based DOM elements 
* @return			a DOM element containing the data specified in the Silverlight package cited in 
*                               {@code optionsObj}, with the style attribute value cited in {@code optionsObj}
*/
function silverlight_createDOMElement(optionsObj)
{
    var silverlightDOMObjectHTML = 
        "<object type='application/x-silverlight' data='data:application/x-silverlight,' style='" + optionsObj.elementStyle + "'>" 
            + "<param name='source' value='" + optionsObj.xapPath + "'/>"
        + "</object>";

    optionsObj.elementParent.innerHTML += silverlightDOMObjectHTML;
    return optionsObj.elementParent.lastChild;
}



/**
* Performs a sequence of operations which ensure the essential conditions
* for and commence the execution of an Isolated Storage-based storage operation.

* @param mFuncName          a String denoting the name of the Javascript-accessible, managed 
*                           function capable of carrying out the desired storage operation
* @param dataEntity         an object containing or specifying the data that is to be the subject of the storage operation
* @param optionsObj         an object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete           a function capable of utilizing the data resulting from the to-be-conducted operation
* @param errorComplete      a function capable of performing contingency processing if an 
*                           exception occurs during the conduction of the storage operation 
*/
function silverlight_conductStorageOperation(mFuncName, dataEntity, optionsObj, complete, errorComplete)
{
    //Obtain local handles to the objects which hold assets associated
    //with BakedGoods.xap and silverlight-based storage operations, respectively
    var silverlightAssetsObj = externalFileAssocAssetsWrapperObj.silverlight;
    var silverlightStorageOperationAssetsObj = externalStorageOperationAssetsWrapperObj.silverlight;
    /////
    
    var silverlightDOMElement = silverlightAssetsObj.domElement;

    /**
     * Invokes the Javascript accessible, managed code method named {@code mFuncName} 
     * to carry out the desired Isolated Storage based storage operation.
     
     * @param operationID       a String identifying {@code complete} in the
     *                          {@code silverlightStorageOperationAssetsObj}
     *                          sub-object containing functions capable of utilizing
     *                          data produced by flash-based storage operations                
     */
    function execute(operationID)
    {
        var specifiesTargetData = (mFuncName.indexOf("All") === -1 || mFuncName === "iss_removeAll");

        if(specifiesTargetData)
            silverlightDOMElement.content.bakedGoods[mFuncName](dataEntity, optionsObj, operationID);
        else
            silverlightDOMElement.content.bakedGoods[mFuncName](optionsObj, operationID);
    }
    
    if(silverlightAssetsObj.canUse === undefined)
    {
        //Determine whether a requirement-satifying version of Silverlight is present, and memoize the result in silverlightAssetsObj
        silverlightAssetsObj.canUse = silverlightAssetsObj.isSupportingPluginVersionInstalled(silverlightAssetsObj.minMajorPluginVersionRequired);
        
        //Create and map in silverlightAssetObj a closure which, when invoked, will 
        //use pertinent configuration data in optionsObj to create and memoize a
        //DOM element referencing (and thus resulting in the downloading of) BakedGoods.xap
        silverlightAssetsObj.createDOMElement = function(){
            silverlightDOMElement = silverlightAssetsObj.domElement = silverlight_createDOMElement(optionsObj);
        };
    }
        
    conductExternalStorageOperation(silverlightAssetsObj, silverlightStorageOperationAssetsObj, execute, complete, errorComplete);
}



/**
 * Procures the name of the managed function designated to carry out a given
 * type of storage operation using a given Isolated Storage-related class.
  
 *  @code storageTypeClass      a String denoting a store representing class related to Isolated Storage
 *  @code operationType         a String denoting a storage operation type
 *  @return                     a String of the name of the managed function which 
 *                              utilizes {@code storageTypeClass} to carry out an 
 *                              operation of type {@code operationType} 
 */
function sl_getOperationManagedFuncName(storageTypeClass, operationType)
{
    return (storageTypeClass === "IsolatedStorageSettings" ? "iss" : "isf") + "_" + operationType;
}



/**
 * Defers to a compiled managed code method which performs an Isolated Storage-based
 * set operation on data items in a given collection.
 
 * @param dataArray         an Array of Objects each consisting of a data item to be persisted,
 *                          and a key which will identify it in Isolated Storage
 * @param optionsObj        an Object consisting of auxiliary data pertinent to the to-be-conducted operation
 * @param complete          a function capable of utilizing the data resulting from the to-be-conducted storage operation
 */
function silverlight_set(dataArray, optionsObj, complete)
{
    var managedFuncName = sl_getOperationManagedFuncName(optionsObj.conduitClass, "set");
    var errorComplete = createExternalStorageErrorCompleteFunc("set", complete);
    silverlight_conductStorageOperation(managedFuncName, dataArray, optionsObj, complete, errorComplete);
}



/**
 * Defers to a compiled managed code method which conducts an Isolated Storage-based 
 * retrieval operation on data items each identified by an element in a collection of keys.
 
 * @param dataArray     an array of objects either identifying, or consisting of data which
 *                      identifies and dictates the retrieval of a data item in Isolated Storage
 * @param optionsObj    an Object consisting of auxiliary data pertinent to the to-be-conducted operation
 * @param complete      a function capable of utilizing the data resulting from the to-be-conducted storage operation
 */
function silverlight_get(dataArray, optionsObj, complete)
{
    var managedFuncName = sl_getOperationManagedFuncName(optionsObj.conduitClass, "get");
    var errorComplete = createExternalStorageErrorCompleteFunc("get", complete);
    silverlight_conductStorageOperation(managedFuncName, dataArray, optionsObj, complete, errorComplete);
}



/**
 * Defers to a compiled managed code method which conducts an Isolated Storage-based 
 * removal operation on data items each identifed by an element in a collection of keys.
 
 * @param keyArray      an Array consisting of variables which key data items persisted in Isolated Storage
 * @param optionsObj    an Object consisting of auxiliary data pertinent to the to-be-conducted operation
 * @param complete      a function capable of utilizing the data resulting from the to-be-conducted storage operation
 */
function silverlight_remove(keyArray, optionsObj, complete)
{
    var managedFuncName = sl_getOperationManagedFuncName(optionsObj.conduitClass, "remove");
    var errorComplete = createExternalStorageErrorCompleteFunc("remove", complete);
    silverlight_conductStorageOperation(managedFuncName, keyArray, optionsObj, complete, errorComplete);
}



/**
 * Defers to a compiled managed code method which retrieves data from
 * Isolated Storage meeting criterea specified by a supplied expression.
 
 * If the managed code class used to persist the target data does not 
 * provide automatic serialization, the criterea is non-discriminatory
 * (i.e all data in the operation locus location is processed).
  
 * @param exprStr           a String representation of a Javascript boolean expression
 * @param optionsObj        an Object consisting of auxiliary data pertinent to the to-be-conducted operation
 * @param complete          a function capable of utilizing the data resulting from the to-be-conducted storage operation
 */
function silverlight_getAll(exprStr, optionsObj, complete)
{
    var errorComplete = createExternalStorageErrorCompleteFunc("getAll", complete);
    
    var conduitClass = optionsObj.conduitClass;
    var managedFuncName = sl_getOperationManagedFuncName(conduitClass, "getAll");

    if(conduitClass === "IsolatedStorageSettings") 
        complete = createConditionalGetAllCompleteFunc(exprStr, complete);

    silverlight_conductStorageOperation(managedFuncName, exprStr, optionsObj, complete, errorComplete);
}



/**
 * Defers to a compiled managed code method which removes data entities from
 * Isolated Storage meeting criterea specified by a supplied expression. 
 
 * If the managed code class used to persist the target data  does not 
 * provide automatic serialization, the criterea is non-discriminatory
 * (i.e all data in the operation locus location is processed).
 
 * @param exprStr           a String representation of a Javascript boolean expression
 * @param optionsObj        an Object consisting of auxiliary data pertinent to the to-be-conducted operation
 * @param complete          a function capable of utilizing the data resulting from the to-be-conducted storage operation
 */
function silverlight_removeAll(exprStr, optionsObj, complete)
{
    //Determine the type of storage operation associated with a complete() function that has a signature suitable for this operation.
    var errorCompleteFuncStorageType = (optionsObj.removeExpirationData ? "getAll" : "removeAll");   
    
    var errorComplete = createExternalStorageErrorCompleteFunc(errorCompleteFuncStorageType, complete);
    
    var conduitClass = optionsObj.conduitClass;
    var managedFuncName = sl_getOperationManagedFuncName(conduitClass, "removeAll");

    if(conduitClass === "IsolatedStorageSettings" && exprStr !== "true")	
        complete = createConditionalRemoveAllCompleteFunc(exprStr, optionsObj, silverlight_remove, complete, false);

    silverlight_conductStorageOperation(managedFuncName, exprStr, optionsObj, complete, errorComplete);
}



/***************************************Test functions****************************************/



var optionsObj = {
    
    xapPath: "ext_apps/BakedGoods.xap",
			
    storeScope: "site",
    conduitClass: "IsolatedStorageSettings",

    directoryPath: "/",
    dataFormat: "text",

    //Set operation pertinent options
    startPosition: 0,      //Number.MAX_VALUE represents "one past" the last byte of the file

    truncateBeforeWrite: true,
    truncatePosition: 0,   //Number.MAX_VALUE represents "one past" the last byte of the file

    writeOnlyIfAbsent: false,
    /////

    //Get operation pertinent options,
    dataEncoding: null,
    /////

    //Get/Remove all pertinent options
    recursive: true,
    removeDirectories: true,
    removeTargetDirectory: true,
    /////

    elementParent: document.body,
    elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;"
};


function clear(storeScope)
{
    var clearOptionsObj= {
        storeScope: storeScope,
        conduitClass: "IsolatedStorageFile",
        directoryPath: "/",
        recursive: true, 
        removeDirectories: true,
        removeTargetDirectory: true
    }
    silverlight_removeAll("true", clearOptionsObj, function(){});  
}



/**********************Precursory action tests*********************************/


/*
function setupPrecursoryActionTest(stubLoadComplete, failFunc) 
{
    
    var loadCompleteOriginalFunc = window.bakedGoods_changeExternalFileStatus;
    var timeoutMilliseconds =  20000;   //1/3rd of a minute
    var failTimeoutID;
    
    var testCompleteFunc = function(){
        window.bakedGoods_silverlight_loadComplete = loadCompleteOriginalFunc;
        clearTimeout(failTimeoutID);
        QUnit.start();
    }
    
    var stubLoadCompleteWrapper =  function(){
        stubLoadComplete(); 
        testCompleteFunc();
    };
    var failFuncWrapper = function(){
        failFunc(); 
        testCompleteFunc();
    };
    
    window.bakedGoods_changeExternalFileStatus = stubLoadCompleteWrapper;
    failTimeoutID = setTimeout(failFuncWrapper, timeoutMilliseconds);
    silverlight_createDOMElement(optionsObj);
    
}
*/

/*
//silverlight_createDOMElement test
(function(){
   
    var testFunc = function(assert){
        var stubLoadComplete = function(){assert.ok(true);};
        var failFunc = function(){assert.ok(false);};
    
        setupPrecursoryActionTest(stubLoadComplete, failFunc);
    };

    QUnit.asyncTest("silverlight_createDOMElement", testFunc);
})()
*/


/*
//silverlight_isSupportingVersionInstalled test
(function(){
    
    var testFunc = function(assert){
        
        var stubLoadComplete = function(){
            
            var maxVersionNum = 10;
            

            for(var i = 0; i < maxVersionNum; i++)
            {
                var actualSupportStatus = silverlight_isSupportingVersionInstalled(i);
                var expectedSupportStatus = silverlight_domElement.IsVersionSupported(i + ".0.0.0");

                assert.strictEqual(actualSupportStatus, expectedSupportStatus);
            }
        }
        
        var failFunc = function(){assert.ok(false, "Unable to load silverlight application."); testCompleteFunc();}
        
        setupPrecursoryActionTest(stubLoadComplete, failFunc);
    }
    
    QUnit.asyncTest("silverlight_isSupportingVersionInstalled", testFunc);
})()
*/


/*******************IsolatedStorageSettings-related tests**********************/

var testNum = Math.random() * Number.MAX_VALUE;
var testNumObj = new Number(Math.random() * Number.MAX_VALUE);

var testStr = "()<>@,;:\\<>/[]?={}";
var testDateObj = new Date();

var testObj = {num: testNum, numObj: testNumObj, str: testStr, dateObj: testDateObj};
var testArr = [testNum, testNumObj, testStr, testDateObj, testObj];

var testDataItemObjArray = [
    {key: 0, value: testNum + ""}, 
    {key: 1, value: testNumObj + ""},
    {key: 2, value: testStr + ""}, 
    {key: 3, value: testDateObj + ""}, 
    {key: 4, value: testObj + ""},
    {key: 5, value: testArr + ""}
];
var objCount = testDataItemObjArray.length;


var issTestOptionsObj = {
    storeScope: "site",
    conduitClass: "IsolatedStorageSettings",

    xapPath: "ext_apps/BakedGoods.xap",
    elementParent: document.body,
    elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;"
};


/*
//silverlight_set && silverlight_get (iss) test
(function(){

    var testFunc = function(assert){
        
        var testCompleteFunc = function(){
            clear();
            QUnit.start();
        }
        
        var checkFunc = function(processedItemCount, keyValuePairsObj){
            
            for(var i = 0; i < testDataItemObjArray.length; i++)
            {
                var currentTestDataObj = testDataItemObjArray[i];              
                var currentExpectedValue = currentTestDataObj.value;
                var currentRetrievedValue = keyValuePairsObj[currentTestDataObj.key];
                
                assert.strictEqual(currentRetrievedValue + "", currentExpectedValue + "");
            }
            
            assert.strictEqual(processedItemCount, testDataItemObjArray.length); 
            testCompleteFunc();
        }
        
        var getFunc = function(processedItemCount){
            var keyArray = [];
            for(var i = 0; i < testDataItemObjArray.length; i++) keyArray.push(i);
 
            silverlight_get(keyArray, issTestOptionsObj, checkFunc);
        }
   
        silverlight_set(testDataItemObjArray, issTestOptionsObj, getFunc);
    }
    
    QUnit.asyncTest("silverlight_set & silverlight_get (iss)", testFunc);
})()
*/

/*
//silverlight_remove (iss) test
(function(){

    var testFunc = function(assert){
        var keyArray = [];
        for(var i = 0; i < testDataItemObjArray.length; i++) keyArray.push(i);
        
        var removedItemCount;
        
        var testCompleteFunc = function(){
            clear();
            QUnit.start();
        }
            
        var checkFunc = function(processedItemCount, keyValuePairsObj){
            
            var retrievedItemCount = 0;
            
            for(var i = 0; i < keyArray.length; i++)
            {
                if(keyValuePairsObj[keyArray[i]] !== null)
                    ++retrievedItemCount;
            }

            assert.strictEqual(removedItemCount, testDataItemObjArray.length);
            assert.strictEqual(processedItemCount, testDataItemObjArray.length);
            assert.strictEqual(retrievedItemCount, 0);
            
            testCompleteFunc();
        }
        
        var getFunc = function(processedItemCount){
            removedItemCount = processedItemCount;
            silverlight_get(keyArray, issTestOptionsObj, checkFunc);
        }
        
        var removeFunc = function(processedItemCount){
            silverlight_remove(keyArray, issTestOptionsObj, getFunc);
        }
        
        silverlight_set(testDataItemObjArray, issTestOptionsObj, removeFunc);
    }
    
    
    QUnit.asyncTest("silverlight_remove (iss)", testFunc);
})()
*/

/*
//silverlight_getAll
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
                clear();
                QUnit.start();
            }
            else
                getAllFunc();
        }
        
        var checkFunc = function(processedItemCount, dataItemObjArray){
            
            assert.strictEqual(processedItemCount, currentFilterDataObj.expectedDataItemCount);

            for(var i = 0; i < dataItemObjArray.length; i++)
            {
                var currentResultDataItemObj = dataItemObjArray[i];
                var currentResultDataItemKey = currentResultDataItemObj.key;
                var currentResultDataItemValue = currentResultDataItemObj.value;

                var expectedDataItemValue  = testDataItemObjArray[currentResultDataItemKey].value + ""
                assert.strictEqual(currentResultDataItemValue, expectedDataItemValue);
            }

            testCompleteFunc();
        }
        
        var getAllFunc = function(){
            currentFilterDataObj = filterDataObjArray[processingIndex];
            silverlight_getAll(currentFilterDataObj.filterStr, issTestOptionsObj, checkFunc)
        }

        silverlight_set(testDataItemObjArray, issTestOptionsObj, getAllFunc);
    }
    
    QUnit.asyncTest("silverlight_getAll (iss)", testFunc);
})()
*/


/*
//silverlight_removeAll (iss)
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
                clear();
                QUnit.start();
            }
            else
                removeAllFunc();
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
            silverlight_get(currentFilterDataObj.removedDataItemKeyArray, issTestOptionsObj, getCheckFunc);
        }
        
        var removeAllCompleteFunc = function(processedItemCount){     
            assert.strictEqual(processedItemCount, currentFilterDataObj.expectedRemovedDataItemCount);
            getFunc();
        }
        
        
        var removeAllFunc = function(){
            currentFilterDataObj = filterDataObjArray[processingIndex];
            silverlight_removeAll(currentFilterDataObj.filterStr, issTestOptionsObj, removeAllCompleteFunc);
        }
        
        silverlight_set(testDataItemObjArray, issTestOptionsObj, removeAllFunc);
    }
   
    QUnit.asyncTest("silverlight_removeAll (iss)", testFunc);
})()
*/







/*******************IsolatedStorageFile-related tests**************************/



//All of the ancestor directories in the directory path contained in a given element in this array must be represented
//by elements that appear before said element in order for the get & remove tests to function correctly
var testDataObjArray = [
    {
        childDirectoryCount: 1,
        descendentDirectoryCount: 5,
        childFileCount: 3, 
        descendentFileCount: 15,
        options:{
            directoryPath: "/",
            recursive: true,
            removeDirectories: true,
            removeTargetDirectory: true  
        },
        testDataItemObjArray: [
            {key: 0, value: "0", dataFormat: "text"},
            {key: 1, value: [1], dataFormat: "binary", byteValueArray: [0, 0, 0, 0, 0, 0, 65533, 63]},
            {key: 2, value: "2", dataFormat: "text", dataEncoding: "UTF-8"}   
        ]
    },
    {
        childDirectoryCount: 2,
        descendentDirectoryCount: 4,
        childFileCount: 3, 
        descendentFileCount: 12,
        options:{
            directoryPath: "/testDir",
            recursive: true,
            removeDirectories: true,
            removeTargetDirectory: true  
        },
        testDataItemObjArray: [
            {key: "A", value: "A", dataFormat: "text"},
            {key: "B", value: [66], dataFormat: "binary", byteValueArray: [0, 0, 0, 0, 0, 65533, 80, 64]},
            {key: "C", value: "C",  dataFormat: "text", dataEncoding: "utf-8"}  
        ]
    },
    {
        childDirectoryCount: 0,
        descendentDirectoryCount: 0,
        childFileCount: 3, 
        descendentFileCount: 3,
        options: {
            directoryPath: "/testDir/dirA/",
            recursive: true,
            removeDirectories: false,
            removeTargetDirectory: false
        },
        testDataItemObjArray: [
            {key: 3, value: "3", dataFormat: "text"},
            {key: 4, value: [4], dataFormat: "binary", byteValueArray: [0, 0, 0, 0, 0, 0, 16, 64]},
            {key: 5, value: "5", dataFormat: "text", dataEncoding: "UTF-8"} 
            
        ]
    },
    {
        childDirectoryCount: 2,
        descendentDirectoryCount: 2,
        childFileCount: 3, 
        descendentFileCount: 6,
        options: {
            directoryPath: "/testDir/dir1/",
            recursive: true,
            removeDirectories: true,
            removeTargetDirectory: false
        },
        testDataItemObjArray:[
            {key: 6, value: "6", dataFormat: "text"},
            {key: 7, value: [7], dataFormat: "binary", byteValueArray: [0, 0, 0, 0, 0, 0, 28, 64]},
            {key: 8, value: "8", dataFormat: "text", dataEncoding: "utf-8"} 
            
        ]
    },
    {
        childDirectoryCount: 0,
        descendentDirectoryCount: 0,
        childFileCount: 3, 
        descendentFileCount: 3,
        options: {
            directoryPath: "/testDir/dir1/dir2/",
            recursive: true,
            removeDirectories: true,
            removeTargetDirectory: false
        },
        testDataItemObjArray: [
            {key: 9, value: "9", dataFormat: "text"},
            {key: 10, value: [10], dataFormat: "binary", byteValueArray: [0, 0, 0, 0, 0, 0, 36, 64]},
            {key: 11, value: "11", dataFormat: "text", dataEncoding: "utf-8"} 
        ]  
    },
    {   
        childDirectoryCount: 0,
        descendentDirectoryCount: 0,
        childFileCount: 0, 
        descendentFileCount: 0,
        options: {
            directoryPath: "/testDir/dir1/dirB/",
            recursive: true,
            removeDirectories: true,
            removeTargetDirectory: true
        },
        testDataItemObjArray: []  
    }  
];





/*
//silverlight_set test (isf)
(function(){
    
    var testSpecificOptionsObj = {
        
        xapPath: "ext_apps/BakedGoods.xap",
			
        storeScope: "site",
        conduitClass: "IsolatedStorageFile",

        directoryPath: "/",
        dataFormat: "text",
        dataEncoding: null,

        //Set operation pertinent options (Note that 
        startPosition: 0,      //Number.MAX_VALUE represents "one past" the last byte of the file

        truncateBeforeWrite: true,
        truncatePosition: 0,   //Number.MAX_VALUE represents "one past" the last byte of the file

        writeOnlyIfAbsent: false,
        /////
        
        elementParent: document.body,
        elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;"
    }
    
    var setTestDataItemObjArray = [
        {key: "1", value: "1234567890", expectedData: "1234567890"},
        {key: "1", value: "1234567890", dataFormat: "UTF-8", startPosition: Number.MAX_VALUE, truncatePosition: Number.MAX_VALUE, truncateBeforeWrite: false, expectedData: "12345678901234567890"},
        {key: "1", value: "1234567890", startPosition: 20, truncatePosition: 20, truncateBeforeWrite: true, expectedData: "123456789012345678901234567890"},
        {key: "1", value: "66666",  startPosition: 10, truncatePosition: 10, truncateBeforeWrite: true, expectedData: "123456789066666"},
        {key: "1", value: "45",  startPosition: 10, truncatePosition: 13, truncateBeforeWrite: true, expectedData: "1234567890456"},
        {key: "1", value: "", startPosition: 2, truncatePosition: 10, truncateBeforeWrite: false, expectedData: "1234567890456"},
        {key: "1", value: "", writeOnlyIfAbsent: true, expectedData: "1234567890456"},
        {key: "2", value: [0, 0, 0], dataFormat: "binary", expectedData: [0, 0, 0]},
        {key: "2", value: [255], dataFormat: "binary", startPosition: 8, truncatePosition: 16,  expectedData: [0,255]},
        {key: "3", value: [255,255], dataFormat: "binary", writeOnlyIfAbsent: true, expectedData: [255,255]}
    ];
    
    var testFunc = function(assert){
        
        var currentProcessingIndex = 0;
        var currentTestDataItemObj;
        
        var testCompleteFunc = function(){
            
            if(++currentProcessingIndex >= setTestDataItemObjArray.length)
            {
                clear(testSpecificOptionsObj.storeScope);
                QUnit.start();   
            }
            else
                setFunc();
        }
        
        
        var checkFunc = function(processedItemCount){
            
            var executeCheck = function(processedItemCount, keyValuePairsObj){
                assert.strictEqual(processedItemCount, 1);

                var currentExpectedData = currentTestDataItemObj.expectedData;
                var currentActualDataEntity = keyValuePairsObj[currentTestDataItemObj.key];

                if(currentExpectedData instanceof Array)
                {
                    var areActualAndExpectedDataEqual = true;
                    
                    for(var i = 0; i < currentActualDataEntity.length && areActualAndExpectedDataEqual; i++)
                        areActualAndExpectedDataEqual = (currentActualDataEntity[i] === currentExpectedData[i]);
 
                    assert.ok(areActualAndExpectedDataEqual);
                }
                else
                    assert.strictEqual(currentActualDataEntity, currentExpectedData);
                
                testCompleteFunc();
            }

            var dataEntity = ("dataFormat" in currentTestDataItemObj ? {key: currentTestDataItemObj.key, dataFormat: currentTestDataItemObj.dataFormat} : currentTestDataItemObj.key);
            silverlight_get([dataEntity], testSpecificOptionsObj, executeCheck);
        }
        
        
        var setFunc = function(){
            currentTestDataItemObj = setTestDataItemObjArray[currentProcessingIndex];
            silverlight_set([currentTestDataItemObj], testSpecificOptionsObj, checkFunc);
        }
        
        setFunc();
    }

    QUnit.asyncTest("silverlight_set (isf)", testFunc);
})()
*/


function setupGetOrRemoveTest(successFunc, testSpecificOptionsObj)
{
    var localOptionsObj = (testSpecificOptionsObj ? testSpecificOptionsObj : optionsObj);
    
    var desiredTestDataObjCount = (testSpecificOptionsObj && testSpecificOptionsObj.hasOwnProperty("testDataObjCount")
                                                    ? testSpecificOptionsObj.testDataObjCount : testDataObjArray.length);
                                                
    var processingIndex = 0;
    var currentTestDataObj;
    
    var setCompleteFunc = function(){
        if(++processingIndex < desiredTestDataObjCount)
            setFunc();
        else
            successFunc();
    }

    var setFunc = function(){
        currentTestDataObj = testDataObjArray[processingIndex];
        localOptionsObj.directoryPath = currentTestDataObj.options.directoryPath;
        silverlight_set(currentTestDataObj.testDataItemObjArray, localOptionsObj, setCompleteFunc);
    }
    
    setFunc();
}



/*
//silverlight_get test (isf)
(function(){
   
    var testSpecificOptionsObj =  {  
	testDataObjCount: 1,
        
        storeScope: "site",
        conduitClass: "IsolatedStorageFile",
        
        startPosition: 0,

        truncateBeforeWrite: true,
        truncatePosition: 0,   

        writeOnlyIfAbsent: false,

        directoryPath: "/",
        
        dataFormat: "text",
        dataEncoding: null,
        
        xapPath: "ext_apps/BakedGoods.xap",
        elementParent: document.body,
        elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;"
    }
    
    var testFunc = function(assert){

        var testDataItemObjArray = testDataObjArray[0].testDataItemObjArray;

        var dataArray = [];
        var harvestedStringIDEntity = false;
        for(var i = 0; i < testDataItemObjArray.length; i++)
        {
            var currentTestDataItemObj = testDataItemObjArray[i];

            if(typeof currentTestDataItemObj.key === "string" && !harvestedStringIDEntity)
            {
                dataArray[i] = currentTestDataItemObj.key
                harvestedStringIDEntity = true;
            }
            else
                dataArray[i] = currentTestDataItemObj;
        }
        
        var testCompleteFunc = function(){
            clear(testSpecificOptionsObj.storeScope);
            QUnit.start();
        }
        
        var getCheckFunc = function(processedItemCount, keyValuePairsObj){
            var testDataItemCount = testDataItemObjArray.length;
            
            assert.strictEqual(processedItemCount, testDataItemCount);
            for(var i = 0; i < testDataItemCount; i++)
            {
                var currentTestDataItemObj = testDataItemObjArray[i];

                var currentExpectedData = currentTestDataItemObj.value;
                var currentActualDataEntity = keyValuePairsObj[currentTestDataItemObj.key];

                if(currentExpectedData instanceof Array)
                {
                    var areActualAndExpectedDataEqual = true;
                    
                    for(var i = 0; i < currentActualDataEntity.length && areActualAndExpectedDataEqual; i++)
                        areActualAndExpectedDataEqual = (currentActualDataEntity[i] === currentExpectedData[i]);
 
                    assert.ok(areActualAndExpectedDataEqual);
                }
                else
                    assert.strictEqual(currentActualDataEntity, currentExpectedData);
            }
            
            testCompleteFunc();
        }
        
        var getFunc = function(){
            silverlight_get(dataArray, testSpecificOptionsObj, getCheckFunc);
        }

        setupGetOrRemoveTest(getFunc, testSpecificOptionsObj);
    }

    QUnit.asyncTest("silverlight_get (isf)", testFunc);
})()
*/


/*
//silverlight_remove test (isf)
(function(){
    
    var testSpecificOptionsObj =  {  
        testDataObjCount: 1,
			
        storeScope: "site",
        conduitClass: "IsolatedStorageFile",
        
        startPosition: 0,

        truncateBeforeWrite: true,
        truncatePosition: 0,   

        writeOnlyIfAbsent: false,

        directoryPath: "/",
        
        dataFormat: "text",
        dataEncoding: null,
        
        xapPath: "ext_apps/BakedGoods.xap",
        elementParent: document.body,
        elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;"
    }

    var testFunc = function(assert){

        var keyArray = [];
        
        var testDataItemObjArray = testDataObjArray[0].testDataItemObjArray;
        for(var i = 0; i < testDataItemObjArray.length; i++)
            keyArray.push(testDataItemObjArray[i].key);
        
        var testCompleteFunc = function(){
            clear(testSpecificOptionsObj.storeScope);
            QUnit.start();
        }
                    
        var checkFunc = function(processedItemCount, keyValuePairsObj){
            assert.strictEqual(processedItemCount, 0);
            
            var resultKeyValuePairsCount = 0;
            for(var key in keyValuePairsObj) ++resultKeyValuePairsCount;
            
            assert.strictEqual(resultKeyValuePairsCount, 0);
            testCompleteFunc();
        }
        
        var getFunc = function(){
            silverlight_get(keyArray, testSpecificOptionsObj, checkFunc);
        }
        
        var removeCheckFunc = function(processedItemCount){
            assert.strictEqual(processedItemCount, keyArray.length);
            getFunc();
        }
        
        var removeFunc = function(){
            silverlight_remove(keyArray, testSpecificOptionsObj, removeCheckFunc);
        }
    
        setupGetOrRemoveTest(removeFunc, testSpecificOptionsObj);        
    }

    QUnit.asyncTest("silverlight_remove (isf)", testFunc);
})()
*/


/*
//silverlight_getAll test (isf)
(function(){
    
    var testSpecificOptionsObj =  {  
        storeScope: "site",
        conduitClass: "IsolatedStorageFile",
        
        startPosition: 0,

        truncateBeforeWrite: true,
        truncatePosition: 0,   

        writeOnlyIfAbsent: false,

        directoryPath: "/",
        
        dataFormat: "text",
        dataEncoding: null,
        
        xapPath: "ext_apps/BakedGoods.xap",
        elementParent: document.body,
        elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;"
    }
    
    var currentTestDataObjIndex = testDataObjArray.length - 1;
    var currentTestDataObj;
    
    var testFunc = function(assert){
        
        var testCompleteFunc = function(){
            
            if(--currentTestDataObjIndex < 0)
            {
                clear(testSpecificOptionsObj.storeScope);
                QUnit.start();
            }
            else
                getAllFunc();       
        }

        var getAllCheckFunc = function(processedItemCount, dataItemObjArray){

            var keyDataObjPairsObj = {};
            var expectedDataItemSetSize = 0;

            var testDataObjSetStartIndex = (currentTestDataObj.options.recursive ? testDataObjArray.length - 1 : currentTestDataObjIndex);
            for(var i = testDataObjSetStartIndex; i >= currentTestDataObjIndex; i--)
            {
                var directoryPath = (testDataObjArray[i].options.directoryPath);
                if(directoryPath[directoryPath.length - 1] !== "/") directoryPath += "/";
                    
                if(directoryPath.indexOf(currentTestDataObj.options.directoryPath) !== 0) continue;

                var currentTestDataItemObjArray = testDataObjArray[i].testDataItemObjArray;
                for(var j = 0; j < currentTestDataItemObjArray.length; j++)
                {
                    var currentTestDataItemObj = currentTestDataItemObjArray[j];

                    var qualifiedKey = directoryPath + currentTestDataItemObj.key;
                    keyDataObjPairsObj[qualifiedKey] = currentTestDataItemObj; 

                    expectedDataItemSetSize++;
                }            
            }

            for(var i = 0; i < dataItemObjArray.length; i++)
            {
                var currentResultDataItemObj = dataItemObjArray[i];

                var currentResultDataItemKey = currentResultDataItemObj.key;
                var currentResultDataItemValue = dataItemObjArray[i].value
                var isResultItemInTestSet = keyDataObjPairsObj.hasOwnProperty(currentResultDataItemKey)

                if(isResultItemInTestSet)
                {
                    var currentExpectedData = (keyDataObjPairsObj[currentResultDataItemKey].byteValueArray || keyDataObjPairsObj[currentResultDataItemKey].value);

                    if(currentExpectedData instanceof Array)
                    {
                        var areActualAndExpectedDataEqual = true;

                        for(var j = 0; j < currentExpectedData.length && areActualAndExpectedDataEqual; j++)
                            areActualAndExpectedDataEqual = (currentResultDataItemValue.charCodeAt(j) === currentExpectedData[j]);

                        assert.ok(areActualAndExpectedDataEqual);
                    }
                    else
                        assert.strictEqual(currentResultDataItemValue, currentExpectedData);
                }
                else
                    assert.ok(false, "Retrieved item is not in test set. key = " + currentResultDataItemObj.key);
            }       

            assert.strictEqual(processedItemCount, expectedDataItemSetSize);
            testCompleteFunc();
        }
 
        var getAllFunc = function(){
            
            var copyCurrentTestDataSetOptions = function(recipientObj, donorObj){
            
                var pertinentPropertiesArray = ["directoryPath", "recursive"];

                for(var i = 0; i < pertinentPropertiesArray.length; i++)
                {
                    var currentPertinentProperty = pertinentPropertiesArray[i];
                    recipientObj[currentPertinentProperty] = donorObj[currentPertinentProperty];
                }
            }
            
            currentTestDataObj = testDataObjArray[currentTestDataObjIndex];
            copyCurrentTestDataSetOptions(testSpecificOptionsObj, currentTestDataObj.options);
            
            silverlight_getAll("true", testSpecificOptionsObj, getAllCheckFunc);
        }
        
        setupGetOrRemoveTest(getAllFunc, testSpecificOptionsObj)
    }

    QUnit.asyncTest("silverlight_getAll (isf)", testFunc);
})()
*/




//silverlight_removeAll (isf) test
(function(){
    
    var testSpecificOptionsObj = {

        storeScope: "site",
        conduitClass: "IsolatedStorageFile",
        
        startPosition: 0,

        truncateBeforeWrite: true,
        truncatePosition: 0,   

        writeOnlyIfAbsent: false,

        directoryPath: "/",
        
        dataFormat: "text",
        dataEncoding: null,
        
        recursive: false,
        removeDirectories: false,
        removeTargetDirectory: false,
        
        xapPath: "ext_apps/BakedGoods.xap",
        elementParent: document.body,
        elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;"
    }
    
    var currentTestDataObjIndex = testDataObjArray.length - 1;
    var currentTestDataObj = testDataObjArray[currentTestDataObjIndex];


    var testFunc = function(assert){
        
        var testCompleteFunc = function(){
            if(--currentTestDataObjIndex < 0)
            {
                clear();
                QUnit.start();
            }
            else
                removeAllFunc();
        }
        
        var getRemovalRelatedOptions = function(testDataObj){
            var optionsObj = testDataObj.options;
            
            return {
                directoryPath: optionsObj.directoryPath,
                isRecursive: optionsObj.recursive,
                removeDirectories: optionsObj.recursive && optionsObj.removeDirectories,
                removeTargetDirectory: optionsObj.recursive && optionsObj.removeTargetDirectory
            }
        }
        
        var removeAllCheckFunc = function(processedItemCount){

            var locusRemovalOptionsObj = getRemovalRelatedOptions(currentTestDataObj);
            var wasClearStoreOperation = (locusRemovalOptionsObj.removeDirectories || locusRemovalOptionsObj.removeTargetDirectory) 
                                                                        && /^(?:\/|\\)$/.test(locusRemovalOptionsObj.directoryPath);
                                                                    
            var expectedProcessedItemCount = currentTestDataObj.childFileCount + (locusRemovalOptionsObj.removeTargetDirectory ? 1 : 0);

            if(wasClearStoreOperation)
                expectedProcessedItemCount = 0;
            else if(locusRemovalOptionsObj.removeDirectories || locusRemovalOptionsObj.removeTargetDirectory)
            {
                var existingDescendentDirPathArray = [];

                for(var i = testDataObjArray.length - 1; i > currentTestDataObjIndex; i--)
                {
                    var curCasedRemovalOptionsObj = getRemovalRelatedOptions(testDataObjArray[i]);

                    if(curCasedRemovalOptionsObj.removeDirectories) 
                    {
                        for(var j = 0; j < existingDescendentDirPathArray.length;)
                        {
                            var curExistingDescendentDirPath = existingDescendentDirPathArray[j];
                            if(curExistingDescendentDirPath.indexOf(curCasedRemovalOptionsObj.directoryPath) === 0)
                                existingDescendentDirPathArray.splice(j,1);
                            else
                                j++;
                        }
                    }

                    if(!curCasedRemovalOptionsObj.removeTargetDirectory && curCasedRemovalOptionsObj.directoryPath.indexOf(locusRemovalOptionsObj.directoryPath) === 0)
                        existingDescendentDirPathArray.push(curCasedRemovalOptionsObj.directoryPath);
                }

                expectedProcessedItemCount += existingDescendentDirPathArray.length;
            }

            assert.strictEqual(processedItemCount, expectedProcessedItemCount);
            testCompleteFunc();
        }
        
        var removeAllFunc = function(){

            var copyCurrentTestDataSetOptions = function(recipientObj, donorObj){
            
                var pertinentPropertiesArray = ["directoryPath", "recursive", "removeDirectories", "removeTargetDirectory"];

                for(var i = 0; i < pertinentPropertiesArray.length; i++)
                {
                    var currentPertinentProperty = pertinentPropertiesArray[i];
                    recipientObj[currentPertinentProperty] = donorObj[currentPertinentProperty];
                }
            }
        
            currentTestDataObj = testDataObjArray[currentTestDataObjIndex];
            copyCurrentTestDataSetOptions(testSpecificOptionsObj, currentTestDataObj.options);
            silverlight_removeAll("true", testSpecificOptionsObj, removeAllCheckFunc);  
            
        }

        setupGetOrRemoveTest(removeAllFunc, testSpecificOptionsObj);
    }

    QUnit.asyncTest("silverlight_removeAll (isf)", testFunc);
})()


//Decipher meaning of first "else clause" in nearlyEqual function at http://floating-point-gui.de/errors/comparison/
//Refactor tests which process a single data item at a time to take advantage of batch-processing
//Refactor test component names with the suffixes "stub" and "mock" when appropriate
//Finalize and implement test nesting structure
//Formally discover how to debug on FlashDevelop
//Model complete() formal parameter comments after those created for the Silverlight and Flash-related methods
//Create flash_serializeLocationData and silverlight_serializeLocationData
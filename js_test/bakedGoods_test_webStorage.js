/*
 * The test runners in this file should be executed independant of one another (in other words, 
 * only one runner should be un-commented at any given time) in order to ensure that data produced
 * and/or modified by one does not affect the execution of any other.
 */



/**
* Carries out a storage operation on a web storage facility.

* @param storageType			a String of the name the operation's target web storage facility
* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param operationFunction		a function capable of carrying out a storage operation on {@code storageType} 
* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to
*/
function webStorage_executeStorageOperation(storageType, optionsObj, operationFunction, complete)
{
   /**
    * Determines if current browser supports a given web storage facility.

    * @param storageType		a String of the name of a web storage facility
    * @return					true if this browser possesses a web storage facility
                                                            with the name {@code storageType}, false otherwise
    */
    function isHTML5StorageTypeSupported(storageType)
    {
            try{return (storageType in window && window[storageType] !== null && window[storageType] !== undefined);}
            catch(e){return false;};
    }

   /**
    * Procures a handle to a web storage facility.

    * @param storageType				a String denoting the desired web storage facility
    * @param storageFacilityDomain		an optional String denoting the domain that the desired web storage
                                                                            facility belongs to (only relevant if {@code storageType} === "globalStorage"}
    * @return							the desired Storage object 
    */
    function getStorageFacility(storageType, storageFacilityDomain)
    {
        return (storageType === "globalStorage" ? window[storageType][storageFacilityDomain] : window[storageType]);
    }

    var error;
    if(isHTML5StorageTypeSupported(storageType))
    {
        try {operationFunction(getStorageFacility(storageType, optionsObj.domain));}
        catch(e){error = e;}	//Spec states an exception must be thrown if the storage facility cannot
                                // be accessed (though it may be supported) or if the quota is met
    }

    //Progress the execution of the set of operations this operation
    //belongs to (operation data to base progression off of is accessible
    //in the closure containing both the complete() and storageOperationFunction)
    complete(error);
}
	
	
	
/**
* Performs a web storage set operation on each object in a collection of data objects.

* @param storageType			a String of the name of the desired web storage facility
* @param dataArray				an Array of Objects each specifying a value to be persisted and a key which will map it in the store
* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to	
*/
function webStorage_set(storageType, dataArray, optionsObj, complete)
{
    var wasLastSetSuccessful = true;
    var i = 0;

   /**
    * Performs a web storage set operation on each object in {@code dataArray}.

    * @param storageFacility		the Storage object that is the target of this storage operation
    */
    function set(storageFacility)
    {
        //Loop through the objects in dataArray, storing the key-value pair defined in each into storageFacility
        var dataCount = dataArray.length;
        for(; i < dataCount && wasLastSetSuccessful; i++) storageFacility.setItem(dataArray[i].key, dataArray[i].value);
        /////
    }

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.

    * @param error      an optional Object representing and describing an error spawned by, 
    *       		and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error){ if(error) complete(i, error); else complete(i); }

    webStorage_executeStorageOperation(storageType, optionsObj, set, completeNow);
}

	
	
/**
* Performs a web storage get operation on each item in the store keyed in a given collection.

* @param storageType        a String of the name of the desired web storage facility
* @param keyArray           an Array of Strings each denoting the name of an item persisted in the web storage store
* @param optionsObj         an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete           a function capable of progressing the execution of the set 
                            of related storage operations this operation belongs to	
*/
function webStorage_get(storageType, keyArray, optionsObj, complete)
{				
    var keyValuePairsObj = {};
    var i = 0;

   /**
    * Performs a web storage get operation on each item in {@code storageType} keyed in {@code dataArray}.

    * @param storageFacility		the Storage object that is the target of this storage operation
    */
    function get(storageFacility)
    {
        //Loop through the key Strings in dataArray, establishing a pairing in 
        //keyValuePairsObj between each key and the value mapped to it in storageFacility
        var dataCount = keyArray.length;
        for(; i < dataCount; i++)
        {
                var key = keyArray[i];
                var value = (storageType === "globalStorage" ? storageFacility.getItem(key).value : storageFacility.getItem(key));
                keyValuePairsObj[key] = value;	
        }					
        /////
    }

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.

    * @param error      an optional Object representing and describing an error spawned by, 
    *       		and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error){ if(error) complete(i, keyValuePairsObj, error); else complete(i, keyValuePairsObj); }

    webStorage_executeStorageOperation(storageType, optionsObj, get, completeNow);
}
	
	
	
/**
* Performs a web storage remove operation on each item in the store keyed in a given collection.

* @param storageType        a String of the name of the desired web storage facility
* @param keyArray          an Array of Strings each denoting the name of an item persisted in the web storage store
* @param optionsObj         an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete           a function capable of progressing the execution of the set of 
*                           related storage operations this operation belongs to	
*/
function webStorage_remove(storageType, keyArray, optionsObj, complete)
{
    var i = 0;

   /**
    * Performs a web storage remove operation on each item in {@code storageType} keyed in {@code dataArray}.

    * @param storageFacility		the Storage object that is the target of this storage operation
    */
    function remove(storageFacility)
    {
        //Loop through the key Strings in dataArray, removing from
        //storageFacility the key-value pair that each belongs to
        var dataCount = keyArray.length;
        for(; i < dataCount; i++)	storageFacility.removeItem(keyArray[i]);	
        /////
    }

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.

    * @param error      an optional Object representing and describing an error spawned by, 
    *       		and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error){ if(error) complete(i, error); else complete(i); }

    webStorage_executeStorageOperation(storageType, optionsObj, remove, completeNow);
}
	
	
	
/**
* Retrieves the keys and values of all the items in a given web storage facility.

* @param storageType			a String of the name of the desired web storage facility
* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set
                                                                of related storage operations this operation belongs to	
*/
function webStorage_getAll(storageType, optionsObj, complete)
{
    var i = 0;
    var dataObjArray = [];

   /**
    *  Retrieves the keys and values of all the items in {@code web storage}.

    * @param storageFacility		the Storage object that is the target of this storage operation
    */
    function getAll(storageFacility)
    {
        //Loop through the keys present in storageFacility, inserting in to 
        //dataObjArray objects containing the key-value pair each belongs to
        var storedItemCount = storageFacility.length;
        for(; i < storedItemCount; i++)
        {
                var currentKey = storageFacility.key(i);
                var currentValue = (storageType === "globalStorage" ? storageFacility.getItem(currentKey).value : storageFacility.getItem(currentKey));
                dataObjArray.push({key: currentKey, value: currentValue});
        }
        /////
    }

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.

    * @param error      an optional Object representing and describing an error spawned by, 
    *       		and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error){ if(error) complete(i, dataObjArray, error); else complete(i, dataObjArray); }

    webStorage_executeStorageOperation(storageType, optionsObj, getAll, completeNow);
}
	
	
	
/**
* Removes all of the items currently persisted in a given web storage store.

* @param storageType			a String of the name of the desired web storage facility
* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to	
*/
function webStorage_removeAll(storageType, optionsObj, complete)
{
    var i = 0;
    var removeExpirationData = optionsObj.removeExpirationData;
    var removedDataItemKeyArray = (removeExpirationData ? [] : undefined);

   /**
    * Removes all of the items currently persisted in {@code storageType}.

    * @param storageFacility		the Storage object that is the target of this storage operation
    */
    function removeAll(storageFacility)
    {
        if(!storageFacility.clear || removeExpirationData)
        {
            //Loop through the keys present in storageFacility, removing
            //from it the key-value pair that each key belongs to, optionally
            //recording the key of each removed item if necessary
            for(; storageFacility.length > 0; i++) 
            {
                var currentKey = storageFacility.key(0);
                storageFacility.removeItem(currentKey);

                if(removedDataItemKeyArray) removedDataItemKeyArray.push(currentKey);
            }
            /////		
        }
        else
        {
            i = storageFacility.length;
            storageFacility.clear();
        }
    };

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.

    * @param error      an optional Object representing and describing an error spawned by, 
    *                   and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error)
    { 
        var argArray = [i];
        if(removedDataItemKeyArray) argArray.push(removedDataItemKeyArray);
        if(error) argArray.push(complete);

        complete.apply(complete, argArray);
    }

    webStorage_executeStorageOperation(storageType, optionsObj, removeAll, completeNow);
}
	
	
	
	
	
	/***************************************Test functions****************************************/
	
	
var testNum = Math.random() * Number.MAX_VALUE;
var testNumObj = new Number(Math.random() * Number.MAX_VALUE);

var testStr = "()<>@,;:\\<>/[]?={}";
var testDateObj = new Date();

var testObj = {num: testNum, numObj: testNumObj, str: testStr, dateObj: testDateObj};
var testArr = [testNum, testNumObj, testStr, testDateObj, testObj];

var objArray = [testNum, testNumObj, testStr, testDateObj, testObj, testArr];
var objCount = objArray.length;
	
	
	
var webStorageTypeArray = ["globalStorage", "localStorage", "sessionStorage"];
var webStorageTypeCount = webStorageTypeArray.length;

function isHTML5StorageTypeSupported(storageType)
{
    try{return (storageType in window && window[storageType] !== null && window[storageType] !== undefined);}
    catch(e){return false;};
}


function getOptionsObj(webStorageType)
{
    return (webStorageType === "globalStorage" ? {domain: window.location.hostname} : {});
}


function clear (webStorageType)
{
    var storageFacility = (webStorageType === "globalStorage" ? window[webStorageType][optionsObj.domain] : window[webStorageType]);

    if(storageFacility)
    {
        if(webStorageType === "globalStorage")
        {
            for(var i = 0; storageFacility.length > 0; i++)
                storageFacility.removeItem(storageFacility.key(i));
        }
        else
            storageFacility.clear();
    }
}
	
/*        
//webStorage_executeStorageOperation test runner
(function(){
    
    for(var i = 0; i < webStorageTypeCount; i++)
    {
        var testFunc = (function(index){

            return function(assert){
                var currentWebStorageType = webStorageTypeArray[index];
                var optionsObj = getOptionsObj(currentWebStorageType);

                if(isHTML5StorageTypeSupported(currentWebStorageType))
                {
                    var closureBool = false;

                    var mockStorageOperationFunc = function(){ closureBool = true; }
                    var complete = function(){ 
                        if(closureBool)
                        {
                            assert.ok(true);
                            clear(currentWebStorageType);  
                        } 
                        else
                        {
                            var storageFacility = (currentWebStorageType === "globalStorage" ? window[currentWebStorageType][optionsObj.domain] : window[currentWebStorageType]);
                            var doesStorageTypeExist = (storageFacility !== undefined || storageFacility === null);
                            assert.ok(!doesStorageTypeExist);
                        }
                    }

                    webStorage_executeStorageOperation(currentWebStorageType, optionsObj, mockStorageOperationFunc, complete);
                }
                else
                    assert.ok(true, currentWebStorageType + " not supported by this browser");
            }
        })(i)

        QUnit.test("webStorage_executeStorageOperation", testFunc);
    }
})()
*/


/*
//webStorage_set test runner
(function(testCount){

    for(var i = 0; i < webStorageTypeCount; i++)
    {
        var currentWebStorageType = webStorageTypeArray[i];
        var shouldBreak = false;

        for(var j = 0; j < testCount; j++)
        {
            var testFunc;

            if(isHTML5StorageTypeSupported(currentWebStorageType))
            {
                testFunc = (function(storageType){

                    return function(assert){

                        var optionsObj = getOptionsObj(storageType);

                        var currentKey = objArray[Math.floor(Math.random() * objCount)];
                        var currentValue = objArray[Math.floor(Math.random() * objCount)];
                        var currentDataObj = {key: currentKey, value: currentValue};

                        var complete = function(processedItemCount){
                                var storageFacility = (storageType === "globalStorage" ? window[storageType][optionsObj.domain] : window[storageType]);
                                assert.equal(storageFacility.getItem(currentKey), currentValue);

                                clear(storageType);
                        }

                        webStorage_set(storageType, [currentDataObj], optionsObj, complete);
                    }
                })(currentWebStorageType)

            }
            else
            {
                testFunc = (function(storageType){
                                return function(assert){assert.ok(true, storageType + "not supported by browser.")}
                            })(currentWebStorageType)
                shouldBreak = true;
            }

            QUnit.test("webStorage_set", testFunc);
            if(shouldBreak) break;
        }
    }
})(198)
*/
	
        
        
/*
//webStorage_get test runner
(function(testCount){

    var webStorageTypeCount = webStorageTypeArray.length;
    for(var i = 0; i < webStorageTypeCount; i++)
    {
        var currentWebStorageType = webStorageTypeArray[i];

        var shouldBreak = false;

        for(var j = 0; j < testCount; j++)
        {
            var testFunc;

            if(isHTML5StorageTypeSupported(currentWebStorageType))
            {
                testFunc = (function(storageType){

                    return function(assert){

                        var optionsObj = getOptionsObj(storageType);

                        var currentKey = objArray[Math.floor(Math.random() * objCount)];
                        var currentValue = objArray[Math.floor(Math.random() * objCount)];

                        var storageFacility = (storageType === "globalStorage" ? window[storageType][optionsObj.domain] : window[storageType]);

                        storageFacility.setItem(currentKey, currentValue);

                        var complete = function(processedItemCount, keyValuePairsObj){
                            assert.strictEqual(processedItemCount, 1);
                            assert.equal(keyValuePairsObj[currentKey], currentValue);

                            clear(storageType);
                        }

                        webStorage_get(storageType, [currentKey], optionsObj, complete);
                    }
                })(currentWebStorageType)
            }
            else
            {
                testFunc = (function(storageType){
                    return function(assert){assert.ok(true, storageType + " not supported by this browser.");}
                })(currentWebStorageType)

                shouldBreak = true;
            }

            QUnit.test("webStorage_get", testFunc);
            if(shouldBreak) break;
        }
    }
})(198)
*/
	
/*
//webStorage_remove test runner
(function(testCount){

    var webStorageTypeCount = webStorageTypeArray.length;
    for(var i = 0; i < webStorageTypeCount; i++)
    {
        var currentWebStorageType = webStorageTypeArray[i];

        var shouldBreak = false;

            for(var j = 0; j < testCount; j++)
            {
                var testFunc;

                if(isHTML5StorageTypeSupported(currentWebStorageType))
                {
                    testFunc = (function(storageType){

                        return function(assert){

                            var optionsObj = getOptionsObj(storageType);

                            var currentKey = objArray[Math.floor(Math.random() * objCount)];
                            var currentValue = objArray[Math.floor(Math.random() * objCount)];

                            var storageFacility = (storageType === "globalStorage" ? window[storageType][optionsObj.domain] : window[storageType]);

                            storageFacility.setItem(currentKey, currentValue);

                            var complete = function(processedItemCount){
                                    assert.strictEqual(processedItemCount, 1);

                                    var storedValue = (storageType === "globalStorage" ? storageFacility.getItem(currentKey).value : storageFacility.getItem(currentKey));
                                    assert.strictEqual(storedValue, null);

                                    clear(storageType);
                            }

                            webStorage_remove(storageType, [currentKey], optionsObj, complete);
                        }
                    })(currentWebStorageType)
                }
                else
                {
                    testFunc = (function(storageType){
                        return function(assert){assert.ok(true, storageType + " not supported by this browser.");}
                    })(currentWebStorageType)

                    shouldBreak = true;
                }

                QUnit.test("webStorage_remove", testFunc);
                if(shouldBreak) break;
            }
    }
})(198)
*/
	
	
/*
//webStorage_getAll test runner
(function(testCount){

    var webStorageTypeCount = webStorageTypeArray.length;
    for(var i = 0; i < webStorageTypeCount; i++)
    {
        var currentWebStorageType = webStorageTypeArray[i];
        var shouldBreak = false;
        
        for(var j = 2; j < testCount; j++)
        {
            var testFunc;

            if(isHTML5StorageTypeSupported(currentWebStorageType))
            {
                testFunc = (function(storageType, dataItemCount){

                    return function(assert){

                        var optionsObj = getOptionsObj(storageType);
                        var storageFacility = (storageType === "globalStorage" ? window[storageType][optionsObj.domain] : window[storageType]);

                        var keyValuePairsObj = {};

                        for(var k = 0; k < dataItemCount; k++)
                        {
                            var currentKey = objArray[Math.floor(Math.random() * objCount)];
                            var currentValue = objArray[Math.floor(Math.random() * objCount)];

                            storageFacility.setItem(currentKey, currentValue);
                            keyValuePairsObj[currentKey] = currentValue;
                        }

                        var complete = function(processedItemCount, dataObjArray){

                            dataItemCount = 0;
                            for(var key in keyValuePairsObj) dataItemCount++;
                            
                            assert.strictEqual(processedItemCount, dataItemCount);

                            var dataObjCount = dataObjArray.length;
                            for(var m = 0; m < dataObjCount; m++)
                            {
                                var curKey = dataObjArray[m].key;

                                assert.ok(curKey in keyValuePairsObj);
                                assert.equal(dataObjArray[m].value, keyValuePairsObj[curKey]);
                            }

                            clear(storageType);
                        }

                        webStorage_getAll(storageType, optionsObj, complete);
                    }
                })(currentWebStorageType, j)
            }
            else
            {
                testFunc = (function(storageType){
                    return function(assert){assert.ok(true, storageType + " not supported by this browser.");}
                })(currentWebStorageType)

                shouldBreak = true;
            }

            QUnit.test("webStorage_getAll", testFunc);
            if(shouldBreak) break;
        }
    }
})(10)
*/
	
	

//webStorage_removeAll test runner
(function(testCount){

    var webStorageTypeCount = webStorageTypeArray.length;
    for(var i = 0; i < webStorageTypeCount; i++)
    {
        var currentWebStorageType = webStorageTypeArray[i];
        var shouldBreak = false;
        
        for(var j = 2; j < testCount; j++)
        {
            var testFunc;

            if(isHTML5StorageTypeSupported(currentWebStorageType))
            {
                testFunc = (function(storageType, dataItemCount){

                    return function(assert){

                        var optionsObj = getOptionsObj(storageType);
                        var storageFacility = (storageType === "globalStorage" ? window[storageType][optionsObj.domain] : window[storageType]);

                        for(var k = 0; k < dataItemCount; k++)
                        {
                            var currentKey = objArray[Math.floor(Math.random() * objCount)];
                            var currentValue = objArray[Math.floor(Math.random() * objCount)];

                            storageFacility.setItem(currentKey, currentValue);
                        }

                        var complete = function(processedItemCount){
                            assert.strictEqual(storageFacility.length, 0, optionsObj.domain);
                        }

                        webStorage_removeAll(storageType, optionsObj, complete);
                    }
                })(currentWebStorageType, j)
            }
            else
            {
                testFunc = (function(storageType){
                    return function(assert){assert.ok(true, storageType + " not supported by this browser.");}
                })(currentWebStorageType)

                shouldBreak = true;
            }

            QUnit.test("webStorage_removeAll", testFunc);
            if(shouldBreak) break;
        }
    }
})(10)

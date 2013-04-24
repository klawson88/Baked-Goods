/**
* Loads and performs a storage operation on a userData store.

* @param optionsObj						an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param storageOperationFunction		a function capable of carrying out a storage operation
* @param complete						a function capable of progressing the execution of the set 
                                                                                of related data storage operations which this operation belongs
* @param doesModify						a boolean denoting whether {@code storageOperationFunction} modifies the store
*/
function userData_executeStorageOperation(optionsObj, storageOperationFunction, complete, doesModify)
{
    function isUserDataBehaviorEnabled(element){ return (element && "save" in element); }
    function canEnableUserDataBehavior(element){ return (element && "addBehavior" in element); }

    var locusElement = (optionsObj.locusElement? optionsObj.locusElement : (optionsObj.useBodyAsBackup ? document.body : null));
    var behaviorID;

    //If the userData behavior has not, but can be enabled, do so and
    //save the ID of the behavior for use in its removal after processing
    if(!isUserDataBehaviorEnabled(locusElement) && canEnableUserDataBehavior(locusElement))
            behaviorID = locusElement.addBehavior("#default#userData");

    //If the userData behavior is enabled (either before the execution of this method or as a result of it), carry out the storage operation
    var error;
    if(isUserDataBehaviorEnabled(locusElement))
    {
        locusElement.load(optionsObj.storeName);	//use locusElement to load the store
        try{storageOperationFunction(locusElement);}catch(e){error = e;}
        if(doesModify) locusElement.save(optionsObj.storeName);	//use locusElement to save the changes to the store
    }

    //Remove the behavior if it was was added by this function
    if(behaviorID) locusElement.removeBehavior(behaviorID);

    //Progress the execution of the set of operations this operation
    //belongs to (operation data to base progression off of is accessible
    //in the closure containing both complete() and storageOperationFunction)
    complete(error);
}



/**
* Performs a userData set operation on a userData store using the 
* data contained in eac element in a collection of data objects.

* @param dataArray				an Array of Objects each specifying a value to be persisted and a key which will map it in the store
* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to	
*/
function userData_set(dataArray, optionsObj, complete)
{
    var i = 0;
    var dataCount = dataArray.length;
    var wasLastSetSuccessful = true;

   /**
    * Performs a useData set operation on each member in a collection of data objects.
    
    * @param locusElement       the specified DOM element fitted with the attributes and methods 
    *                           necessary to access a userData store and perform a storage operation 
    */
    function set(locusElement)
    {
        //Loop through the objects in dataArray, storing (with the help of the 
        //properties in optionsObj) the key-value pair defined in each
        for(;i < dataCount && wasLastSetSuccessful; i++)
        {
            var key = dataArray[i].key;
            var valueObj = dataArray[i].value;

            locusElement.setAttribute(key, valueObj);
            wasLastSetSuccessful = (locusElement.getAttribute(key) !== null);
        }
        /////
    }

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.
    
    * @param error      an optional Object representing and describing an error spawned by, 
		*       and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error){ if(error) complete(i, error); else complete(i); }

    userData_executeStorageOperation(optionsObj, set, completeNow, true);
}



/**
* Performs a userData remove operation on each item in the store keyed in a given collection.

* @param dataArray				an Array of Strings each denoting the name of an item persisted in the userData store
* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set 
                                                                of related storage operations this operation belongs to	
*/
function userData_get(dataArray, optionsObj, complete)
{
    var i = 0;
    var keyValuePairsObj = {};

   /**
    * Performs a userData get operation on item in the store keyed in dataArray.
    
    * @param locusElement       the specified DOM element fitted with the attributes and methods 
    *                           necessary to access a userData store and perform a storage operation 
    */
    function get(locusElement)
    {
        //Loop through the key Strings in dataArray, creating a pairing in 
        //keyValuePairsObj between each key and the value it maps to in the store
        var dataCount = dataArray.length;
        for(; i < dataCount; i++)
        {
                var key = dataArray[i];
                keyValuePairsObj[key] = locusElement.getAttribute(key);
        }
        /////
    }

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.
    
    * @param error      an optional Object representing and describing an error spawned by, 
		*       and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error){ if(error) complete(i, keyValuePairsObj, error); else complete(i, keyValuePairsObj); }

    userData_executeStorageOperation(optionsObj, get, completeNow, false);
}



/**
* Performs a userData remove operation on each item in the store keyed in a given collection.

* @param dataArray				an Array of Strings each denoting the name of an item persisted in the userData store
* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set
                                                                of related storage operations this operation belongs to	
*/
function userData_remove(dataArray, optionsObj, complete)
{
    var i = 0;

   /**
    * Performs a userData remove operation on each item in the store keyed in dataArray.
    
    * @param locusElement       the specified DOM element fitted with the attributes and methods 
    *                           necessary to access a userData store and perform a storage operation 
    */
    function remove(locusElement)
    {
        //Loop through the key Strings in dataArray, removing from  
        //the store the key-value pair that each belongs to
        var dataCount = dataArray.length;
        for(; i < dataCount; i++) locusElement.removeAttribute(dataArray[i]);
        /////
    }

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.
    
    * @param error      an optional Object representing and describing an error spawned by, 
		*       and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error){ if(error) complete(i, error); else complete(i); }

    userData_executeStorageOperation(optionsObj, remove, completeNow, true);
}



/**
* Retrieves the names and values of all the items in a given userData store.

* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to	
*/
function userData_getAll(optionsObj, complete)
{
    var i = 0;
    var dataObjArray = [];

   /**
    * Retrieves the names and values of all the items in a given userData store.
     
    * @param locusElement       the specified DOM element fitted with the attributes and methods 
    *                           necessary to access a userData store and perform a storage operation 
    */
    function getAll(locusElement)
    {
        //Get a map of the locusElement's root element attributes. They serve as 
        //representations of the key-value pairs persisted in the store
        var namedAttributeNodeObj = locusElement.XMLDocument.documentElement.attributes;

        //Loop through the nodes contained in namedAttributeNodeObj, copying
        //the key and value of the attribute each node represents in to 
        //an object that is inserted in to dataObjArray
        var currentAttributeNode;
        for(var currentAttributeNode; (currentAttributeNode = namedAttributeNodeObj.nextNode()) !== null; i++)
        {
            var currentKey = currentAttributeNode.nodeName;
            var currentValue = currentAttributeNode.nodeValue;
            dataObjArray.push({key: currentKey, value: currentValue});
        }
        /////
    }

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.
    
    * @param error      an optional Object representing and describing an error spawned by, 
		*       and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error){ if(error) complete(i, dataObjArray, error); else complete(i, dataObjArray); }

    userData_executeStorageOperation(optionsObj, getAll, completeNow, false);
}



/**
* Removes all of the items currently persisted in a given userData store.

* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to	
*/
function userData_removeAll(optionsObj, complete)
{
    var i = 0;

    var removeExpirationData = optionsObj.removeExpirationData;
    var removedDataItemKeyArray = (removeExpirationData ? [] : undefined);

   /**
    *  Removes all of the items currently persisted in a given userData store.
    */
    function removeAll(locusElement)
    {
        //Get a map of the locusElement's root element attributes. They serve as 
        //representations of the key-value pairs persisted in the store
        var namedAttributeNodeObj = locusElement.XMLDocument.documentElement.attributes;

        //Loop through the and remove the nodes (which are derived 
        //representations of peristed key-value pairs) in namedAttributeNodeObj, 
        //recording the names of the removed nodes if necessary
        for(; namedAttributeNodeObj.length > 0;i++)
        {	
            var currentAttributeNodeName = namedAttributeNodeObj[0].nodeName;
            namedAttributeNodeObj.removeNamedItem(currentAttributeNodeName);

            if(removedDataItemKeyArray) removedDataItemKeyArray.push(currentAttributeNodeName);
        }
        /////
    }

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

    userData_executeStorageOperation(optionsObj, removeAll, completeNow, true);
}

/***************************************Test functions****************************************/
	
/*
var testNum = Math.random() * Number.MAX_VALUE;
var testNumObj = new Number(Math.random() * Number.MAX_VALUE);

var testStr = "()<>@,;:\\<>/[]?={}";
var testDateObj = new Date();

var testObj = {num: testNum, numObj: testNumObj, str: testStr, dateObj: testDateObj};
var testArr = [testNum, testNumObj, testStr, testDateObj, testObj];

var objArray = [testNum, testNumObj, testStr, testDateObj, testObj, testArr];
*/

var objArray = ["one", "two", "three", "four", "five", "six"];
var objCount = objArray.length;
	
        
var optionsObj = {storeName: "Baked_Goods", locusElement: document.body, useBodyAsBackup: false};
var isUserDataBehaviorEnabledBool = false;

function isUserDataBehaviorEnabled(element){ return element && ("save" in element); }
function canEnableUserDataBehavior(element){ return element && ("addBehavior" in element); }


function clear()
{
    var locusElement = optionsObj.locusElement;
    var storeName = optionsObj.storeName;
    
    var namedAttributeNodeObj = locusElement.XMLDocument.documentElement.attributes;

    for(var i = 0; namedAttributeNodeObj.length > 0;i++)
    {	
        var currentAttributeNodeName = namedAttributeNodeObj[0].nodeName;
        namedAttributeNodeObj.removeNamedItem(currentAttributeNodeName);
    }

    locusElement.save(storeName);
}




if(isUserDataBehaviorEnabled(optionsObj.locusElement))
    clear();
else if(canEnableUserDataBehavior(optionsObj.locusElement))
{
    optionsObj.locusElement.addBehavior("#default#userData");

    optionsObj.locusElement.setAttribute("test", "test");
    optionsObj.locusElement.save(optionsObj.storeName);

    optionsObj.locusElement.load(optionsObj.storeName);
    isUserDataBehaviorEnabledBool = (optionsObj.locusElement.XMLDocument.xml.indexOf("test") !== -1);
    optionsObj.locusElement.removeAttribute("test");
        optionsObj.locusElement.save(optionsObj.storeName);


}
        
		


/*	
//userData_executeStorageOperation test runner
(function(){

    for(var i = 0; i < 2; i++)
    {
        var testFunc = (function(numVar){

            var doesModify = !!numVar;

            return function(assert){

                var closureInt = 0;
                var mockStorageOperationFunc = function(){closureInt = 2;};
                var complete = function(){ assert.strictEqual(closureInt, 2);}

                userData_executeStorageOperation(optionsObj, mockStorageOperationFunc, complete, doesModify);
            }
        })(i)
        
        QUnit.test("userData_executeStorageOperation", testFunc);
    }
})()
*/
	
/*
//userData_set test runner
(function(testCount){

    var locusElement = optionsObj.locusElement;
    var storeName = optionsObj.storeName;

    for(var i = 0; i < testCount; i++)
    {
        var testFunc = function(assert){

            var currentKey = objArray[Math.floor(Math.random() * objCount)];
            var currentValue = objArray[Math.floor(Math.random() * objCount)];
            var currentDataObj = {key: currentKey, value: currentValue};

            var complete = function(processedItemCount){
                
                var expectedProcessedItemCount = 0;
                
                if(isUserDataBehaviorEnabledBool)
                {
                        expectedProcessedItemCount = 1;
                        optionsObj.locusElement.load(storeName);		
                        assert.equal(locusElement.getAttribute(currentKey), currentValue);

                        clear();
                }
                else
                        assert.ok(true, "userData not supported by this browser.");

                assert.strictEqual(expectedProcessedItemCount, processedItemCount);
            }

            userData_set([currentDataObj], optionsObj, complete);
        }

        QUnit.test("userData_set", testFunc);
    }
})(198)
*/


/*
//userData_get test runner
(function(testCount){

    var locusElement = optionsObj.locusElement;
    var storeName = optionsObj.storeName;

    for(var i = 0; i < testCount; i++)
    {
        var testFunc = function(assert){

            var currentKey = objArray[Math.floor(Math.random() * objCount)];
            var currentValue = objArray[Math.floor(Math.random() * objCount)];

            if(isUserDataBehaviorEnabledBool)
            {
                locusElement.load(storeName);
                locusElement.setAttribute(currentKey, currentValue);
                locusElement.save(storeName);
            }

            var complete = function(processedItemCount, keyValuePairsObj){

                var expectedProcessedItemCount = 0;;

                if(isUserDataBehaviorEnabledBool)
                {
                        expectedProcessedItemCount = 1;
                        assert.equal(keyValuePairsObj[currentKey], currentValue);

                        clear();
                }
                else
                        assert.ok(true, "userData not supported by this browser.");

                assert.strictEqual(expectedProcessedItemCount, processedItemCount);
            }

            userData_get([currentKey], optionsObj, complete);
        }

        QUnit.test("userData_get", testFunc);
    }

})(198)
*/


/*
//userData_remove test runner
(function(testCount){

    var locusElement = optionsObj.locusElement;
    var storeName = optionsObj.storeName;

    for(var i = 0; i < testCount; i++)
    {
        var testFunc = function(assert){

            var currentKey = objArray[Math.floor(Math.random() * objCount)];
            var currentValue = objArray[Math.floor(Math.random() * objCount)];

            if(isUserDataBehaviorEnabledBool)
            {
                locusElement.load(storeName);
                locusElement.setAttribute(currentKey, currentValue);
                locusElement.save(storeName);
            }

            var complete = function(processedItemCount){

                var expectedProcessedItemCount;

                if(isUserDataBehaviorEnabledBool)
                {
                    expectedProcessedItemCount = 1;
                    assert.strictEqual(locusElement.getAttribute(currentKey), null);
                    clear();
                }
                else
                    assert.ok(true, "userData not supported by this browser");

                assert.strictEqual(expectedProcessedItemCount, processedItemCount);
            }

            userData_remove([currentKey], optionsObj, complete);
        }

        QUnit.test("userData_remove", testFunc);
    }
})(198)
*/



/*
//userData_getAll testRunner
(function(testCount){

    var locusElement = optionsObj.locusElement;
    var storeName = optionsObj.storeName

    for(var i = 2; i < testCount; i++)
    {
        var testFunc = (function(dataItemCount){

            return function(assert){
                var keyValuePairsObj = {};

                for(var j = 0; j < dataItemCount; j++)
                {
                    var currentKey = objArray[Math.floor(Math.random() * objCount)];
                    var currentValue = objArray[Math.floor(Math.random() * objCount)];

                    if(isUserDataBehaviorEnabledBool)
                    {
                            locusElement.load(storeName);
                            locusElement.setAttribute(currentKey, currentValue);
                            locusElement.save(storeName);

                            keyValuePairsObj[currentKey] = currentValue;
                    }
                }

                var complete = function(processedItemCount, dataObjArray){
                    
                    dataItemCount = 0;
                    for(var key in keyValuePairsObj) dataItemCount++;

                    assert.equal(processedItemCount, dataItemCount);

                    for(var k = 0; k < processedItemCount; k++)
                    {
                        var curKey = dataObjArray[k].key;

                        assert.ok(curKey in keyValuePairsObj);
                        assert.equal(dataObjArray[k].value, keyValuePairsObj[curKey]);
                    }

                    if(isUserDataBehaviorEnabledBool)
                        clear(locusElement);
                    else
                        assert.ok(true, "userData not supported by this browser");
                }

                userData_getAll(optionsObj, complete);
            }

        })(i)


        QUnit.test("userData_getAll", testFunc);
    }
})(10)
*/




//userData_removeAll testRunner
(function(testCount){

    var locusElement = optionsObj.locusElement;
    var storeName = optionsObj.storeName;

    for(var i = 2; i < testCount; i++)
    {
        var testFunc = (function(dataItemCount){

            return function(assert){

                var keyValuePairsObj = {};

                for(var j = 0; j < dataItemCount; j++)
                {
                    var currentKey = objArray[Math.floor(Math.random() * objCount)];
                    var currentValue = objArray[Math.floor(Math.random() * objCount)];

                    if(isUserDataBehaviorEnabledBool)
                    {
                            locusElement.load(storeName);
                            locusElement.setAttribute(currentKey, currentValue);
                            locusElement.save(storeName);

                            keyValuePairsObj[currentKey] = currentValue;
                    }
                }

                var complete = function(processedItemCount, dataObjArray){

                    if(isUserDataBehaviorEnabledBool)
                            assert.strictEqual(locusElement.XMLDocument.documentElement.attributes.length, 0);
                    else
                        assert.ok(true, "userData not supported by this browser");
                }

                userData_removeAll(optionsObj, complete);
            }

        })(i)

        QUnit.test("userData_removeAll", testFunc);
    }
})(10)

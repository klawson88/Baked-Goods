/**
* Creates an object consisting of data items each describing
* a time instant or a relationship between two time instants.

* @param timeInstantVar		an Object representing a time instant
* @param pivotDate			(optional) a Date object that a subset of the time data contained 
                                                        in the the to-be-created object will contain be based on
* @return					an Object containing two properties:
                                                                - millisecondsToTimeInstant:  	the duration in milliseconds from the execution of this 
                                                                                                                                function to the time represented by {@code timeInstantVar}
                                                                - timeInstantUTCString:			a String representing the time instant in UTC format
*/
function createTimeDataObject(timeInstantVar, pivotDate)
{
        var timeDataObj = null;

        if(timeInstantVar !== undefined)
        {
                if(!pivotDate)	pivotDate = new Date();
                var timeDate = (timeInstantVar instanceof Date ? timeInstantVar
                                    : ( typeof timeInstantVar === "number" || timeInstantVar instanceof Number ? new Date(timeInstantVar) : pivotDate));

                timeDataObj = {};
                timeDataObj.millisecondsToTimeInstant = (timeDate.getTime() - pivotDate.getTime());
                timeDataObj.timeInstantUTCString = timeDate.toUTCString();
        }

        return timeDataObj;
}




/**
* Performs a cookie set operation using the data contained in each element in collection of data objects.
* Depending on the parameters and data contained in the data objects, the 
* operations can either result in the creation or removal of a cookie.

* @param dataArray				an Array containing objects of a homogenous type dependant on the type of operation to be conducted
                                                                        set: an Array of Objects each containing  key, value, and optional expirationTime properties
                                                                        remove: an Array of Strings, each of the name of a to-be-removed cookie
* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to	
* @param isRemoveOperation		a boolean denoting whether the purpose of the set operation is the removal of a cookie
*/
function cookie_set(dataArray, optionsObj, complete, isRemoveOperation)
{
        var i = 0;
        var dataCount = dataArray.length;
        var wasLastSetSuccessful = true;

        //Loop through the entities in dataArray, performing set operations on document.cookie using the
        //data contained or represented by the processing entity along with that contained in optionsObj
        for(; i < dataCount && wasLastSetSuccessful; i++)
        {
                var currentDataObj = dataArray[i];
                var key, value, isSecure, expirationTimeDataObj;
                
                if(isRemoveOperation)
                {
                   key = encodeURIComponent(currentDataObj);
                   value = "";
                   isSecure = false;
                   expirationTimeDataObj = createTimeDataObject(-1);
                }
                else
                {
                    key = encodeURIComponent(currentDataObj.key);
                    value = encodeURIComponent(currentDataObj.value);
                    isSecure = (currentDataObj.isSecure || optionsObj.isSecure);
                    expirationTimeDataObj = createTimeDataObject(currentDataObj.expirationTime);
                }

                //Create components each containing a distinct data item of the to-be-created cookie
                var keyValueComponent = key + "=" + value;
                var maxAgeComponent = (expirationTimeDataObj ? "max-age=" + expirationTimeDataObj.millisecondsToTimeInstant + ";" : "");
                var expirationDateComponent = (expirationTimeDataObj ? "expires=" + expirationTimeDataObj.timeInstantUTCString + ";" : "");
                var domainComponent = (optionsObj.domain !== null ? "domain=" + optionsObj.domain + ";" : "");
                var pathComponent = (optionsObj.path !== null ? "path=" + optionsObj.path + ";" : "");
                var secureComponent = (isSecure ? "secure;" : "");
                /////

                //Concatenate the cookie components and insert the resulting String in to the existing set of cookies for the 
                //current origin. Depending on the expiration data, this action either sets or removes the specified cookie
                document.cookie = keyValueComponent + ";" + maxAgeComponent + expirationDateComponent + domainComponent + pathComponent + secureComponent;

                //Determine if the operation was successful by testing for the presence of the cookie.
                //If a removal was performed, success is defined by the absense of the cookie 
                wasLastSetSuccessful = (document.cookie.search("(^|;)\\s*" + keyValueComponent) !== -1);	
                if(isRemoveOperation) wasLastSetSuccessful = !wasLastSetSuccessful;
                /////
        }
        /////

        //Conditially progress the execution of the set of operations which this operation
        //belongs to by providing the index of the last succesfully set data item
        complete(i);
}



/**
* Performs a cookie retrieval operation one each name in a collection of cookie name Strings.

* @param dataArray				an Array of Strings, each denoting the name of a desired cookie
* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to	
*/
function cookie_get(dataArray, optionsObj, complete)
{
        var keyValuePairsObj = {};
        var allCookiesStr = document.cookie;
        var i = 0;

        //Loop through the key Strings in dataArray, retrieving the value related to each 
        //(from allCookiesStr) and placing the resulting key-value pairs in keyValuePairsObj
        var dataCount = dataArray.length;
        for(; i < dataCount; i++)
        {
            var key = dataArray[i];
            var encodedKey = encodeURIComponent(dataArray[i]); //We encode the URI to ensure we're using the form of the 
            var value = null;                                       //key that was actually used as the name of the cookie

            var keyAndEqualSignStr = encodedKey + "=";
            var cookieKeyValuePairBeginIndex = allCookiesStr.indexOf(keyAndEqualSignStr);

            //If there is a cookie by the name of the value specified by key
            if(cookieKeyValuePairBeginIndex !== -1)
            {
                //Determine the bounding indices of the keyed value
                var valueBeginIndex  = cookieKeyValuePairBeginIndex + keyAndEqualSignStr.length;
                var onePastValueEndIndex = allCookiesStr.indexOf(";", cookieKeyValuePairBeginIndex);
                onePastValueEndIndex = (onePastValueEndIndex === -1 ? allCookiesStr.length : onePastValueEndIndex);
                /////

                //Extract the desired value from the string of all cookies. We decode the URI to ensure 
                //we recieve the form of the value that was actually submitted during creation
                value = allCookiesStr.substring(valueBeginIndex, onePastValueEndIndex).replace(/\s+$/, "");
                value = decodeURIComponent(value);	
            }
            /////

            keyValuePairsObj[key] = value;
        }
        /////

        //Conditially progress the execution of the set of operations which this 
        //operation belongs to by providing the index of the last key succesfully operated
        //on along with an object containing the key-value pairs resulting from the operation
        complete(i, keyValuePairsObj);
}



/**
* Retrieves the names and values of all the cookies accessible from the current origin.

* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to
* @param isRemovalSuboperation                  a boolean denoting whether or not this function was invoked by a parent removal operation
*/
function cookie_getAll(optionsObj, complete, isRemovalSuboperation)
{
    var i = 0;
    var cookieDataArray = document.cookie.split(";");

    //Loop through key-value pair Strings in  cookieDataArray, parsing, extracting,
    //and inserting the desired data back in to the processing index in cookieDataArray 
    var cookieCount = cookieDataArray.length;
    for(var i = 0; i < cookieCount; i++)
    {
            var currentKeyValuePairArray = cookieDataArray[i]
                                                    .replace(/^\s+/, "").replace(/\s+$/, "")  //whitespace precedes and/or trails key-value pair Strings in some browsers
                                                    .split("=");
            
            //Extract the currently processing data item key, decoding it to obtain its pre-persisted form
            var key = decodeURIComponent(currentKeyValuePairArray[0]);

            //Replace the current key-value pair String in cookieDataArray with 
            //the operation-dependant desired data it contains. All data items 
            //extracted from the String are decoded to obtain their pre-persisted form
            if(!isRemovalSuboperation) 
            {
                var value = decodeURIComponent(currentKeyValuePairArray[1]);
                cookieDataArray[i] = ({key: key, value: value});
            }
            else
                cookieDataArray[i] = key;
            /////
    }
    /////

    //Progress the execution of the set of operations which this operation belongs to, providing
    // the number of key-value pairs processed as well as the actual pairs resulting from this operation
    complete(i, cookieDataArray);
}



/**
* Removes all the cookies accessible from the current origin.

* @param optionsObj     an Object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete	a function capable of progressing the execution of the set of related storage operations this operation belongs to	
*/
function cookie_removeAll(optionsObj, complete)
{
    var allCookieDataObjArray;
    var removeExpirationData = optionsObj.removeExpirationData;

   /**
    * Creates a function capable of utilizing the data resulting from a pair of cookie getAll() and 
    * cookie removeAll() sub-operations to conclude an overarching cookie removeAll() operation.

    * @return		a function capable of utilizing the data resulting from a pair of cookie getAll() and 
                        cookie removeAll() sub-operations to conclude an overarching cookie removeAll() operation
    */
    function createRemoveAllCompleteWrapper()
    {
       /**
        * Concludes the removeAll operation

        * @param processedItemCount     an int denoting the number of items processed 
                                        by the removeAll() operation to invoke this function
        */
        function removeAllComplete(processedItemCount)
        {
            var indexer = (removeExpirationData ? 0 : processedItemCount);
            var removedDataItemKeyArray;

            if(removeExpirationData)
            {
                //Loop through the data item objects in allCookieDataObjArray, pushing 
                //the key contained in each on to removedDataItemKeyArray 
                var removedDataItemKeyArray = [];
                for(; indexer < processedItemCount; indexer++)
                        removedDataItemKeyArray.push(allCookieDataObjArray[indexer].key);
                /////
                complete(processedItemCount, removedDataItemKeyArray);
            }
            else
                complete(processedItemCount);
        }

        return removeAllComplete;
    }

/**
    * Creates a function capable of funnelling the data resulting from a cookie getAll() 
    * operation in to a set operation which removes the represented data from the store. 

    * @return       a function capable of funneling the data resulting from a
                    cookie getAll() operation in to a cookie remove() operation
    */
    function createGetAllCompleteWrapper()
    {
        /**
        * Progresses the execution of the set of constituent sub-operations in this storage operation.

        * @param processedItemCount         an integer denoting the number of items in {@code keyValuePairObjArray}
        * @param keyValuePairObjArray       an Array of objects each containing the key and value of a persisted cookie
        */
        function getAllComplete(processedItemCount, keyValuePairObjArray)
        {
            allCookieDataObjArray = keyValuePairObjArray;
            cookie_set(keyValuePairObjArray, optionsObj, createRemoveAllCompleteWrapper(), true);
        }

        return getAllComplete;
    }

    cookie_getAll(optionsObj, createGetAllCompleteWrapper(), true);
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
/*
//createTimeDataObject test runner
(function(testCount)
{
        for(var i = 0; i < testCount; i++)
        {
                var testFunc = (function(num){
                    
                    return  function(assert){

                        var nowDate = new Date();
                        var nowTimeMilliseconds = nowDate.getTime();

                        var twiceNowTimeMilliMag = Math.abs(nowTimeMilliseconds) * 2;

                        var arbitraryTimeMilliseconds = nowTimeMilliseconds - Math.floor((Math.random() * twiceNowTimeMilliMag));
                        var arbitraryTimeEntity = arbitraryTimeMilliseconds;

                        switch (num % 3)
                        {
                                case 1: 	arbitraryTimeEntity = new Date(arbitraryTimeEntity); break;
                                case 2 : 	arbitraryTimeEntity = new Number(arbitraryTimeEntity); break;
                                default: 	break;
                        }

                        var arbitraryTimeDataObj = createTimeDataObject(arbitraryTimeEntity, nowDate);

                        assert.strictEqual(arbitraryTimeDataObj.millisecondsToTimeInstant, (arbitraryTimeMilliseconds - nowTimeMilliseconds));
                        assert.strictEqual(arbitraryTimeDataObj.timeInstantUTCString, new Date(arbitraryTimeMilliseconds).toUTCString());
                    
                    }
                    
                })(i)

                QUnit.test("cookie_createTimeDataObject", testFunc);
        }

})(100)
*/

/*
//cookie_set test runner
(function(testCount){

        var optionsObj = {path: null, domain: null, isSecure: false}; 

        for(var i = 0; i < testCount; i++)
        {
                var testFunc = (function(num){

                        return function(assert){

                                var currentKey = objArray[Math.floor(Math.random() * objCount)];
                                var currentValue = objArray[Math.floor(Math.random() * objCount)];
                                var expirationTime = (num % 5 === 0 ? -1 : new Date().getTime() +  31556926000);

                                var currentDataObj = {key: currentKey, value: currentValue, expirationTime: expirationTime};

                                var completeFunc = function(processedItemCount){

                                        var wasStored = (expirationTime >= 0 );

                                        assert.strictEqual(processedItemCount, 1);

                                        var cookieStr = document.cookie;
                                        var keyValuePairStr = encodeURIComponent(currentKey) + "=" + encodeURIComponent(currentValue);
                                        
                                        if(wasStored)
                                            assert.ok(cookieStr.indexOf(keyValuePairStr) !== -1);
                                        else
                                            assert.ok(cookieStr.indexOf(keyValuePairStr) === -1);
                                        
                                        
                                        cookie_removeAll(optionsObj, function(){});
                                }

                                cookie_set([currentDataObj], optionsObj, completeFunc);
                        }
                })(i);

                QUnit.test("cookie_set", testFunc);
        }
})(100)
*/




/*
//cookie_get test runner
(function(testCount){

        var optionsObj = {path: null, domain: null, isSecure: false}; 

        for(var i = 0; i < testCount; i++)
        {
                var testFunc = function(assert){

                        var currentKey = objArray[Math.floor(Math.random() * objCount)];
                        var currentValue = objArray[Math.floor(Math.random() * objCount)];
                        document.cookie = encodeURIComponent(currentKey) + "=" + encodeURIComponent(currentValue);

                        var completeFunc = function(processedItemCount, keyValuePairsObj){
                                assert.equal(keyValuePairsObj[currentKey], new String(currentValue));
                                cookie_removeAll(optionsObj, function(){});
                        }

                        cookie_get([currentKey], optionsObj, completeFunc);
                }

                QUnit.test("cookie_get", testFunc);
        }
})(100)
*/

/*
//cookie_remove test runner
(function(testCount){
        var optionsObj = {path: null, domain: null, isSecure: false}; 


        for(var i = 0; i < testCount; i++)
        {
                var testFunc = function(assert){

                        var currentKey = objArray[Math.floor(Math.random() * objCount)];
                        var currentValue = objArray[Math.floor(Math.random() * objCount)];
                        document.cookie = encodeURIComponent(currentKey) + "=" + encodeURIComponent(currentValue);

                        var completeFunc = function(processedItemCount){
                                assert.strictEqual(processedItemCount, 1);

                                var allCookiesStr = document.cookie;
                                var isCookieRemoved = !(new RegExp(encodeURIComponent(currentKey) + "\\s*=").test(allCookiesStr));
                                assert.ok(isCookieRemoved);
                                
                                cookie_removeAll(optionsObj, function(){});
                        }

                        cookie_set([currentKey], optionsObj, completeFunc, true);
                }

                QUnit.test("cookie_remove", testFunc);
        }
})(100)

*/


/*
 var optionsObj = {path: null, domain: null, isSecure: false}; 
cookie_removeAll(optionsObj, function(){});

//cookie_getAll test runner
(function(testCount){

        var optionsObj = {path: null, domain: null, isSecure: false}; 

        for(var i = 2; i < testCount; i++)
        {
                var testFunc = (function(dataItemCount){

                        return function(assert){
                                var previousOperationCookieData = document.cookie;

                                var keyValuePairsObj = {};

                                for(var j = 0; j < dataItemCount; j++)
                                {
                                        var currentKey = objArray[Math.floor(Math.random() * objCount)];
                                        var currentValue = objArray[Math.floor(Math.random() * objCount)];
                                        document.cookie = encodeURIComponent(currentKey) + "=" + encodeURIComponent(currentValue);

                                        keyValuePairsObj[currentKey] = currentValue;
                                }

                                var completeFunc = function(processedItemCount, dataObjArray){
                                    
                                        dataItemCount = 0;
                                        for(var key in keyValuePairsObj) dataItemCount++;
                                        
                                        assert.strictEqual(processedItemCount, dataItemCount);

                                        var retrievedDataItemCount = dataObjArray.length;

                                        for(var k = 0; k < retrievedDataItemCount; k++)
                                        {
                                            var wasKeyStoredByOperation = (dataObjArray[k].key in keyValuePairsObj);
                                            assert.ok(wasKeyStoredByOperation);
                                        }
                                        
                                        cookie_removeAll(optionsObj, function(){});
                                }

                                cookie_getAll(optionsObj, completeFunc);
                        };
                })(i)

                QUnit.test("cookie_getAll", testFunc);
        }

})(10)
*/



//cookie_removeAll test runner
(function(testCount){

        var optionsObj = {path: null, domain: null, isSecure: false}; 

        for(var i = 2; i < testCount; i++)
        {
                var testFunc = (function(dataItemCount){

                        return function(assert){

                                var dataItemCount = Math.max(i, 2);
                                for(var j = 0; j < dataItemCount; j++)
                                {
                                        var currentKey = objArray[Math.floor(Math.random() * objCount)];
                                        var currentValue = objArray[Math.floor(Math.random() * objCount)];
                                        document.cookie = encodeURIComponent(currentKey) + "=" + encodeURIComponent(currentValue);
                                }

                                var completeFunc = function(i){
                                        assert.strictEqual(document.cookie, "");
                                }

                                cookie_removeAll(optionsObj, completeFunc);
                        }
                })(i);


                QUnit.test("cookie_removAll", testFunc);
        }
})(10)

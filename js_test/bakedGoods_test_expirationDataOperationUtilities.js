var expirationDataAptStorageTypesArray =  ["indexedDB", "webSQL", "localStorage", "globalStorage", "fileSystem", "userData"];
var expirationDataRepositoryName = "Baked_Goods_Expiration_Data";

var defaultStorageTypeExpirationDataPrimedOptionsObj = {
    webSQL: {
        tableData: {name: expirationDataRepositoryName, keyColumnName: "key", columnDefinitions: "(key TEXT PRIMARY KEY, expirationTimeMillis INTEGER)"},
        tableIndexDataArray:[{name: "Expiration_Data_By_Time", columnNames: "expirationTimeMillis"}]
    }, 
    indexedDB:{
        objectStoreData: {name: expirationDataRepositoryName, keyPath: "key", autoIncrement: false},
        objectStoreIndexDataArray: [{name: "Expiration_Data_By_Time", keyPath: "expirationTimeMillis"}]
    }
}; 


/**
* Determines if an object is a DOMError object. A DOMError object is defined as an
* object possessing a name property with a specific type of error as its value.

* @param obj        an Object
* @return           a boolean denoting whether {@code obj} represents and contains data describing a DOM error
*/
function isDOMError(obj)
{
    return ((obj instanceof Object) && (typeof obj.name === "string") && (obj.name.toLowerCase().indexOf("error") !== -1));
}


/**
 * Creates a String capable of representing a given 
 * String literally in a Javascript regular expression.
 
 * @param str       a String
 * @return          a String capable of representing {@code str} as 
 *                  a literal char sequence in a regular expression
 */
function escapeRegexSpecialChars(str)
{
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}



/**
* Creates a version of a given String suitable for insertion in to a String 
* to contain expiration-related data pertaining to persisted data items.

* @param expirationDataItemComponentStr        a String containing data which either partially identifies,
*                                              or denotes the expiration time of a persisted data item
* @return                                      a String equivalent to {@code expirationDataItemComponent} suitable 
*                                              for insertion in to a String to contain expiration-related
*                                              data pertaining to persisted data items
*/
function encodeExpirationDataItemComponent(expirationDataItemComponentStr)
{
    if(typeof expirationDataItemComponentStr !== "string") expirationDataItemComponentStr += "";

    var encodedExpirationDataItemComponent = "";

    var periodHex = "%" + ".".charCodeAt(0).toString(16);
    var underscoreHex = "%" + "_".charCodeAt(0).toString(16); 
    var vertBarHex = "%" + "|".charCodeAt(0).toString(16);

    //Loop through the chars in expirationDataItemComponentStr, appending each 
    //char or (if its designated to seperate expiration data items or their 
    //components) its hex representation to encodedExiprationDataItemArray
    var charCount = expirationDataItemComponentStr.length;
    for(var i = 0; i < charCount; i++)
    {
        var curChar = expirationDataItemComponentStr[i];

        switch(curChar)
        {
            case ".":   encodedExpirationDataItemComponent += periodHex;	break;
            case "_":   encodedExpirationDataItemComponent += underscoreHex;    break;
            case "|":   encodedExpirationDataItemComponent += vertBarHex;       break;
            default:    encodedExpirationDataItemComponent += curChar;          break;
        }
    }
    /////

    return encodedExpirationDataItemComponent;
}



/**
* Recreates the String used as the basis for the creation of 
* a given readily-storable, expiration-data containing String.

* @param encodedExpirationDataItemComponentStr     a String, primed to be inserted inside a String containing similarly  
*                                                  formatted substrings, which contains data which partially identifies    
*                                                  or denotes the expiration time of a persisted item
* @return                                          a String identical to the one used as the basis for the
*                                                  creation of {@code encodedExpirationDataItemComponentStr}
*/
function decodeExpirationDataItemComponent(encodedExpirationDataItemComponentStr)
{
    var expirationDataItemComponent = "";
    var charBuffer = "";

    var periodHex = "%" + ".".charCodeAt(0).toString(16);
    var underscoreHex = "%" + "_".charCodeAt(0).toString(16);
    var vertBarHex = "%" + "|".charCodeAt(0).toString(16);

    //Loop through the chars in encodedExpirationDataItemComponent, appending the unicode 
    //representation of each char or eligible char sequence to expirationDataItemComponent
    var charCount = encodedExpirationDataItemComponentStr.length;
    for(var i = 0; i < charCount; i++)
    {
        //Buffer the currently processing char in charBuffer for interpretation as part of a hex sequence
        charBuffer += encodedExpirationDataItemComponentStr[i]; 

        //The contents of the buffer can be processed if charBuffer does represent a hex sequence, is equal 
        //in length to the hex representation of an ASCII char, or if the last char has been reached
        var reachedLastChar = (i === (charCount - 1));
        var canProcessBuffer = (charBuffer[0] !== "%" || charBuffer.length === 3 || reachedLastChar);

        if(canProcessBuffer)     
        {
            var nestedHexSequenceBeginIndex = undefined;
            
            //Process charBuffer as a hex sequence, appending to expirationDataItemComponent  
            //either its unicode form (if it represents a "." "_" or "|"), or its longest 
            //0-index based substring that isn't a component to a hex sequence
            switch(charBuffer)
            {
                case periodHex:     expirationDataItemComponent += ".";           break;
                case underscoreHex: expirationDataItemComponent += "_";           break;
                case vertBarHex:    expirationDataItemComponent += "|";           break;
                default:            
                {
                    nestedHexSequenceBeginIndex = (reachedLastChar ? charBuffer.length : charBuffer.indexOf("%", 1));
                    if(nestedHexSequenceBeginIndex === -1) nestedHexSequenceBeginIndex = charBuffer.length;

                    expirationDataItemComponent += charBuffer.substring(0, nestedHexSequenceBeginIndex);
                }  
                break;
            }
            /////
            
            //Redefine charBuffer as its sequence of chars that were not appended to expirationDataItemComponent
            if(nestedHexSequenceBeginIndex === undefined) nestedHexSequenceBeginIndex = charBuffer.length;
            charBuffer = charBuffer.substring(nestedHexSequenceBeginIndex, charBuffer.length);
            /////
        }  
    }
    /////

    return expirationDataItemComponent;
}



/**
* Creates the array of objects that will be used as the subject of an expiration data- 
* related storage operation to be executed in a database storage facility.

* @param storedItemDataCollectionObjArray       an Array of objects each consisting of the name of a storage facility and a collection 
*                                               of objects which each contain data related to an item stored in the facility
* @param includeExpirationTime                  a boolean denoting whether to include the expiration times of the data items described
*                                               in the collections inside the elements of {@code storedItemDataCollectionObjArray}
*                                               in the data item-describing elements of the to-be-returned array
* @return                                       a homogeouns Array consisting of either Objects or Strings each containing identifying (and optionally 
                                                expiration-time denoting) data of an persisted data item described in {@code storedItemDataCollectionObjArray}
*/ 
function createExpirationDataArray(storedItemDataCollectionObjArray, includeExpirationTime)
{
    var expirationDataArray = [];

    //Loop through the objects in storedItemDataCollectionObjArray, using the storage type and array of data item-describing 
    //objects contained in each to append objects to expirationDataArray that contain the expiration data of those data items
    var collectionCount = storedItemDataCollectionObjArray.length;
    for(var i = 0; i < collectionCount; i++)
    {
        var currentItemDataCollectionObj = storedItemDataCollectionObjArray[i];
        var currentStorageType = currentItemDataCollectionObj.storageType;
        var currentStoredItemDataObjArray = currentItemDataCollectionObj.dataArray;

        //Loop through the objects in currentStoredItemDataObjArray, using each to append to expirationDataArray an object 
        //(with a type/form implicitly specified by doContainExpirationTime) that may either be a String uniquely identifying 
        //the item described by the object, or an object consisting of said String  and the time the described item is set to expire
        var currentItemCount = currentStoredItemDataObjArray.length;
        for(var j = 0; j < currentItemCount; j++)
        {
            var currentDataObj = currentStoredItemDataObjArray[j];
            var keyStorageTypeLocationDataStr = currentDataObj.key + "_" + currentStorageType + "_" + currentDataObj.locationDataStr;
            expirationDataArray.push((includeExpirationTime ? {key: keyStorageTypeLocationDataStr, expirationTimeMillis: currentDataObj.expirationTimeMillis}
                                                              : keyStorageTypeLocationDataStr));		
        }
        /////
    }
    /////

    return expirationDataArray;
}



/**
* Stores a String containing data item expiration
* metadata in a non-database storage facility.

* @param storageType		a String denoting the storage facility that the to-be-conducted operation is to take place in
* @param expirationDataBlob     a "|" delimited String consisting of substrings which each contain a storage facility
                                holding a data item, the key that identifies the item, and the time the item is set to expire		
* @param complete		a function to be called upon the conclusion of the set operation
*/
function setExpirationDataBlob(storageType, expirationDataBlob, complete)
{
    var expirationDataKeyValueObj = {key: expirationDataRepositoryName, value: expirationDataBlob};
    set({data:[expirationDataKeyValueObj], storageTypes: [storageType], options: defaultStorageTypeExpirationDataPrimedOptionsObj, complete: complete});
}



/**
* Performs a change on a String containing expiration-related data
* pertaining to persisted items in one or more storage facilities.

* @param expirationDataBlob                     a "|" delimited String consisting of substrings which each contain a key identifying a
*                                               persisted item, the storage facility it is persisted in, and the time the item is set to expire
* @param storedItemDataCollectionObjArray	an Array of objects each consisting of the name of a storage facility and a collection
                                                of objects which each contain data describing an item stored in the facility
* @param expirationDataExistingItemModFunc      a function to be called when a data item described in a collection in 
                                                {@code storedItemDataCollectionObjArray} has expiration data present in {@code expirationDataBlob}
* @param expirationDataAbsentItemModFunc	a function to be called when a data item described in a collection in {@code storedItemDataCollectionObjArray}
                                                does not have expiration data present in {@code expirationDataBlob}
* @param modCompleteCallback			a function to be called once the change concludes, with the resulting String as its sole argument
*/
function updateSerializedExpirationData(expirationDataBlob, storedItemDataCollectionObjArray,
            expirationDataExistingItemModFunc, expirationDataAbsentItemModFunc, modCompleteCallback)
{
    if(!expirationDataBlob) expirationDataBlob = "";

    //Loop through the objects in storedItemDataCollectionObjArray, using Strings constructed
    //from the storage type and data item-describing objects contained in each along with
    //expirationDataExistingItemModFunc and expirationDataAbsentItemModFunc to modify expirationDataBlob 
    var collectionCount = storedItemDataCollectionObjArray.length
    for(var i = 0; i < collectionCount; i++)
    {
        var storedItemDataCollectionObj = storedItemDataCollectionObjArray[i];
        var storedItemDataArray = storedItemDataCollectionObj.dataArray;
        var storageType = storedItemDataCollectionObj.storageType;

        //Loop through the objects in storedItemDataArray, using the key and expiration time 
        //contained in each along with storageType and location data to modify expirationBlob
        var dataItemCount = storedItemDataArray.length;
        for(var j = 0; j < dataItemCount; j++)
        {
            var currentDataObj = storedItemDataArray[j];
            var currentKey = encodeExpirationDataItemComponent(currentDataObj.key);

            var keyStorageTypeLocationStr = escapeRegexSpecialChars(currentKey) + "_" + storageType + "_" + escapeRegexSpecialChars(currentDataObj.locationDataStr);
            var expirationDataItem = (currentDataObj.expirationTimeMillis !== undefined ? keyStorageTypeLocationStr + "_" + currentDataObj.expirationTimeMillis : undefined);	

            //Search for the expiration data item keyed by keyStorageTypeLocationStr
            var expirationDataItemKeyRegex = new RegExp("(?:^|\\|)" + keyStorageTypeLocationStr + "_\\d+(?:$|\\|)");
            var targetSubstrBeginIndex = expirationDataBlob.search(expirationDataItemKeyRegex);
            /////

            if(targetSubstrBeginIndex !== -1)		//if there is an expiration data item for this key/storage type/location combination
            {
                var targetSubstrEndIndexOffset = (expirationDataBlob[targetSubstrBeginIndex] === "|" ? 0 : 1);
                var targetSubstrEndIndex = expirationDataBlob.indexOf("|", targetSubstrBeginIndex + 1); //"+1" ensures indexOf doesn't match the matched token's first char which may be "|"
                
                targetSubstrEndIndex = (targetSubstrEndIndex === -1 ? expirationDataBlob.length : targetSubstrEndIndex + targetSubstrEndIndexOffset);
                expirationDataBlob = expirationDataExistingItemModFunc(targetSubstrBeginIndex, targetSubstrEndIndex, expirationDataBlob, expirationDataItem);
            }
            else
                expirationDataBlob = expirationDataAbsentItemModFunc(expirationDataBlob, expirationDataItem);
        }
        /////
    }

    //Invoke modCompleteCallback with the modified expiration data blob
    modCompleteCallback(expirationDataBlob);
}



/**
* Carries out a storage operation targeting or utilizing data item expiration metadata.

* @param storageType                                a String denoting storage facility the to-be-conducted operation is to take place in
* @param storageTypeCategoryToOperationTypeObj      an Object containing key-value pairs each consisting of a
                                                    storage type category (key), and a storage operation type (value)
* @param storageTypeCategoryToDataEntityObj         an object containing key-value pairs each consisting of a storage type category (key),
                                                    and an object consisting of or identifying the target data of the operation 
* @param complete                                   a function to execute upon the conclusion of the to-be-conducted storage operation													
*/
function conductExpirationDataStorageOperaton(storageType, storageTypeCategoryToOperationTypeObj, storageTypeCategoryToDataEntityObj, complete)
{
    var storageMetatype = (storageType === "localStorage" || storageType === "globalStorage" ? "webStorage" : storageType);
    var storageTypeCategory = (storageType === "webSQL" || storageType === "indexedDB" ? "database" : "nonDatabase");

    var operationType = storageTypeCategoryToOperationTypeObj[storageTypeCategory];
    var dataEntity = storageTypeCategoryToDataEntityObj[storageTypeCategory];

    var optionsObj = procureStorageTypeOptions(storageType, defaultStorageTypeExpirationDataPrimedOptionsObj[storageType]);
    var storageOperationFunc = storageOperationFuncObj[storageMetatype][operationType];

    if(storageMetatype !== storageType)
        storageOperationFunc(storageType, dataEntity, optionsObj, complete);
    else
        storageOperationFunc(dataEntity, optionsObj, complete);
}



/**
* Records metadata identifying and denoting the expiration time of one or more persisted data items. 

* @param storedItemDataCollectionObjArray       an Array of objects each consisting of the name of a storage facility and a collection 
*                                               of objects which each contain data describing an item stored in the facility
*/
function recordExpirationData(storedItemDataCollectionObjArray)
{	
    var i = 0;
    var currentStorageType;

    var storageTypeCategoryToDataEntityObj = {
        database : createExpirationDataArray(storedItemDataCollectionObjArray, true),
        nonDatabase: [expirationDataRepositoryName]
    };

    var storageTypeCategoryToOperationTypeObj = {
        database: "set",
        nonDatabase: "get"
    };
    
    
   /**
    * Replaces a given substring in a String.

    * @param targetSubstrBeginIndex             an int of the index in {@code str} that the to-be-replaced substring begins
    * @param onePastTargetSubstrEndIndex        an int of the index in {@code str} directly following that which the to-be-replaced substring ends
    * @param str                                a String containing the to-be-replaced substring
    * @param newSubstring                       the String designated to replace the substring in {@code str} bounded by 
    *                                           {@code targetSubstrBeginIndex} and {@code onePastTargetSubstrEndIndex}
    * @return                                   a String containing the contents of {@code str} with {@code newSubstring}
    *                                           in place of the substring delimited by {@code targetSubstrBeginIndex}
    *                                           and {@code onePastTargetSubstrEndIndex}
    */
    function replaceSubstring(targetSubstrBeginIndex, onePastTargetSubstrEndIndex, str, newSubstring)
    {
        return str.substring(0, targetSubstrBeginIndex) + newSubstring + str.substring(onePastTargetSubstrEndIndex);
    }

   /**
    * Appends one String to another, delimiting them if necessary.

    * @param operandStr1        the String to be appended to 
    * @param operandStr2        the String to be appeneded
    * @return                   a String which consists of the contents of {@code operandStr1} 
    *                           and {@code operandStr1}, seperated by "|" if the former is non-empty
    */
    function appendStringWithDelimiter(operandStr1, operandStr2)
    {
        return operandStr1 += (operandStr1 === "" ? "" : "|" ) + operandStr2;	
    }
    
   /**
    * Commences a write of a blob containing expiration 
    * data to the currently processing storage type.
    
    * @param expirationDataBlob     a "|" delimited String consisting of substrings which each
    *                               contain a key identifying a persisted item, the storage facility
    *                               it is persisted in, and the time the item is set to expire
    */
    function addExpirationDataComplete(expirationDataBlob)
    {
        setExpirationDataBlob(currentStorageType, expirationDataBlob, complete);
    }
    
   /**
    * Progresses the expiration data recording operation upon completion of a 
    * sub-operation, depending on the success and type of the completed sub-operation.
    * 
    * @param processedItemCount     an int denoting the number of items processed by the invoking sub-operation
    * @param operationResultObj     the Object produced as a result of the invoking sub-operation
    * @param error                  an optional Object representing and describing an error spawned by, 
    *                               and responsible for the conclusion of the invoking storage operation
    */
    function complete(processedItemCount, operationResultObj, error)
    {
        var isSuccessful = (arguments.length === 1  || (arguments.length === 2 && !isDOMError(operationResultObj)));
        
        if(isSuccessful)
        {
            //If the completed sub-operation was a "get" (only "gets" produce result objects),
            //call updateSerializedExpirationData to add to the retrieved expiration data,
            //that which is procured from the objects in storedItemDataCollectionObjArray
            if(operationResultObj !== undefined)
                updateSerializedExpirationData(operationResultObj[expirationDataRepositoryName], storedItemDataCollectionObjArray, 
                                                                replaceSubstring, appendStringWithDelimiter, addExpirationDataComplete);
        }
        else
        {
            ++i;
            run();	//attempt to record the expiration data in the next storage facility in expirationDataAptStorageTypesArray
        }
    }

   /**
    * Commences an operation to record the expiration data of the items described in the
    * elements of storedItemDataCollectionObjArray in the currently processing storage facility.
    */
    function run()
    { 
        if(i < expirationDataAptStorageTypesArray.length)
        {
            currentStorageType = expirationDataAptStorageTypesArray[i];
            conductExpirationDataStorageOperaton(currentStorageType, storageTypeCategoryToOperationTypeObj, storageTypeCategoryToDataEntityObj, complete);
        }
    }

    run();
    return this;
}



/**
* Deletes metadata identifying and denoting the expiration time of one or more persisted data items.

* @param storedItemDataCollectionObjArray           an Array of Objects each consisting of the name of a storage facility and a collection
                                                    of objects either identifying or describing data items stored in the facility
* @param expirationDataContainingStorageType        a String denoting a storage facility known to contain the expiration data of the 
*                                                   data items described in {@code storedItemDataCollectionObjArray}
*/
function removeExpirationData(storedItemDataCollectionObjArray, expirationDataContainingStorageType)
{
    var i = 0;
    var currentStorageType;
    var localExpirationDataAptStorageTypesArray = (expirationDataContainingStorageType ? [expirationDataContainingStorageType] : expirationDataAptStorageTypesArray);

    var storageTypeCategoryToDataEntityObj = {
        database : createExpirationDataArray(storedItemDataCollectionObjArray, false),
        nonDatabase: [expirationDataRepositoryName]
    };

    var storageTypeCategoryToOperationTypeObj = {
        database: "remove",
        nonDatabase: "get"
    };
    
    
   /**
    * Replaces a given substring in a String.

    * @param targetSubstrBeginIndex             an int of the index in {@code str} that the to-be-removed substring starts begins
    * @param onePastTargetSubstrEndIndex        an int of the index in {@code str} directly following that which the to-be-removed substring ends
    * @param str                                a String containing the to-be-removed substring
    * @return                                   a String identical to {@code str} sans the substring delimited by 
    *                                           {@code targetSubstrBeginIndex} and {@code onePastTargetSubstrEndIndex}
    */
    function removeSubstring(targetSubstrBeginIndex, onePastTargetSubstrEndIndex, str)
    {
        return str.substring(0, targetSubstrBeginIndex) + str.substring(onePastTargetSubstrEndIndex);
    }
    
    /**
     * Returns a given String, unchanged.
     
     * @param str       a String        
     * @return          {@code expirationDataBlob}
     */
    function reflectString(str){ return str; }
    
   /**
    * Commences a write of a blob containing expiration 
    * data to the currently processing storage type.
    
    * @param expirationDataBlob     a "|" delimited String consisting of substrings which each
    *                               contain a key identifying a persisted item, the storage facility
    *                               it is persisted in, and the time the item is set to expire
    */
    function removeExpirationDataItemComplete(expirationDataBlob)
    {
        setExpirationDataBlob(currentStorageType, expirationDataBlob, complete);
    }

   /**
    * Progresses the expiration data removal operation upon completion of a 
    * sub-operation, depending on the success and type of the completed sub-operation.
    
    * @param processedItemCount     an int denoting the numer of items processed by the invoking sub-operation
    * @param operationResultObj     the Object produced as a result of the invoking sub-operation
    */
    function complete(processedItemCount, operationResultObj)
    {
        var isSuccessful = (arguments.length === 1  || (arguments.length === 2 && !isDOMError(operationResultObj)));
        var isSuccessfulGet = isSuccessful && (operationResultObj !== undefined) && (operationResultObj[expirationDataRepositoryName] !== null);

        if(isSuccessfulGet)
        {
            var expirationDataContainerEntity = operationResultObj[expirationDataRepositoryName];

            //If expiration data was found in the currently processing storage type, call
            //updateSerializedExpirationData to remove from the retrieved expiration data,
            //that of each of the items described in storedItemDataCollectionObjArray
            if(expirationDataContainerEntity)
            {
                updateSerializedExpirationData(expirationDataContainerEntity, storedItemDataCollectionObjArray,
                                                removeSubstring, reflectString, removeExpirationDataItemComplete);			
            }	
            else									
                isSuccessful = isSuccessfulGet = false;
        }

        if(!isSuccessful)   
        {                                   
            ++i;
            run();	//attempt to record the expiration data in the next storage facility in expirationDataAptStorageTypesArray
        }
    }

   /**
    * Commences an operation to remove the expiration data of the items described in the
    * elements of storedItemDataCollectionObjArray from the currently processing storage facility
    */
    function run()
    { 
        if(i < localExpirationDataAptStorageTypesArray.length)
        {
            currentStorageType = localExpirationDataAptStorageTypesArray[i];
            conductExpirationDataStorageOperaton(currentStorageType, storageTypeCategoryToOperationTypeObj, storageTypeCategoryToDataEntityObj, complete);
        }
    }

    run();
    return this;
}



/**
* Procures objects each containing the name of a storage facility and a collection of 
* Strings keying expired items in that facility from expiration-related metadata.

* @param expirationDataItemArray        a homogenous Array of Objects each containing consisting of the  key of  a data item, the
*                                       storage facility that contains it, subsidiary data pinpointing the location inside the
*                                       storage facility the data item is located and (optionally) the time instant the item is set to expire
* @param fromDatabase                   a boolean denoting whether {@code expirationDataItemArray} 
                                        was procured from a database-type storage facility 
* @param operationStartTimeMillis       the number representation of the time instant (in milliseconds) designated as that which  
*                                       is greater than or equal to the expiration times of all data items to be regarded as expired 
* @return                               an Array of Objects each consisting of the name of a storage facility appearing in at
                                        least one Object in {@code expirationDataItemArray}, and an array of Objects  
                                        each containing data describing an expired item in that storage facility 
*/
function procureByStorageTypeExpiredItemDataExternal(expirationDataItemArray, fromDatabase, operationStartTimeMillis)
{
    var storageTypeToIndexObj = {};
    var expiredItemDataCollectionArray = [];

    //Loop through the objects in expirationDataItemArray, extracting the data item key,
    //location data, and storage type contained each, and placing the former two in to   
    //the array in the object in expiredItemDataCollectionArray related to the latter.
    var dataItemCount = expirationDataItemArray.length;
    for(var i = 0; i < dataItemCount; i++)
    {
        var currentDataObj = expirationDataItemArray[i];
        var currentDataItemIdentifyingStr = (fromDatabase ? currentDataObj.key : currentDataObj);
        var currentKeyComponentArray = currentDataItemIdentifyingStr.split("_");

        //Procure the expiration time of the data item described by currentDataItemIdentifyingStr. If a database was the source of 
        //the items in expirationDataItemArray, then the items were retrieved conditionally and the array only contains the data  
        //of expired stored items; we assign expirationTimeMillis to an arbitrary negative number in this case
        var expirationTimeIndex = currentKeyComponentArray.length - (fromDatabase ? 0 : 1);
        var expirationTimeMillis = (fromDatabase ? Number.NEGATIVE_INFINITY : currentKeyComponentArray[expirationTimeIndex]);
        /////

        if(expirationTimeMillis <= operationStartTimeMillis)
        {
            //Extract the key, containing storage facility, and subsidiary location data 
            //of the data item that is described by currentDataItemIdentifyingStr
            var dataItemKey = decodeExpirationDataItemComponent(currentKeyComponentArray[0]);										
            var storageType = currentKeyComponentArray[1];
            var locationDataStr = currentKeyComponentArray[2];
            /////

            //Get the index in expiredItemDataCollectionArray which stores the object containing
            //the array of Objects each consisting of data describing expired data item in storageType
            var storageTypeIndex = storageTypeToIndexObj[storageType];

            //If such an object hasn't been created, create it
            if(storageTypeIndex === undefined)
            {
                storageTypeIndex = storageTypeToIndexObj[storageType] = expiredItemDataCollectionArray.length;
                expiredItemDataCollectionArray.push({storageType: storageType, dataArray: []});	
            }
            /////

            //Push an object containing dataItemKey and locationDataStr on to the array of such data-describing
            //objects inside the object in expiredItemDataCollectionArray linked to storageType 
            expiredItemDataCollectionArray[storageTypeIndex].dataArray.push({key: dataItemKey, locationDataStr: locationDataStr});		
        }
    }
    /////

    return expiredItemDataCollectionArray;
}



/**
* Removes data items from the supported storage facilities that are
* regarded as expired by related metadata, as well as said metadata.

* @param dataItemRemovalArgObj      an optional object containing properties to be utilized by the 
*                                   sub-operation responsible for removing expired data items 
*/
function removeExpired(dataItemRemovalArgObj)
{
    //Will dictate the course and nuances of the operation. Items with 
    //expiration times less than or equal to this value are considered expired
    var operationStartTimeMillis = new Date().getTime();

    //Will be used to sequentially check for expiration data in the
    //storage facilities named in expirationDataAptStorageTypesArray
    var i = 0;
    var currentStorageType;

    //Assure dataItemRemovalArgObj is of the form that this function expects and is capable of handling
    if(!dataItemRemovalArgObj) 			dataItemRemovalArgObj = {};
    if(!dataItemRemovalArgObj.options) 	dataItemRemovalArgObj.options = {};
    /////

    //Map removeComplete to dataItemRemovalArgObj's complete property. This will allow 
    //removeComplete to be executed immediately after the conclusion of any data item removal
    //operations spawned by this operation (all of which will utilize dataItemRemovalArgObj)
    dataItemRemovalArgObj.complete = removeComplete;

    //Will contain objects each consisting of a storage type and and an array of objects describing
    //data items with expiration times less than or equal to operationStartTimeMillis
    var expiredItemDataCollectionArray = [];

    var j = 0;		//will be used to sequentially process the the objects inside expiredItemDataCollectionArray
    var k = 0;		//will be used to sequentially process the objects in the member array of each object in expiredItemDataCollectionArray

    //Will contain objects each consisting of a storage type and an array of objects
    //describing data items removed from the storage type by this operation
    var removedItemDataCollectionArray = [];

    var storageTypeCategoryToDataEntityObj = {
        database :  "valueObj.expirationTimeMillis <= " + operationStartTimeMillis,
        nonDatabase: [expirationDataRepositoryName]
    }

    var storageTypeCategoryToOperationTypeObj = {
        database: "getAll",
        nonDatabase: "get"
    };

    /**
    * Procures objects each containing the name of a storage facility and a collection of 
    * Strings keying expired items in that facility from expiration-related metadata.

    * @param expirationDataItemArray        a homogenous Array of Objects each containing consisting of the  key of  a data item, the
    *                                       storage facility that contains it, subsidiary data pinpointing the location inside the
    *                                       storage facility the data item is located and (optionally) the time instant the item is set to expire
    * @param fromDatabase                   a boolean denoting whether {@code expirationDataItemArray} 
                                            was procured from a database-type storage facility 
    * @return                               an Array of Objects each consisting of the name of a storage facility appearing in at
                                            least one Object in {@code expirationDataItemArray}, and an array of Objects  
                                            each containing data describing an expired item in that storage facility 
    */
    function procureByStorageTypeExpiredItemData(expirationDataItemArray, fromDatabase)
    {
        var storageTypeToIndexObj = {};
        var expiredItemDataCollectionArray = [];

        //Loop through the objects in expirationDataItemArray, extracting the data item key,
        //location data, and storage type contained each, and placing the former two in to   
        //the array in the object in expiredItemDataCollectionArray related to the latter.
        var dataItemCount = expirationDataItemArray.length;
        for(var i = 0; i < dataItemCount; i++)
        {
            var currentDataObj = expirationDataItemArray[i];
            var currentDataItemIdentifyingStr = (fromDatabase ? currentDataObj.key : currentDataObj);
            var currentKeyComponentArray = currentDataItemIdentifyingStr.split("_");

            //Procure the expiration time of the data item described by currentDataItemIdentifyingStr. If a database was the source of 
            //the items in expirationDataItemArray, then the items were retrieved conditionally and the array only contains the data  
            //of expired stored items; we assign expirationTimeMillis to an arbitrary negative number in this case
            var expirationTimeIndex = currentKeyComponentArray.length - (fromDatabase ? 0 : 1);
            var expirationTimeMillis = (fromDatabase ? Number.NEGATIVE_INFINITY : currentKeyComponentArray[expirationTimeIndex]);
            /////

            if(expirationTimeMillis <= operationStartTimeMillis)
            {
                //Extract the key, containing storage facility, and subsidiary location data 
                //of the data item that is described by currentDataItemIdentifyingStr
                var dataItemKey = decodeExpirationDataItemComponent(currentKeyComponentArray[0]);										
                var storageType = currentKeyComponentArray[1];
                var locationDataStr = currentKeyComponentArray[2];
                /////

                //Get the index in expiredItemDataCollectionArray which stores the object containing
                //the array of Objects each consisting of data describing expired data item in storageType
                var storageTypeIndex = storageTypeToIndexObj[storageType];

                //If such an object hasn't been created, create it
                if(storageTypeIndex === undefined)
                {
                    storageTypeIndex = storageTypeToIndexObj[storageType] = expiredItemDataCollectionArray.length;
                    expiredItemDataCollectionArray.push({storageType: storageType, dataArray: []});	
                }
                /////

                //Push an object containing dataItemKey and locationDataStr on to the array of such data-describing
                //objects inside the object in expiredItemDataCollectionArray linked to storageType 
                expiredItemDataCollectionArray[storageTypeIndex].dataArray.push({key: dataItemKey, locationDataStr: locationDataStr});		
            }
        }
        /////

        return expiredItemDataCollectionArray;
    }

   /**
    * Removes the expired data item described in the next object
    * to be processed in {@code expiredItemDataCollectionArray}.
    */
    function removeExpiredDataItem()
    {
        var curExpiredItemDataCollectionObj = expiredItemDataCollectionArray[j];
        var curStorageType = curExpiredItemDataCollectionObj.storageType;

        var curExpiredItemDataObj = curExpiredItemDataCollectionObj.dataArray[k];

        if(!dataItemRemovalArgObj.options[curStorageType]) dataItemRemovalArgObj.options[curStorageType] = {};
        var locationDataObj = storageOperationFuncObj[curStorageType].createLocationDataObj(curExpiredItemDataObj.locationDataStr);
        copyObjectProperties(dataItemRemovalArgObj.options[curStorageType],  [locationDataObj]);

        //Conduct a removal operation using the data extracted from curExpiredItemDataObj. dataItemRemovalArgObj had its  
        //complete() function assigned to removeComplete(); processing will continue there after the removal has concluded
        dataItemRemovalArgObj.storageTypes = [curStorageType];
        
        if(curStorageType !== "webSQL")
        {
            dataItemRemovalArgObj.data = [curExpiredItemDataObj.key];
            remove(dataItemRemovalArgObj);	
        }
        else
        {
            dataItemRemovalArgObj.filter = curExpiredItemDataObj.key;
            removeAll(dataItemRemovalArgObj);	
        }
        /////
    }

   /**
    * Progresses the expired data removal operation upon completion of 
    * an expiration data retrieval or previous removal sub-operation.
   
    * @param processedItemCount     an int denoting the number of items processed by the invoking sub-operation
    * @param error                  an Object representing and identifying the error spawned by, 
    *                               and responsible for the conclusion of, the invoking sub-operation
    */
    function removeComplete(processedItemCount, error)
    {
        var canConclude = true;

        if(!error)
        {
            //Obtain handles to the currently processing expired item data collection and expired item data object in it
            var expiredItemDataCollectionObj = expiredItemDataCollectionArray[j];
            var curExpiredItemDataObj = expiredItemDataCollectionObj.dataArray[k];
            /////

            //If currentExpiredItemDataObj was the first object to be processed in its collection,
            //create an object in removedItemCollectionArray for the collection, which will contain
            //the data of items represented in the collection that were removed from the store
            if(k === 0) removedItemDataCollectionArray.push({storageType: expiredItemDataCollectionObj.storageType, dataArray: []});

            //Get a handle to the object in removedItemDataCollectionArray that is related to expiredItemDataCollectionObj, and push currentExpiredItemDataObj 
            //on to the array contained in it (this array represents expired data items which have been removed from the related store)
            removedItemDataCollectionArray[removedItemDataCollectionArray.length - 1].dataArray.push(curExpiredItemDataObj);

            //Update the item removal processing indices so that they can collectively
            //be used to point to the next unprocessed expired data-item describing object
            if(++k >= expiredItemDataCollectionObj.dataArray.length) 
            {
                ++j;
                k = 0;
            }
            /////

            //If there is at least one expired data-item describing object left to process,  
            //do so after marking the over-arching removal operation incomplete
            if(j < expiredItemDataCollectionArray.length)
            {
                canConclude = false;
                removeExpiredDataItem();
            }
            /////
        }
        
        if(canConclude)	removeExpirationData(removedItemDataCollectionArray, currentStorageType);
    }

   /**
    * Progresses the expired data removal operation upon completion an expiration metadata retrieval sub-operation.
    
    * @param processedItemCount     an int denoting the number of items processed by the invoking sub-operation
    * @param operationResultObj     the Object produced as a result of the invoking sub-operation
    * @param error                  an optional Object representing and invoking an error spawned by, 
    *                               and responsible for the conclusion of the invoking storage operation
    */
    function getExpirationDataComplete(processedItemCount, operationResultObj, error)
    {
        var isSuccessful = !error;

        if(isSuccessful)
        {
            var isGetAll = (operationResultObj instanceof Array);

            //If the operation was conducted on a non-database storage type (and thus retrieved a data blob),
            //tokenize the blob in to an array of individual expiration data item Strings so both database
            //and non-database operation results can be processed with the same function
            if(!isGetAll) 
                operationResultObj = (operationResultObj[expirationDataRepositoryName] ? operationResultObj[expirationDataRepositoryName].split("|") : []);
            
            if(operationResultObj.length > 0)
            {
                expiredItemDataCollectionArray = procureByStorageTypeExpiredItemData(operationResultObj, isGetAll);
                removeExpiredDataItem();
            }
        }

        if(!isSuccessful)
        {
            ++i;
            run();
        }
    }

   /**
    * Commences an operation to remove expiration metadata related to expired 
    * persisted items as well as the persisted items themselves.
    */
    function run()
    { 
        if(i < expirationDataAptStorageTypesArray.length)
        {
            currentStorageType = expirationDataAptStorageTypesArray[i];
            conductExpirationDataStorageOperaton(currentStorageType, storageTypeCategoryToOperationTypeObj, storageTypeCategoryToDataEntityObj, getExpirationDataComplete);
        }
    }

    run();
    return this;
}



/******************************Test functions**********************************/



var testNum = new Number(Math.random() * Number.MAX_VALUE).toPrecision(15).valueOf();
var testNumObj = new Number(Math.random() * Number.MAX_VALUE).toPrecision(15);

var testStr = "()<>@,;:<>/[]?={}";
var testDateObj = new Date();

var testObj = {num: testNum, numObj: testNumObj, str: testStr, dateObj: testDateObj};
var testArr = [testNum, testNumObj, testStr, testDateObj, testObj];


/*
//encodeExpirationDataItemComponent test
(function(){
    
    var testObjArray = [
        {str: "", expectedResultStr: ""},
        {str: ".", expectedResultStr: "%2e"},
        {str: "_", expectedResultStr: "%5f"},
        {str: "|", expectedResultStr: "%7c"},
        {str: "abc", expectedResultStr: "abc"},
        {str: "a.b_c|", expectedResultStr: "a%2eb%5fc%7c"},
        {str: ".a_b|c", expectedResultStr: "%2ea%5fb%7cc"}
    ];

    var testFunc = function(assert){
        
        for(var i = 0; i < testObjArray.length; i++)
        {
            var currentTestObj = testObjArray[i];
            assert.strictEqual(encodeExpirationDataItemComponent(currentTestObj.str), currentTestObj.expectedResultStr);
        }
    }
    
    QUnit.test("encodeExpirationDataItemComponent", testFunc);
})()
*/


//decodeExpirationDataItemComponent test
(function(){
    
    var testObjArray = [
        {str: "", expectedResultStr: ""},
        {str: "%2e", expectedResultStr: "."},
        {str: "a%5f", expectedResultStr: "a_"},
        {str: "ab%7c", expectedResultStr: "ab|"},
        {str: "abc%2e", expectedResultStr: "abc."},
        {str: "%2e%2e%5f%5f%7c%7c", expectedResultStr: "..__||"},
        {str: "%2%2e%5f%5%7c%%7", expectedResultStr: "%2._%5|%%7"},
        {str: "abcdefg", expectedResultStr: "abcdefg"}
    ];

    var testFunc = function(assert){
        
        for(var i = 0; i < testObjArray.length; i++)
        {
            var currentTestObj = testObjArray[i];
            assert.strictEqual(decodeExpirationDataItemComponent(currentTestObj.str), currentTestObj.expectedResultStr);
        }
    }
    
    QUnit.test("decodeExpirationDataItemComponent", testFunc);
})()



function createItemDataCollectionObj(storageType, keyArray, locationDataStrArray, expirationTimeMillisArray)
{
    var isLocationDataPresent = !!locationDataStrArray;
    var isExpirationTimeDataPresent = !!expirationTimeMillisArray;
    
    
    var itemDataCollectionObj = {storageType: storageType, dataArray: []};
    
    for(var i = 0; i < keyArray.length; i++)
    {
        var currentItemDataObj = {key: keyArray[i]};
        
        if(isLocationDataPresent && i < locationDataStrArray.length)
            currentItemDataObj.locationDataStr = locationDataStrArray[i];
        
        if(isExpirationTimeDataPresent && i < expirationTimeMillisArray.length)
            currentItemDataObj.expirationTimeMillis = expirationTimeMillisArray[i];
        
        itemDataCollectionObj.dataArray.push(currentItemDataObj);
    }
    
    
    return itemDataCollectionObj;
}


/*
//createExpirationDataArray test
(function(){

    var expirationDataKeyToTimeObj = {};
    var storageTypeStrBase = "storageType";
    var locationDataStrBase = "locationData";
    
    var createStorageTypeUniqueComponent = function(index){return index};
    var createLocationDataUniqueComponent = function(index){return index};
    var createExpirationTimeMillis = function(index){return index};

    var createItemDataCollectionObjArray = function(collectionSize, includeLocationData, includeExpirationTimeMillis){
        
        var itemDataCollectionObjArray = [];
        
        for(var i = 0; i < collectionSize; i++)
        {
            var currentStorageTypeStr = storageTypeStrBase + createStorageTypeUniqueComponent(i);
            var locationDataStrArray = (includeLocationData ? [] : null);
            var expirationTimeMillisArray = (includeExpirationTimeMillis ? [] : null);
            
            for(var j = 0; j < testArr.length; j++)
            {
                var currentDataItemKey = encodeExpirationDataItemComponent(testArr[j]);
                var currentExpirationDataItemKey = currentDataItemKey + "_" + currentStorageTypeStr;
                
                var currentLocationDataStr;
                var currentExpirationDataStr;

                if(includeLocationData)
                {
                    currentLocationDataStr = locationDataStrBase + createLocationDataUniqueComponent(j);
                    currentExpirationDataItemKey += "_" + currentLocationDataStr;
                    locationDataStrArray.push(currentLocationDataStr);
                }
                
                if(includeExpirationTimeMillis)
                {
                    currentExpirationDataStr = createExpirationTimeMillis(j);
                    expirationTimeMillisArray.push(currentExpirationDataStr);
                }
                
                expirationDataKeyToTimeObj[currentExpirationDataItemKey] = (currentExpirationDataStr !== undefined ? currentExpirationDataStr : true);
            }
           
            itemDataCollectionObjArray.push(createItemDataCollectionObj(currentStorageTypeStr, testArr, locationDataStrArray, expirationTimeMillisArray));
        }
        
        return itemDataCollectionObjArray;
    }

    var testFunc = function(assert){
       
       var testCount = 3;
     
       for(var i = 0; i < testCount; i++)
       {
           var includeExpirationTimeMillis = !!i;
           var itemDataCollectionObjArray = createItemDataCollectionObjArray(i, true, includeExpirationTimeMillis);
           
           var expirationDataArray = createExpirationDataArray(itemDataCollectionObjArray, includeExpirationTimeMillis);

           for(var j = 0; j < expirationDataArray.length; j++)
           {
               var actualExpirationDataObj = expirationDataArray[j];
               var curExpirationDataItemKey = actualExpirationDataObj;
               var curExpirationDataItemValue = true;
               
               if(includeExpirationTimeMillis)
               {
                    curExpirationDataItemKey = curExpirationDataItemKey.key; 
                    curExpirationDataItemValue = actualExpirationDataObj.expirationTimeMillis;
                }
                
               if(expirationDataKeyToTimeObj[curExpirationDataItemKey] === curExpirationDataItemValue)
                   delete expirationDataKeyToTimeObj[curExpirationDataItemKey];
               else
                   break;               
           }
           
           var unmatchedKeyCount = 0;
           for(var key in expirationDataKeyToTimeObj) unmatchedKeyCount++;
           
           assert.strictEqual(unmatchedKeyCount, 0);
       }
    }
    
    QUnit.test("createExpirationDataArray", testFunc);
})()
*/



function createExpirationDataItemArray(itemType, storageType, keyArray, locationDataStrArray, expirationTimeMillisArray)
{
    var createStringItems = (itemType === "string");
    var expirationDataItemArray  = [];

    for(var i = 0; i < keyArray.length; i++)
    {
        var storageTypeComponent = "_" + storageType;
        var locationDataComponent = (locationDataStrArray && i < locationDataStrArray.length ? "_" + locationDataStrArray[i] : "");
        var expirationTimeMillisComponent = (expirationTimeMillisArray && i < expirationTimeMillisArray.length ? "_" + expirationTimeMillisArray[i] : "");
        
        var currentExpirationDataStr = encodeExpirationDataItemComponent(keyArray[i]) + storageTypeComponent + locationDataComponent + expirationTimeMillisComponent;
        
        var expirationDataEntity = (createStringItems ? currentExpirationDataStr : {key: currentExpirationDataStr});
        expirationDataItemArray.push(expirationDataEntity)
    }
    
    return expirationDataItemArray;
}




/*
//updateSerializedExpirationData test
(function(){

    var storageTypeStrBase = "storageType";
    var locationDataStrBase = "locationDataStr";

    var testCount = 3;
    var expirationDataBlobArray = [];
    
    var wasNullTestBlobCreated = false;
    for(var i = 0; i < testCount; i++)
    {
        var currentStorageType = storageTypeStrBase + i;
        
        var currentTestArr = testArr.slice(0,i);
        var currentLocationDataStrArray = [];
        var currentExpirationTimeMillisArray = [];
        
        if(wasNullTestBlobCreated)
        {
            for(var j = 0; j < currentTestArr.length; j++)
            {
                currentLocationDataStrArray.push(locationDataStrBase + j);
                currentExpirationTimeMillisArray.push(j);
            }

            var expirationDataItemStrArray = createExpirationDataItemArray("string", currentStorageType, currentTestArr, currentLocationDataStrArray, currentExpirationTimeMillisArray);
            expirationDataBlobArray.push(expirationDataItemStrArray.join("|"));
        }
        else
        {
            expirationDataBlobArray.push(null);
            wasNullTestBlobCreated = true;
            i--;
        }
    }
        
    
    var testFunc = function(assert){
        var dataItemIsPresent = false;
       
        var expirationDataExistingItemModFunc = function(){ assert.strictEqual(true, dataItemIsPresent); };
        var expirationDataAbsentItemModFunc =   function(){ assert.strictEqual(false, dataItemIsPresent); };
        var modCompleteCallback = function(){};
        
        for(var i = 0; i < expirationDataBlobArray.length; i++)
        {
            var currentExpirationDataBlob = expirationDataBlobArray[i];
            var currentStorageType = storageTypeStrBase + i;

            for(var j = 0; j < testArr.length; j++)
            {
                var currentKey = testArr[j];
                var currentItemDataObj = {key: currentKey, locationDataStr: locationDataStrBase + j};
                var dummyItemDataCollectionObjArray = [{storageType: currentStorageType, dataArray: [currentItemDataObj]}];
                
                dataItemIsPresent = (j < i);

                updateSerializedExpirationData(currentExpirationDataBlob, dummyItemDataCollectionObjArray, 
                    expirationDataExistingItemModFunc, expirationDataAbsentItemModFunc, modCompleteCallback);
            }
        }
    };
    
    QUnit.test("updateSerializedExpirationData", testFunc);
})()
*/



var nonDatabaseExpirationDataAptStorageTypesArray = ["userData", "fileSystem"];
var databaseExpirationDataAptStorageTypesArray = ["webSQL", "indexedDB"];

var expirationDataAptStorageTypesArrayContainerArray = [
    nonDatabaseExpirationDataAptStorageTypesArray,
    databaseExpirationDataAptStorageTypesArray
];

var expirationDataAptStorageTypesArray;
var expirationDataRepositoryName = "Baked_Goods_Expiration_Data";
var keyValuePairsObjContainerObj = {fileSystem: {}, indexedDB:{}};
var unsupportedStorageTypeAccessCountObj = {userData: 0, webSQL: 0};

function procureStorageTypeOptions(storageType, specifiedOptionsObj){return {};}

function createLocationDataObj(locationDataStr){ return {}; };
function copyObjectProperties(recipientObj, donorObjArray){};

function setExpirationDataBlob(storageType, expirationDataBlob, complete)
{
    var expirationDataKeyValueObj = {key: expirationDataRepositoryName, value: expirationDataBlob};
    var keyValuePairsObj = keyValuePairsObjContainerObj[storageType];
    setInternal([expirationDataKeyValueObj], {}, complete, keyValuePairsObj);
}

function remove(argObj)
{
    var keyValuePairsObj = keyValuePairsObjContainerObj[argObj.storageTypes[0]];
    
    if(keyValuePairsObj.hasOwnProperty("itemData")) keyValuePairsObj = keyValuePairsObj["itemData"];
    removeInternal(argObj.data, argObj.options, argObj.complete, keyValuePairsObj);
}


function setInternal(dataArray, optionsObj, complete, keyValuePairsObj)
{   
    for(var i = 0; i < dataArray.length; i++)
        keyValuePairsObj[dataArray[i].key] = dataArray[i]["value"];
    
    complete(dataArray.length);
}

function getInternal(keyArray, optionsObj, complete, keyValuePairsObj)
{
    var resultsObj = {};
    
    for(var i = 0; i < keyArray.length; i++)
    {
        var curValue = keyValuePairsObj[keyArray[i]];
        resultsObj[keyArray[i]] = (curValue === undefined ? null : curValue);
    }

    complete(keyArray.length, resultsObj);
}

function removeInternal(keyArray, optionsObj, complete, keyValuePairsObj)
{
    for(var i = 0; i < keyArray.length; i++)
        delete keyValuePairsObj[keyArray[i]];
    
    complete(keyArray.length);
}


function getAllInternal(filterStr, optionsObj, complete, keyValuePairsObj)
{
    var resultsArr = [];

    for(var keyObj in keyValuePairsObj)
    {
        var valueObj = keyValuePairsObj[keyObj];
        if(eval(filterStr) === true)
            resultsArr.push(valueObj === undefined ? null : valueObj);
    }
    
    return complete(resultsArr.length, resultsArr); 
}

function curryStorageOperationFunc(storageType, operationType, getKeyValuePairsObj)
{
    var storageOperationFunc;
    switch(operationType)
    {
        case "set":       storageOperationFunc = setInternal;     break;
        case "get":       storageOperationFunc = getInternal;     break;
        case "remove":    storageOperationFunc = removeInternal;  break;
        case "getAll":    storageOperationFunc = getAllInternal;  break;
        default:                                          break;
    }
    
    return function(){
        var keyValuePairsObj = (getKeyValuePairsObj ? getKeyValuePairsObj() : keyValuePairsObjContainerObj[storageType]);
        Array.prototype.push.call(arguments, keyValuePairsObj); 
        storageOperationFunc.apply(window, arguments);
    }
}

var storageOperationFuncObj = {
    
    userData: {
        set: function(dataArray, optionsObj, complete){unsupportedStorageTypeAccessCountObj.userData++; return complete(0, {name: "UnsupportedError"})},
        get: function(keyArray, optionsObj, complete){unsupportedStorageTypeAccessCountObj.userData++; return complete(0, {}, {name: "UnsupportedError"})},
        remove: function(keyArray, optionsObj, complete){unsupportedStorageTypeAccessCountObj.userData++; return complete(0, {name: "UnsupportedError"})},
        createLocationDataObj: createLocationDataObj
    },
    webSQL: {
        set: function(dataArray, optionsObj, complete){unsupportedStorageTypeAccessCountObj.webSQL++; return complete(0, {name: "UnsupportedError"})},
        get: function(keyArray, optionsObj, complete){unsupportedStorageTypeAccessCountObj.webSQL++; return complete(0, {}, {name: "UnsupportedError"})},
        remove: function(keyArray, optionsObj, complete){unsupportedStorageTypeAccessCountObj.webSQL++; return complete(0, {name: "UnsupportedError"})},
        getAll: function(filterSr, optionsObj, complete){unsupportedStorageTypeAccessCountObj.webSQL++; return complete(0, [], {name: "UnsupportedError"})},
        createLocationDataObj: createLocationDataObj
    },
    fileSystem: {
        set: curryStorageOperationFunc("fileSystem", "set"),
        get: curryStorageOperationFunc("fileSystem", "get"),
        remove: curryStorageOperationFunc("fileSystem", "remove"),
        createLocationDataObj: createLocationDataObj
    },
    indexedDB: {
        set: curryStorageOperationFunc("indexedDB", "set"),
        get: curryStorageOperationFunc("indexedDB", "get"),
        remove: curryStorageOperationFunc("indexedDB", "remove"),
        getAll: curryStorageOperationFunc("indexedDB", "getAll"),
        createLocationDataObj: createLocationDataObj
    }
};

function getStorageTypeCategory(storageType)
{
    return (storageType === "indexedDB" || storageType === "webSQL" ? "database" : "nonDatabase");
}

function getFirstSupportedStorageTypeData(storageTypesArray)
{    
    var firstSupportedStorageType;
    for(var i = 0; i < storageTypesArray.length && !firstSupportedStorageType; i++)
    {
        var currentStorageType = storageTypesArray[i];
        if(keyValuePairsObjContainerObj.hasOwnProperty(currentStorageType))
            firstSupportedStorageType = currentStorageType;
    }
    
    return {
        type: firstSupportedStorageType,
        category: getStorageTypeCategory(currentStorageType)
    };
}

function arePrecedingSupportedStorageTypes(unsupportedStorageTypeIndex)
{
    var arePrecedingSupportedStorageTypesBool = false;  
    for(var i = 0; i < unsupportedStorageTypeIndex && !arePrecedingSupportedStorageTypesBool; i++)
    {
        if(keyValuePairsObjContainerObj.hasOwnProperty(expirationDataAptStorageTypesArray[i]))
            arePrecedingSupportedStorageTypesBool = true;
    }

    return arePrecedingSupportedStorageTypesBool;
}

function clearStorageTypeRelatedData()
{
    for(var storageType in keyValuePairsObjContainerObj)
        keyValuePairsObjContainerObj[storageType] = {};

    for(var storageType in unsupportedStorageTypeAccessCountObj)
        unsupportedStorageTypeAccessCountObj[storageType] = 0;  
}


/*
//recordExpirationData test
(function(){
    
    var storageType = "storageType";
    var locationDataStrBase = "locationDataStr";
    
    var locationDataStrArray = [];
    var expirationTimeMillisArray = [];
    for(var i = 0; i < testArr.length; i++) 
    {
        locationDataStrArray.push(locationDataStrBase + i);
        expirationTimeMillisArray.push(i);
    }

    var itemDataCollectionObj = createItemDataCollectionObj(storageType, testArr, locationDataStrArray, expirationTimeMillisArray);
    
    var testFunc = function(assert){
        
        for(var i = 0; i < expirationDataAptStorageTypesArrayContainerArray.length; i++)
        {
            expirationDataAptStorageTypesArray = expirationDataAptStorageTypesArrayContainerArray[i];
            
            for(var j = 0; j < expirationDataAptStorageTypesArray.length; j++)
            {
                if(j > 0) expirationDataAptStorageTypesArray.push(expirationDataAptStorageTypesArray.shift());
                
                recordExpirationData([itemDataCollectionObj]);
            
                for(var k = 0; k < expirationDataAptStorageTypesArray.length; k++)
                {
                    var currentStorageType = expirationDataAptStorageTypesArray[k];

                    if(keyValuePairsObjContainerObj.hasOwnProperty(currentStorageType))
                    {
                        var storageTypeCategory = getStorageTypeCategory(currentStorageType);   
                        var currentKeyValuePairsObj = keyValuePairsObjContainerObj[currentStorageType];

                        if(storageTypeCategory === "nonDatabase")
                        {
                            var expirationDataItemStrArray = currentKeyValuePairsObj[expirationDataRepositoryName].split("|");

                            currentKeyValuePairsObj = {};

                            for(var m = 0; m < expirationDataItemStrArray.length; m++)
                            {
                                var currentExpirationDataItemComponentArray = expirationDataItemStrArray[m].split("_");

                                var currentExpirationDataKey = currentExpirationDataItemComponentArray.slice(0,3).join("_");
                                var currentExpirationTimeMillis = currentExpirationDataItemComponentArray[3];
                                currentKeyValuePairsObj[currentExpirationDataKey] = currentExpirationTimeMillis;
                            }
                        }

                        var itemCollectionContainerStorageType = itemDataCollectionObj.storageType;
                        var itemDataObjArray = itemDataCollectionObj.dataArray;

                        for(var m = 0; m < itemDataObjArray.length; m++)
                        {
                            var currentItemDataObj = itemDataObjArray[m];
                            var expirationDataItemKey = encodeExpirationDataItemComponent(currentItemDataObj.key);
                            var currentItemLocationDataStr = currentItemDataObj.locationDataStr;
                            var currentItemExpirationTimeMillis = currentItemDataObj.expirationTimeMillis;

                            if(storageTypeCategory === "nonDatabase")
                            {
                                expirationDataItemKey = escapeRegexSpecialChars(expirationDataItemKey);
                                currentItemLocationDataStr = escapeRegexSpecialChars(currentItemLocationDataStr);
                            }

                            var expectedExpirationDataItemKey = expirationDataItemKey + "_" + itemCollectionContainerStorageType + "_" + currentItemLocationDataStr;
                            assert.equal(currentKeyValuePairsObj[expectedExpirationDataItemKey], currentItemExpirationTimeMillis);
                        }
                    }
                    else
                    { 
                        var expectedAccessCount = (arePrecedingSupportedStorageTypes(j) ? 0 : 1);
                        assert.strictEqual(unsupportedStorageTypeAccessCountObj[currentStorageType], expectedAccessCount);
                    }   
                }
                
                clearStorageTypeRelatedData();
            }
        }

    }
 
    QUnit.test("recordExpirationData", testFunc);
})()
*/



/*
//removeExpirationData test
(function(){
    
    var storageType = "storageType";
    var locationDataStrBase = "locationDataStr";
    
    var locationDataStrArray = [];
    var expirationTimeMillisArray = [];
    for(var i = 0; i < testArr.length; i++) 
    {
        locationDataStrArray.push(locationDataStrBase + i);
        expirationTimeMillisArray.push(i);
    }

    var itemDataCollectionObj = createItemDataCollectionObj(storageType, testArr, locationDataStrArray, expirationTimeMillisArray);
    var databaseSetOpDataArray = [];
    var expirationDataItemBlob = "";
    
    for(var i = 0; i < itemDataCollectionObj.dataArray.length; i++)
    {
        var currentDataObj = itemDataCollectionObj.dataArray[i];
        
        var currentDataItemKey = currentDataObj.key;
        var currentEncodedDataItemKey = encodeExpirationDataItemComponent(currentDataItemKey);
       
        var nonDatabaseExpirationDataItemKey = currentEncodedDataItemKey + "_" + storageType + "_" + currentDataObj.locationDataStr;
        expirationDataItemBlob += ((i === 0 ? "" : "|") + nonDatabaseExpirationDataItemKey + "_" + currentDataObj.expirationTimeMillis);
        
        var databaseExpirationDataItemKey =  currentDataItemKey + "_" + storageType + "_" + currentDataObj.locationDataStr;
        databaseSetOpDataArray.push({key:databaseExpirationDataItemKey , expirationTimeMillis: currentDataObj.expirationTimeMillis});       
    }
    
    var testFunc = function(assert){
        
        for(var i = 0; i < expirationDataAptStorageTypesArrayContainerArray.length; i++)
        {
            expirationDataAptStorageTypesArray = expirationDataAptStorageTypesArrayContainerArray[i];
            
            for(var j = 0; j < expirationDataAptStorageTypesArray.length; j++)
            {
                if(j > 0) expirationDataAptStorageTypesArray.push(expirationDataAptStorageTypesArray.shift());
               
                var firstSupportedStorageTypeDataObj = getFirstSupportedStorageTypeData(expirationDataAptStorageTypesArray);
                var firstSupportedStorageType = firstSupportedStorageTypeDataObj.type;
                var firstSupportedStorageTypeCategory = firstSupportedStorageTypeDataObj.category;

                if(firstSupportedStorageTypeCategory === "database")
                    setInternal(databaseSetOpDataArray, {}, function(){}, keyValuePairsObjContainerObj[firstSupportedStorageType], true); 
                else
                    setInternal([{key: expirationDataRepositoryName, value: expirationDataItemBlob}], {}, function(){}, keyValuePairsObjContainerObj[firstSupportedStorageType], false);
                    
                removeExpirationData([itemDataCollectionObj]);
                
                
                for(var k = 0; k < expirationDataAptStorageTypesArray.length; k++)
                {
                    var currentStorageType = expirationDataAptStorageTypesArray[k];

                    if(keyValuePairsObjContainerObj[currentStorageType])
                    {
                        var currentStorageTypeCategory = getStorageTypeCategory(currentStorageType);
                        var currentKeyValuePairsObj = keyValuePairsObjContainerObj[currentStorageType];

                        if(currentStorageTypeCategory === "database")
                        {
                            var expirationDataItemCount = 0;

                            for(var key in currentKeyValuePairsObj) expirationDataItemCount++;

                            assert.strictEqual(expirationDataItemCount, 0);
                        }
                        else
                            assert.strictEqual(currentKeyValuePairsObj[expirationDataRepositoryName], "");
                    }
                    else
                    { 
                        var expectedAccessCount = (arePrecedingSupportedStorageTypes(k) ? 0 : 1);
                        assert.strictEqual(unsupportedStorageTypeAccessCountObj[currentStorageType], expectedAccessCount);
                    }   
                }
                
                clearStorageTypeRelatedData();
            }
        }
    }
    
    QUnit.test("removeExpirationData", testFunc);
})()
*/


function shuffleArray(array) 
{
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

/*
//procureByStorageTypeExpiredItemDataExternal test
(function(){

    var storageTypeStrBase = "storageType"
    var locationDataStrBase = "locationDataStr";

    var testItemTypeArray = ["string", "object"];
    var locationDataStrArray = [];
    var expirationTimeMillisArray = [];

    for(var j = 0; j < testArr.length; j++)
    {
        locationDataStrArray.push(locationDataStrBase + j);
        expirationTimeMillisArray.push(j);
    }
        
    var testFunc = function(assert){
        
        
        for(var i = 0; i < testItemTypeArray.length; i++)
        {
            var currentTestItemType = testItemTypeArray[i];
            var fromDatabase = (currentTestItemType === "object");

            for(var j = 1; j < 3; j++)
            {
                var expirationDataItemArray = [];
                var expirationDataItemKeyToTimeObj = {};
                
                for(var k = 0; k < j; k++)
                {
                    var currentStorageType = storageTypeStrBase + k;
                    shuffleArray(locationDataStrArray);
                    shuffleArray(expirationTimeMillisArray);

                    var currentExpirationDataItemArray =  createExpirationDataItemArray(currentTestItemType, currentStorageType, testArr, locationDataStrArray, expirationTimeMillisArray);
                    Array.prototype.push.apply(expirationDataItemArray,currentExpirationDataItemArray);

                    for(var m = 0; m < currentExpirationDataItemArray.length; m++)
                    {
                        var currentExpirationDataItem = currentExpirationDataItemArray[m];
                        var currentExpirationDataItemKey = (typeof currentExpirationDataItem === "object" ? currentExpirationDataItem.key : currentExpirationDataItem.split("_").slice(0,3).join("_"));
                        var currentExpirationTimeMillis = (typeof currentExpirationDataItem === "object" ? currentExpirationDataItem.expirationTimeMillis : currentExpirationDataItem.split("_")[3]);
                        
                        expirationDataItemKeyToTimeObj[currentExpirationDataItemKey] = currentExpirationTimeMillis;
                    }

                    var operationStartTimeMillis = Math.round(Math.random() * testArr.length);
                    var byStorageTypeExpiredItemDataArray = procureByStorageTypeExpiredItemDataExternal(expirationDataItemArray, fromDatabase, operationStartTimeMillis);

                    for(var m = 0; m < byStorageTypeExpiredItemDataArray.length; m++)
                    {
                        var expiredDataItemCollectionObj = byStorageTypeExpiredItemDataArray[m];
                        var expiredDataItemPossessingStorageType = expiredDataItemCollectionObj.storageType;

                        var expiredItemDataObjArray = expiredDataItemCollectionObj.dataArray;
                        for(var n = 0; n < expiredItemDataObjArray.length; n++)
                        {
                            var currentExpiredItemDataObj = expiredItemDataObjArray[n];
                            var currentExpiredDataItemKey = currentExpiredItemDataObj.key;

                            var currentExpiredDataItemLocationDataStr = currentExpiredItemDataObj.locationDataStr;

                            var currentExpirationDataItemKey = currentExpiredDataItemKey + "_" + expiredDataItemPossessingStorageType + "_" + currentExpiredDataItemLocationDataStr;
                            var currentExpirationTimeMillis = expirationDataItemKeyToTimeObj[currentExpirationDataItemKey];

                            var isExpired = (currentExpirationTimeMillis <= operationStartTimeMillis);
                            assert.ok(isExpired || fromDatabase);
                        }
                    } 
                }

            }
        }
    }
    
    QUnit.test("procureByStorageTypeExpiredItemDataExternal", testFunc);
})()
*/



/*
//removeExpired test
(function(){

    var storageType = "storageType";
    var locationDataStrBase = "locationDataStr";
    
    var locationDataStrArray = [];
    var expirationTimeMillisArray = [];

    for(var i = 0; i < testArr.length; i++) 
    {
        locationDataStrArray.push(locationDataStrBase + i);
        expirationTimeMillisArray.push(i);
    }

    function createTestDataArrays(storageTypesArray)
    {
        var expirationDataItemBlob = "";
        var expirationDataItemArray = [];
        var dataItemArray = [];
        
        for(var i = 0; i < storageTypesArray.length; i++)
        {
            var currentStorageType = storageTypesArray[i];
            var itemDataCollectionObj = createItemDataCollectionObj(currentStorageType, testArr, locationDataStrArray, expirationTimeMillisArray);
     
            for(var j = 0; j < itemDataCollectionObj.dataArray.length; j++)
            {
                var currentDataObj = itemDataCollectionObj.dataArray[j];
        
                var currentDataItemKey = currentDataObj.key;
                var currentExpirationTimeMillis = currentDataObj.expirationTimeMillis;

                var nonDatabaseExpirationDataItemKey = encodeExpirationDataItemComponent(currentDataItemKey) + "_" + currentStorageType + "_" + currentDataObj.locationDataStr;
                expirationDataItemBlob += ((expirationDataItemBlob.length === 0 ? "" : "|") + nonDatabaseExpirationDataItemKey + "_" + currentExpirationTimeMillis);

                var databaseExpirationDataItemKey =  currentDataItemKey + "_" +  currentStorageType + "_" + currentDataObj.locationDataStr;
                expirationDataItemArray.push({key:databaseExpirationDataItemKey , value: {key: databaseExpirationDataItemKey, expirationTimeMillis: currentExpirationTimeMillis}});  

                if(i === 0) dataItemArray.push({key: currentDataItemKey, value: ""});
            }
        }
        
        return {
            expirationDataItemBlob: expirationDataItemBlob,
            expirationDataItemArray: expirationDataItemArray,
            dataItemArray: dataItemArray
        }
    }
    
    function changeStorageOperationTargetStore(storageType, operationTypeArray, keyValuePairsObj)
    {
        var pertinentStorageOperationFuncObj = storageOperationFuncObj[storageType];
        var storeObjProcurementFunc = function(){return keyValuePairsObj};
        
        for(var i = 0; i < operationTypeArray.length; i++)
        {
            var currentOperationType = operationTypeArray[i];
            pertinentStorageOperationFuncObj[currentOperationType] = curryStorageOperationFunc(storageType, currentOperationType, storeObjProcurementFunc);
        }
    }

    
    var testFunc = function(assert){
        
        for(var i = 0; i < expirationDataAptStorageTypesArrayContainerArray.length; i++)
        {
            expirationDataAptStorageTypesArray = expirationDataAptStorageTypesArrayContainerArray[i];

            for(var j = 0; j < expirationDataAptStorageTypesArray.length; j++)
            {
                if(j > 0) expirationDataAptStorageTypesArray.push(expirationDataAptStorageTypesArray.shift());
                
                var firstSupportedStorageTypeDataObj = getFirstSupportedStorageTypeData(expirationDataAptStorageTypesArray);
                var firstSupportedStorageType = firstSupportedStorageTypeDataObj.type;
                var firstSupportedStorageTypeCategory = firstSupportedStorageTypeDataObj.category;

                var targetStorageTypeArray = [];
                var targetStoreObjArray = [];
                
                if(firstSupportedStorageTypeCategory === "database")
                {
                    var targetNonDatabaseStorageType = getFirstSupportedStorageTypeData(nonDatabaseExpirationDataAptStorageTypesArray).type;
                    targetStorageTypeArray = [firstSupportedStorageType, targetNonDatabaseStorageType];
                }
                else
                {
                    var targetDatabaseStorageType = getFirstSupportedStorageTypeData(databaseExpirationDataAptStorageTypesArray).type;
                    targetStorageTypeArray = [firstSupportedStorageType, targetDatabaseStorageType];
                }

                var wasNullBlobTestConducted = false;
                for(var k = 0; k <= targetStorageTypeArray.length; k++)
                {
                    var currentTargetStorageTypeSubArray = targetStorageTypeArray.slice(0,k);

                    var testDataArraysObj = createTestDataArrays(currentTargetStorageTypeSubArray);

                    var firstSupportedStorageTypeStoreObj = keyValuePairsObjContainerObj[firstSupportedStorageType];
                    
                    if(firstSupportedStorageTypeCategory === "database")
                    {
                        firstSupportedStorageTypeStoreObj.expirationData = {};
                        firstSupportedStorageTypeStoreObj.itemData = {};
                        changeStorageOperationTargetStore(firstSupportedStorageType, ["getAll", "remove"], firstSupportedStorageTypeStoreObj.expirationData);

                        targetStoreObjArray[0] = firstSupportedStorageTypeStoreObj.itemData;
                        targetStoreObjArray[1] = keyValuePairsObjContainerObj[targetStorageTypeArray[1]];
      
                        setInternal(testDataArraysObj.expirationDataItemArray, {}, function(){}, firstSupportedStorageTypeStoreObj.expirationData);
                    }
                    else
                    {
                        var targetDatabaseStorageTypeObj = keyValuePairsObjContainerObj[targetStorageTypeArray[1]];
                        targetDatabaseStorageTypeObj.expirationData = {};
                        targetDatabaseStorageTypeObj.itemData = {};
                        
                        targetStoreObjArray[0] = firstSupportedStorageTypeStoreObj;
                        targetStoreObjArray[1] = targetDatabaseStorageTypeObj.itemData;
                        
                        if(k === 0 && !wasNullBlobTestConducted)
                            k--;
                        else
                            setInternal([{key: expirationDataRepositoryName, value: testDataArraysObj.expirationDataItemBlob}], {}, function(){}, firstSupportedStorageTypeStoreObj); 
                    }
                    
                    for(var m = 0; m < currentTargetStorageTypeSubArray.length; m++)
                        setInternal(testDataArraysObj.dataItemArray, {}, function(){}, currentTargetStorageTypeSubArray[m]);
        
                    removeExpired();
                    
                    var expirationDataStoreObj = firstSupportedStorageTypeStoreObj;
                    var expectedExpirationDataStoreItemCount;
                    
                    if(firstSupportedStorageTypeCategory === "database")
                    {
                        expirationDataStoreObj = firstSupportedStorageTypeStoreObj.expirationData;
                        expectedExpirationDataStoreItemCount = 0;
                    }
                    else
                    {
                        if(!wasNullBlobTestConducted)
                        {
                            expectedExpirationDataStoreItemCount = 0;
                            assert.strictEqual(firstSupportedStorageTypeStoreObj[expirationDataRepositoryName], undefined);
                            wasNullBlobTestConducted = true;
                        }
                        else
                        {
                            expectedExpirationDataStoreItemCount = 1;
                            assert.strictEqual(firstSupportedStorageTypeStoreObj[expirationDataRepositoryName], "");
                        }
                    }
                        
                    var expirationDataStoreItemCount = 0
                    for(var key in expirationDataStoreObj) expirationDataStoreItemCount++;
                    assert.strictEqual(expirationDataStoreItemCount, expectedExpirationDataStoreItemCount);

                    
                    for(var m = 1; m < currentTargetStorageTypeSubArray.length; m++)
                    { 
                        var currentKeyValuePairsObj = targetStoreObjArray[m];
                        
                        var actualDataItemCount = 0;
                        for(var key in currentKeyValuePairsObj) actualDataItemCount++;

                        assert.strictEqual(actualDataItemCount, 0);
                    }

                    for(var m = 0; m < expirationDataAptStorageTypesArray.length; m++)
                    {
                        var currentStorageType = expirationDataAptStorageTypesArray[m];
                        if(!keyValuePairsObjContainerObj.hasOwnProperty(currentStorageType))
                        {
                            var expectedAccessCount = (arePrecedingSupportedStorageTypes(m) ? 0 : 1);
                            assert.ok(unsupportedStorageTypeAccessCountObj[currentStorageType] === expectedAccessCount);
                        }
                    }
                    
                    if(firstSupportedStorageTypeCategory === "database")
                        changeStorageOperationTargetStore(firstSupportedStorageType, ["getAll", "remove"], keyValuePairsObjContainerObj[firstSupportedStorageType]);

                    clearStorageTypeRelatedData();
                }
                    
            }
        }
    }
    
    QUnit.test("removeExpired", testFunc);
})()
*/

//Code shortcuts where necessary
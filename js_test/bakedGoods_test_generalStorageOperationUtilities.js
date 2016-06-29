var defaultStorageTypeOptionsObj = {
    cookie:{
        domain: null,
        path: null,
        isSecure: false
    },
    userData:{
        storeName: "Baked_Goods",
        locusElement: null,
        useBodyAsBackup: true
    },
    globalStorage: {
        domain: null
    },
    webSQL: {
        databaseName: "Baked_Goods",
        databaseDisplayName: "Baked Goods",
        databaseVersion: "",
        estimatedDatabaseSize: 1024 * 1024,
        tableData: {name: "Main", keyColumnName: "key", columnDefinitions: "(key TEXT PRIMARY KEY, value TEXT)"}, 
        tableIndexDataArray: []
    },
    indexedDB: {
        databaseName: "Baked_Goods",
        databaseVersion: 1,
        objectStoreData: {name: "Main", keyPath: null, autoIncrement: false},
        objectStoreIndexDataArray: [],
        closeConnection: false
    },
    fileSystem:{
        storageType: window.TEMPORARY,
        size: 1024 * 1024,
        directoryPath: "/",

        //Set operation pertinent options
        startPosition: 0,      //Number.MAX_VALUE represents "one past" the last byte of the file

        truncateBeforeWrite: true,
        truncatePosition: 0,   //Number.MAX_VALUE represents "one past" the last byte of the file

        writeOnlyIfAbsent: false,
        realizeDirectoryPath: false,
        /////

        //Get operation pertinent options,
        dataFormat: "text",
        dataEncoding: null,
        /////

        //Get/Remove all pertinent options
        recursive: true,
        removeDirectories: true,
        removeTargetDirectory: true
        /////
    },
    flash:{
        swfPath: "ext_bin/BakedGoods.swf",

        lsoName: "Baked_Goods",
        lsoPath: null,

        elementID: "bakedGoods",
        elementParent: document.body,
        elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;",

        allowScriptAccess: "sameDomain"
    },
    silverlight: {
        xapPath: "ext_bin/bakedGoods.xap",

        storeScope: "application",
        conduitClass: "IsolatedStorageSettings",

        directoryPath: "/",

        dataFormat: "text",
        dataEncoding: null,

        //Set operation pertinent options
        startPosition: 0,      //Number.MAX_VALUE represents "one past" the last byte of the file

        truncateBeforeWrite: true,
        truncatePosition: 0,   //Number.MAX_VALUE represents "one past" the last byte of the file

        writeOnlyIfAbsent: false,
        /////

        //Get/Remove all pertinent options
        recursive: true,
        removeDirectories: true,
        removeTargetDirectory: true,
        /////

        elementParent: document.body,
        elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;"
    }
};




var defaultOperationOptionsObj = {
    set: {
        conductDisjointly: false,
        recordExpirationData: false
    },
    get: {
        conductDisjointly: false,
        regenerate: false
    },
    remove:{
        removeExpirationData: false
    },
    removeAll:{
        removeExpirationData: false
    }
};


var stubFunctionObj = function(){};

var storageOperationStubFuncCollectionObj = {
    set: stubFunctionObj,
    get: stubFunctionObj,
    remove: stubFunctionObj,
    getAll: stubFunctionObj,
    removeAll: stubFunctionObj,
    serializeLocationData: stubFunctionObj,
    createLocationDataObj: stubFunctionObj
};

var storageOperationFuncObj = {
    cookie: storageOperationStubFuncCollectionObj,
    userData: storageOperationStubFuncCollectionObj,
    webStorage: storageOperationStubFuncCollectionObj,
    webSQL: storageOperationStubFuncCollectionObj,
    indexedDB: storageOperationStubFuncCollectionObj,
    fileSystem: storageOperationStubFuncCollectionObj,
    flash: storageOperationStubFuncCollectionObj,
    silverlight: storageOperationStubFuncCollectionObj
};


/**
* Copies the properties of one or more objects to a single target object.

* @param recipientObj		the object that will receive the properties processed by this operation
* @param donorObjArray		an array of Objects each containing the properties to be copied to {@code recipientObj}
* @param copyOnlyIfAbsent	a boolean denoting whether the properties of the objects in {@code donorObjArray} 
                                with key components that appear in respectively preceding objects should be copied
*/
function copyObjectProperties(recipientObj, donorObjArray, copyOnlyIfAbsent)
{
    var donorObjCount = donorObjArray.length;

    for(var i = 0; i < donorObjCount; i++)
    {
        var currentDonorObj = donorObjArray[i];	
        for(var property in currentDonorObj) 
        {
            if(!copyOnlyIfAbsent || !recipientObj.hasOwnProperty(property))
                recipientObj[property] = currentDonorObj[property];
        }
    }
}



/**
* Produces an object containing all of the preferences defined for
* a given storage operation with either user or default values.

* @param storageOperationType       a String denoting a type of storage operation
* @param specifiedOptionsObj        an object containing key-value pairs each consisting of a 
*                                   preference defined for {@code storageOperationType} and a value for it
* @return                           an object containing key-value pairs each consisting of a preference defined for 
*                                   {@code storageOperationType} and either the value it keys in {@code userSpecifiedOptionsObj}
*                                   or the default value if such a value is not present 
*/
function procureOperationOptions(storageOperationType, specifiedOptionsObj)
{
    var operationOptionsObj;
    var pertinentDefaultOperationOptionsObj = defaultOperationOptionsObj[storageOperationType];

    if(specifiedOptionsObj)
    {
        operationOptionsObj = {};
        copyObjectProperties(operationOptionsObj, [pertinentDefaultOperationOptionsObj, specifiedOptionsObj]);
    }
    else
        operationOptionsObj = pertinentDefaultOperationOptionsObj;

    return operationOptionsObj;
}



/**
* 
* @param storageType
* @returns {unresolved}
*/
function procureStorageMetatype(storageType)
{
    return (storageType === "globalStorage" || storageType === "sessionStorage" || storageType === "localStorage" ? "webStorage" : storageType);
}



/**
* Produces an object containing all of the operation-related preferences
* defined for a storage facility with either user or default values. 

* @param storageType                a String denoting a type of storage facility
* @param specifiedOptionsObj        an object containing key-value pairs each consisting of an 
*                                   operation-related preference defined for {@code storageType} and a value
* @return                           an object containing key-value pairs each consisting of an operation-related 
*                                   preference defined for {@code storaageType} and either the value it keys in 
*                                   {@code specifiedOptiosnObj} or its default value if such a value isn't present
*/
function procureStorageTypeOptions(storageType, specifiedOptionsObj)
{
    var optionsObj;
    var defaultOptionsObj = defaultStorageTypeOptionsObj[storageType];

    if(defaultOptionsObj)
    {
        if(specifiedOptionsObj)
        {
            optionsObj = specifiedOptionsObj;
            copyObjectProperties(optionsObj, [defaultOptionsObj], true);
        }
        else
            optionsObj = defaultOptionsObj;
    }
    else
        optionsObj = (specifiedOptionsObj || {});

    return optionsObj;
}



/**
* Conducts a storage operation.

* @param operationType      a String denoting the type of operation to be conducted
* @param storageType        a String denoting the type of storage facility the operation is to be conducted in
* @param argObj             an object containing properties required to conduct a storage operation 
*                           of type {@code operationType} in {@code storageType}
* @param complete           a function to execute upon the conclusion of the to-be-conducted operation
*/
function conductStorageOperation(operationType, storageType, argObj, complete)
{
    //Obtain the meta-type of storageType (if defined), which is the collection of storage types that it belongs to
    var storageMetatype = procureStorageMetatype(storageType);

    //Use the default operation preferences associated with storageType, along with any overriding 
    //values specified by the user, to get the object of preferences to be used for this storage operation
    var storageTypeOptionsObj = procureStorageTypeOptions(storageType, argObj.options[storageType]);

    //Obtain a handle to the function which will be used to carry out the storage operation
    var userDefinedStorageOperationFunc = argObj.functions[storageMetatype];
    var defaultStorageOperationFunc = storageOperationFuncObj[storageMetatype][operationType];
    var storageOperationFunc = (userDefinedStorageOperationFunc || defaultStorageOperationFunc);
    /////

    var operationArgArray = [];

    //Push on to operationArgArray the arguments necessary to conduct  
    //the desired storage operation on the specified storage type
    if(storageMetatype !== storageType) operationArgArray.push(storageType);

    if(operationType.indexOf("All") !== -1) 
    {
        //If it is a "removeAll" operation that is to be conducted, the removeExpirationData property of argObj.options, 
        //which is a preference indirectly defined for the operation, is inserted in to storageTypeOptionsObj,
        //and act which directly defines the preference for the operation, giving the operation access to 
        //the preferecnce, which it requires to compose and provide the expected data to the complete callback
        if(operationType === "removeAll")
            storageTypeOptionsObj.removeExpirationData = argObj.options.removeExpirationData;
        /////

        if(storageType === "indexedDB" || storageType === "webSQL" || storageType === "flash" || storageType === "silverlight")     //conditional ("getAll", "removeAll") operation
        {
                //If argObj.filter has no meaningful value, assign it to "true" which, when evaluated, will
                //return true for, and allow for the processing of, all data items encountered by the operation
                if(argObj.filter === undefined || argObj.filter === null || argObj.filter === "") 
                        argObj.filter = "true";

                operationArgArray.push(argObj.filter);
        }
    }
    else
        operationArgArray.push(argObj.data);

    Array.prototype.push.apply(operationArgArray, [storageTypeOptionsObj, complete]);
    /////

    storageOperationFunc.apply(storageOperationFunc, operationArgArray);
}


/**
 * Procures an object that uniquely identifies the payload data
 * of an item persisted in a given storage facility.
 
 * @param dataItemObj               an Object containing the identifying and payload data of a item persisted in {@code storageType}
 * @param storageType               a String denoting the type of storage facility that {@code dataItemObj} was persisted in
 * @param storageTypeOptionsObj     an Object containing the {@code storageType}-related preferences used to store {@code dataItemObj}
 * @return                          an Object which uniquely identifies the payload data of {@code dataItemObj} in {@code storageType}
 */
function procureDataItemIdentifyingEntityExternal(dataItemObj, storageType, storageTypeOptionsObj)
{	
    var key;

    if(storageType === "indexedDB")
    {
        if(storageTypeOptionsObj.objectStoreData.keyPath !== null)
        {
            //Split the supplied key path in to an array of its constituent keys
            var keyPathComponentArray  = storageTypeOptionsObj.objectStoreData.keyPath.split(".");
            var keyPathComponentCount = keyPathComponentArray.length;
            
            //Iterate through the elements in keyPathComponentArray, using each
            //to obtain the increasingly nested object it keys in dataItemObj.key
            var currentDataObj = dataItemObj.value; 
            for(var i = 0; i < keyPathComponentCount; i++)
                currentDataObj = currentDataObj[keyPathComponentArray[i]];
            /////

            key = currentDataObj;
        }
        else
            key = dataItemObj.key;
    }
    else if(storageType === "webSQL")
    {
        var columnDefinitionsStr = storageTypeOptionsObj.tableData.columnDefinitions;
        
        //If the column definitions in columnDefinitionsStr are enclosed by parentheses, omit them
        if(columnDefinitionsStr[0] === "(") columnDefinitionsStr = columnDefinitionsStr.substring(1, columnDefinitionsStr.length - 1);
        
        //Split columnDefinitionsStr in to an array of its constituent column definition Strings
        var columnDefinitionsArray = columnDefinitionsStr.split(",");
        
        key = "";
        
        //Loop through the column definition Strings in columnDefinitionsArray, composing a 
        //boolean expression comprised of equality expressions each consisting of the name of a
        //column in the relevant table's primary key along with the value it keys in dataItemObj.value
        var columnCount = columnDefinitionsArray.length;
        for(var i = 0; i < columnCount; i++)
        {
            var currentColumnDefStr = columnDefinitionsArray[i];
            
            if(/\bPRIMARY KEY\b/.test(currentColumnDefStr))     //if currentColumnDefStr defines a column that is part of the 
            {                                                       //primary key of the table described by optionsObj.tableData
                var currentColumnName = /\w+/.exec(currentColumnDefStr)[0];
                key += (key === "" ? "" : " && " ) + currentColumnName + " === " + dataItemObj.value[currentColumnName];
            }
        }
        /////
    }
    else
        key = dataItemObj.key;

    return key;
}



/**
* Creates an object that can be used to record the expiration data of data items with specified
* expiration times that were stored during the most recently run sub-storage operation.
 
* @param onePastSubsetEnd       an int of one past the index in {@code argObj.dataArray}
*                               containing the last object in the desired subset
* @return                       an object consisting of the currently relevant storage facility and objects each containing 
*                               the data of an expiration time-possessing data item stored in the facility during the most recent  
                                run of this operation along with data that describes where in the facility the item is located
*/
function createItemExpirationDataCollectionExternal(currentStorageType, argObj, onePastSubsetEnd, procureDataItemIdentifyingEntity)
{
    var storageTypeExprDataObj = null;
    var toExpireDataItemObjArray = [];

    var storageMetatype = procureStorageMetatype(currentStorageType);
    var serializedLocationData;

    //Procure the storage facility-related preferences used in the most recently executed storage operation. 
    //Contained location data will be serialized for use in the creation of expiration data for the stored items
    var storageTypeOptionsObj = procureStorageTypeOptions(currentStorageType, argObj.options[currentStorageType]);

    //Loop through the data objects in dataArray, pushing on to toExpireDataItemObjArray objects each
    //consisting of the contents of a data item object with an expiration time along with data which 
    //describes where the item's key-value pair is stored in the currently relevant storage facility
    var dataArray = argObj.data;
    for(var i = 0; i < onePastSubsetEnd; i++)
    {
        var currentDataObj = dataArray[i];
        if(currentDataObj.hasOwnProperty("expirationTimeMillis"))
        {
            //Serialize the data which describes where the items stored by this operation
            //is/will be located within the currently relevant storage facility.
            if(serializedLocationData === undefined) 
                serializedLocationData = storageOperationFuncObj[storageMetatype].serializeLocationData(storageTypeOptionsObj);

            var key = procureDataItemIdentifyingEntity(currentDataObj, currentStorageType, storageTypeOptionsObj);

            //Push an object on to toExpireDataItemObjArray consisting of data identifying 
            //the currently processing item, its location, and its expiration time
            toExpireDataItemObjArray.push({key: key, expirationTimeMillis: currentDataObj.expirationTimeMillis, serializedLocationData: serializedLocationData});
        }
    }
    /////

    //If there was at least one item with an expiration time that was stored during the most recently run sub-operation, 
    //create an object which relates the storage facility to the elements in toExpireDataItemObjArray
    if(toExpireDataItemObjArray.length > 0)
        storageTypeExprDataObj = {storageType: currentStorageType, dataArray: toExpireDataItemObjArray};			

    return storageTypeExprDataObj;
}



/**
* Conducts a set operation in one or more specified storage 
* facilities using data contained in a collection of objects. 

* @param argObj     an Object containing:
*                       - an Array of objects each containing the data of an item to be stored
*                       - an Array of Strings denoting the storage facilities the data 
*                         of the aforementioned items are to be stored in
*                       - (optional) an object containing data which will collectively dictate
*                         the execution of the overarching and subordinate set operations 
                        - (optional) an object containing mappings between a given storage facility 
                          and a function used to be used to carry out the set operation on it
*/
function set(argObj)
{
    //Will be used to sequentially conduct a set operation on each of the storage facilities named in argObj
    var i = 0;

    //Will contain key-value pairs each consisting of a storage facility specified 
    //in argObj and an object consisting of the bounds of the range of items in
    //argObj.data successfully stored in the storage type by this operation 
    var byStorageTypeStoredItemRangeDataObj = {};

    //Will contain key-value pairs each consisting of a storage facility accessed by a 
    //sub-operation which spawned an error, and the DOMError representation of that error
    var byStorageTypeErrorObj = {};

    //Will contain objects each consisting of a storage facility specified in argObj and an 
    //array containing the expiration-related data of items stored in it by this operation
    var expirationDataCollectionArray = [];

    //Assure argObj has the properties assumed to be present
    if(!argObj.options) 		argObj.options = {};
    if(!argObj.functions) 		argObj.functions = {};
    /////

    var currentStorageType = argObj.storageTypes[0];
    var storageTypeCount = argObj.storageTypes.length;

    var firstUnprocessedItemAbsoluteIndex = 0;
    var unprocessedItemCount = argObj.data.length;

    var operationOptionsObj = procureOperationOptions("set", argObj.options);
    var doRecordExpirationData = operationOptionsObj.recordExpirationData;
    var doConductDisjointly = operationOptionsObj.conductDisjointly;

/**
    * Procures an object that uniquely identifies the payload data
    * of an item persisted in a given storage facility.

    * @param dataItemObj               an Object containing the identifying and payload data of an item persisted in {@code storageType}
    * @param storageType               a String denoting the type of storage facility that {@code dataItemObj} was persisted in
    * @param storageTypeOptionsObj     an Object containing the {@code storageType}-related preferences used to store {@code dataItemObj}
    * @return                          an Object which uniquely identifies the payload data of {@code dataItemObj} in {@code storageType}
    */
    function procureDataItemIdentifyingEntity(dataItemObj, storageType, storageTypeOptionsObj)
    {	
            var key;

            if(storageType === "indexedDB")
            {
                    if(storageTypeOptionsObj.objectStoreData.keyPath !== null)
                    {
                            //Split the supplied key path in to an array of its constituent keys
                            var keyPathComponentArray  = storageTypeOptionsObj.objectStoreData.keyPath.split(".");
                            var keyPathComponentCount = keyPathComponentArray.length;

                            //Iterate through the elements in keyPathComponentArray, using each
                            //to obtain the increasingly nested object it keys in dataItemObj.key
                            var currentDataObj = dataItemObj.value; 
                            for(var i = 0; i < keyPathComponentCount; i++)
                                    currentDataObj = currentDataObj[keyPathComponentArray[i]];
                            /////

                            key = currentDataObj;
                    }
                    else
                            key = dataItemObj.key;
            }
            else if(storageType === "webSQL")
            {
                    var columnDefinitionsStr = storageTypeOptionsObj.tableData.columnDefinitions;

                    //If the column definitions in columnDefinitionsStr are enclosed by parentheses, omit them
                    if(columnDefinitionsStr[0] === "(") columnDefinitionsStr = columnDefinitionsStr.substring(1, columnDefinitionsStr.length - 1);

                    //Split columnDefinitionsStr in to an array of its constituent column definition Strings
                    var columnDefinitionsArray = columnDefinitionsStr.split(",");

                    key = "";

                    //Loop through the column definition Strings in columnDefinitionsArray, composing a 
                    //boolean expression comprised of equality expressions each consisting of the name of a
                    //column in the relevant table's primary key along with the value it keys in dataItemObj.value
                    var columnCount = columnDefinitionsArray.length;
                    for(var i = 0; i < columnCount; i++)
                    {
                            var currentColumnDefStr = columnDefinitionsArray[i];

                            if(/\bPRIMARY KEY\b/.test(currentColumnDefStr))     //if currentColumnDefStr defines a column that is part of the 
                            {                                                       //primary key of the table described by optionsObj.tableData
                                    var currentColumnName = /\w+/.exec(currentColumnDefStr)[0];
                                    key += (key === "" ? "" : " && " ) + currentColumnName + " === " + dataItemObj.value[currentColumnName];
                            }
                    }
                    /////
            }
            else
                    key = dataItemObj.key;

            return key;
    }

/**
    * Creates an object that can be used to record the expiration data of data items with specified
    * expiration times that were stored during the most recently run sub-storage operation.

    * @param onePastSubsetEnd       an int of one past the index in {@code argObj.dataArray}
    *                               containing the last object in the desired subset
    * @return                       an object consisting of the currently relevant storage facility and objects each containing 
    *                               the data of an expiration time-possessing data item stored in the facility during the most recent  
                                    run of this operation along with data that describes where in the facility the item is located
    */
    function createItemExpirationDataCollection(onePastSubsetEnd)
    {
            var storageTypeExprDataObj = null;
            var toExpireDataItemObjArray = [];

            var currentStorageMetatype = procureStorageMetatype(currentStorageType);
            var serializedLocationData;

            //Procure the storage facility-related preferences used in the most recently executed storage operation. 
            //Contained location data will be serialized for use in the creation of expiration data for the stored items
            var storageTypeOptionsObj = procureStorageTypeOptions(currentStorageType, argObj.options[currentStorageType]);

            //Loop through the data objects in dataArray, pushing on to toExpireDataItemObjArray objects each
            //consisting of the contents of a data item object with an expiration time along with data which 
            //describes where the item's key-value pair is stored in the currently relevant storage facility
            var dataArray = argObj.data;
            for(var i = 0; i < onePastSubsetEnd; i++)
            {
                    var currentDataObj = dataArray[i];
                    if(currentDataObj.hasOwnProperty("expirationTimeMillis"))
                    {
                            //Serialize the data which describes where the items stored by this operation
                            //are/will be located within the currently relevant storage facility.
                            if(serializedLocationData === undefined) 
                                    serializedLocationData = storageOperationFuncObj[currentStorageMetatype].serializeLocationData(storageTypeOptionsObj);

                            var key = procureDataItemIdentifyingEntity(currentDataObj, currentStorageType, storageTypeOptionsObj);

                            //Push an object on to toExpireDataItemObjArray consisting of data identifying 
                            //the currently processing item, its location, and its expiration time
                            toExpireDataItemObjArray.push({key: key, expirationTimeMillis: currentDataObj.expirationTimeMillis, serializedLocationData: serializedLocationData});
                    }
            }
            /////

            //If there was at least one item with an expiration time that was stored during the most recently run sub-operation, 
            //create an object which relates the storage facility to the elements in toExpireDataItemObjArray
            if(toExpireDataItemObjArray.length > 0)
                    storageTypeExprDataObj = {storageType: currentStorageType, dataArray: toExpireDataItemObjArray};			

            return storageTypeExprDataObj;
    }

/**
    * Progresses the execution of the set of to-be-conducted "set" operations after the conclusion of one.

    * @param processedItemCount		an int denoting the number of items in {@code argObj.dataArray} processed by the invoking set operation
    * @param error                 (optional) the DOMError spawned by the invoking set sub-operation
    */
    function complete(processedItemCount, error)
    {
            var currentUnprocessedItemCount =  unprocessedItemCount - processedItemCount;

            //Associate the number of items processed by the invoking sub-operation with the storage facility it operated in
            byStorageTypeStoredItemRangeDataObj[currentStorageType] = {
                storedItemRangeBegin: firstUnprocessedItemAbsoluteIndex,
                onePastStoredItemRangeEnd: firstUnprocessedItemAbsoluteIndex + processedItemCount
            };

            //If an error was spawned by the invoking sub-operation, associate it with the currently relevant storage type in byStorageTypeErrorObj
            if(error) byStorageTypeErrorObj[currentStorageType] = error;

            //If the expiration-related data of the stored items is to be recorded, push an object containing 
            //such data on to expirationDataCollectionArray, which will be utilized by recordExpirationData when it is called
            if(doRecordExpirationData)
            {
                    var expirationDataCollectionObj = createItemExpirationDataCollection(processedItemCount);
                    if(expirationDataCollectionObj !== null) expirationDataCollectionArray.push(expirationDataCollectionObj);
            }
            /////

            var processedAllItemsThisRun = (currentUnprocessedItemCount === 0);
            var canConclude = ++i >= storageTypeCount || (doConductDisjointly ? false : processedAllItemsThisRun); 

            if(canConclude)
            {
                    if(argObj.complete)             argObj.complete(byStorageTypeStoredItemRangeDataObj, byStorageTypeErrorObj);
                    if(doRecordExpirationData)	recordExpirationData(expirationDataCollectionArray);
            }
            else
            {
                    if(!doConductDisjointly)
                    {
                            argObj.dataArray.splice(processedItemCount);                //Remove the items stored in this run of the operation from the array of to-be-stored items

                            firstUnprocessedItemAbsoluteIndex += processedItemCount;    //Update the index at which the first unprocessed item is located in the original argObj.dataArray 
                            unprocessedItemCount = currentUnprocessedItemCount;         //Update the number of unprocessed items to that which were not stored by this operation
                    }

                    currentStorageType = argObj.storageTypes[i];
                    conductStorageOperation("set", currentStorageType, argObj, complete);
            }
    }

    conductStorageOperation("set", currentStorageType, argObj, complete);
    return this;
}



/**
* Reconstitues the array of keys contained in each object in {@code regenerationArgObjArray} to consist
* of objects each possessing a key in the array and the value it keys in {@code keyValuePairsObj}. 
* Keys which do not appear in {@code keyValuePairsObj} are not represented by objects in the reconstituted array.
*/
function createRegenerationDataItemObjectsExternal(regenerationArgObjArray, resultDataObj)
{
    //Loop through the objects in regenerationArgObjArray, inserting in to the array contained in each,  
    //data item objects for the unprocessed & absent keys in the array which appear in keyValuePairsObj.
    var setArgObjCount = regenerationArgObjArray.length;
    for(var i = 0; i < setArgObjCount; i++)
    {
        var currentDataArray = regenerationArgObjArray[i].data;
        var pivotIndex = 0;		//will mark one past the index of the last unprocessed/absent key that was replaced by a data item object

        //Loop through the keys in currentDataArray, inserting a data item object for each which maps to
        //a value in keyValuePairsObj at pivotIndex (a key without a mapping in keyValuePairsObj will be
        //overwitten by the data item object corresponding to the first key after it which does)
        var currentDataCount = currentDataArray.length;
        for(var j = 0; j < currentDataCount; j++)
        {
            var currentKey = currentDataArray[j];
            var wasKeyProcessed = resultDataObj.hasOwnProperty(currentKey);

            var currentValue = resultDataObj[currentKey];

            if(wasKeyProcessed && currentValue !== null)
                currentDataArray[pivotIndex++] = {key: currentKey, value: currentValue};
        }
        /////

        if(pivotIndex > 0)
            currentDataArray.splice(pivotIndex, currentDataCount - pivotIndex);		//remove the elements in currentDataArray which aren't data item objects
        else
            regenerationArgObjArray.splice(i, 1);
    }
    /////
}



/**
* Conducts a retrieval operation in one or more specified storage facilities
* for data items keyed by elements in a collection of Strings.

* @param argObj		an Object containing:
*                           - an Array of Strings which presumably key items in the target storage facilties
*                           - an Array of Strings denoting the storage facilities containing the
*                             items keyed by the aforementioned array of key strings
*                           - (optional) an object containing data which will collectively dictate
*                             the execution of the overarching and subordinate retrieval operations 
*                           - (optional) an object containing mappings between a given storage facility and a
*                             function used to be used to carry out the retrieval operation on it
*/
function get(argObj)
{
    //Will be used to sequentially conduct retrieval operations 
    //on each of the storage facilities in argObj.storageTypes
    var i = 0;	

    //Will be used to sequentially conduct a set/retrieval operation with each object in regenerationArgObj
    var j = 0;

    //Will contain data establishing relationships between the keys
    //in argObj.data and the retrieval payload data in a form dependant
    //on the disjointness of the retrieval operation:
    // non-disjoint:	mappings each consisting of a key in argObj.data and the value it keys
    //			in the first storage facility in argObj.storageTypes it appears in
    // disjoint:	mappings each consisting of a storage type in argObj.storageTypes and an object containing 
    //			mappings each consisting of a key in argObj.data and the value it keys in the storage type
    var resultDataObj = {};

    //Will contain key-value pairs each consisting of a storage type accessed by a 
    //sub-operation which spawned an error, and the DOMError representation of that error
    var byStorageTypeErrorObj = {};

    //Will contain objects that will each be used as the argument for a set/regeneration operation
    var regenerationArgObjArray = [];

    //Assure argObj has the properties assumed to be present
    if(!argObj.options) 		argObj.options = {};
    if(!argObj.functions) 		argObj.functions = {};
    /////

    var operationOptionsObj = procureOperationOptions("get", argObj.options);
    var conductDisjointly = operationOptionsObj.conductDisjointly;

    //Disjoint retrieval operations imply distinctness between
    //the data sets that are the targets of the operations, making
    //regeneration (which assumes equivalency between said data sets) illogical 
    var regenerate = (operationOptionsObj.regenerate && !conductDisjointly);	

    var regenerationFunctionsObj = argObj.regenerationFunctions;

    var currentStorageType = argObj.storageTypes[0];
    var storageTypeCount = argObj.storageTypes.length;


/**
    * Extracts from {@code argObj.data} the keys that were not present in 
    * the target storage facility of the most recently executed sub-retrieval. 
    *
    * This function cannot discern between keys that are not present in the  
    * relevant storage facility and those which key null values. Thus, keys  
    * which fall in to either category will be included in the returned array.

    * @param onePastProcessedKeySubsetEnd       an int of one past the index in {@code argObj.dataArray}
    *                                           containing the last object in the desired subset
    * @return                                   an Array consisting of the keys in {@code argObj.data} that
    *                                           were left unprocessed by, or did not key anything in the target
    *                                           storage facility of, the most recently executed sub-retrieval
    */
    function getAbsentDataKeys(onePastProcessedKeySubsetEnd)
    {
            var absentDataKeysArray = [];
            var dataArray = argObj.data;

            //Loop through the keys in dataArray processed during the last retrieval operation, 
            //pushing those on to absentDataKeysArray that don't map to meaningful values
            for(var i = 0; i < onePastProcessedKeySubsetEnd; i++)
            {
                    var currentKey = dataArray[i];
                    var currentValue = resultDataObj[currentKey];

                    if(currentValue === null) absentDataKeysArray.push(currentKey);
            }
            /////

            return absentDataKeysArray;
    }

/**
    * Reconstitues the array of keys contained in each object in {@code regenerationArgObjArray} to consist
    * of objects each possessing a key in the array and the value it keys in {@code keyValuePairsObj}. 
    * Keys which do not appear in {@code keyValuePairsObj} are not represented by objects in the reconstituted array.
    */
    function createRegenerationDataItemObjects()
    {
            //Loop through the objects in regenerationArgObjArray, inserting in to the array contained in each,  
            //data item objects for the unprocessed & absent keys in the array which appear in keyValuePairsObj.
            var setArgObjCount = regenerationArgObjArray.length;
            for(var i = 0; i < setArgObjCount; i++)
            {
                    var currentDataArray = regenerationArgObjArray[i].data;
                    var pivotIndex = 0;		//will mark one past the index of the last unprocessed/absent key that was replaced by a data item object

                    //Loop through the keys in currentDataArray, inserting a data item object for each which maps to
                    //a value in keyValuePairsObj at pivotIndex (a key without a mapping in keyValuePairsObj will be
                    //overwitten by the data item object corresponding to the first key after it which does)
                    var currentDataCount = currentDataArray.length;
                    for(var j = 0; j < currentDataCount; j++)
                    {
                            var currentKey = currentDataArray[j];
                            var wasKeyProcessed = resultDataObj.hasOwnProperty(currentKey);

                            var currentValue = resultDataObj[currentKey];

                            if(wasKeyProcessed && currentValue !== null)
                                    currentDataArray[pivotIndex++] = {key: currentKey, value: currentValue};
                    }
                    /////

                    if(pivotIndex > 0)
                            currentDataArray.splice(pivotIndex, currentDataCount - pivotIndex);		//remove the elements in currentDataArray which aren't data item objects
                    else
                            regenerationArgObjArray.splice(i, 1);
            }
            /////
    }

/**
    * Commences a set operation using the next object to be processed in {@code regenerationArgObjArray}.
    */
    function regenerateData()
    {
            if(j++ < regenerationArgObjArray.length)
            {
                    regenerationArgObjArray[j].functions = regenerationFunctionsObj;
                    regenerationArgObjArray[j].complete = regenerateData;	//Designate this function to execute after the conclusion of the set operation
                    set(regenerationArgObjArray[j]);
            }
    }

    /**
    * Progresses the execution of the set of to-be-conducted get operations after the conclusion of one.

    * @param currentProcessedItemCount      an int denoting the number of items in {@code argObj.data} processed by the invoking get sub-operation
    * @param retrievedKeyValuePairsObj      an object containing mappings each consisting of a key in {@code argObj.data} and the value it keys
                                                                                    in the currently processing storage facility (which is the setting of the invoking get sub-operation
    * @param error                          (optional) the DOMError spawned by the invoking get sub-operation
    */
    function complete(currentProcessedItemCount, retrievedKeyValuePairsObj, error)
    {
            var currentKeyValuePairsObj;

            if(!conductDisjointly)
            {
                    //Extract the keys in argObj.dataArray that did not key anything 
                    //in the storage facility that was the target of the invoking sub-retrieval
                    var absentDataKeysArray = getAbsentDataKeys(currentProcessedItemCount);

                    //Reconstitute the operation's key array as that which contains the keys 
                    //that were unprocessed or deemed absent by the invoking sub-retrieval            
                    Array.prototype.splice.apply(argObj.data, [0, currentProcessedItemCount]).concat(absentDataKeysArray); 

                    //If absent data is to be regenerated, push an object containing relevant data from the invoking 
                    //sub-retrieval on to regenerationArgObjArray that will be used to accomplish this (after further processing) 
                    if(regenerate && absentDataKeysArray.length > 0)
                    {
                        var regenerationOptionsObj = {};
                        regenerationOptionsObj[currentStorageType] = argObj.options[currentStorageType];

                        regenerationArgObjArray.push({data: absentDataKeysArray, storageTypes: [currentStorageType], options: regenerationOptionsObj});
                    }

                    currentKeyValuePairsObj = resultDataObj;
            }
            else
                    currentKeyValuePairsObj = resultDataObj[currentStorageType] = {};

            //Copy the key-value pairs created by the invoking sub-retrieval to currentKeyValuePairsObj
            copyObjectProperties(currentKeyValuePairsObj, [retrievedKeyValuePairsObj]);

            //If an error was spawned by the invoking sub-operation, associate it with the currently relevant storage type in byStorageTypeErrorObj
            if(error) byStorageTypeErrorObj[currentStorageType] = error;

            var canConclude = (++i >= storageTypeCount || argObj.data.length === 0);

            if(canConclude)
            {
                    if(argObj.complete) argObj.complete(resultDataObj, byStorageTypeErrorObj);

                    if(regenerate)
                    {
                            createRegenerationDataItemObjects();
                            regenerateData();
                    }
            }
            else
            {
                    currentStorageType = argObj.storageTypes[i];
                    conductStorageOperation("get", currentStorageType, argObj, complete);
            }
    }

    conductStorageOperation("get", currentStorageType, argObj, complete);
    return this;
}



/**
* Conducts a removal operation in in one or more specified 
* storage facilities on items keyed by elements in a collection of keys.

* @param argObj     an Object containing:
*                       - an Array of Strings which presumably key items in the target storage facilties
*                       - an Array of Strings denoting the storage facilities containing 
*                         the items keyed by the aforementioned array of key strings
*                       - (optional) an object containing data which will collectively dictate
*                         the execution of the overarching and subordinate removal operations 
*                       - (optional) an object containing mappings between a given storage facility and a 
*                         function used to be used to carry out the removal operation on it
*/
function remove(argObj)
{
    //Will be used to sequentially conduct removal operations 
    //in each of the storage facilities in argObj.storageTypes
    var i = 0;

    var byStorageTypeRemovedItemCountObj = {};
    var byStorageTypeErrorObj = {};
    var expirationDataCollectionArray = [];

    //Assure argObj has the properties assumed to be present
    if(!argObj.options) 		argObj.options = {};
    if(!argObj.functions) 		argObj.functions = {};
    /////

    var storageTypeCount = argObj.storageTypes.length;
    var currentStorageType = argObj.storageTypes[i];

    var storageOperationOptionsObj = procureOperationOptions("remove", argObj.options);
    var removeExpirationDataBool = storageOperationOptionsObj.removeExpirationData;

/**
    * Creates an object that can be used to remove the expiration data
    * of stored items removed by the most recent removal sub-operation.

    * @param onePastSubsetEnd       an int of one past the index in {@code argObj.data}
    *                               containing the last key in the sub-array
    * @return                       an object consisting of the name of the currently relevant storage facility and an 
    *                               array of objects each containing the key of a data item removed by the most
    *                               recent removal sub-operation and a string of the item's former location data
    */
    function createItemIdentificationCentricExpirationDataCollection(onePastSubsetEnd)
    {
            var expirationDataObjArray = [];
            var dataArray = argObj.data;

            var currentStorageMetatype = procureStorageMetatype(currentStorageType);

            //Create a String containing data that describes the location of items in currentStorageType keyed by the Strings in dataArray 
            var storageTypeOptionsObj = procureStorageTypeOptions(currentStorageType, argObj.options[currentStorageType]);
            var serializedLocationData = storageOperationFuncObj[currentStorageMetatype].serializeLocationData(storageTypeOptionsObj);
            /////

            //Loop through the keys in the sub-array of dataArray bounded by [0, onePastSubsetEnd), pushing on to
            //expirationDataObjArray an object for each key consisting of it (the key) and serializedLocationData
            for(var i = 0; i < onePastSubsetEnd; i++)
                    expirationDataObjArray.push({key: dataArray[i], serializedLocationData: serializedLocationData});
            /////

            return {storageType: currentStorageType, dataArray: expirationDataObjArray};
    }

/**
    * Progresses the execution of the set of to-be-conducted remove operations after the conclusion of one.

    * @param processedItemCount		an int denoting the number of keys in dataObj.data processed by the invoking remove sub-operation
    * @param error                  (optional) the DOMError spawned by the invoking remove sub-operation
    */
    function complete(processedItemCount, error)
    {
            //Map the currently relevant storage type to the number of items removed by the invoking sub-removal
            byStorageTypeRemovedItemCountObj[currentStorageType] = processedItemCount;

            //If an error was spawned by the invoking sub-operation, associate it with the currently relevant storage type in byStorageTypeErrorObj
            if(error) byStorageTypeErrorObj[currentStorageType] = error;

            //If related expiration data is to be removed, push an object on to expirationDataCollectionArray 
            //that will be used by removeExpirationData() to itentify and remove such data 
            if(removeExpirationDataBool && processedItemCount > 0) 
                    expirationDataCollectionArray.push(createItemIdentificationCentricExpirationDataCollection(processedItemCount));

            var canConclude = (++i >= storageTypeCount);

            if(canConclude)
            {
                    if(argObj.complete)                                 argObj.complete(byStorageTypeRemovedItemCountObj, byStorageTypeErrorObj);
                    if(expirationDataCollectionArray.length > 0)        removeExpirationData(expirationDataCollectionArray);
            }
            else
            {
                    currentStorageType = argObj.storageTypes[i];
                    conductStorageOperation("remove", currentStorageType, argObj, complete);
            }
    }

    conductStorageOperation("remove", currentStorageType, argObj, complete);
    return this;
}



/**
* Creates an object that can be used to remove the expiration data
* of stored items removed by the most recent remove-all sub-operation.

* @param keyArray       an array of objects each identifying an item removed from the target storage 
*                       facility of the most recently executed remove-all sub-operation 
* @return               an object consisting of the name of the currently relevant storage facility and an 
*                       array of objects each containing the key of a data item removed by the most
*                       recent removal sub-operation and a string of the item's former location data
*/
function removeAll_createExpirationDataObjectExternal(currentStorageType, argObj, keyArray)
{
    var expirationDataObjArray = [];

    //Create a String containing data that describes the location of items in currentStorageType keyed by the elements in keyArray 
    var storageTypeOptionsObj = procureStorageTypeOptions(defaultStorageTypeOptionsObj[currentStorageType], argObj.options[currentStorageType]);
    var serializedLocationData = storageOperationFuncObj[currentStorageType].serializeLocationData(storageTypeOptionsObj);
    /////

    var isFileSystemType = (currentStorageType === "fileSystem" || (currentStorageType === "silverlight"
                                                                && storageTypeOptionsObj.conduitClass === "IsolatedStorageFile"));

    //Loop through the keys in keyArray, pushing on to expirationDataObjArray
    //an object for each consisting of it (the key) and a String containing
    //data specifying the location of the item the key identifies
    var dataItemCount = keyArray.length;
    for(var i = 0; i < dataItemCount; i++)
    {
        var expirationDataObj;

        if(isFileSystemType)
        {
            var currentDataItemPath = keyArray[i];
            
            //Split the key (full file path) at the currently processing index 
            //in to its constituent directory path and file name components
            var dataItemPathComponentArray = currentDataItemPath.split(/(?:\\|\/)(?=[^\\\/]+$)/);

            //Store the contents of dataItemPathComponentArray in to local variables
            var dataItemName = dataItemPathComponentArray[dataItemPathComponentArray.length - 1];
            var dataItemParentDirectoryPath = (dataItemPathComponentArray.length === 2 
                                                    ? dataItemPathComponentArray[0] + currentDataItemPath[dataItemPathComponentArray[0].length] 
                                                    : "/");
            /////

            //Utilize dataItemParentDirectoryPath to help create and assign to serializedLocationData, a string which   
            //contains data specifying the location of the data item identified by the currently processing key
            storageTypeOptionsObj.directoryPath = dataItemParentDirectoryPath;
            serializedLocationData = storageOperationFuncObj[currentStorageType].serializeLocationData(storageTypeOptionsObj);
            /////

            expirationDataObj = {key: dataItemName, serializedLocationData: serializedLocationData};
        }
        else
            expirationDataObj = {key: keyArray[i], serializedLocationData: serializedLocationData};	

        expirationDataObjArray.push(expirationDataObj);
    }
    /////

    return {storageType: currentStorageType, dataArray: expirationDataObjArray};
}
    


/**
* Conducts a get or remove operation on criterea-meeting
* items in a set of specified storage facilities.

* @param operationType      a String denoting the type of operation to be conducted
* @param argObj             an Object containing:
*                               - an Array of Strings denoting the storage facilities that the operation will be conducted in
                                - (optional) a String representation of an expression that, when evaluated using an 
                                  arbitrary data item, must return true for that item to be subject to the operation
                                - (optional) an object containing properties which specify where the desired data is
                                  located inside each of the storage types in the aforementioned array
                                - (optional) an object containing mappings between a given storage facility and 
                                   a function used to be used to carry out the retrieval operation on it
*/
function getOrRemoveAll(operationType, argObj)
{
    //Will be used to sequentially execute retrieval or removal operations on
    //criteria-meeting data items in each storage facility named in argObj.storageTypes
    var i = 0;

    var byStorageTypeResultDataObj = {};
    var byStorageTypeErrorObj = {};
    var expirationDataCollectionArray = [];

    //Assure argObj has the properties assumed to be present
    if(!argObj.options)         argObj.options = {};
    if(!argObj.functions)       argObj.functions = {};
    /////

    var storageTypeCount = argObj.storageTypes.length;
    var currentStorageType = argObj.storageTypes[0];

    var isGetAll = (operationType === "getAll");
    var operationOptionsObj = procureOperationOptions(operationType, argObj.options);
    var removeExpirationDataBool = operationOptionsObj.removeExpirationData;


   /**
    * Creates an object that can be used to remove the expiration data
    * of stored items removed by the most recent remove-all sub-operation.

    * @param keyArray       an array of objects each identifying an item removed from the target storage 
    *                       facility of the most recently executed remove-all sub-operation 
    * @return               an object consisting of the name of the currently relevant storage facility and an 
    *                       array of objects each containing the key of a data item removed by the most
    *                       recent removal sub-operation and a string of the item's former location data
    */
    function createExpirationDataObject(keyArray)
    {
        var expirationDataObjArray = [];

        //Create a String containing data that describes the location of items in currentStorageType keyed by the elements in keyArray 
        var storageTypeOptionsObj = procureStorageTypeOptions(defaultStorageTypeOptionsObj[currentStorageType], argObj.options[currentStorageType]);
        var serializedLocationData = storageOperationFuncObj[currentStorageType].serializeLocationData(storageTypeOptionsObj);
        /////

        var isFileSystemType = (currentStorageType === "fileSystem" || (currentStorageType === "silverlight"
                                                                    && storageTypeOptionsObj.conduitClass ===  "IsolatedStorageFile"));

        //Loop through the keys in keyArray, pushing on to expirationDataObjArray
        //an object for each consisting of it (the key) and a String containing
        //data specifying the location of the item the key identifies
        var dataItemCount = keyArray.length;
        for(var i = 0; i < dataItemCount; i++)
        {
            var expirationDataObj;
            
             if(isFileSystemType)
            {
                var currentDataItemPath = keyArray[i];

                //Split the key (full file path) at the currently processing index 
                //in to its constituent directory path and file name components
                var dataItemPathComponentArray = currentDataItemPath.split(/(?:\\|\/)(?=[^\\\/]+$)/);

                //Store the contents of dataItemPathComponentArray in to local variables
                var dataItemName = dataItemPathComponentArray[dataItemPathComponentArray.length - 1];
                var dataItemParentDirectoryPath = (dataItemPathComponentArray.length === 2 
                                                        ? dataItemPathComponentArray[0] + currentDataItemPath[dataItemPathComponentArray[0].length] 
                                                        : "/");
                /////

                //Utilize dataItemParentDirectoryPath to help create and assign to serializedLocationData, a string which   
                //contains data specifying the location of the data item identified by the currently processing key
                storageTypeOptionsObj.directoryPath = dataItemParentDirectoryPath;
                serializedLocationData = storageOperationFuncObj[currentStorageType].serializeLocationData(storageTypeOptionsObj);
                /////

                expirationDataObj = {key: dataItemName, serializedLocationData: serializedLocationData};
            }
            else
                expirationDataObj = {key: keyArray[i], serializedLocationData: serializedLocationData};	

            expirationDataObjArray.push(expirationDataObj);
        }
        /////

        return {storageType: currentStorageType, dataArray: expirationDataObjArray};
    }


   /**
    * Progresses the execution of the set of to-be-conducted storage operations after the conclusion of one.

    * @param processedItemCount     an int denoting the number of items processed by the invoking sub-storage operation
    * @param resultObj              (optional) an Object containing data procured by the invoking sub-storage operation
    * @param error                  (optional) the DOMError spawned by the invoking sub-storage operation
    */
    function complete(processedItemCount, resultObj, error)
    {
        var externalFacingResultObj = (isGetAll ? resultObj : processedItemCount);
        byStorageTypeResultDataObj[currentStorageType] = externalFacingResultObj;
        
        //If the removal operation is not specified to remove expiration data associated with 
        //removed data items, any DOMErrors spawned will appear as the second argument of this
        //function. Redefine "error" if this is the case, associating it with currentStorageType if appropriate
        if(!isGetAll && !removeExpirationDataBool) error = resultObj;
        if(error) byStorageTypeErrorObj[currentStorageType] = error;
        /////

        //If related expiration data is to be removed, push an object on to expirationDataCollectionArray 
        //that will be used by removeExpirationData() to itentify and remove such data 
        if(removeExpirationDataBool && processedItemCount > 0) 
            expirationDataCollectionArray.push(createExpirationDataCollection(resultObj));

        var canConclude = (++i >= storageTypeCount);

        if(canConclude)
        {
            if(argObj.complete)                 argObj.complete(byStorageTypeResultDataObj, byStorageTypeErrorObj);
            if(removeExpirationDataBool)        removeExpirationData(expirationDataCollectionArray);
        }
        else
        {
            currentStorageType = argObj.storageTypes[i];
            conductStorageOperation(operationType, currentStorageType, argObj, complete);
        }
    }

    conductStorageOperation(operationType, currentStorageType, argObj, complete);    
    return this;
}



function getAll(argObj)
{
    getOrRemoveAll("getAll", argObj);
}



function removeAll(argObj)
{
    getOrRemoveAll("removeAll", argObj);	
}



/******************************Test functions**********************************/



var testNum = new Number(Math.random() * Number.MAX_VALUE).toPrecision(15).valueOf();
var testNumObj = new Number(Math.random() * Number.MAX_VALUE).toPrecision(15);

var testStr = "()<>@,;:<>/[]?={}";
var testDateObj = new Date();

var testObj = {num: testNum, numObj: testNumObj, str: testStr, dateObj: testDateObj};
var testArr = [testNum, testNumObj, testStr, testDateObj, testObj];


/*
//copyObjectProperties test
(function(){
    
    var testDataObjArray = [
        {recipientObj: {}, donorObjArray: [{}], expectedResultObj: {}},
        {recipientObj: {}, donorObjArray: [{testNum: testNum, testStr: testStr}], expectedResultObj: {testNum: testNum, testStr: testStr}},
        {recipientObj: {}, donorObjArray: [{testNum: testNum, testStr: testStr}], copyOnlyIfAbsent: true, expectedResultObj: {testNum: testNum, testStr: testStr}},
        {recipientObj: {testNum: testNum, testNumObj: testNumObj, testStr: testStr}, donorObjArray: [{testDateObj: testDateObj, testObj: testObj, testArr: testArr}], copyOnlyIfAbsent: false, 
                        expectedResultObj: {testNum: testNum, testNumObj: testNumObj, testStr: testStr, testDateObj: testDateObj, testObj: testObj, testArr: testArr}},
        {recipientObj: {testNum: testNum, testNumObj: testNumObj, testStr: testStr}, donorObjArray: [{testDateObj: testDateObj, testObj: testObj, testArr: testArr}], copyOnlyIfAbsent: true,
                        expectedResultObj: {testNum: testNum, testNumObj: testNumObj, testStr: testStr, testDateObj: testDateObj, testObj: testObj, testArr: testArr}},
        {recipientObj: {testNum: testNum, testNumObj: testNumObj, testStr: testStr}, donorObjArray: [{testNum: null, testNumObj: null, testStr: null}],
            expectedResultObj: {testNum: null, testNumObj: null, testStr: null}},
        {recipientObj: {testNum: testNum, testNumObj: testNumObj, testStr: testStr}, donorObjArray: [{testNum: null, testNumObj: null, testStr: null}], copyOnlyIfAbsent: false,
            expectedResultObj: {testNum: null, testNumObj: null, testStr: null}},
        {recipientObj: {testNum: testNum, testNumObj: testNumObj, testStr: testStr}, donorObjArray: [{testNum: null, testNumObj: null, testStr: null}], copyOnlyIfAbsent: true,
            expectedResultObj: {testNum: testNum, testNumObj: testNumObj, testStr: testStr}}
    ];
    
    var testFunc = function(assert){
        
        for(var i = 0; i < testDataObjArray.length; i++)
        {
            var currentTestDataObj = testDataObjArray[i];

            var recipientObj = currentTestDataObj.recipientObj;
            var donorObjArray = currentTestDataObj.donorObjArray;
            var copyOnlyIfAbsent = currentTestDataObj.copyOnlyIfAbsent;
            var expectedResultObj = currentTestDataObj.expectedResultObj;
            
            
            copyObjectProperties(recipientObj, donorObjArray, copyOnlyIfAbsent);
            
            assert.deepEqual(recipientObj, expectedResultObj);
        }
    };
      
    QUnit.test("copyObjectProperties", testFunc);
})()
*/

/*
//procureOperationOptions test
(function(){
    
    var testDataObjArray = [
        {storageOperationType: "set", specifiedOptionsObj: undefined, expectedResultObj: defaultOperationOptionsObj.set},
        {storageOperationType: "get", specifiedOptionsObj: {conductDisjointly: true}, expectedResultObj: {conductDisjointly: true, regenerate: false}}
    ]
    
    var testFunc = function(assert){
        
        for(var i = 0; i < testDataObjArray.length; i++)
        {
            var currentTestDataObj = testDataObjArray[i];

            var storageOperationType = currentTestDataObj.storageOperationType;
            var specifiedOptionsObj = currentTestDataObj.specifiedOptionsObj;
            var expectedResultObj = currentTestDataObj.expectedResultObj;

            var actualOptionsObj = procureOperationOptions(storageOperationType, specifiedOptionsObj);
            assert.deepEqual(actualOptionsObj, expectedResultObj);
        }
    }
    
    QUnit.test("procureOperationOptions", testFunc);
})()
*/


/*
//procureStorageTypeOptions
(function(){
    
    var testDataObjArray = [
        {storageType: "cookie", expectedResultObj: defaultStorageTypeOptionsObj["cookie"]},
        {storageType: "userData", specifiedOptionsObj: {storeName: "testName"}, expectedResultObj: {storeName: "testName", locusElement: null,useBodyAsBackup: true}},
        {storageTYpe: "unsupportedStorageType", specifiedOptionsObj: {option1: 1, option2: 2, option3: "3"}, expectedResultObj: {option1: 1, option2: 2, option3: "3"}}
    ];
    
    var testFunc = function(assert){
        
        for(var i = 0; i < testDataObjArray.length; i++)
        {
            var currentTestDataObj = testDataObjArray[i];
            
            var storageType = currentTestDataObj.storageType;
            var specifiedOptionsObj = currentTestDataObj.specifiedOptionsObj;
            
            var expectedResultObj = currentTestDataObj.expectedResultObj;
            var actualOptionsObj = procureStorageTypeOptions(storageType, specifiedOptionsObj);
            
            assert.deepEqual(actualOptionsObj, expectedResultObj);
        }    
    };
    
    QUnit.test("procureStorageTypeOptions", testFunc);
})()
*/


/*
//conductStorageOperation test
(function(){
    
   
    var testDataObjArray = [
        {storageOperationType: "get", storageType: "cookie", argObj: {data: testArr}, expectedArgArray: [testArr, defaultStorageTypeOptionsObj.cookie, undefined]},
        {storageOperationType: "remove", storageType: "globalStorage", argObj: {data: testArr}, expectedArgArray: ["globalStorage", testArr, defaultStorageTypeOptionsObj.globalStorage, undefined]},
        {storageOperationType: "getAll", storageType: "userData", argObj: {filter: "true"}, expectedArgArray: [defaultStorageTypeOptionsObj.userData, undefined]},
        {storageOperationType: "getAll", storageType: "webSQL", argObj:{filter: "false"}, expectedArgArray: ["false", defaultStorageTypeOptionsObj.webSQL, undefined]},
        {storageOperationType: "removeAll", storageType: "indexedDB", argObj: {}, expectedArgArray: ["true", defaultStorageTypeOptionsObj.indexedDB, undefined]}
        
    ];
    
    var closureExpectedArgArray;
    
    var testFunc = function(assert){

        var getStorageMetatype = function(storageType){
            return (storageType === "globalStorage" || storageType === "sessionStorage" || storageType === "localStorage" ? "webStorage" : storageType);
        };
        
         var stubStorageOperationFunc = function(){
            assert.strictEqual(arguments.length, closureExpectedArgArray.length);
            
            for(var i = 0; i < arguments.length; i++)
                assert.deepEqual(arguments[i], closureExpectedArgArray[i]);
        };
        
        for(var i = 0; i < testDataObjArray.length; i++)
        {
            var currentTestDataObj = testDataObjArray[i];
            
            var storageOperationType = currentTestDataObj.storageOperationType;
            var storageType = currentTestDataObj.storageType;
            var argObj = currentTestDataObj.argObj;
            
            closureExpectedArgArray = currentTestDataObj.expectedArgArray;
            
            argObj.options = {};
            argObj.functions = {};
            argObj.functions[getStorageMetatype(storageType)] = stubStorageOperationFunc;
            
            conductStorageOperation(storageOperationType, storageType, argObj)
        }
    }
    
    QUnit.test("conductStorageOperation", testFunc);
    
})()
*/


/*
//procureDataItemIdentifyingEntityExternal test
(function(){
    
    var testDataObjArray = [
        {dataItemObj: {key: testStr, value: null}, storageType: "indexedDB", storageTypeOptionsObj: {objectStoreData: {keyPath: null}}, expectedResultObj: testStr},
        {dataItemObj: {key: null, value: {key1: {key2: {key3: testStr}}}}, storageType: "indexedDB", storageTypeOptionsObj: {objectStoreData: {keyPath: "key1.key2.key3"}}, expectedResultObj: testStr},
        {dataItemObj: {key: null, value: {key1: 1, key2: 2, key3: 3, key4: 4}}, storageType: "webSQL", 
            storageTypeOptionsObj: {tableData:{ columnDefinitions:"key1 INTEGER PRIMARY KEY, key2 INTEGER PRIMARY KEY, key3 INTEGER PRIMARY KEY, key4 INTEGER"}},
            expectedResultObj: "key1 === 1 && key2 === 2 && key3 === 3"},
        {dataItemObj: {key: testStr, value: null}, storageType: "cookie", storageTypeOptionsObj: {}, expectedResultObj: testStr}
    ];
    
    var testFunc = function(assert){
        
        for(var i = 0; i < testDataObjArray.length; i++)
        {
            var currentTestDataObj = testDataObjArray[i];

            var dataItemObj = currentTestDataObj.dataItemObj;
            var storageType = currentTestDataObj.storageType;
            var storageTypeOptionsObj = currentTestDataObj.storageTypeOptionsObj;
            var expectedResultObj = currentTestDataObj.expectedResultObj;

            var actualIdentifyingEntity = procureDataItemIdentifyingEntityExternal(dataItemObj, storageType, storageTypeOptionsObj)

            assert.strictEqual(actualIdentifyingEntity, expectedResultObj);
        }
      
    };
    
    QUnit.test("procureDataItemIdentifyingEntityExternal", testFunc);
})()
*/

/*
//createItemExpirationDataCollectionExternal test
(function(){
    var testDataObjArray = [
        {storageType: "cookie", argObj: {data: []}, onePastSubsetEnd: 0, expectedResultObj: null},
        {storageType: "userData", argObj: {data: [{key: 1, value: 1, expirationTimeMillis: 1}, {key: 2, value: 2, expirationTimeMillis: 2}]},
            onePastSubsetEnd: 0, expectedResultObj: null},
        {storageType: "localStorage", argObj: {data:[{key: 1, value: 1, expirationTimeMillis: 1}, {key: 2, value: 2, expirationTimeMillis: 2}]}, 
            onePastSubsetEnd: 1, expectedResultObj: {storageType: "localStorage", dataArray: [{key: 1, expirationTimeMillis: 1, serializedLocationData: undefined}]}},
        {storageType: "webSQL", argObj: {data:[{key: 1, value: 1}, {key: 2, value: 2, expirationTimeMillis: 2}]},
            onePastSubsetEnd: 2, expectedResultObj: {storageType: "webSQL", dataArray: [{key: 2, expirationTimeMillis: 2, serializedLocationData: undefined}]}},
        {storageType: "indexedDB", argObj: {data:[{key: 1, value: 1, expirationTimeMillis: 1}, {key: 2, value: 2}]}, 
            onePastSubsetEnd: 2, expectedResultObj: {storageType: "indexedDB", dataArray: [{key: 1, expirationTimeMillis: 1, serializedLocationData: undefined}]}},
        {storageType: "fileSystem", argObj: {data:[{key: 1, value: 1, expirationTimeMillis: 1}, {key: 2, value: 2, expirationTimeMillis: 2}]}, 
            onePastSubsetEnd: 2, expectedResultObj: {storageType: "fileSystem", dataArray: [{key: 1, expirationTimeMillis: 1, serializedLocationData: undefined},
                                                     {key: 2, expirationTimeMillis: 2, serializedLocationData: undefined}]}}
    ]
    
    var procureDataItemIdentifyingEntityStub = function(dataItemObj, storageType, storageTypeOptionsObj){return dataItemObj.key;}

    var testFunc = function(assert){
        
        for(var i = 0; i < testDataObjArray.length; i++)
        {
            var currentTestDataObj = testDataObjArray[i];
            
            var storageType = currentTestDataObj.storageType;
            var argObj = currentTestDataObj.argObj;
            var onePastSubsetEnd = currentTestDataObj.onePastSubsetEnd;
            var expectedResultObj = currentTestDataObj.expectedResultObj;
            
            argObj.options = {};
            
            var actualItemExpirationDataCollection = createItemExpirationDataCollectionExternal(storageType, argObj, onePastSubsetEnd, procureDataItemIdentifyingEntityStub);
            
            assert.deepEqual(actualItemExpirationDataCollection, expectedResultObj);
        }
        
    };
    
    QUnit.test("createItemExpirationDataCollectionExternal", testFunc);
})()
*/


/*
//createRegenerationDataItemObjectsExternal test
(function(){
    
    var testDataObjArray = [
        {regenerationArgObjArray: [{data:["key1"]}], resultDataObj: {key1: 1}, expectedResultObj: [{data: [{key: "key1", value: 1}]}]},
        {regenerationArgObjArray: [{data:["key1", "key2"]}], resultDataObj: {key1: 1, key2: 2}, expectedResultObj: [{data: [{key: "key1", value: 1}, {key: "key2", value: 2}]}]},
        {regenerationArgObjArray: [{data:["key1", "key2", "key3"]}], resultDataObj: {key1: 1, key2: 2, key3: null}, expectedResultObj: [{data: [{key: "key1", value: 1}, {key: "key2", value: 2}]}]},
        {regenerationArgObjArray: [{data:["key1", "key2", "key3"]}], resultDataObj: {key1: 1, key2: null, key3: 3}, expectedResultObj: [{data: [{key: "key1", value: 1}, {key: "key3", value: 3}]}]},
        {regenerationArgObjArray: [{data:["key1", "key2"]}, {data:["key2"]}], resultDataObj: {key1: 1, key2: null}, expectedResultObj: [{data: [{key: "key1", value: 1}]}]}
        
    ]
    
    var testFunc = function(assert){
        
        for(var i = 0; i < testDataObjArray.length; i++)
        {
            var currentTestDataObj = testDataObjArray[i];

            var regenerationArgObjArray = currentTestDataObj.regenerationArgObjArray;
            var resultDataObj = currentTestDataObj.resultDataObj;
            var expectedResultObj = currentTestDataObj.expectedResultObj;

            createRegenerationDataItemObjectsExternal(regenerationArgObjArray, resultDataObj);

            assert.deepEqual(regenerationArgObjArray, expectedResultObj);
        }  
    }
    
    QUnit.test("createRegenerationDataItemObjectsExternal", testFunc);
})()
*/



//removeAll_createExpirationDataObjectExternal test
(function(){
    
    //currentStorageType, argObj, keyArray
    var testDataObjArray = [
        {storageType: "cookie", argObj: {options: {cookie: defaultStorageTypeOptionsObj.cookie}}, keyArray: ["key1"]},
        {storageType: "userData", argObj: {options: {userData: defaultStorageTypeOptionsObj.userData}}, keyArray: ["key1", "key2"]},
        {storageType: "fileSystem", argObj: {options: {fileSystem: defaultStorageTypeOptionsObj.fileSystem}}, keyArray: ["", "key0", "/key0", "\\key0", "dir1/key1", "dir1\\key1"]},
        {storageType: "silverlight", argObj: {options: {silverlight: procureStorageTypeOptions(defaultStorageTypeOptionsObj.silverlight, {conduitClass: "IsolatedStorageFile"})}},
                                     keyArray: ["dir1//key1", "dir1\\key1", "dir2/\\key2", "dir2\\/key2", "dir1/dir2/key3", "dir1\\dir2\\key3"]}
    ];
    
    
    storageOperationStubFuncCollectionObj.serializeLocationData = function(optionsObj){
        var str = ""; 
        for(var property in optionsObj)
            str += (str === "" ? "" : ";") + property + ":" + optionsObj[property];

        return str;
    }
    
    var endsWith = function(str, substr){return str.substr(str.length - substr.length) === substr;}

    var testFunc = function(assert){
        
        
        for(var i = 0; i < testDataObjArray.length; i++)
        {
            var currentTestDataObj = testDataObjArray[i];
            
            var storageType = currentTestDataObj.storageType;
            var argObj = currentTestDataObj.argObj;
            var keyArray = currentTestDataObj.keyArray;
            
            var isFileSystemType = (storageType === "fileSystem" || storageType === "silverlight" && argObj.options.silverlight.conduitClass === "IsolatedStorageFile");
            var expirationDataCollectionObj = removeAll_createExpirationDataObjectExternal(storageType, argObj, keyArray);
            
            assert.strictEqual(expirationDataCollectionObj.storageType, storageType);
            
            for(var j = 0; j < keyArray.length; j++)
            {
                var currentKey = keyArray[j];
                var currentExpirationDataObj = expirationDataObject.dataArray[j];

                assert.ok(endsWith(currentKey, currentExpirationDataObj.key));

                if(isFileSystemType)
                {
                    var directoryPath = currentKey.substring(0, currentKey.indexOf(currentExpirationDataObj.key));
                    if(directoryPath === "") directoryPath = "/" + directoryPath;
                    
                    assert.ok(currentExpirationDataObj.serializedLocationData.indexOf("directoryPath:" + directoryPath) !== -1, "storageType: " + storageType + "\ndirectoryPath: " + directoryPath + "\nkey: " + currentExpirationDataObj.key);
                }
            }
        } 
    }
    
    QUnit.test("removeAll_createExpirationDataObjectExternal", testFunc);
})()
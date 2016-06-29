
//Enum-like object containing values corresponding to load-related states an external file 
var externalFileStatusObj = {NOT_LOADED: 0, LOADING: 1, LOADED: 2, ERROR: 3};

//Contains key-value pairs each consisting of an external storage types and an object
//containing data and functions related to the loading of the file that defines code
//able to access a storage facility defined by the storage type
var externalFileAssocAssetsWrapperObj = {
    /*flash: createExternalFileAssociatedAssetsObj(9, flash_isSupportingVersionInstalled),
    silverlight: createExternalFileAssociatedAssetsObj(3, silverlight_isSupportingVersionInstalled)*/   //Many of the facilities & classes used in the xap file require Silverlight >= 3
}

//Contains key-value pairs each consisting of an external storage type and an object containing
//data structures which, depending on the storage operation status a given structure is associated
//with, contain either functions or function-containing objects related to storage operations
//associated with the paired storage type.
var externalStorageOperationAssetsWrapperObj = {
    flash: createExternalStorageOperationAssetObj(),
    silverlight: createExternalStorageOperationAssetObj()
}

window.bakedGoods_changeExternalFileStatus = changeExternalFileStatus;
window.bakedGoods_completeExternalStorageOperation = completeExternalStorageOperation;



/**
* Inserts a backslash in front of each backslash in a String; this allows the original 
* backslashes in the String to be preserved through interpretation by a Javascript engine
* as source code or a part of source code. 

* @param str	a String
* @return		a version of {@code str} in which all backslashes are escaped
*/
function escapeBackslashes(str)
{
	return str.replace("\\", "\\\\");
}



/**
 * Creates an object consisting of data and functions 
 * associated with the loading of an external file by a plugin.
 
 * @param minMajorPluginVersionRequired             a number denoting the minimum major version of a plugin
 *                                                  capable of processing the file that this function was invoked for
 * @param isSupportingPluginVersionInstalled        a function capable of determining whether the installed version of a plug-in 
 *                                                  supports all the functionality available in a given version
 * @return                                          an object consisting of data and functions associated with the loading of an 
 *                                                  external file by the plugin that {@code isSupportingPlginVersionInstalled} pertains to
 */
function createExternalFileAssociatedAssetsObj(minMajorPluginVersionRequired, isSupportingPluginVersionInstalled)
{
    return {
        canUse: undefined,
        domElement: undefined,
        status: externalFileStatusObj.NOT_LOADED,
        minMajorPluginVersionRequired: minMajorPluginVersionRequired,
        isSupportingPluginVersionInstalled: isSupportingPluginVersionInstalled,
        createDOMElement: undefined
    };
}



/**
 * Creates an Object consisting of data structures which, depending on the storage operation status
 * a given structure is associated with, contain either functions or function-containing
 * objects related to storage operations which target data in an external storage facility.
 
 * @return      an Object consisting of:
 *                  - an array which will function as a queue of objects, each of which
 *                    contains functions associated with a pending external storage operation
 *                  - an Object which will map a unique ID to the complete()
 *                    function of an active external storage operation
 */
function createExternalStorageOperationAssetObj()
{
    return {
        pendingOperationActionObjArray: [],
        activeOperationCompleteFuncObj: {}
    } 
}



/**
 * Advances the state of storage operations to be conducted in a given storage facility.
 
 * @param storageType
 * @param advanceFuncName       a String denoting the name of the functions related to the storage operation that 
 */
function advancePendingExternalStorageOperations(storageType, advanceFuncName)
{
    //Obtain a handle to the object containing assets associated with storage operations linked to storageType
    var storageTypeOperationAssetsObj = externalStorageOperationAssetsWrapperObj[storageType];
    
    var pendingOperationActionObjArray = storageTypeOperationAssetsObj.pendingOperationActionObjArray;

    //Create a boolean denoting whether the storage operations represented in pertinentAssetObjArray are to be executed
    var areToBeExecuted = (advanceFuncName === "execute");
    
    //Loop through the objects in pertinentAssetObjArray, advancing 
    //the state of the storage operation each represents by directly
    //or indirectly invoking the function identified by asFuncName
    var pendingStorageOperationCount = pendingOperationActionObjArray.length;
    for(var i = 0; i < pendingStorageOperationCount; i++)
    {
        var currentOperationAssetsObj = pendingOperationActionObjArray[i];
        
        if(areToBeExecuted)
            executeExternalStorageOperation(storageTypeOperationAssetsObj, currentOperationAssetsObj.execute, currentOperationAssetsObj.complete);
        else
            currentOperationAssetsObj[advanceFuncName]();
    }
    /////
        
    //Discard the contents of pertinentAssetsObjArray
    pendingOperationActionObjArray = [];
}



/**
 * Changes the load status of a file that contains code able 
 * to conduct storage operations on a browser-external facility.
 
 *@param storageType            a String denoting the type of storage facility
 *                              the file of interest is associated with
 *@param isLoadSuccessful       a boolean denoting whether the file of interest was loaded successfully
 */
function changeExternalFileStatus(storageType, isLoadSuccessful)
{
    var pertinentFileAssocAssetObj = externalFileAssocAssetsWrapperObj[storageType];
    var advanceFuncName;
    
    if(isLoadSuccessful)
    {
        pertinentFileAssocAssetObj.status = externalFileStatusObj.LOADED;
        advanceFuncName = "execute";
    }
    else
    {
        pertinentFileAssocAssetObj.status = externalFileStatusObj.ERROR;
        advanceFuncName = "errorComplete";
    }

    advancePendingExternalStorageOperations(storageType, advanceFuncName);
}
    
    
    
/**
 * Invokes the client-side function associated with a given external
 * storage operation capable of utilizing the data resulting from it.
 
 * @param storageType           a String denoting the type of storage facility the triggering operation was conducted in
 * @param operationID           a String uniquely identifying the complete() function associated with the triggering operation 
 * @param resultDataArray       an array of Objects resulting from the execution of the triggering operation
 */
function completeExternalStorageOperation(storageType, operationID, resultDataArray)
{
    //Obtain a handle to the object containing assets of storage operations associated with storageType  
    var storageTypeOperationAssetsObj = externalStorageOperationAssetsWrapperObj[storageType];
    
    //Obtain a handle to the complete function mapped to the current
    //operation and remove the mapping from storageTypeOperationAssetsObj
    var complete = storageTypeOperationAssetsObj.activeOperationCompleteFuncObj[operationID];
    delete storageTypeOperationAssetsObj.activeOperationCompleteFuncObj[operationID];
    /////
    
    //Utilize (in the context of storage operation processing) the data resulting from the operation
    complete.apply(window, resultDataArray);
}



/**
 * Groups and stores the functions associated with an external storage operation at the end 
 * of a collection of similar entities, essentially queueing the storage operation of interest.
 
 * @param externalStorageOperationAssetsObj     an Object consisting of data structures which, depending on the storage operation status
 *                                              a given structure is associated with, contain either functions or function-containing
 *                                              objects related to storage operations which target data in the locus storage facility
 * @param execute                               a function capable of executing a storage operation inside the locus storage facility
 * @param complete                              a function capable of utilizing the data resulting from the to-be-conducted storage operation
 * @param errorComplete                         a function capable of performing contingency processing if an 
*                                               exception occurs during the conduction of the storage operation 
 */
function queueExternalStorageOperation(externalStorageOperationAssetsObj, execute, complete, errorComplete)
{
    var actionObj = {execute: execute, complete: complete, errorComplete: errorComplete};
    externalStorageOperationAssetsObj.pendingOperationActionObjArray.push(actionObj);
}



/**
* Creates a String suitable for identifying an entity.

* @return      a String suitable for identifying an entity
*/
function createID()
{
    //Base the to-be-returned String on the milllisecond value of the current time instant
    var idStr = new Date().getTime() + "_";
    
    var randomCharCount = 4;
    
    //Append to idStr the number of random characters denoted by randomCharCount 
    for(var i = 0; i < randomCharCount; i++)
    {
        var curRandomNum = Math.floor((Math.random() * 26)) + 65;
        idStr += String.fromCharCode(curRandomNum);
    }
    /////

    return idStr;
}



/**
 * Executes a series of operations which put in to place a conclusion facility for,
 * and commences the execution of, a storage operation in a browser-external facility.
 
 * @param externalStorageOperationAssetsObj     an Object consisting of data structures which, depending on the storage operation status
 *                                              a given structure is associated with, contain either functions or function-containing
 *                                              objects related to storage operations which target data in the locus storage facility
 * @param execute                               a function capable of executing a storage operation inside the locus storage facility
 * @param complete                              a function capable of utilizing the data resulting from the to-be-conducted storage operation
 */
function executeExternalStorageOperation(externalStorageOperationAssetsObj, execute, complete)
{
    var operationID = createID();
    externalStorageOperationAssetsObj.activeOperationCompleteFuncObj[operationID] = complete;
    execute(operationID);
}



/**
 * Performs a sequence of operations which ensure the essential conditions for
 * and commence the execution of a storage operation in a browser-external facility.

 * @param externalFileAssocAssetsObj            an Object consisting of data and functions pertinent to the loading of a file
 *                                              which contains code able to perform storage operations the locus storage facility
 * @param externalStorageOperationAssetsObj     an Object consisting of data structures which, depending on the storage operation status
 *                                              a given structure is associated with, contain either functions or function-containing
 *                                              objects related to storage operations which target data in the locus storage facility
 * @param execute                               a function capable of executing a storage operation inside the locus storage facility
 * @param complete                              a function capable of utilizing the data resulting from the to-be-conducted storage operation
 * @param errorComplete                         a function capable of performing contingency processing if an 
*                                               exception occurs during the conduction of the storage operation 
 */
function conductExternalStorageOperation(externalFileAssocAssetsObj, externalStorageOperationAssetsObj, execute, complete, errorComplete) 
{
    var fileStatus = externalFileAssocAssetsObj.status;
		
	if(externalFileAssocAssetsObj.canUse && fileStatus !== externalFileStatusObj.ERROR)
	{
		if(fileStatus === externalFileStatusObj.NOT_LOADED || fileStatus === externalFileStatusObj.LOADING)
		{
			//Queue the storage operation (by queuing  its associated assets: execute, complete, errorComplete);
			//It will be executed upon the successful loading of the file which contains code able to access the locus storage facility
			queueExternalStorageOperation(externalStorageOperationAssetsObj, execute, complete, errorComplete);
			
			//If the file containing code able to perform storage operations on the locus facility has not been loaded,
			//update its load status before creating a DOM element which will contain the data defined by the file
			if(fileStatus === externalFileStatusObj.NOT_LOADED)
			{
				fileStatus = externalFileAssocAssetsObj.status = externalFileStatusObj.LOADING;
				externalFileAssocAssetsObj.createDOMElement();
			}
			/////
		}	
		else    //can execute storage operation
			executeExternalStorageOperation(externalStorageOperationAssetsObj, execute, complete);       
	}
	else
		errorComplete();
}



/**
* Creates a function capable of extracting and commencing the processing of
* criterea-meeting data items from the data set resulting from an unconditional
* retrieval operation in a storage facility.

* @param exprStr        a String representation of a Javascript boolean expression
* @param complete       a function capable of utilizing data resulting from a 
*                       conditional retrieval operation on the data in a storage facility
* @param onlyKeys       a boolean denoting if only the keys of the criterea-meeting items
*                       are to be extracted from the data resulting from the unconditional retrieval
* @return               a function capable of extracting and commencing the processing 
*                       of criterea-meeting data items in the result set 
*                       of an unconditional retrieval opereation
*/
function createConditionalGetAllCompleteFunc(exprStr, complete, onlyKeys)
{
    var originalComplete = complete;

    complete = function(processedItemCount, dataItemObjArray){

        var resultEntityArray = [];

        //Loop through the key-value pairs in keyValuePairsObj, pushing objects on to dataObjArray each containing
        //the constituents of a pair that, when utilized to evaluate exprStr, cause true to be returned
        var dataItemCount = dataItemObjArray.length;
        for(var i = 0; i < dataItemCount; i++)
        {
            //Put the key and value objects of the current data item in to local variables
            //with reserved identifiers. If the identifiers appear in exprStr, the
            //corresponding objects will be utilized in place of them during its evaluation
            var currentDataItemObj = dataItemObjArray[i];
            var keyObj = currentDataItemObj.key;
            var valueObj = currentDataItemObj.value; 
            /////

            if(eval(escapeBackslashes(exprStr)) === true)		//Since the arugment of eval is assumed to be Javascript source code, we escape the backslashes in 
			{														//exprStr, transforming it in to its source code representation, before feeding it to the function
                var resultEntity = (onlyKeys ? keyObj : currentDataItemObj);
                resultEntityArray.push(resultEntity);
            }
        }
        /////

        originalComplete(resultEntityArray.length, resultEntityArray);
    }
    /////
    
    return complete;
}



/**
* Creates a function capable of removing criteriea-meeting
* data items from a storage facility before passing control flow to a 
* function capable of handling the conclusion of such an operation.

* @param exprStr                    a String representation of a Javascript boolean expression
* @param optionsObj                 an Object containing auxiliary data pertinent to the spawning removal operation
* @param remove                     a function capable of removing data items identified in a 
*                                   collection of keys from the storage facility which the spawning removal operation
* @param complete                   a function capable of utilizing data resulting from a conditional
*                                   removal operation on the data in a storage facility
* @param removeExpirationData       an optional boolean denoting whether the keys of the criterea-meeting data items should 
                                    be collected in preparation for the removal of the expiration data related to them
*/
function createConditionalRemoveAllCompleteFunc(exprStr, optionsObj, remove, complete, removeExpirationData)
{
    var resultDataEntity;
    
    /**
     * Passes control flow to {@code complete} after the elements in
     * {@code resultDataEntity} (populated during the execution
     * of {@code getAllComplete} have been used in a removal operation.
     
     * @param processedItemCount        an int denoting the number of data items keyed by a zero-indexed continuous
     *                                  subset of the elements in {@code resultDataEntity} that have been removed
     */
    function removeAllComplete(processedItemCount)
    {
        if(resultDataEntity) 
        {
            resultDataEntity = resultDataEntity.slice(0, processedItemCount); 
            complete(processedItemCount, resultDataEntity);
        }
        else
            complete(processedItemCount);
    }

    /**
     * Conducts a removal operation on the pertinent storage
     * facility targeting items keyed in a collection.
     
     * @param targetDataItemCount           an int denoting the number of elements the 
     *                                      to-be-conducted operation is to target
     * @param targetDataItemKeyArray        an array containing elements identifying the data items
     *                                      to be targeted in the pertinent storage facility
     */
    function removeAll(targetDataItemCount, targetDataItemKeyArray)
    {
        if(removeExpirationData) resultDataEntity = targetDataItemKeyArray;
        
        if(targetDataItemKeyArray.length > 0)
            remove(targetDataItemKeyArray, optionsObj, removeAllComplete);
        else
            removeAllComplete(0);
    }

    return createConditionalGetAllCompleteFunc(exprStr, removeAll, true);
}



/**
 * Creates a function able to perform contingency processing in the event
 * the locus storage facility of a storage operation cannot be accessed.
 
 * @param operationType     a String denoting a storage operation type
 * @param complete          a function capable of utilizing the data resulting from a storage operation
 * @return                  a function capable of performing contingency processing in the event
 *                          the storage facility linked to {@complete} cannot be accessed
 */
function createExternalStorageErrorCompleteFunc(operationType, complete)
{
    var errorComplete;
    
    switch(operationType)
    {
        case "get":     errorComplete = function(){complete(0, {})}; break;
        case "getAll":  errorComplete = function(){complete(0, [])}; break;
        default:        errorComplete = function(){complete(0)};     break;      
    }
    
    return errorComplete;
}


/*
//conductExternalStorageOperation test
(function(){
    
    var testFunc = function(assert){
		
		var mockExternalFileAssocAssetsObj = {
			createDOMElement: function(){
				assert.ok(this.canUse);
				assert.strictEqual(this.status, externalFileStatusObj.LOADING);
			}, 
			canUse:undefined, 
			status:undefined
		};
		
		var mockExternalStorageOperationAssetsObj = {activeOperationCompleteFuncObj:{}};
		
        var canUsePluginStubObj = {yes: function(){return true;}, no: function(){return false;}};
		
        var queueExternalStorageOperationStub = function(){
            var doesFileHaveStatusOf_notLoaded = (mockExternalFileAssocAssetsObj.status === externalFileStatusObj.NOT_LOADED);
            var doesFileHaveStatusOf_loading = (mockExternalFileAssocAssetsObj.status === externalFileStatusObj.LOADING);
            
            assert.ok(doesFileHaveStatusOf_notLoaded || doesFileHaveStatusOf_loading);
            assert.ok(mockExternalFileAssocAssetsObj.canUse);
        };
		
        var executeExternalStorageOperationStub = function(){
            assert.ok(mockExternalFileAssocAssetsObj.canUse);
            assert.strictEqual(mockExternalFileAssocAssetsObj.status, externalFileStatusObj.LOADED);
        };
        
        var errorCompleteStub = function(){
            var hasFileLoadFailed = (mockExternalFileAssocAssetsObj.status === externalFileStatusObj.ERROR);
            assert.ok(!mockExternalFileAssocAssetsObj.canUse || hasFileLoadFailed);
        };
		
        var queueExternalStorageOperationOriginal = window.queueExternalStorageOperation;
        window.queueExternalStorageOperation = queueExternalStorageOperationStub;
        
        for(var canUsePluginBool in canUsePluginStubObj)
        {
			mockExternalFileAssocAssetsObj.canUse = canUsePluginStubObj[canUsePluginBool]();
            
            for(var fileStatusLabel in externalFileStatusObj)
            {
                mockExternalFileAssocAssetsObj.status = externalFileStatusObj[fileStatusLabel];
                conductExternalStorageOperation(mockExternalFileAssocAssetsObj, mockExternalStorageOperationAssetsObj, executeExternalStorageOperationStub, null, errorCompleteStub);
            }
        }
        
        window.queueExternalStorageOperation = queueExternalStorageOperationOriginal;
    }
    
    QUnit.test("conductExternalStorageOperation", testFunc);
})()
*/
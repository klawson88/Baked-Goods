/**
* Creates all the components named in a (HTML5) file system directory path that do not currently exist.

* @param directoryEntry                     the DirectoryEntry that the directory path defined by the
*                                           elements in {@code directoryPathComponentArray} is relative to
* @param directoryPathComponentArray        an Array of Strings containing, in sequential order, the names of the 
                                            constituent DirectoryEntries in a directory path
* @param targetComponentIndex               an int denoting the index in {@code directoryPathComponentArray}
                                            containing the name of the directoryEntry to be procured
* @param storageOperationFuncObj            an object containing functions which further execution in the context 
*                                           of the storage operation responsible for the invocation of this function
*/
function realizeDirectoryPath(directoryEntry, directoryPathComponentArray, targetComponentIndex, storageOperationFuncObj)
{
   /**
    * Furthers the execution of the realization operation, or starts the invoking storage
    * operation, depending on the presence of any unrealized directories named in 
    * directoryPathComponentArray after successful procurement of a path component.

    * @param procuredDirectoryEntry     the DirectoryEntry resulting from a directory procurement operation
    */
    function procureDirectoryComplete(procuredDirectoryEntry)
    {
        if(++targetComponentIndex < directoryPathComponentArray.length)
            realizeDirectoryPath(procuredDirectoryEntry, directoryPathComponentArray, targetComponentIndex, storageOperationFuncObj);
        else
            storageOperationFuncObj.execute(procuredDirectoryEntry);
    }

    var targetDirectoryEntryName = directoryPathComponentArray[targetComponentIndex];
    var flagsObj = {create:true, exclusive: false};

    directoryEntry.getDirectory(targetDirectoryEntryName, flagsObj, procureDirectoryComplete, storageOperationFuncObj.complete);
}
	
	
	
/**
* Furthers execution after an occurance of an error due to a directory access operation. 

* @param error  an Object representing and denoting the error caused by a directory access operation
*/
function handleDirectoryAccessErrorExt(error, realizeDirectoryPathBool, rootDirectoryEntry, directoryPath, resolutionFunc, storageOperationFunc, accessErrorCompleteFunc)
{
    if(error.name === "NotFoundError" && realizeDirectoryPathBool)
    {
        //Create an array of the directory names in the data item set's prospective directory path
        //(first regex rids the directory path of leading and trailing slashes that would otherwise cause
        //the array resulting from the split to contain empty strings at the beginning or end, respectively)
        var directoryPathComponentArray = directoryPath.replace(/(?:^\s*(?:\/|\\)+)|(?:(?:\/|\\)+\s*$)/g, "").split(/(?:\/|\\)+/g);

        //Store the functions capable of executing or aborting the storage operation in an object for easier handling
        var storageOperationFuncObj = {execute: storageOperationFunc, complete: accessErrorCompleteFunc};

        resolutionFunc(rootDirectoryEntry, directoryPathComponentArray, 0, storageOperationFuncObj);
    }
    else
        accessErrorCompleteFunc();
}
	
	
	
/**
* Executes a storage operation in a specific directory inside a given (HTML5) file system.

* @param optionsObj			an object containing properties which describe the file system and child
                                        directory that the to-be-conducted operation is to take place in
* @param storageOperationFunc		a function capable of carrying out a storage operation in the 
                                        file system and directory specified in {@code optionsObj}
* @param accessErrorCompleteFunc        a function to be called if the specified file system or directory cannot be accessed
*/
function fileSystem_executeStorageOperation(optionsObj, storageOperationFunc, accessErrorCompleteFunc)
{
    //Obtain a handle to the function capable of granting access to file system. If no such 
    //function exists, invoke accessErrorCompleteFunc before aborting the storage operation
    var requestFileSystem = (window.requestFileSystem || window.webkitRequestFileSystem);
    if(!requestFileSystem){ accessErrorCompleteFunc(); return;}	
    /////

    var quotaManagementObj = window.webkitStorageInfo;

    var rootDirectoryEntry;

    var directoryPath = optionsObj.directoryPath;
    var isDirectoryPathToRoot = (directoryPath === "/" || directoryPath === "\\" || directoryPath === null || directoryPath === undefined);
    
    var canRealizeDirectoryPath = (isDirectoryPathToRoot ? false : (optionsObj.canRealizeDirectoryPath || false));
    var realizeDirectoryPathBool = (canRealizeDirectoryPath && optionsObj.realizeDirectoryPath);

   /**
    * Furthers execution after an occurance of an error due to a directory access operation. 

    * @param error      an Object representing and denoting the error caused by a directory access operation
    */
    function handleDirectoryAccessError(error)
    {
        if((error.name === "NotFoundError" || error.code === error.NOT_FOUND_ERR) && realizeDirectoryPathBool)
        {
            //Create an array of the directory names in the data item set's prospective directory path
            //(first regex rids the directory path of leading and trailing slashes that would otherwise cause
            //the array resulting from the split to contain empty strings at the beginning or end, respectively)
            var directoryPathComponentArray = directoryPath.replace(/(?:^\s*(?:\/|\\)+)|(?:(?:\/|\\)+\s*$)/g, "").split(/(?:\/|\\)+/g);
            
            //Store the functions capable of executing or aborting the storage operation in an object for easier handling
            var storageOperationFuncObj = {execute: storageOperationFunc, complete: accessErrorCompleteFunc};

            realizeDirectoryPath(rootDirectoryEntry, directoryPathComponentArray, 0, storageOperationFuncObj);
        }
        else
            accessErrorCompleteFunc();
    }

   /**
    * Executes {@code storageOperationFunc} on the directory specified in {@code optionsObj}.

    * @param fileSystem		the file system which contains the directory specified in {@code optionsObj}
    */
    function accessDirectory(fileSystem){
        rootDirectoryEntry = fileSystem.root;

        if(!isDirectoryPathToRoot)
        {
            var flagsObj = {create: canRealizeDirectoryPath, exclusive: false};
            rootDirectoryEntry.getDirectory(directoryPath, flagsObj, storageOperationFunc, handleDirectoryAccessError); 
        }
        else
            storageOperationFunc(rootDirectoryEntry);
    }

    //Will be called to request access to the file system specified by {@code optionsObj}
    var accessFunc = function(quotaByteSize){
        requestFileSystem(optionsObj.storageType, quotaByteSize, accessDirectory, accessErrorCompleteFunc);
    };

    //If we have to request a storage quota before we can request a file system, reassign accessFunc to a
    //function which requests the quota and calls the original accessFunc upon the success of the request
    if(quotaManagementObj && optionsObj.storageType === window.PERSISTENT)
    {
        var subAccessFunc = accessFunc;
        accessFunc = function(quotaByteSize){
             quotaManagementObj.requestQuota(optionsObj.storageType, quotaByteSize, subAccessFunc, accessErrorCompleteFunc);
        };
    }
    /////

    accessFunc(optionsObj.size);	
}
	
	
	
/**
* Performs a (HTML5) file system write operation on prospective or existing files in a directory that
* are each identified with the data to be written to them in objects in a given collection. 

* @param dataArray      an array of Objects each containing a data item to be persisted in a
                        file system, a String which will identify it in the file system, and (optionally) 
                        data to be used to dictate the write operation for that data item
* @param optionsObj     an object containing auxiliary data pertinent to the set operation
* @param complete	a function capable of progressing the execution of the set of related storage operations this operation belongs to
*/
function fileSystem_set(dataArray, optionsObj, complete)
{
    var dataCount = dataArray.length;
    var i = 0;

    //Will store a handle to the directory containing the files keyed in dataArray
    var locusDirectoryEntry;

    //Will be used to store a reference to the currently processing data object in dataArray
    var currentDataObj;

    //Determine whether blobs can be constructed with the Blob constructor
    var isBlobConstructorPresent = !!window.Blob;

    //Obtain a handle to the browser's BlobBuilder constructor (will only be used if !isBlobConstructorPresent)
    var BlobBuilder = (!isBlobConstructorPresent ? (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder) : undefined);
    
    //Essential variables which will collectively specify the subtleties of, and dictate how 
    //a given write sub-operation will be performed. They are batch-defined before each write 
    //sub-operation in order to capture per-data item operation specifications that may be present
    var truncateBeforeWrite;
    var writeOnlyIfAbsent;
    var truncatePosition;
    var startPosition
    
    var startsAtFileBegin;
    var truncateEntireFile;
    /////
    
   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.

    * @param error      an optional Object representing and describing an error spawned by, 
    *       		and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error){ if(error) complete(i, error); else complete(i); }

   /**
    * Advances the set operation.
    */
    function advance()
    {
        if(++i < dataCount) set();          //process the data item at i (which was just incremented in the 'if' clause)
        else                completeNow();
    }

   /**
    * Writes to the current file of interest, the data specified to be written to it.

    * @param fileWriter     the FileWriter which will be used to carry out the write operation
    */
    function write(fileWriter)
    {
        var type = (currentDataObj.type || "");
        var dataBlob;

        //Create a blob containing the data payload of the currently processing item. Blobs can either 
        //be created using BlobBuilder (deprecated) or the Blob constructor. All browser versions that  
        //support file system also support at least one of the two blob construction procedures
        if(!isBlobConstructorPresent)		
        {							
            var blobBuilder = new BlobBuilder();
            blobBuilder.append(currentDataObj.value);
            dataBlob = blobBuilder.getBlob();
        }
        else
            dataBlob = new Blob([currentDataObj.value], {type: type});
        /////

        //Create a flag which will be used to indicate whether data has actually 
        //started to be written. This is how we'll differentiate between completed truncate
        //operations (which may be carried out in preperation for writes) and writing operations
        var writeStarted = false;

        /**
        * Writes the data payload of the currently processing item (contained in 
        * {@code dataBlob}) to the file that {@code fileWriter} is linked to.
        */
        function writeData()
        {
            //Number.MAX_VALUE is the value chosen to represent "one past the last"
            //byte written to the file. Redefine startPosition as this value if necessary 
            if(startPosition === Number.MAX_VALUE)
                startPosition = fileWriter.length;

            writeStarted = true;
            fileWriter.seek(startPosition);
            fileWriter.write(dataBlob);
        }

        //Designate an anonymous function to execute after the conclusion of a writing operation that will, depending
        //on the concluded operation type and completion status, commence, advance, or conclude the write for this file.
        fileWriter.onwriteend = function(event){
            var errorOccurred = (fileWriter.error !== null);

            if(!errorOccurred)	
            {
                if(!writeStarted)       //(if the completed operation was a preparatory truncate)
                    writeData();
                else                    //write was successful
                    advance();	
            }
            else
                completeNow();	//conclude the operation
        }
        /////

        if(truncateBeforeWrite)
        {
            //Number.MAX_VALUE is the value chosen to represent "one past" the last byte written 
            //to the file. Redefine truncatePosition as this value if necessary
            if(truncatePosition === Number.MAX_VALUE)
                truncatePosition = fileWriter.length;

            //Delete the data presently in the file past truncatePosition. The onwriteend 
            //handler will commence the actual writing upon completion of the truncate 
            fileWriter.truncate(truncatePosition);         
        }
        else           
            writeData();
    }

   /**
    * Creates a FileWriter for the current file of interest 
    * which will write the data specified to be written to it. 

    * @param fileEntry      a FileEntry representing the file named in the currently processing object in {@code dataArray}
    */
    function createFileWriter(fileEntry)
    {
        fileEntry.createWriter(write, completeNow);
    }

   /**
    * Defines or redefines the write operation related variables in preparation for  
    * the write operation to be conducted on the currently processing data item.
    */
    function rectifyWriteVariables()
    {
        truncateBeforeWrite = (currentDataObj.hasOwnProperty("truncateBeforeWrite") ? currentDataObj.truncateBeforeWrite : optionsObj.truncateBeforeWrite);
        writeOnlyIfAbsent = (currentDataObj.hasOwnProperty("writeOnlyIfAbsent") ? currentDataObj.writeOnlyIfAbsent : optionsObj.writeOnlyIfAbsent);
        truncatePosition = (currentDataObj.hasOwnProperty("truncatePosition") ? currentDataObj.truncatePosition : optionsObj.truncatePosition);
        startPosition = (currentDataObj.hasOwnProperty("startPosition") ? currentDataObj.startPosition : optionsObj.startPosition);

        startsAtFileBegin = (startPosition <= 0);
        truncateEntireFile = truncateBeforeWrite && (truncatePosition <= 0);
    }

/**
    * Writes the currently processing data item in {@code dataObjArray} to disk.

    * @param directoryEntry     an optional DirectoryEntry object used to set {@code locusDirectoryEntry}, which represents 
    *				the parent directory (or soon-to-be parent directory) of the operation's target file(s)
    */
    function set(directoryEntry)
    {
        if(!locusDirectoryEntry) locusDirectoryEntry = directoryEntry;

        currentDataObj = dataArray[i];
        rectifyWriteVariables();

        locusDirectoryEntry.getFile(
            dataArray[i].key, 
            {create: startsAtFileBegin && truncateEntireFile, exclusive: writeOnlyIfAbsent},
            createFileWriter,
            completeNow
        );
    }

    //Indicate that this operation is allowed to bring in to existence
    //components of the specified directory path that are missing 
    optionsObj.canRealizeDirectoryPath = true;

    fileSystem_executeStorageOperation(optionsObj, set, completeNow);
}
	
	
	
/**
* Obtains the contents of a FileEntry in a specified format.

* @param fileEntry          				the to-be-read FileEntry
* @param optionsObj         				an object containing auxiliary data pertinent to the read operation
* @param conclusionFunc     				a function capable of handling what is brought about by the conclusion of the read operation
* @param individualOperationOptionsObj		an optional object containing data specified specifically to be used 
*                           				(appropriately) in the read operation to be conducted on {@code fileEntry}
*/
function readFileEntry(fileEntry, optionsObj, conclusionFunc, individualOperationOptionsObj)
{
   /**
    * Reads the contents of a file.

    * @param file		a File
    */
    function readFile(file)
    {
        var fileReader = new FileReader();

        //Designate anonymous functions which call conclusionFunc to execute upon conclusion
        //of the read operation with a boolean denoting the success of the operation as well as the object resulting from it
        fileReader.onload = function(){conclusionFunc(true, fileReader.result);};
        fileReader.onerror = function(error){conclusionFunc(false, error); };
        /////

        var readMethodName;
        //Assign to readMethodName the name of the fileReader method 
        //suitable for reading file data in the desired format
        var dataFormat = (individualOperationOptionsObj && individualOperationOptionsObj.hasOwnProperty("dataFormat") 
                                                ? individualOperationOptionsObj.dataFormat : optionsObj.dataFormat);
        switch(dataFormat)
        {
            case "dataURL": 	readMethodName = "readAsDataURL"; 	break;
            case "arrayBuffer": readMethodName = "readAsArrayBuffer";	break;
            default: 		readMethodName = "readAsText"; 		break;
        }
        /////

        var dataEncoding = (individualOperationOptionsObj  && individualOperationOptionsObj.hasOwnProperty("dataEncoding") 
                                                                ? individualOperationOptionsObj.dataEncoding : null);
        fileReader[readMethodName](file, dataEncoding);
    }
    
    fileEntry.file(readFile, conclusionFunc);
}
	
	
	
/**
*
* Removes an Entry from an (HTML5) file system.

* @param entry              the to-be-removed Entry
* @param optionsObj         an object containing auxiliary data pertinent to the remove operation
* @param conclusionFunc     a function capable of handling what is brought about by the conclusion of the read operation
*/
function removeEntry(entry, optionsObj, conclusionFunc)
{
    //Designate anonymous functions which call conclusionFunc to execute upon conclusion
    //of the removal operation with a boolean denoting the success of the operation
    var successCallback = 	function(){ conclusionFunc(true); }
    var errorCallback = 	function(error){ conclusionFunc(false, error); }
    /////

    entry.remove(successCallback, errorCallback);
}
		
	
	
/**
* Carries out an (HTML5) file system get or remove operation on items  
* in a specified directory that are named in a given collection.

* @param operationType      a String denoting the to-be-conducted storage operation
* @param dataArray          an Array of Objects, each of which either identifies the data items,
*                           or contains identifying and operation pertinent data related 
*                           to the data items that are to be subject to the operation 
* @param optionsObj         an object containing auxiliary data pertinent to
*                           the to-be-conducted storage operation
* @param complete           a function capable of progressing the execution of the set
*                           of related storage operations this operation belongs to
*/
function fileSystem_getOrRemove(operationType, dataArray, optionsObj, complete)
{
    var isGet = (operationType === "get");

    var keyValuePairsObj = (isGet ? {} : undefined);
    var dataCount = dataArray.length;

    var currentDataEntity;
    var currentDataItemKey;
    var i = 0;

    //Will store a handle to the directory containing the files keyed in dataArray
    var locusDirectoryEntry;

    //Store the function capable of carrying out the specified storage operation
    var operationFunc = (isGet ? readFileEntry : removeEntry);

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.

    * @param error      an optional Object representing and describing an error spawned by, 
    *                   and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error)
    { 
        var argArray = [i];
        if(keyValuePairsObj) argArray.push(keyValuePairsObj);
        if(error) argArray.push(error);

        complete.apply(complete, argArray);
    }

   /**
    * Advances the execution of the storage operation.

    * @param isSuccessful       a boolean denoting whether the most recently executed sub-storage operation was a success
    * @param error              an optional Object representing and describing an error spawned by, 
    *                           and responsible for the conclusion of the invoking sub-storage operation
    */
    function advance(isSuccessful, error)
    {
        if(isSuccessful && ++i < dataCount)     performStorageOperation();	//process the data item at i (which was just incremented in the 'if' clause)
        else                                    completeNow(error);
    }

   /**
    * Processes the data, if any, resulting from the execution of the get/remove operation
    * on the file identified by the currently processing element in {@code dataArray}.

    * @param isSuccessful           a boolean denoting whether the storage operation 
    *                               responsible for this invocation was a success
    * @param operationResultObj     (optional) the result of the storage operation responsible for this invocation
    * @return                       true if {@code isSuccessful} === true or if failure was a
    *                               result of the absense of the item of interest, false otherwise
    */
    function processOperationResult(isSuccessful, operationResultObj)
    {
        //If the operation failed because of the absence of the keyed file, mark it as 
        //successful and set the payload to null. This makes the operation more robust and mimicks
        //the behavior of analogous storage operations on the other storage types in this scenario
        if(!isSuccessful && operationResultObj.name === "NotFoundError")
        {
            isSuccessful = true;
            operationResultObj = null;
        }
        /////

        //If this is a successful get operation, establish a mapping in keyValuePairsObj between
        //the currently processing key and the data it identifies in the file system
        if(isSuccessful && isGet) keyValuePairsObj[currentDataItemKey] = operationResultObj;

        return isSuccessful;
    }

   /**
    * Calls a function to process the result of most recent execution of operationFunc(), 
    * and another to advance execution of the over-arching operation.

    * @param isSuccessful           a boolean denoting whether the storage operation responsible
                                    for this invocation of this function was a success
    * @param operationResultObj     (optional) the result of the storage operation  
                                    responsible for this invocation of this function
    */
    function handleOperationConclusion(isSuccessful, operationResultObj)
    {
        advance(processOperationResult(isSuccessful, operationResultObj));
    }

   /**
    * Executes the specified storage operation on an Entry.

    * @param entry      the Entry that is the target of the to-be-executed operation
    */
    function executeOperation(entry)
    {
        //Create an object (to be used in the pending operation) containing
        //processing-relatedn data specific to the current data item of interest
        //if such data is defined for the operation and is present
        var individualOperationOptionsObj;
        if(isGet && (currentDataEntity.hasOwnProperty("key")))  //if currentDataEntity has a "key" property, it is assumed to be a simple object 
        {                                                           //containing identifying and processing-pertinent data for a data item
            individualOperationOptionsObj = {
                dataFormat: currentDataEntity.dataFormat, 
                dataEncoding: currentDataEntity.dataEncoding
            }
        }
        else
            individualOperationOptionsObj = undefined;
        /////
        
        operationFunc(entry, optionsObj, handleOperationConclusion, individualOperationOptionsObj);
    }

   /**
    * Carries out the specified storage operation on the data item
    * identified by the currently processing name in {@code dataArray}.

    * @param directoryEntry     an optional DirectoryEntry object used to set {@code locusDirectoryEntry}, 
    *				which represents the parent directory of the operation's target file(s)
    */
    function performStorageOperation(directoryEntry)
    {
        if(!locusDirectoryEntry) locusDirectoryEntry = directoryEntry;	

        //If currentDataEntity has a "key" property, it is assumed to be a simple object 
        //containing identifying and processing-pertinent data for a data item
        currentDataEntity = dataArray[i];
        currentDataItemKey = (currentDataEntity.hasOwnProperty("key") ? currentDataEntity.key : currentDataEntity);
        /////
        
        locusDirectoryEntry.getFile(currentDataItemKey, {create: false}, executeOperation, completeNow);
    }

    fileSystem_executeStorageOperation(optionsObj, performStorageOperation, completeNow);
}
	

	
function fileSystem_get(dataArray, optionsObj, complete)
{
    fileSystem_getOrRemove("get", dataArray, optionsObj, complete);
}



function fileSystem_remove(dataArray, optionsObj, complete)
{
    fileSystem_getOrRemove("remove", dataArray, optionsObj, complete);
}
	
	
	
/**
* Carries out a (HTML5) file system read or remove operation on 
* the file entries contained in a specified directory.

* @param operationType      a String denoting the type of operation to be carried out
* @param optionsObj         an object containing auxiliary data items pertinent to the to-be-executed operation
* @param complete           a function capable of progressing the execution of the set
                                                        of related storage operations this operation belongs to
*/
function fileSystem_getOrRemoveAll(operationType,  optionsObj, complete)
{
    var isRecursive = optionsObj.recursive;
    var isGet = (operationType === "get");

    var isBaseOperationDefinedForDirs = !isGet;

    var removeExpirationData = optionsObj.removeExpirationData;

    var dataArray = (isGet || removeExpirationData ? [] : undefined);
    var i = 0;

    //Store the function capable of carrying out the specified storage operation on a single Entry
    var operationFunc = (isGet ? readFileEntry : removeEntry);

    //Will store a reference to the currently processing Entry
    var currentEntry;

    //Will hold the FileEntries and FileEntry-containing DirectoryEntries to be processed
    var entryStack = [];

    //Will hold the DirectoryEntries to be processed
    var directoryEntryStack = [];

    //Create a convenience method for entryStack which retrieves its last element
    entryStack.peek = function(){ return (this.length > 0 ? this[this.length - 1] : undefined); }

   /**
    * Progresses the execution of the set of related storage operations that this operation belongs to.

    * @param error      an optional Object representing and describing an error spawned by, 
    *                   and responsible for the conclusion of the invoking storage operation
    */
    function completeNow(error)
    { 
        var argArray = [i];
        if(dataArray) argArray.push(dataArray);
        if(error) argArray.push(error);

        complete.apply(complete, argArray);
    }

   /**
    * Advances the execution of the storage operation.

    * @param isSuccessful           a boolean denoting whether the most recently executed sub-storage operation was a success
    * @param operationResultObj     the object resulting from the most recently executed sub-storage operation   
    */
    function advance(isSuccessful, operationResultObj)
    {
        //Store the current value of isSuccessful before redefining a successful
        //storage operation as one that doesn't explicitly spawn an error
        var rawIsSuccessful = isSuccessful;
        isSuccessful = (isSuccessful === true || isSuccessful === undefined);
        /////
        
        if(isSuccessful)	
        {
            if(rawIsSuccessful) i++;	//increment the processed item count if success was explicitly indicated (this prevents 
                                        //native recursive removals from incrementing the processed item count incorrectly
                                        //(actual processing set size calculation is avoided in this case for performance reasons)
                                        //(note that operations defined for and targeting DirectoryEntries modify the count just like those targeting FileEntries)

            executeOperation();	//process the entries left in entryStack and directoryEntryStack
        }
        else			completeNow(operationResultObj);
    }

   /**
    * Processes the data, if any, resulting from the execution of 
    * the get/remove operation on the currently processing file.

    * @param isSuccessful           a boolean denoting whether the storage operation 
                                    responsible for this invocation was a success
    * @param operationResultObj     (optional) the result of the storage operation responsible for this invocation
    */
    function processOperationResult(isSuccessful, operationResultObj)
    {
        if(!isSuccessful)  
            entryStack = directoryEntryStack = [];
        else if(isGet)
            dataArray.push({key: currentEntry.fullPath, value: operationResultObj});
        else if(removeExpirationData)
            dataArray.push(currentEntry.fullPath);
    }

   /**
    * Calls a function to process the result of most recent execution of operationFunc(), 
    * and another to advance execution of the over-arching operation.

    * @param isSuccessful           a boolean denoting whether the storage operation responsible
                                    for this invocation of this fucntion was a success
    * @param operationResultObj     (optional) the result of the storage operation  
                                    responsible for this invocation of this function
    */
    function handleOperationConclusion(isSuccessful, operationResultObj)
    {
        processOperationResult(isSuccessful, operationResultObj);
        advance(isSuccessful, operationResultObj);
    }

   /**
    * Carries out a get or remove operation on the current file system Entry of interest.
    */
    function executeBaseOperation()
    {
        operationFunc(currentEntry, optionsObj, handleOperationConclusion);
    }
    
    /**
     * Determines, given the type of storage operation being conducted and the
     * specified options pertaining to it, whether a given DirectoryEntry 
     * can be recursively removed using its {@code removeRecursively} method.
     * 
     *  @param directoryEntry       a DirectoryEntry 
     */
    function canRecursivelyRemoveNatively(directoryEntry)
    {
        return (!isGet && isRecursive && optionsObj.removeTargetDirectory && directoryEntry.fullPath !== "/");
    }

   /**
    * Carries out a get or remove operation on the entry in
    * {@code locusDirectory} that is next to be processed.

    * @param entryArray		(optional) an array consisting of the
                                Entries in {@code locusDirectory}
    */
    function executeOperation(entryArray)
    {
        if(entryArray) entryStack.push.apply(entryStack, entryArray);
        
        //If the operation isn't recursive, continuously pop the 
        //top of entryStack until a FileEntry is encountered
        if(!isRecursive)
        {
            while(entryStack.length > 0 && entryStack.peek().isDirectory) 
                entryStack.pop();
        }
        /////

        if((currentEntry = entryStack.pop()))
        {
            if(currentEntry.isDirectory)    //If a DirectoryEntry is encountered here, the operation is recursive                                                          
                performStorageOperation(currentEntry);	//execute the storage operation on the entries contained in currentEntry
            else                            
                executeBaseOperation();
        }
        else
        {     
            if(isBaseOperationDefinedForDirs && (currentEntry = directoryEntryStack.pop()))    //Perform the storage operation on the next unprocessed DirectoryEntry 
                executeBaseOperation();                                                        //(if the base operation is defined directory entries)
            else
                completeNow();
        }
    }

   /**
    * Carries out a read or remove operation on each of the Entries in a given DirectoryEntry.

    * @param locusDirectoryEntry        the DirectoryEntry containing the current target Entries of this operation
    */
    function performStorageOperation(locusDirectoryEntry)
    {
        if(canRecursivelyRemoveNatively(locusDirectoryEntry))
            locusDirectoryEntry.removeRecursively(advance, completeNow);
        else
            locusDirectoryEntry.createReader().readEntries(executeOperation, completeNow);
    }

    fileSystem_executeStorageOperation(optionsObj, performStorageOperation, completeNow);
}

	
        
function fileSystem_getAll(optionsObj, complete)
{
    fileSystem_getOrRemoveAll("get", optionsObj, complete);
}



function fileSystem_removeAll(optionsObj, complete)
{
    fileSystem_getOrRemoveAll("remove", optionsObj, complete);
}
	
	
	
/***************************************Test functions****************************************/

var optionsObj = {

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
};
	
//All of the ancestor directories in the directory path contained in a given element in this array must be represented
//by elements that appear before said element in order for the get & remove tests to function correctly
var testDataObjArray = [
    {
        childDirectoryEntryCount: 2,
        descendentDirectoryEntryCount: 4,
        childFileEntryCount: 4, 
        descendentFileEntryCount: 16,
        options:{
            directoryPath: "/",
            recursive: true,
            removeDirectories: true,
            removeTargetDirectory: true  
        },
        testDataItemObjArray: [
            {key: 0, value: "0"},
            {key: 1, value: "1", dataFormat: "text"},
            {key: 2, value: new Int8Array([2]), dataFormat: "arrayBuffer", bufferViewConstructor: Int8Array},
            {key: 3, value: "3", type: "text/plain", dataFormat: "dataURL"}   
        ]
    },
    {
        childDirectoryEntryCount: 0,
        descendentDirectoryEntryCount: 0,
        childFileEntryCount: 3, 
        descendentFileEntryCount: 4,
        options: {
            directoryPath: "/dirA/",
            recursive: true,
            removeDirectories: false,
            removeTargetDirectory: false
        },
        testDataItemObjArray: [
            {key: "A", value: "A", dataFormat: "text"},
            {key: "B", value: "A"},
            {key: "C", value: new Uint8Array([67]), dataFormat: "arrayBuffer", bufferViewConstructor: Uint8Array},
            {key: "D", value: "D", type: "text/plain;charset=US-ASCII", dataFormat: "dataURL"} 
            
        ]
    },
    {
        childDirectoryEntryCount: 2,
        descendentDirectoryEntryCount: 2,
        childFileEntryCount: 3, 
        descendentFileEntryCount: 8,
        options: {
            directoryPath: "/dir1/",
            recursive: false,
            removeDirectories: false,
            removeTargetDirectory:false
        },
        testDataItemObjArray:[
            {key: 4, value: "4", dataFormat: "text"},
            {key: 5, value: "5", dataFormat: "text"},
            {key: 6, value: new Uint8Array([6]), dataFormat: "arrayBuffer", bufferViewConstructor: Uint8Array},
            {key: 7, value: "7", type: "text/plain;charset=US-ASCII", dataFormat: "dataURL"} 
        ]
    },
    {
        childDirectoryEntryCount: 0,
        descendentDirectoryEntryCount: 0,
        childFileEntryCount: 4, 
        descendentFileEntryCount: 4,
        options: {
            directoryPath: "/dir1/dir2/",
            recursive: true,
            removeDirectories: true,
            removeTargetDirectory: false
        },
        testDataItemObjArray: [
            {key: 8, value: "8", dataFormat: "text"},
            {key: 9, value: "9"},
            {key: 10, value: new Uint8ClampedArray([10]), dataFormat: "arrayBuffer", bufferViewConstructor: Uint8ClampedArray},
            {key: 11, value: "11", type: "text/plain;charset=UTF-8", dataFormat: "dataURL"} 
            
        ]  
    },
    {   
        childDirectoryEntryCount: 0,
        descendentDirectoryEntryCount: 0,
        childFileEntryCount: 0, 
        descendentFileEntryCount: 0,
        options: {
            directoryPath: "/dir1/dirB/",
            recursive: true,
            removeDirectories: true,
            removeTargetDirectory: true
        },
        testDataItemObjArray: []  
    }  
];

function clear(pertinentOptionsObj)
{
    if(!pertinentOptionsObj)
        pertinentOptionsObj = optionsObj;
    
    pertinentOptionsObj.directoryPath = "/";
    
    var clearFunc = function(locusDirectoryEntry){
        var directoryReader;
        var currentEntriesArray = [];
        
        var deleteEntryCompleteFunc = function(){
            currentEntriesArray.shift();
            
            if(currentEntriesArray.length > 0)  deleteEntryFunc();
            else                                readEntriesFunc();
        }
        
        var deleteEntryFunc = function(){
           var toBeDeletedEntry = currentEntriesArray[0];
           
           var removeMethodName = (toBeDeletedEntry.isFile ? "remove" : "removeRecursively");
           toBeDeletedEntry[removeMethodName](deleteEntryCompleteFunc);
        }
        
        var deleteEntriesFunc = function(entriesArray){
            
            if(entriesArray.length > 0)
            {
                Array.prototype.push.apply(currentEntriesArray, entriesArray);
                deleteEntryFunc();
            }
        }
        
        var readEntriesFunc = function(locusDirectoryEntry){
            
            if(locusDirectoryEntry)
                directoryReader = locusDirectoryEntry.createReader();

             directoryReader.readEntries(deleteEntriesFunc);
        }
        
        readEntriesFunc(locusDirectoryEntry);
    }
    fileSystem_executeStorageOperation(pertinentOptionsObj, clearFunc);
}
	
	
/*
//realizeDirectoryPath test 
(function(){

    var realizeDirectoryPathTestDataObj = {
        path: "dir1/dir2/dir3/dir4",
        pathComponentArray: ["dir1", "dir2", "dir3", "dir4"]
    }

    var testFunc = function(assert){

        var rootDirectoryEntry;
        
        var testCompleteFunc = function(){clear(); QUnit.start();};

        var failfunc = function(){assert.ok(false); testCompleteFunc();};
        var accessFailFunc = function(){assert.ok(false, "Error accessing file system"); testCompleteFunc();};

        var realizeDirectoryPathCheck = function(){
            
            var path = realizeDirectoryPathTestDataObj.path;
            
            var getDirectoryComplete = function(directoryEntry){
                
                if(path[0] !== "/") path = "/" + path;
                assert.ok(directoryEntry.fullPath, path); 
                testCompleteFunc();
            };
            
            rootDirectoryEntry.getDirectory(path, {create: false}, getDirectoryComplete, failfunc);
        }

        var realizeDirectoryPathFunc = function(fileSystem){
            rootDirectoryEntry = fileSystem.root;
            realizeDirectoryPath(rootDirectoryEntry, realizeDirectoryPathTestDataObj.pathComponentArray, 0, mockOperationFuncObj);
        }
        
        var mockOperationFuncObj = {execute: realizeDirectoryPathCheck, complete: failfunc};

        var requestFileSystem = (window.requestFileSystem || window.webkitRequestFileSystem);
        if(requestFileSystem)
            requestFileSystem(window.TEMPORARY, 1024 * 1024, realizeDirectoryPathFunc, accessFailFunc);
        else
            accessFailFunc();
    }

    QUnit.asyncTest("realizeDirectoryPath", testFunc);
})()
*/
	
	
	
/*
//handleDirectoryAccessError test
(function(){
    var handleDirectoryAccessErrorTestDataObjArray = [
        {path:"dir1/dir2/dir3/dir4/", expectedPathComponentArray: ["dir1", "dir2", "dir3", "dir4"]},
        {path:"dir1\\dir2\\dir3\\dir4", expectedPathComponentArray: ["dir1", "dir2", "dir3", "dir4"]},
        {path: "/dir1/dir2\\dir3/dir4\\", expectedPathComponentArray: ["dir1", "dir2", "dir3", "dir4"]},
        {path: "//////dir1\\\\\\dir2/\\/\\dir3///dir4\\", expectedPathComponentArray: ["dir1", "dir2", "dir3", "dir4"]},
        {path: "this/error/cannot/be/handled", expectedPathComponentArray: null, errorObj: {name: "InvalidStateError"}},
        {path: "this/error/cannot/be/handled", expectedPathComponentArray: null, errorObj:{name: "SecurityError"}, realizeDirectoryBool: false}
    ]

    var defaultErrorObj = {name: "NotFoundError"};
    var defaultRealizeDirectoryPathBool = true;

    var testFunc = function(assert){

        for(var i = 0; i < handleDirectoryAccessErrorTestDataObjArray.length; i++)
        {
            var completeFunc = (function(processingIndex){
                return function(rootDirectory, directoryPathComponentArray, funcObj){
                    var expectedPathComponentArray = handleDirectoryAccessErrorTestDataObjArray[processingIndex].expectedPathComponentArray;
                    assert.deepEqual(directoryPathComponentArray, expectedPathComponentArray);
                }
            })(i)

            var failFunc = (function(processingIndex){
                return function(){
                    var expectedPathComponentArray = handleDirectoryAccessErrorTestDataObjArray[processingIndex].expectedPathComponentArray;
                    assert.strictEqual(null, expectedPathComponentArray);
                }
            })(i)

            var currentTestDataObj = handleDirectoryAccessErrorTestDataObjArray[i];

            var currentErrorObj = (currentTestDataObj.hasOwnProperty("errorObj") ? currentTestDataObj.errorObj : defaultErrorObj);
            var currentRealizeDirectoryBool = (currentTestDataObj.hasOwnProperty("realizeDirectoryBool") ? currentTestDataObj.realizeDirectoryBool : defaultRealizeDirectoryPathBool);

            var currentPath = handleDirectoryAccessErrorTestDataObjArray[i].path;
            handleDirectoryAccessErrorExt(currentErrorObj, currentRealizeDirectoryBool, null, currentPath, completeFunc, undefined, failFunc);
        }
    }

    QUnit.test("handleDirectoryAccessError", testFunc);
})()
*/
	
/*
//fileSystem_executeStorageOperation test
(function(){

    var quotaByteSize = 1024 * 1024;

    var executeStorageOperationTestDataObjArray = [
        {storageType: window.TEMPORARY, directoryPath: "", canRealizeDirectoryPath: false, realizeDirectoryPath: false, isSuccessExpected: true, size: quotaByteSize},
        {storageType: window.PERSISTENT, directoryPath: "/dir1", canRealizeDirectoryPath: true, realizeDirectoryPath: false, isSuccessExpected: true, size: quotaByteSize},
        {storageType: window.PERSISTENT, directoryPath: "/dir1", canRealizeDirectoryPath: false, realizeDirectoryPath: false, isSuccessExpected: false, size: quotaByteSize},
        {storageType: window.PERSISTENT, directoryPath: "/dir1/dir2", canRealizeDirectoryPath: true, realizeDirectoryPath: true, isSuccessExpected: true, size: quotaByteSize},
        {storageType: window.PERSISTENT, directoryPath: "/dir1/dir2", canRealizeDirectoryPath: true, realizeDirectoryPath: false, isSuccessExpected: false, size: quotaByteSize},
        {storageType: window.PERSISTENT, directoryPath: "/dir1/dir2", canRealizeDirectoryPath: false, realizeDirectoryPath: false, isSuccessExpected: false, size: quotaByteSize}
    ];
    
    for(var i = 0; i < executeStorageOperationTestDataObjArray.length; i++)
    {
        var testFunc = (function(processingIndex){

            var dataObj = executeStorageOperationTestDataObjArray[processingIndex];

            return function(assert){
                
                var testCompleteFunc = function(directoryEntry){
                    
                    if(directoryEntry && directoryEntry.fullPath !== "/")
                    {
                        var clearSuccessFunc = function(){QUnit.start()};
                        var clearFailFunc = function(error){
                            assert.ok(false, error);                          
                            QUnit.start()
                        };
                   
                        var recursiveRemoveFunc = function(targetDirectoryEntry){targetDirectoryEntry.removeRecursively(clearSuccessFunc, clearFailFunc);} 
                        
                        var fullPath = directoryEntry.fullPath;
                        var onePastFirstLevelAncestorPathIndex = fullPath.indexOf("/", 1);
                        if(onePastFirstLevelAncestorPathIndex < 0) onePastFirstLevelAncestorPathIndex = fullPath.length;
                        
                        var firstLevelAncestorPath= fullPath.substring(0, onePastFirstLevelAncestorPathIndex);
                        directoryEntry.getDirectory(firstLevelAncestorPath, {create: false}, recursiveRemoveFunc, clearFailFunc)
                    }
                    else
                        QUnit.start();
                }

                var mockStorageOperationFunc = function(targetDirectoryEntry){
                    var expectedDirectoryPath = (dataObj.directoryPath[0] !== "/" ? "/" : "") + dataObj.directoryPath;
                    
                    assert.strictEqual(true, dataObj.isSuccessExpected);
                    assert.strictEqual(targetDirectoryEntry.fullPath, expectedDirectoryPath);
                    testCompleteFunc(targetDirectoryEntry);
                };

                var failFunc = function(error){
                    var argArray = [false, dataObj.isSuccessExpected];

                    if(!window.requestFileSystem && !window.webkitRequestFileSystem) 
                        argArray.push("Error accessing file system");
                    else
                        argArray.push(error);
                    
                    assert.strictEqual.apply(assert, argArray);
                    testCompleteFunc();
                }

                fileSystem_executeStorageOperation(dataObj, mockStorageOperationFunc ,failFunc);
            }
        })(i)

        QUnit.asyncTest("fileSystem_executeStorageOperation", testFunc);
    }
})()
*/



//fileSystem_set test
(function(){

    var isBlobConstructorPresent = !!window.Blob;
    var BlobBuilder = (!isBlobConstructorPresent ? (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder) : undefined);

    var createBlob = function(dataArray, type){
        
        var dataBlob;
        if(!isBlobConstructorPresent)		
        {							
            var blobBuilder = new BlobBuilder();
            
            for(var i = 0;i < dataArray.length; i++)
                blobBuilder.append(dataArray[i]);
            dataBlob = blobBuilder.getBlob();
        }
        else
             dataBlob = new Blob(dataArray, {type: type|| ""});
        
        return dataBlob
    }
    
    var setTestDataItemObjArray = [
        {key: "1", value: "1234567890", type:"text/plain", expectedData: "1234567890"},
        {key: "1", value: createBlob(["12345", "67890"], "text/plain"), startPosition: Number.MAX_VALUE, truncatePosition: Number.MAX_VALUE, truncateBeforeWrite: false, type:"text/plain", expectedData: "12345678901234567890"},
        {key: "1", value: "1234567890", startPosition: 20, truncatePosition: 20, truncateBeforeWrite: true, type:"text/plain", expectedData: "123456789012345678901234567890"},
        {key: "1", value: "66666", startPosition: 10, truncatePosition: 12, truncateBeforeWrite: true, type:"text/plain", expectedData: "123456789066666"},
        {key: "1", value: "45", startPosition: 10, truncatePosition: 13, truncateBeforeWrite: true, expectedData: "1234567890456"},
        {key: "1", value: "", startPosition: 2, truncatePosition: 10, truncateBeforeWrite: false, type: "text/plain", expectedData: "1234567890456"},
        {key: "1", value: "", writeOnlyIfAbsent: true, type:"text/plain", expectedData: "1234567890456"},
        {key: "2", value: createBlob([new Int8Array([0,0]), new ArrayBuffer(1)], "application/octet-stream"), type:"application/octet-stream", expectedData: new Int8Array([0,0,0]), bufferViewConstructor: Int8Array},
        {key: "2", value: createBlob([new Int8Array([255])]), startPosition: 1, truncatePosition: 2, type: "application/octet-stream", expectedData: new Int8Array([0,255]), bufferViewConstructor: Int8Array},
        {key: "3", value: createBlob([new Int8Array([255, 255])]), writeOnlyIfAbsent: true, type: "application/octet-stream", expectedData: new Int8Array([255,255]), bufferViewConstructor: Int8Array}
    ];

    var locusDirectoryEntry;
    var currentTestDataItemObj;

    var testFunc = function(assert){
        var processingIndex = 0;

        var testCompleteFunc = function(){

            if(++processingIndex >= setTestDataItemObjArray.length)
            {
                clear();
                QUnit.start();
            }
            else
                setFunc();
        }

        var accessFailFunc = function(){
            assert.ok(false, "Error accessing file system"); QUnit.start();
        };
        var failFunc = function(){assert.ok(false); testCompleteFunc();};

        var readFileFunc = function(fileEntry){

            var containsRawBinaryData = (currentTestDataItemObj.type === "application/octet-stream");

            var fileReferenceRetrievalFunc;
                
            if(containsRawBinaryData)
            {
                fileReferenceRetrievalFunc = function(file){
                    
                    var fileReader = new FileReader();
                    
                    fileReader.readAsArrayBuffer(file);
                    fileReader.onload = function(){
                        var actualBufferView = new currentTestDataItemObj.bufferViewConstructor(fileReader.result);
                        assert.deepEqual(actualBufferView, currentTestDataItemObj.expectedData);
                        testCompleteFunc();
                    };
                    fileReader.onerror = failFunc;
                }
            }
            else
            {
                fileReferenceRetrievalFunc = function(file){
                    
                    var fileReader = new FileReader();
                    
                    fileReader.readAsText(file, currentTestDataItemObj.type);
                    fileReader.onload = function(){ 
                        assert.strictEqual(fileReader.result, currentTestDataItemObj.expectedData)
                        testCompleteFunc();
                    };
                    fileReader.onerror = failFunc;
                }
            }  
            
            fileEntry.file(fileReferenceRetrievalFunc, failFunc);
        }


        var getFileFunc = function(directoryEntry){

            if(!locusDirectoryEntry) locusDirectoryEntry = directoryEntry;
            locusDirectoryEntry.getFile(currentTestDataItemObj.key, {create: false}, readFileFunc , failFunc);
        }


        var setCheckFunc = function(processedItemCount){
            fileSystem_executeStorageOperation(optionsObj, getFileFunc, accessFailFunc);
        }

        var setFunc = function(){
            currentTestDataItemObj = setTestDataItemObjArray[processingIndex];
            fileSystem_set([currentTestDataItemObj], optionsObj, setCheckFunc);
        }
        
        setFunc(); 
    }

    QUnit.asyncTest("fileSystem_set", testFunc);
})()



function setupGetOrRemoveTest(locusDirectoryEntry, successFunc, testSpecificOptionsObj)
{
    var isBlobConstructorPresent = !!window.Blob;
    var BlobBuilder = (!isBlobConstructorPresent ? (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder) : undefined);

    var currentTestDataObjIndex = 0;
    var currentTestDataObjOptionsObj;
    
    var currentTestDataItemObjIndex = 0;
    var currentTestDataItemObj;
    
    var desiredTestDataObjCount = (testSpecificOptionsObj && testSpecificOptionsObj.hasOwnProperty("testDataObjCount")
                                                    ? testSpecificOptionsObj.testDataObjCount : testDataObjArray.length);

    var writeFileComplete = function(){
        if(++currentTestDataItemObjIndex < testDataObjArray[currentTestDataObjIndex].testDataItemObjArray.length)
            procureFileFunc();
        else if(++currentTestDataObjIndex < desiredTestDataObjCount)
            procureDirectoryFunc();
        else
            successFunc();
    }

    var writeFileFunc = function(fileEntry){

        var executeWriteFunc = function(fileWriter){
            
            var contentType = (currentTestDataItemObj.type || "");

            var dataBlob;       
            if(!isBlobConstructorPresent)		
            {							
                var blobBuilder = new BlobBuilder();
                blobBuilder.append(currentTestDataItemObj.value);
                dataBlob = blobBuilder.getBlob();
            }
            else
                dataBlob = new Blob([currentTestDataItemObj.value], {type: contentType});

            fileWriter.write(dataBlob);
            fileWriter.onwrite = writeFileComplete;
        }
        
        var fileWriter = fileEntry.createWriter(executeWriteFunc, writeFileComplete);
    }

    var procureFileFunc = function(directoryEntry){
       if(directoryEntry) locusDirectoryEntry = directoryEntry;

       if(testDataObjArray[currentTestDataObjIndex].testDataItemObjArray.length > 0)
        {
            currentTestDataItemObj = testDataObjArray[currentTestDataObjIndex].testDataItemObjArray[currentTestDataItemObjIndex];
            locusDirectoryEntry.getFile(currentTestDataItemObj.key, {create: true, exclusive: false}, writeFileFunc);
        }
        else
            writeFileComplete();
        
    }
    
    var procureDirectoryFunc = function(){
        
        currentTestDataObjOptionsObj = testDataObjArray[currentTestDataObjIndex].options;
        currentTestDataItemObjIndex = 0;

        if(currentTestDataObjOptionsObj.directoryPath !== null)
            locusDirectoryEntry.getDirectory(currentTestDataObjOptionsObj.directoryPath,{create: true, exclusive: false}, procureFileFunc);
        else
            procureFileFunc(locusDirectoryEntry);
    }

    procureDirectoryFunc();
}




/*
//filesystem_get test
(function(){

    var testFunc = function(assert){
        
        var testCompleteFunc = function(){
            clear();
            QUnit.start();
        }

        var accessFailFunc = function(){assert.ok(false, "Error accessing database"); testCompleteFunc();};

        var getFunc = function(){
            
            var testDataItemObjArray = testDataObjArray[0].testDataItemObjArray;

            var getCheckFunc = function(processedItemCount, keyValuePairsObj){

                assert.strictEqual(processedItemCount, testDataItemObjArray.length);
                
                for(var i = 0; i < testDataItemObjArray.length; i++)
                {
                    var currentTestDataItemObj = testDataItemObjArray[i];

                    var dataFormat = (currentTestDataItemObj.dataFormat || optionsObj.dataFormat);

                    var currentKey = currentTestDataItemObj.key;
                    var actualValue = keyValuePairsObj[currentKey];

                    if(dataFormat === "arrayBuffer")
                    {
                        var actualBufferView = new currentTestDataItemObj.bufferViewConstructor(actualValue);						
                        assert.deepEqual(actualBufferView, currentTestDataItemObj.value);
                    }
                    else if(dataFormat === "dataURL")
                    {
                        var dataURLRegex = /^data:.*?;(?:base64,)?.*$/;
                        assert.ok(dataURLRegex.test(actualValue));
                    }
                    else
                        assert.strictEqual(actualValue, currentTestDataItemObj.value);
                }
                
                testCompleteFunc();
            }

            fileSystem_get(testDataItemObjArray, optionsObj, getCheckFunc);
        }

        var setupWrapper = function(locusDirectoryEntry){setupGetOrRemoveTest(locusDirectoryEntry, getFunc, {testDataObjCount: 1});}
        fileSystem_executeStorageOperation(optionsObj, setupWrapper, accessFailFunc)
    }

    QUnit.asyncTest("fileSystem_get", testFunc);
})()
*/

	
/*
//fileSystem_remove
(function(){

    var testFunc = function(assert){

        var locusDirectoryEntryExtern;
        var accessFailFunc = function(){assert.ok(false, "Error accessing file system"); QUnit.start();}

        var removeFunc = function(){

            var keyArray = [];
            var testDataItemObjArray = testDataObjArray[0].testDataItemObjArray;
            for(var i = 0; i < testDataItemObjArray.length; i++)
                keyArray.push(testDataItemObjArray[i].key);

            var removeCheckFunc = function(processedItemCount){

                assert.strictEqual(processedItemCount, keyArray.length);
                
                var processingIndex = 0;

                var testCompleteFunc = function(){
                    if(++processingIndex >= keyArray.length)
                    {
                        clear();
                        QUnit.start();
                    }
                    else
                        getFile();
                }

                var failFunc = function(){assert.ok(true); testCompleteFunc();};
                var successFunc = function(){assert.ok(false); testCompleteFunc();};

                var getFile = function(){
                    locusDirectoryEntryExtern.getFile(keyArray[processingIndex], {create: false}, successFunc, failFunc);
                }
                
                getFile();
            }

            fileSystem_remove(keyArray, optionsObj, removeCheckFunc);
        }

        var setupWrapper = function(locusDirectoryEntry){
            locusDirectoryEntryExtern = locusDirectoryEntry;
            setupGetOrRemoveTest(locusDirectoryEntry, removeFunc, {testDataObjCount: 1});
        };

        fileSystem_executeStorageOperation(optionsObj, setupWrapper, accessFailFunc);
    }

    QUnit.asyncTest("fileSystem_remove", testFunc);
})()
*/


/*
//fileSystem_getAll test
(function(){
    var testSpecificOptionsObj = {

        storageType: window.TEMPORARY,
        size: 1024 * 1024,
        directoryPath: "/",
        startPosition: 0,     
        truncateBeforeWrite: true,
        truncatePosition: 0,   
        writeOnlyIfAbsent: false,
        realizeDirectoryPath: false,
        dataFormat: "text",
        dataEncoding: null,
        recursive: false,
        removeDirectories: false,
        removeTargetDirectory: false
    }
    
    var currentTestDataObjIndex = testDataObjArray.length - 1;
    var currentTestDataObj;


    var testFunc = function(assert){

        var testCompleteFunc = function(){
            
            if(--currentTestDataObjIndex < 0)
            {
                clear();
                QUnit.start();
            }
            else
                getAllFunc();       
        }
        
        var accessFailFunc = function(){assert.ok(false, "Error accessing file system"); QUnit.start();}

        var getAllFunc = function(){

            var getAllCheckFunc = function(processedItemCount, dataItemObjArray){
                
                var keyDataObjPairsObj = {};
                var expectedDataItemSetSize = 0;
 
                var testDataObjSetStartIndex = (currentTestDataObj.options.recursive ? testDataObjArray.length - 1 : currentTestDataObjIndex);
                for(var i = testDataObjSetStartIndex; i >= currentTestDataObjIndex; i--)
                {
                    var directoryPath =  "/";

                    var currentTestDataItemObjArray = testDataObjArray[i].testDataItemObjArray;
                    
                    for(var j = 0; j < currentTestDataItemObjArray.length; j++)
                    {
                        var currentTestDataItemObj = currentTestDataItemObjArray[j];
                        
                        var qualifiedKey = directoryPath + currentTestDataItemObj.key;
                        keyDataObjPairsObj[qualifiedKey] = currentTestDataItemObj;   
                        
                        if(directoryPath.indexOf(currentTestDataObj.options.directoryPath) === 0)
                            expectedDataItemSetSize++;
                    }            
                }

                for(var i = 0; i < dataItemObjArray.length; i++)
                {
                    var currentRetrievedDataItemObj = dataItemObjArray[i];

                    var currentRetrievedDataItemKey = currentRetrievedDataItemObj.key;
                    var isRetrievedItemInTestSet = keyDataObjPairsObj.hasOwnProperty(currentRetrievedDataItemKey)

                    if(isRetrievedItemInTestSet)
                    {
                        var expectedValue = keyDataObjPairsObj[currentRetrievedDataItemKey].value;
                        
                        if(expectedValue.hasOwnProperty("buffer"))
                        {
                            var arrayBufferStr = ""
                            for(var j = 0; j < expectedValue.length; j++)
                                arrayBufferStr += String.fromCharCode(expectedValue[j]);

                            expectedValue = arrayBufferStr;
                        }
                        
                        assert.equal(currentRetrievedDataItemObj.value, expectedValue + "");
                    }
                    else
                        assert.ok(false, "Retrieved item is not in test set. key = " + currentRetrievedDataItemObj.key);
                }       
                
                assert.strictEqual(dataItemObjArray.length, expectedDataItemSetSize);
                testCompleteFunc();
            }		

            var copyCurrentTestDataSetOptions = function(recipientObj, donorObj){
            
                var pertinentPropertiesArray = ["directoryPath", "recursive","removeDirectories", "removeTargetDirectory"];

                for(var i = 0; i < pertinentPropertiesArray.length; i++)
                {
                    var currentPertinentProperty = pertinentPropertiesArray[i];
                    recipientObj[currentPertinentProperty] = donorObj[currentPertinentProperty];
                }
            }
            
            currentTestDataObj = testDataObjArray[currentTestDataObjIndex];
            copyCurrentTestDataSetOptions(testSpecificOptionsObj, currentTestDataObj.options);
            
            fileSystem_getAll(testSpecificOptionsObj, getAllCheckFunc);
        }

        var setupWrapper = function(locusDirectoryEntry){setupGetOrRemoveTest(locusDirectoryEntry, getAllFunc);}
        fileSystem_executeStorageOperation(testSpecificOptionsObj, setupWrapper, accessFailFunc);
    }

    QUnit.asyncTest("fileSystem_getAll", testFunc);
})()
*/


        
/*
//fileSystem_removeAll test
(function(){
    
    var testSpecificOptionsObj = {

        storageType: window.TEMPORARY,
        size: 1024 * 1024,
        directoryPath: "/",
        startPosition: 0,     
        truncateBeforeWrite: true,
        truncatePosition: 0,   
        writeOnlyIfAbsent: false,
        realizeDirectoryPath: false,
        dataFormat: "text",
        dataEncoding: null,
        recursive: false,
        removeDirectories: false,
        removeTargetDirectory: false
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

        var accessFailFunc = function(){
            assert.ok(false, "Error accessing file system"); QUnit.start();
        }
        
        
        var removeAllCheckFunc = function(processedItemCount){

            var executeRemoveAllCheckFunc = function(locusDirectoryEntry){
                
                var locusDirectoryEntryPath = locusDirectoryEntry.fullPath;
                
                var currentCheckTestDataObjIndex = testDataObjArray.length - 1;
                var currentCheckTestDataObj;

                var currentCheckTestDirectoryEntry;
                var currentCheckTestDirectoryReader;

                var checkDataObj = {
                    fileEntryCounts:{
                        children: 0,
                        descendents:0
                    },
                    directoryEntryCounts:{
                        children: 0,
                        descendents:0
                    }
                }

                var expectedChildDirectoryEntryCount = 0;
                var expectedDescendentDirectoryEntryCount = 0;;

                var checkCompleteFunc = function(){

                    expectedChildDirectoryEntryCount = expectedChildDirectoryEntryCount + currentTestDataObj.childDirectoryEntryCount;
                    expectedDescendentDirectoryEntryCount = expectedDescendentDirectoryEntryCount + currentTestDataObj.descendentDirectoryEntryCount;

                    assert.strictEqual(checkDataObj.fileEntryCounts.children, 0);
                    assert.strictEqual(checkDataObj.fileEntryCounts.descendents, 0);
                    assert.strictEqual(checkDataObj.directoryEntryCounts.children, expectedChildDirectoryEntryCount);
                    assert.strictEqual(checkDataObj.directoryEntryCounts.descendents, expectedDescendentDirectoryEntryCount);

                    testCompleteFunc();
                }

                var readEntriesCompleteFunc = function(resultEntity){
                    
                    var currentTestCheckDirectoryExists = !!currentCheckTestDirectoryEntry;

                    if(locusDirectoryEntryPath === "/") locusDirectoryEntryPath = "";
                    
                    var locusRegex = new RegExp("^" +locusDirectoryEntryPath + "/?$");
                    var descendentRegex = new RegExp("^" + locusDirectoryEntryPath + "(?=/[^/]+)");
                    var childRegex = new RegExp("^" + locusDirectoryEntryPath + "/[^/]+/?$");

                    var isLocusDirectoryEntry = locusRegex.test(currentCheckTestDataObj.options.directoryPath);
                    var isDescendentOfLocusDirectoryEntry = descendentRegex.test(currentCheckTestDataObj.options.directoryPath);
                    var isChildOfLocusDirectoryEntry = childRegex.test(currentCheckTestDataObj.options.directoryPath);
                    
                    if(currentTestCheckDirectoryExists && (isLocusDirectoryEntry || isDescendentOfLocusDirectoryEntry))
                    {
                        for(var i = 0; i < resultEntity.length; i++)
                        {
                            var currentEntry = resultEntity[i];

                            var currentCheckSubObj = (currentEntry.isFile ? checkDataObj.fileEntryCounts : checkDataObj.directoryEntryCounts);

                            currentCheckSubObj.descendents++;                           
                            if(isLocusDirectoryEntry) currentCheckSubObj.children++
                        }
                    }
                    else if(isDescendentOfLocusDirectoryEntry)
                    {
                        --expectedDescendentDirectoryEntryCount;

                        if(isChildOfLocusDirectoryEntry)
                            --expectedChildDirectoryEntryCount;
                    }
                    
                    if(currentTestCheckDirectoryExists && resultEntity.length > 0)
                        readEntriesFunc();
                    else if(--currentCheckTestDataObjIndex >= currentTestDataObjIndex)
                        getDirectoryFunc();
                    else
                        checkCompleteFunc();
                }             

                var readEntriesFunc = function(directoryEntry){

                    if(directoryEntry)
                    {
                        currentCheckTestDirectoryEntry = directoryEntry;
                        currentCheckTestDirectoryReader = currentCheckTestDirectoryEntry.createReader();
                    }
                    
                    currentCheckTestDirectoryReader.readEntries(readEntriesCompleteFunc, checkCompleteFunc);
                }


                var getDirectoryFunc = function(){
                    
                    if(currentCheckTestDirectoryEntry) currentCheckTestDirectoryEntry = undefined;
                    
                    currentCheckTestDataObj = testDataObjArray[currentCheckTestDataObjIndex];
                    locusDirectoryEntry.getDirectory(currentCheckTestDataObj.options.directoryPath, {create:false}, readEntriesFunc, readEntriesCompleteFunc);
                }

                getDirectoryFunc(); 
            }
            
            var checkAccessFailFunc = function(){
                if(currentTestDataObj.options.removeTargetDirectory)
                {
                    assert.ok(true);
                    testCompleteFunc();
                }
                else
                    accessFailFunc();
            }

            fileSystem_executeStorageOperation(testSpecificOptionsObj, executeRemoveAllCheckFunc, checkAccessFailFunc);
        }
        
        var copyCurrentTestDataSetOptions = function(recipientObj, donorObj){
            
            var pertinentPropertiesArray = ["directoryPath", "recursive","removeDirectories", "removeTargetDirectory"];
            
            for(var i = 0; i < pertinentPropertiesArray.length; i++)
            {
                var currentPertinentProperty = pertinentPropertiesArray[i];
                recipientObj[currentPertinentProperty] = donorObj[currentPertinentProperty];
            }
        }
        
        
        var removeAllFunc = function(){
            currentTestDataObj = testDataObjArray[currentTestDataObjIndex];
            copyCurrentTestDataSetOptions(testSpecificOptionsObj, currentTestDataObj.options);
            fileSystem_removeAll(testSpecificOptionsObj, removeAllCheckFunc);  
        }

        var setupWrapper = function(locusDirectoryEntry){setupGetOrRemoveTest(locusDirectoryEntry, removeAllFunc);}
        fileSystem_executeStorageOperation(testSpecificOptionsObj, setupWrapper, accessFailFunc);
    }

    QUnit.asyncTest("fileSystem_removeAll", testFunc);
})()
*/
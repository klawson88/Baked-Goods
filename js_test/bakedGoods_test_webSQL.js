/*
 * The test runners in this file should be executed independant of one another (in other words, 
 * only one runner should be un-commented at any given time) in order to ensure that data produced
 * and/or modified by one does not affect the execution of any other.
 */



/**
* Progresses the execution of the set of operations a given 
* storage operation belongs to in the event of its failure.

* @param complete                   a function capable of progressing the execution of the set
*                                   of related storage operations a given storage operation belongs to
* @param completeFuncArgArray       the prospective argument-array for {@code complete} 
*/
function createErrorCompleteFunction(complete, completeFuncArgArray)
{
    return function (error){ if(error) completeFuncArgArray.push(error); complete.apply(complete, completeFuncArgArray); };
}



/**
* Executes a storage operation on a webSQL database.

* @param optionsObj			an object containing properties which identify a webSQL database
* @param storageOperationFunc		a function capable of executing a storage operation 
                                        on the database specified in {@code optionsObj}
* @param accessErrorCompleteFunc	a function to execute in the event that the database 
                                        specified in {@code optionsObj} cannot be opened
*/
function webSQL_executeStorageOperation(optionsObj, storageOperationFunc, accessErrorCompleteFunc)
{
    var openedDatabase = false;
    var error;
    
    if(window.openDatabase)
    {
        try
        {
            var database = window.openDatabase(optionsObj.databaseName, optionsObj.databaseVersion,
                                                            optionsObj.databaseDisplayName, optionsObj.estimatedDatabaseSize); 
            openedDatabase = true;

            storageOperationFunc(database);
        }
        catch(e){error = e;}
    }

    if(!openedDatabase) accessErrorCompleteFunc(error);
}



/**
* Executes a conditional index creation statement for, and using the data 
* contained in each, index-describing-data possessing object in a collection.

* @param transaction			the transaction that the index creation statements are to be executed in
* @param optionsObj			an object containing the name of a table and an array which consists of objects each 
                                        possessing properties properties which describe an index to be created on for the table
* @param setFunc			a function capable of carrying out an INSERT operation in the table associated with the indexes
*/
function webSQL_createIndices(transaction, optionsObj, setFunc)
{
    var i = 0;
    var indexCount = optionsObj.tableIndexDataArray.length;

   /**
    * Advances the index creation operation creation or concludes it by calling {@code setFunc},
    * depending on the presence of an object in optionsObj.tableIndexDataArray that hasn't't been processed.

    * @param transaction		{@code transaction}
    * @param sqlResultSet		an object containing result-related data arising
                                                            from the executed statement (none in this case)
    */
    function advance(transaction, sqlResultSet)
    {
        if(++i < indexCount)	createIndex();
        else			setFunc(transaction);
    }

   /**
    * Creates an index using the table named in {@code optionsObj} as well as data contained
    * in the next object in {@code optionsObj.tableIndexDataArray} to be processed.
    */
    function createIndex()
    {
        var currentIndexDataObj = optionsObj.tableIndexDataArray[i]; 
        var createIndexStatement = "CREATE INDEX IF NOT EXISTS " + currentIndexDataObj.name + " ON " + optionsObj.tableData.name + " " + currentIndexDataObj.columnNames;

        transaction.executeSql(createIndexStatement, [], advance);
    }

    createIndex();
}



/**
* Executes a conditional table creation statement using supplied table identifying/description data.

* @param transaction				the transaction that the table creation statement is to be executed in
* @param optionsObj				an object containing properties which describe a table in a webSQL database
* @param setFunc				a function capable of carrying out an INSERT operation in the table specified in {@code optionsObj}
*/
function webSQL_createTable(transaction, optionsObj, setFunc)
{
    var createTableStatement = "CREATE TABLE IF NOT EXISTS " + optionsObj.tableData.name + " " + optionsObj.tableData.columnDefinitions;
    
    /**
    * Advances the set operation this function is related to 
    * after the successful execution of {@code createTableStatement}.

    * @param transaction		the transaction which {@code createTableStatement} was executed in
    * @param sqlResultSet		an object containing result-related data arising from the executed statement (none in this case)
    */
    function advance(transaction, sqlResultSet)
    {
        if(optionsObj.tableIndexDataArray.length > 0) 	webSQL_createIndices(transaction, optionsObj, setFunc); 
        else 						setFunc(transaction);
    }
    
    transaction.executeSql(createTableStatement, [], advance);
}




/**
* Creates an object containing members that can be
* used in the creation of an SQL INSERT statement. 

* @param columnDefinitionsStr		a String containing a table's column definitions
* @return				an object containing: 
*                                           - an array of the column names that appear in {@code columnDefinitionsStr}
                                            - a String of markers suitable for use in a prepared INSERT statement targeting the relevant table	
*/
function createINSERTStatementComponentObject(columnDefinitionsStr)
{
    var columnNamesArray = [];
    var markersStr = "";

    //Omit the enclosing parentheses in columnDefinitionsStr if there are any
    var isEnclosedInParentheses = /^\(.+\)$/.test(columnDefinitionsStr);
    if(isEnclosedInParentheses) columnDefinitionsStr = columnDefinitionsStr.substring(1, columnDefinitionsStr.length - 1);
    /////

    //Split the column definitions string in to an array of individual column definitions
    var columnDefinitionStrsArray = columnDefinitionsStr.split(",");

    //Loop through the column definition strings in columnDefinitionStrsArray,
    //pushing the name of the column specified in each in to columnNamesArray
    //as well as appending a marker for it in markersStr
    var columnCount = columnDefinitionStrsArray.length;
    for(var i = 0; i < columnCount; i++)
    {
        var currentColumnDefinitionStr = columnDefinitionStrsArray[i];
        currentColumnDefinitionStr = currentColumnDefinitionStr.replace(/^\s+/, "");

        columnNamesArray.push(currentColumnDefinitionStr.split(/\s+/)[0]);	//Extract the column name (which must be the first token) from the
        markersStr+= (i === 0 ? "" : ",") + "?";                                    //whitespace delimited definition and push it to columnNamesArray
    }
    /////

    return {
            columnNamesArray: columnNamesArray,
            markersStr: markersStr
    }
}



/**
* Creates an Array-based tuple.

* @param dataObj        an object containing values each keyed by a column name in {@code columnNamesArray}
* @return		an Array consisting of the values keyed in {@code dataObj} in the same 
                        apperance order as that which their keys appear in {@code columnNamesArray}
*/
function createTupleExt(columnNamesArray, dataObj)
{
    var valueArray = [];

    //Loop through the column names in columnNamesArray, pushing 
    //on to valueArray the value each keys in dataObj
    var columnCount = columnNamesArray.length;
    for(var i = 0; i < columnCount; i++)
    {
            var columnName = columnNamesArray[i];
            valueArray.push(dataObj[columnName]);
    }
    /////

    return valueArray;
}



/**
* Updates the members of {@code insertStatemementCreationalAssetsObj} using the name
* of a column, data procured with said name, and invocation-resultant data.

* @param columnName        a String denoting the name of a column in {@code tableName}
*/
function updateInsertStatementCreationalAssetsWithExt(insertStatementCreationalAssetsObj, columnName)
{
   var sequenceTermPrefix = (insertStatementCreationalAssetsObj.subjectColumnNameArray.length === 0 ? "" : ", ");

   insertStatementCreationalAssetsObj.subjectColumnNameArray.push(columnName);
   insertStatementCreationalAssetsObj.subjectColumnNameSequenceStr += (sequenceTermPrefix + columnName);
   insertStatementCreationalAssetsObj.subjectColumnValueMarkerSequenceStr += (sequenceTermPrefix + "?");
}



/**
* Updates the members of {@code updateStatementCreationalAssetsObj} using the name
* of a column, data procured with said name, and invocation-resultant data.

* @param columnName        a String denoting the name of a column in {@code tableName}
*/
function updateUpdateStatementCreationalAssetsWithExt(updateStatementCreationalAssetsObj, tableKeyColumnName, columnName)
{
   if(columnName !== tableKeyColumnName)
   {
       var sequenceTermPrefix = (updateStatementCreationalAssetsObj.subjectColumnNameArray.length === 0 ? "" : ", ");

       updateStatementCreationalAssetsObj.subjectColumnNameArray.push(columnName);
       updateStatementCreationalAssetsObj.assignmentSequenceStr += (sequenceTermPrefix + columnName + " = (?)");
   }
}



/**
* Conducts a series of operations which transition {@code insertStatementCreationalAssetsObj}
* to a state in which it can be utilized to create statements that, when executed, insert rows
* in to {@code tableName}. After refinement, {@code insertStatementCreationalAssetsObj} is to 
* possess exactly two members:
*      - templateStr:          A prepared INSERT statement capable of being used to insert a 
*                              data tuple into {@code tableName}
*      - subjectColumnNameArray:      An array consisting of the names of columns of {@code tableName},
*                              in the order in which the markers which respectively correspond to
*                              the values of said columns appear in {@code templateStr}
*/
function thourouglyRefineInsertStatementCreationalAssetCollectionExt(insertStatementCreationalAssetsObj, tableName)
{
    var parenthesizedColumnNameSequenceStr = "(" + insertStatementCreationalAssetsObj.subjectColumnNameSequenceStr + ")";
    var parenthesizedColumnValueMarkerSequenceStr = "(" + insertStatementCreationalAssetsObj.subjectColumnValueMarkerSequenceStr + ")";

    insertStatementCreationalAssetsObj.templateStr = "INSERT INTO " + tableName + " " + parenthesizedColumnNameSequenceStr + " VALUES " + parenthesizedColumnValueMarkerSequenceStr;

    delete insertStatementCreationalAssetsObj.subjectColumnNameSequenceStr;
    delete insertStatementCreationalAssetsObj.subjectColumnValueMarkerSequenceStr;
}



/**
* Conducts a series of operations which transition {@code updateStatementCreationalAssetsObj}
* to a state in which it can be utilized to create statements that, when executed, update rows
* in {@code tableName}. After refinement, {@code updateStatementCreationalAssetsObj} is to 
* possess exactly two members:
*      - templateStr:          A prepared UPDATE statement capable of being used to update
*                              a data tuple in {@code tableName}
*      - subjectColumnNameArray:      An array consisting of the names of columns of {@code tableName},
*                              in the order in which the markers which respectively correspond to
*                              the values of said columns appear in {@code templateStr}
*/
function thoroughlyRefineUpdateStatementCreationalAssetCollectionExt(updateStatementCreationalAssetsObj, tableName, tableKeyColumnName)
{
    if(updateStatementCreationalAssetsObj.subjectColumnNameArray.length > 0)
    {
        updateStatementCreationalAssetsObj.subjectColumnNameArray.push(tableKeyColumnName);
        updateStatementCreationalAssetsObj.templateStr = "UPDATE " + tableName + " SET " + updateStatementCreationalAssetsObj.assignmentSequenceStr + " WHERE " + tableKeyColumnName + " = (?)";
    }
    else
    {
        updateStatementCreationalAssetsObj.subjectColumnNameArray = [];
        updateStatementCreationalAssetsObj.templateStr = null;
    }

    delete updateStatementCreationalAssetsObj.assignmentSequenceStr;
}



/**
 * Composes an object comprised of objects which each consist of data items
 * that can be collectively used to create statements of a distinct type capable
 * of placing tuples of data in to a given table when executed.
 
 * @param tableName                     a String denoting the name of a table in a WebSQL database
 * @param tableColumnDefinitonStr       a String consisting of the definitions of the columns of {@code tableName}; a column 
 *                                      definition consists of the name of column followed by the type of data to be stored in it
 * @param tableKeyColumnName            a String denoting the name of the sole primary key column of {@code tableName}
 * @return                              an object comprised of two objects, respectively keyed by the strings "insert" and "update", 
 *                                      which each consist of data items that can collectively be used to create statements of the
 *                                      key-denoted type, which are capable of placing tuples of data in to {@tableName} when executed
 */
function procureSetOperationStatementCreationalAssets(tableName, tableColumnDefinitonStr, tableKeyColumnName)
{
    var insertStatementCreationalAssetsObj = {
        subjectColumnNameArray: [],
        subjectColumnNameSequenceStr: "",
        subjectColumnValueMarkerSequenceStr: "",
    };
    
    var updateStatementCreationalAssetsObj = {
        subjectColumnNameArray: [],
        assignmentSequenceStr: ""
    };
    
    
    
    /**
     * Updates the members of {@code insertStatemementCreationalAssetsObj} using the name
     * of a column, data procured with said name, and invocation-resultant data.
     
     * @param columnName        a String denoting the name of a column in {@code tableName}
     */
    function updateInsertStatementCreationalAssetsWith(columnName)
    {
        var sequenceTermPrefix = (insertStatementCreationalAssetsObj.subjectColumnNameArray.length === 0 ? "" : ", ");
        
        insertStatementCreationalAssetsObj.subjectColumnNameArray.push(columnName);
        insertStatementCreationalAssetsObj.subjectColumnNameSequenceStr += (sequenceTermPrefix + columnName);
        insertStatementCreationalAssetsObj.subjectColumnValueMarkerSequenceStr += (sequenceTermPrefix + "?");
    }
    
    
    
    /**
     * Updates the members of {@code updateStatementCreationalAssetsObj} using the name
     * of a column, data procured with said name, and invocation-resultant data.
     
     * @param columnName        a String denoting the name of a column in {@code tableName}
     */
    function updateUpdateStatementCreationalAssetsWith(columnName)
    {
        if(columnName !== tableKeyColumnName)
        {
            var sequenceTermPrefix = (updateStatementCreationalAssetsObj.subjectColumnNameArray.length === 0 ? "" : ", ");
            
            updateStatementCreationalAssetsObj.subjectColumnNameArray.push(columnName);
            updateStatementCreationalAssetsObj.assignmentSequenceStr += (sequenceTermPrefix + columnName + " = (?)");
        }
    }
    
    
    
    /**
     * Conducts a series of operations which transition {@code insertStatementCreationalAssetsObj}
     * to a state in which it can be utilized to create statements that, when executed, insert rows
     * in to {@code tableName}. After refinement, {@code insertStatementCreationalAssetsObj} is to 
     * possess exactly two members:
     *      - templateStr:          A prepared INSERT statement capable of being used to insert a 
     *                              data tuple into {@code tableName}
     *      - subjectColumnNameArray:      An array consisting of the names of columns of {@code tableName},
     *                              in the order in which the markers which respectively correspond to
     *                              the values of said columns appear in {@code templateStr}
     */
    function thourouglyRefineInsertStatementCreationalAssetCollection()
    {
        var parenthesizedColumnNameSequenceStr = "(" + insertStatementCreationalAssetsObj.subjectColumnNameSequenceStr + ")";
        var parenthesizedColumnValueMarkerSequenceStr = "(" + insertStatementCreationalAssetsObj.subjectColumnValueMarkerSequenceStr + ")";

        insertStatementCreationalAssetsObj.templateStr = "INSERT INTO " + tableName + " " + parenthesizedColumnNameSequenceStr + " VALUES " + parenthesizedColumnValueMarkerSequenceStr;
 
        delete insertStatementCreationalAssetsObj.subjectColumnNameSequenceStr;
        delete insertStatementCreationalAssetsObj.subjectColumnValueMarkerSequenceStr;
    }
    
    
    
    /**
     * Conducts a series of operations which transition {@code updateStatementCreationalAssetsObj}
     * to a state in which it can be utilized to create statements that, when executed, update rows
     * in {@code tableName}. After refinement, {@code updateStatementCreationalAssetsObj} is to 
     * possess exactly two members:
     *      - templateStr:          A prepared UPDATE statement capable of being used to update
     *                              a data tuple in {@code tableName}
     *      - subjectColumnNameArray:      An array consisting of the names of columns of {@code tableName},
     *                              in the order in which the markers which respectively correspond to
     *                              the values of said columns appear in {@code templateStr}
     */
    function thoroughlyRefineUpdateStatementCreationalAssetCollection()
    {
        if(updateStatementCreationalAssetsObj.subjectColumnNameArray.length > 0)
        {
            updateStatementCreationalAssetsObj.subjectColumnNameArray.push(tableKeyColumnName);
            updateStatementCreationalAssetsObj.templateStr = "UPDATE " + tableName + " SET " + updateStatementCreationalAssetsObj.assignmentSequenceStr + " WHERE " + tableKeyColumnName + " = (?)";
        }
        else
        {
            updateStatementCreationalAssetsObj.subjectColumnNameArray = [];
            updateStatementCreationalAssetsObj.templateStr = null;
        }
        
        delete updateStatementCreationalAssetsObj.assignmentSequenceStr;
    }



    //Omit the enclosing parentheses in columnDefinitionsStr if there are any
    var isEnclosedInParentheses = /^\(.+\)$/.test(tableColumnDefinitonStr);
    if(isEnclosedInParentheses) tableColumnDefinitonStr = tableColumnDefinitonStr.substring(1, tableColumnDefinitonStr.length - 1);
    /////

    //Split the column definitions string in to an array of individual column definitions
    var columnDefinitionStrsArray = tableColumnDefinitonStr.split(",");

    //Loop through the column definition strings in columnDefinitionStrsArray, using
    //the name specified in each to update each collection of creationary assets defined and
    //associated by this function with a distinct type of set operation executory statement
    var columnCount = columnDefinitionStrsArray.length;
    for(var i = 0; i < columnCount; i++)
    {
        var currentColumnDefinitionStr = columnDefinitionStrsArray[i];
        currentColumnDefinitionStr = currentColumnDefinitionStr.replace(/^\s+/, "");
        
        var currentColumnName = currentColumnDefinitionStr.split(/\s+/)[0]  //Extract the column name (which must be the first token) from the whitespace delimited definition 
        
        updateInsertStatementCreationalAssetsWith(currentColumnName);
        updateUpdateStatementCreationalAssetsWith(currentColumnName);
    }
    /////
    
    //Conduct the sequences of operations which respectively transition each collection of
    //creationary assets, defined and associated by this function with a distinct type of
    //set operation executory statement, to a state in which it can be used for its purpose
    thourouglyRefineInsertStatementCreationalAssetCollection();
    thoroughlyRefineUpdateStatementCreationalAssetCollection();
    /////

    return {
            insert: insertStatementCreationalAssetsObj,
            update: updateStatementCreationalAssetsObj
    };
}



/**
* Performs an SQL insert operation targeting a specified table
* using tuples derived from data objects in a given collection.

* @param dataArray		an Array of Objects each specifying a value to be persisted and a key which will map it in the store
* @param optionsObj		an object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete		a function capable of progressing the execution of the set of related storage operations this operation belongs to
*/
function webSQL_set(dataArray, optionsObj, complete)
{
    var i = 0;
    var errorCompleteFunc = createErrorCompleteFunction(complete, [0]);
    
    //Procure an object comprised by objects which respectively contain the assets that
    //will be used to create the types of statements used to carry out the set operation
    var operationAssetsObj = procureSetOperationStatementCreationalAssets(optionsObj.tableData.name, optionsObj.tableData.columnDefinitions, optionsObj.tableData.keyColumnName);

   /**
    * Performs an SQL insert operation targeting a table specified
    * in {@code optionsObj} on every element in {@code dataArray}.

    * @param transaction	the transaction that the operation will be carried out within 
    */
    function set(transaction)
    {
        var dataCount = dataArray.length;
        
        //Store in local variables the data items which will be used to dictate the course of processing
        //in the event of the failure of a data item insertion operation subordinate to the set operation
        var setOnlyIfAbsent = optionsObj.setOnlyIfAbsent;
        
        var CONSTRAINT_ERR_CODE = 6;    //the code of the type of SQLError spawned by an attempt to execute an integrity-constraint-violating statement in a transaction
        /////
        
        //Store in local variables the data items which will be used to create the executory statements of the operation
        var insertColumnNameArray = operationAssetsObj.insert.subjectColumnNameArray;
        var insertStatementTemplate = operationAssetsObj.insert.templateStr;

        var updateColumnNameArray = operationAssetsObj.update.subjectColumnNameArray;
        var updateStatementTemplate = operationAssetsObj.update.templateStr;
        /////
        
        
        
       /**
        * Advances the set operation.
        */
        function advance()
        {
            if(++i < dataCount) insertDataItem(); 	//process the data item at i (which was just incremented in the 'if' clause)
            else                complete(i);
        }
        
        
        
       /**
        * Dictates the course of a set operation in the event of the failure of 
        * a data item insertion operation subordinate to the set operation.
        * 
        * The course dictated depends on the preferences specified for the operation
        * and the reason for the failure. If each tuple procured using an element
        * in dataArray is to be placed in the target table despite the existence of 
        * an identically identified tuple in the table, and if the error spawned by 
        * the spurring insertion operation indicates that the operation failed because
        * it would, if carried out, violate an integrity constraint, it is optimistically
        * assumed that such an integrity constraint is a primary key constraint, and an 
        * attempt is made to place the contents of the subject data item of the insertion
        * operationin the target table via an update operation instead. Under any other
        * circumstances, processing proceeds up the default statement execution error-handling
        * chain.

        * @param transaction       the transaction which the spurring insertion operation was executed in
        * @param error             the SQLError spawned by the spurring insertion operation
        * @return                  true if processing is to proceed up the default statement 
        *                          execution error-handling chain, false otherwise
        */
       function handleInsertFailure(transaction, error)
       {
           var doDeferToSuperiorHandler = true;

           if(!setOnlyIfAbsent && error.code === CONSTRAINT_ERR_CODE)
           {
               updateDataItem();
               doDeferToSuperiorHandler = false;
           }

           return doDeferToSuperiorHandler;
       }



       /**
        * Creates an Array-based tuple.

        * @param dataObj        an object containing values each keyed by a column name in {@code columnNamesArray}
        * @return		an Array consisting of the values keyed in {@code dataObj} in the same 
                                apperance order as that which their keys appear in {@code columnNamesArray}
        */
        function createTuple(columnNameArray, dataObj)
        {
            var valueArray = [];

            //Loop through the column names in columnNamesArray, pushing 
            //on to valueArray the value each keys in dataObj
            var columnCount = columnNameArray.length;
            for(var i = 0; i < columnCount; i++)
            {
                var columnName = columnNameArray[i];
                valueArray.push(dataObj[columnName]);
            }
            /////

            return valueArray;
        }



       /**
        * Inserts a tuple derived from a data object in dataArray in to the target table.
        */
        function insertDataItem(){transaction.executeSql(insertStatementTemplate, createTuple(insertColumnNameArray, dataArray[i].value), advance, handleInsertFailure);};
        
        
        
       /**
        * Redefines the mutable elements of an existing tuple in the target table as those which said
        * elements respectively correspond to in a tuple derived from a data object in dataArray.
        */
        function updateDataItem(){transaction.executeSql(updateStatementTemplate, createTuple(updateColumnNameArray, dataArray[i].value), advance);};



        insertDataItem();	//start the set operation
    }

   /**
    * Executes a transaction which conducts a set operation.

    * @param database		an object which provides a connection to a database
    */
    function executeSetTransaction(database)
    {
        database.transaction(
            function(transaction){webSQL_createTable(transaction, optionsObj, set, errorCompleteFunc);},	//Will conditionally create the table specified in optionsObj before starting the set operation
            errorCompleteFunc
        );
    }

    webSQL_executeStorageOperation(optionsObj, executeSetTransaction, errorCompleteFunc);
}


/**
* Performs an SQL select or delete operation targeting a specified 
* table on tuples identified by key Strings in a given collection.

* @param operationKeyWord       a String of the SQL keyword used to execute the desired operation
* @param dataArray		an Array of Strings each denoting the key of tuple in the target table
* @param optionsObj		an object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete		a function capable of progressing the execution of the set of related storage operations this operation belongs to
*/
function webSQL_getOrRemove(operationKeyWord, dataArray, optionsObj, complete)
{
    var isGet = (operationKeyWord === "SELECT");
    
    var i = 0;
    var keyValuePairsObj = (isGet ? {} : undefined);
    var errorComplete = (isGet ? createErrorCompleteFunction(complete, [0, {}])
                               : createErrorCompleteFunction(complete, [0]));

   /**
    * Performs an SQL select or delete operation targeting the table specified
    * in {@code optionsObj} on every String in {@code dataArray}.

    * @param transaction	the transaction that the operation will be carried out within 
    */
    function getOrRemove(transaction)
    {	
        var dataCount = dataArray.length;
        
        //Construct the statement which will be used to retrieve or delete a single tuple from the target table using a given key from dataArray
        var targetColumnNames = (isGet ? "*" : "");
        var operationStatement = operationKeyWord + " " + targetColumnNames + " FROM " + optionsObj.tableData.name + " WHERE " + optionsObj.tableData.keyColumnName + " = (?)";
        /////

       /**
        * Advances the operation.

        * @param transaction		the transaction object that the current operation is being conducted inside
        * @param sqlResultSet		an object containing the results of the execution of an 
                                        SQL statement as well as related auxiliary data
        */
        function advance(transaction, sqlResultSet)
        {
            if(isGet)
            {
                //Establish a pairing between the currently processing key and the retrieved row (which it keys) in keyValuePairsObj
                var key = dataArray[i];
                var valueObj = (sqlResultSet.rows.length > 0 ? sqlResultSet.rows.item(0) : null);
                keyValuePairsObj[key] = valueObj;
                /////
            }

            if(++i < dataCount)	processDataItem(); 	//process the data item at i (which was just incremented in the 'if' clause)
            else 		{if(isGet) complete(i, keyValuePairsObj); else complete(i);}
        }

       /**
        * Retrieves or deletes a tuple in the target table keyed by a String in dataArray .
        */
        function processDataItem(){transaction.executeSql(operationStatement, [dataArray[i]], advance);};

        processDataItem();	//starts the get or remove operation
    }

   /**
    * Executes a transaction which conducts a get or remove operation.

    * @code database        an object which provides a connection to a database
    */
    function executeGetOrRemoveTransaction(database)
    {
        var transactionType = (isGet ? "readTransaction" : "transaction");
        database[transactionType](getOrRemove, errorComplete);
    }

    webSQL_executeStorageOperation(optionsObj, executeGetOrRemoveTransaction, errorComplete);
}



function webSQL_get(dataArray, optionsObj, complete)
{
    webSQL_getOrRemove("SELECT", dataArray, optionsObj, complete);
}



function webSQL_remove(dataArray, optionsObj, complete)
{
    webSQL_getOrRemove("DELETE", dataArray, optionsObj, complete);
}



/**
* Replaces a String's substrings with a given "placeholder" string.  

* @param str			a String
* @param placeholderStr		the String that will be used to replace the substrings of {@code str}
* @return			an object containing:
                                    - an array of the substrings in {@code str}
                                    - a String identical to {@code str} with {@code placeholderStr} in place of substrings
*/
function replaceSubstrings(str, placeholderStr)
{
    var strRegex = /(?:".*?")|(?:'.*?')/g;
    var displacedStrArray = [];
    var matchDataObj;

    //Iteratively match strRegex to subsrings of str, placing the  
    //matches in to displacedStrArray before removing them from str
    var placeholderStrLength = placeholderStr.length;
    for( ;(matchDataObj = strRegex.exec(str)) !== null; strRegex.lastIndex = strRegex.index + placeholderStrLength)
    {
        var matchedStr = matchDataObj[0];
        displacedStrArray.push(matchedStr);
        str = str.substring(0, matchDataObj.index) + placeholderStr + str.substring(matchDataObj.index + matchedStr.length);
    }
    /////

    return {substrArray: displacedStrArray, str: str};
}


/**
* Sequentially replaces occurances of a given substring in a String with Strings in an array.

* @param str                a String
* @param strArray           an Array containing Strings that will sequentially be used to replace occurances of {@code targetSubstr}
* @param targetSubstr       the String which will have its each of occurances sequentially replaced by the elements in {@code strArray}
* @return                   a String identical to {@code str}, with each element of {@code strArray}
                            sequentially appearing in place of an occurrance of {@code targetSubstr} 
*/
function restoreSubstrings(str, strArray, targetSubstr)
{
    var targetSubstrLength = targetSubstr.length;
    var substringCount = strArray.length;
    var lastSubstringBeginIndex = 0;

    //Progress sequentially through the Strings in strArray, sequentially
    //using each to replace an occurance of targetSubstr in order
    for(var i = 0; i < substringCount; lastSubstringBeginIndex = currentSubstringBeginIndex, i++)
    {
        var currentSubstringBeginIndex = str.indexOf(targetSubstr, lastSubstringBeginIndex);
        str = str.substring(0, currentSubstringBeginIndex) + strArray[i] + str.substring(currentSubstringBeginIndex + targetSubstrLength);
    }
    /////

    return str;
}


/**
* Removes occurances of a gvein variable from a String. The variable 
* is pre-compiled in a local variable regex for performance

* @param booleanExprStr     a String representation of an expression
* @return                   a String representation of the same expression represented
                            in {@code booleanExprStr} sans a given variable
*/
function removeValueObjVariables(booleanExprStr)
{
    var valueObjRegex = /\W?\s*valueObj(?:\s*.)?/g;	
    var newBooleanExprStr = "";
    var curMatchDataObj;
    var pivotIndex = 0;

    //Iteratively find substrings in booleanExprStr that match valueObjRegex, appending to newBooleanExprStr
    //all substrings traversed between match occurances as well as matched tokens starting with the dot operator
    //(in other words, reconstruct booleanExprStr, omitting non-property occurances of the variable of interest)
    while((curMatchDataObj = valueObjRegex.exec(booleanExprStr)) !== null)
    {
        var matchFirstChar = curMatchDataObj[0][0];
        var isMatchOfVariable = (matchFirstChar === "v" || matchFirstChar !== ".");
        var matchLength = curMatchDataObj[0].length;
        
        //If the matched token contains a variable, adjust the variables which collectively 
        //describe the location of the match to describe the location of the contained variable
        if(isMatchOfVariable) 
        {
            var variableOffset = curMatchDataObj[0].indexOf("val")
            curMatchDataObj.index += variableOffset;
            matchLength -= variableOffset;
        }
        /////
        
        var onePastDesiredExprFragmentEndIndex =  curMatchDataObj.index + (isMatchOfVariable ?  0 : matchLength);
        newBooleanExprStr += booleanExprStr.substring(pivotIndex, onePastDesiredExprFragmentEndIndex);

        pivotIndex = curMatchDataObj.index + matchLength;
    }
    /////
    
    if(pivotIndex < booleanExprStr.length) newBooleanExprStr += booleanExprStr.substring(pivotIndex);
    return newBooleanExprStr;
}


/**
* Modifies in a Javascript boolean expression String, logical operators that are 
* associated with sub-expressions containing a given identifier so that the
* truthiness resulting from the evaluation of such sub-expressions is optional.
* The identifier is pre-compiled in a local variable regex for performance.

* @param booleanExprStr		a String representation of a boolean expression
* @return			a String representation of the same boolean expression represented
                                in {@code booleanExprStr}, with || operators in place of the && operators 
                                that expressions containing the identifier of interest have associativity with
*/
function neutralizeKeyObjExpressions(booleanExprStr)
{
    var newBooleanExprStr = "";

    var expressionDelimiterRegex = /(?:&&)|(?:\|\|)|$/g;
    var delimPivotIndex = 0;
    var lastDelimMatch = "";
    var delimMatchDataObj;

    var identifierRegex = /(?:^|(?:\W\s*))keyObj(?!\s*[A-Za-z0-9_$.:])/;
    var identifierStr = "keyObj";
    var identifierMatchDataObj;

   /**
    * Calculates the number of occurances of a parenthesis char in a  
    * string that are not paired with complementary parenthesis chars.

    * @param str                    a String
    * @param parenthesisChar        the parenthesis char of interest
    * @return                       the number of {@code parenthesisChar} present in {@code str} that are not paired with a complementary 
                                    parenthesis char. A negative value denotes the number of excess complementary parenthesis chars
    */
    function calculateExcessParenthesisCharCount(str, parenthesisChar)
    {
        //Calculate the number of opening and closing parentheses in str
        var openingParenthesisCount = 0;
        var opRegex = /\(/g;
        while(opRegex.exec(str) !== null) openingParenthesisCount++;

        var closingParenthesisCount = 0;
        var cpRegex = /\)/g;
        while(cpRegex.exec(str) !== null) closingParenthesisCount++;
        /////

        var excessOpeningParenthesisCount = openingParenthesisCount - closingParenthesisCount;
        return (parenthesisChar === ")" ? -1 : 1) * excessOpeningParenthesisCount;
    }

    //Iteratively parse fragments of booleanExprStr bounded by logical operators and/or input boundaries,
    //ensuring the logical operators in the fragments that the identifiers of interest are bounded to
    //are "||"'s (effectively making their evaluation optional) before appending them to newBooleanExprStr
    while((delimMatchDataObj = expressionDelimiterRegex.exec(booleanExprStr)) !== null)
    {
        var currentDelimMatch = delimMatchDataObj[0];
        var previousExprStr = booleanExprStr.substring(delimPivotIndex, delimMatchDataObj.index);

        if((identifierMatchDataObj = identifierRegex.exec(previousExprStr)) !== null && identifierMatchDataObj[0][0] !== ".")
        {
            //Procure booleans which denote the presence of logical operators bounding previousExprStr
            var precededByLogicOperator = lastDelimMatch.length > 0 && (lastDelimMatch[0] === "&" || lastDelimMatch[0] === "|");
            var followedByLogicOperator = (currentDelimMatch[0] === "&" || currentDelimMatch[0] === "|");
            var enclosedByLogicOperators = precededByLogicOperator && followedByLogicOperator;
            /////

            if(enclosedByLogicOperators)
            {
                var curIdentifierMatchStr = identifierMatchDataObj[0];

                //Determine the bounding indices of the identifier inside previousExprStr
                var identifierBeginIndex = identifierMatchDataObj.index + curIdentifierMatchStr.indexOf(identifierStr);
                var onePastIdentifierEndIndex = identifierBeginIndex + identifierStr.length;
                /////

                //Store in local variables the expression fragments in previousExprStr bounding identifierStr
                var exprFragmentBeforeIdentifier = previousExprStr.substring(0, identifierBeginIndex);
                var exprFragmentAfterIdentifier = previousExprStr.substring(onePastIdentifierEndIndex);
                /////

                //Determine which boundary logic operator the identifier in previousExprStr is has associativity with
                var unmatchedOpeningParenthesisBeforeIdentifierCount = calculateExcessParenthesisCharCount(exprFragmentBeforeIdentifier, "(");
                var unmatchedClosingParenthesisAfterIdentifierCount = calculateExcessParenthesisCharCount(exprFragmentAfterIdentifier, ")");
                var isIdentifierBoundToRightmostLogicOperator = (unmatchedOpeningParenthesisBeforeIdentifierCount - unmatchedClosingParenthesisAfterIdentifierCount) > 0;
                /////

                if(isIdentifierBoundToRightmostLogicOperator)       //identifier is in expression grouping with (and thus bounded to) rightmost logic operator
                    currentDelimMatch = "||";
                else    //identifier isn't in expression grouping or is in one with (and thus bounded to) leftmost logic operator
                    lastDelimMatch = "||";
            }
            else if(followedByLogicOperator)
                currentDelimMatch = "|| ";
            else if(precededByLogicOperator)
                lastDelimMatch = "||";
        }
        
        newBooleanExprStr += (lastDelimMatch + previousExprStr);

        lastDelimMatch = currentDelimMatch;
        delimPivotIndex = delimMatchDataObj.index + lastDelimMatch.length;
        if(lastDelimMatch.length === 0) break;
    }
    /////

    return newBooleanExprStr;
}



/**
* Replaces binary operators in a Javascript expression String with their SQLite equivalents.

* @param exprStr        a String representation of a Javascript expression
* @return		a String identical to {@code expressionStr} with 
                        binary operators that can be recognized in SQLite
*/
function convertBinaryOperators(exprStr)
{
    return exprStr.replace("&&", "AND").replace("||", "OR").replace("===", "==").replace("!==", "!=").replace(/\![^=]/, "~");
}



/**
* Creates a String able to be used in a WHERE clause of an 
* SQL statement from a Javascript boolean expression String.

* @param exprStr		a String representation of a Javascript boolean expression
* @return				a String suitable for use in a WHERE clause of an SQL statement
*/
function webSQL_createWhereClauseString(exprStr)
{
    var variablePlaceholderChar = "@";
    var replaceOperationDataObj = replaceSubstrings(exprStr, variablePlaceholderChar);
    var substrArray = replaceOperationDataObj.substrArray;
    exprStr = replaceOperationDataObj.str;
   

    exprStr = removeValueObjVariables(exprStr);
    exprStr = neutralizeKeyObjExpressions(exprStr);
    exprStr = convertBinaryOperators(exprStr);
    exprStr = restoreSubstrings(exprStr, substrArray, variablePlaceholderChar);

    return exprStr;
}



/**
* Conducts an SQL select or detete operation on tuples in a specified 
* table which meet criteria specified in a supplied expression.

* @param operationKeyWord       a String of the SQL keyword used to execute the desired operation
* @param exprStr		a String representation of a Javascript boolean expression
* @param optionsObj		an object containing auxiliary data pertinent to the to-be-conducted operation
* @param complete		a function capable of progressing the execution of the set of related storage operations this operation belongs to
*/
function webSQL_getOrRemoveAll(operationKeyWord, exprStr, optionsObj, complete)
{
    var isGet = (operationKeyWord === "SELECT");
    var targetAllRecords = (exprStr === "true");
    
    var i = 0;
    var dataObjArray = (isGet ? [] : undefined);
    var errorComplete = (isGet ? createErrorCompleteFunction(complete, [0, []]) 
                                  : createErrorCompleteFunction(complete, [0]));

   /**
    * Performs a conditional SQL select or delete operation using 
    * {@code whereClauseStr} that targets the table specified in {@code optionsObj}.

    * @param transaction	the transaction that the operation will be carried out within 
    */
    function getOrRemoveAll(transaction)
    {
       /**
        * Advances the operation.

        * @param transaction        the transaction object that the current operation is being conducted inside
        * @param sqlResultSet       an object containing the results of the execution of an 
                                    SQL statement as well as related auxiliary data
        */
        function advance(transaction, sqlResultSet)
        {
            if(isGet)
            {
                var rowList = sqlResultSet.rows;

                //Loop through the retrieved rows in rowList, pushing on to dataObjArray objects 
                //each consisting of a single row item keyed by the string "value"
                //
                //(We must return a native array in order to maintain uniformity among
                //the types of objects returned from this operation across storage types)
                var resultCount = rowList.length;
                for(; i < resultCount; i++) dataObjArray.push({value: rowList.item(i)});
                
                complete(i, dataObjArray);
            }
            else{ i = sqlResultSet.rowsAffected; complete(i); }
        }

        //Construct the statement which will be used to conditionally retrieve or delete tuples from the target table
        var targetColumnNames = (isGet ? "*" : "");
        var operationStatement = operationKeyWord + " " + targetColumnNames + " FROM " + optionsObj.tableData.name + (targetAllRecords  ? "" : " WHERE " + webSQL_createWhereClauseString(exprStr));

        transaction.executeSql(operationStatement, [], advance);	//execute operationStatement
    }

   /**
    * Executes a transaction which conducts a get or remove operation.

    * @code database		an object which provides a connection to a database
    */
    function executeGetOrRemoveAllTransaction(database)
    {
        var transactionType = (isGet ? "readTransaction" : "transaction");
        database[transactionType](getOrRemoveAll, errorComplete);
    }

    webSQL_executeStorageOperation(optionsObj, executeGetOrRemoveAllTransaction, errorComplete);
}



function webSQL_getAll(exprStr, optionsObj, complete)
{
    webSQL_getOrRemoveAll("SELECT", exprStr, optionsObj, complete);
}



function webSQL_removeAll(exprStr, optionsObj, complete)
{
    webSQL_getOrRemoveAll("DELETE", exprStr, optionsObj, complete);
}
	
        
/**
* Determines if an object is a SqlError object. An sqlError object is defined
* as an object possessing code and message properties which map an error 
* code and a message related to the type of error the code represents, respectively 
*/
function isSqlError(obj)
{
    return (/*(obj instanceof Object) &&*/ (typeof obj.code ===  "number") && (typeof obj.message === "string"));
}
	
	
/***************************************Test functions****************************************/

var optionsObj = {
    databaseName: "Test",
    databaseDisplayName: "Baked Test",
    databaseVersion: "",
    estimatedDatabaseSize: 1024 * 1024,
    tableData: {name: "Main", columnDefinitions: "(key TEXT PRIMARY KEY, value1 INTEGER, value2 REAL, value3 NULL, value4 BLOB)", keyColumnName: "key"},
    tableIndexDataArray: [],
    
    setOnlyIfAbsent: false
};



function createString()
{
    var uniqueStr = new Date().getTime() + "_";
    
    for(var i = 0; i < 5; i++)
    {
        var randomCharCode = Math.floor((Math.random() * 26)) + 97;
        uniqueStr += String.fromCharCode(randomCharCode);
    }
    
    return uniqueStr;
    
}


function createInt()
{
    return Math.floor(Math.random() * (Math.pow(2,32)- 1));
}


function createReal()
{
    var real = 0;

    for(var i = 0; i < 10; i++)
        real += (Math.random() * 10);

    return real;
}


function createBlob()
{
    var blob = 0;
    for(var i = 0; i < 10; i++)
            blob <<= (i % 2 === 0 ? 1 : 0);

    return blob;
}


var testDataObjArray = [
    {value: {key: createString(), value1: createInt(), value2: createReal(), value3: null, value4: createBlob()}},
    {value: {key: createString(), value1: createInt(), value2: createReal(), value3: null, value4: createBlob()}}
];


function clear()
{
    var tableNamesArray = [];
    var currentTableIndex = 0;

    var advance = function(transaction){ 
        if(++currentTableIndex < tableNamesArray.length)
            dropTable(transaction);
    }

    var dropTable = function(transaction){
            transaction.executeSql("DROP TABLE " + tableNamesArray[currentTableIndex], [], advance)
    }

    var getTableNamesFunc = function(transaction){

        var getTablesComplete = function(transaction, sqlResultSet){
            for(var i = 0; i < sqlResultSet.rows.length; i++)
                tableNamesArray.push(sqlResultSet.rows.item(i).name);
            
            if(tableNamesArray.length > 0) dropTable(transaction);
            else                           advance(transaction);
        }
        
        transaction.executeSql(
            "SELECT name FROM sqlite_master WHERE type='table'",
            [],
            getTablesComplete
        ); 
    }
    
    webSQL_executeStorageOperation(optionsObj, function(database){database.transaction(getTableNamesFunc)});
}


//This function primes the storage facility for the get, remove, get_all,
//and remove_all isf tests runners; as such, this function must be visible 
//(i.e uncommented) at the time any of those tests are to be run
function setupGetOrRemoveTest(database, testFunc, failFunc){
        
    var i = 0;

    var executeSetTransaction = function(transaction){

        var currentTestDataObj = testDataObjArray[i];

        var advance = function(transaction, sqlResultSet){
            if(++i < testDataObjArray.length)
                executeSetTransaction(transaction);
            else
                testFunc();
        }

        var insertStatementCreationalAssetsObj = procureSetOperationStatementCreationalAssets(optionsObj.tableData.name, optionsObj.tableData.columnDefinitions, optionsObj.tableData.keyColumnName).insert;
        var valuesArray = createTupleExt(insertStatementCreationalAssetsObj.subjectColumnNameArray, currentTestDataObj.value);

        transaction.executeSql(
            insertStatementCreationalAssetsObj.templateStr,
            valuesArray,
            advance
        )
    }

    var executeCreateTableTransaction = function(transaction){
        webSQL_createTable(transaction, optionsObj, executeSetTransaction, failFunc)
    }
    
    database.transaction(executeCreateTableTransaction, failFunc);
}




/*
//webSQL_executeStorageOperation test
(function(){

    var testFunc = function(assert){
        
        var mockStorageOperationFunc = function(database){
                QUnit.start(); 
                assert.ok("transaction" in database);
                assert.ok("readTransaction" in database);
                assert.ok("version" in database);
                assert.ok("changeVersion" in database);

        }

        var accessFailFunc = function(){assert.ok(false, "Error accessing database"); QUnit.start();}

        webSQL_executeStorageOperation(optionsObj, mockStorageOperationFunc, accessFailFunc);
}

    QUnit.asyncTest("webSQL_executeStorageOperation", testFunc);
})()
*/




/*
//webSQL_createTable test runner
(function(){

    var testFunc =  function(assert){
        
        var testCompleteFunc = function(transaction){
            transaction.executeSql("DROP TABLE IF EXISTS " + optionsObj.tableData.name);
            QUnit.start();
        }

        var failFunc = function(transaction, sqlError){         
            assert.ok(false, sqlError.message);
            testCompleteFunc(transaction);
        };
        
        var accessFailFunc = function(){assert.ok(false, "Error while accessing database");};

        var tableCheckFunc = function(transaction){

            var completeFunc = function(transaction, sqlResultSet){
                assert.strictEqual(sqlResultSet.rows.item(0).name, optionsObj.tableData.name);
                testCompleteFunc(transaction);
            }

            transaction.executeSql(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='" + optionsObj.tableData.name + "'",
                [],
                completeFunc
            );
        };

        var createTableFunc = function(database){

            var executeTableCreateTransaction = function(transaction){
                webSQL_createTable(transaction, optionsObj, tableCheckFunc)
            }

            database.transaction(executeTableCreateTransaction, failFunc);
        };

        webSQL_executeStorageOperation(optionsObj, createTableFunc, accessFailFunc);
    }

    QUnit.asyncTest("webSQL_createTable", testFunc);
})()
*/



/*
//webSQL_createIndices test runner
(function(){
    
    var currentOptionsObj = {
        databaseName: optionsObj.databaseName,
        databaseDisplayName: optionsObj.databaseDisplayName,
        databaseVersion: "",
        estimatedDatabaseSize: optionsObj.estimatedDatabaseSize,
        tableData: optionsObj.tableData,
        tableIndexDataArray: [{name: "Index0", columnNames: "(value1)"}, {name: "Index1", columnNames: "(value2,value3, value4)"}]
    };

    var testFunc = function(assert){

        var failFunc = function(transaction, sqlError){assert.ok(false, sqlError.message);  testCompleteFunc(transaction);};
        var accessFailFunc = function(){ assert.ok(false, "Error while accessing database");}
        
        var testCompleteFunc = function(transaction){
            transaction.executeSql(
                "DROP TABLE IF EXISTS " + currentOptionsObj.tableData.name
            );
                
            QUnit.start();        
        }

        var createIndexFunc = function(transaction){
            
            var runCount = 0;
            
            var completeFunc = function(transaction, sqlResultSet){
                
                assert.strictEqual(sqlResultSet.rows.length, currentOptionsObj.tableIndexDataArray.length + 1);  //+1 to account for the index automatically 
                                                                                                                    //created for the primary key upon table creation
                if(++runCount < 2)
                    webSQL_createIndices(transaction, currentOptionsObj, indexCheckFunc);	
                else
                    testCompleteFunc(transaction);
            }
        
            var indexCheckFunc = function(transaction){
                transaction.executeSql(
                    "SELECT name FROM sqlite_master WHERE tbl_name ='" + currentOptionsObj.tableData.name + "' AND type='index' ",
                    [],
                    completeFunc
                )		
            }

            webSQL_createIndices(transaction, currentOptionsObj, indexCheckFunc);
        }

        var testOperationFunc = function(database){
            
            var executeTestOperation = function(transaction){
                transaction.executeSql(
                    "CREATE TABLE " + currentOptionsObj.tableData.name + " " + currentOptionsObj.tableData.columnDefinitions,
                    [],
                    createIndexFunc
                );
            }
            
            database.transaction(executeTestOperation, failFunc);
        }

        webSQL_executeStorageOperation(currentOptionsObj, testOperationFunc, accessFailFunc);
    }

    QUnit.asyncTest("webSQL_createIndices", testFunc);

})()
*/



/*
//updateInsertStatementCreationalAssetsWithExt test runner insertStatementCreationalAssetsObj, columnName)
(function(){

    var localTestDataObjArray = [
        {
            subjectColumnNameArray: ["testColumnName1"],
            expectedInsertStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1"],
                subjectColumnNameSequenceStr: "testColumnName1",
                subjectColumnValueMarkerSequenceStr: "?"
            }
        },
        {
            subjectColumnNameArray: ["testColumnName1", "testColumnName2"],
            expectedInsertStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1", "testColumnName2"], 
                subjectColumnNameSequenceStr: "testColumnName1, testColumnName2", 
                subjectColumnValueMarkerSequenceStr: "?, ?"
            }
        },
        {
            subjectColumnNameArray: ["testColumnName1", "testColumnName2", "testColumnName3"],
            expectedInsertStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1", "testColumnName2", "testColumnName3"],
                subjectColumnNameSequenceStr: "testColumnName1, testColumnName2, testColumnName3",
                subjectColumnValueMarkerSequenceStr: "?, ?, ?"
            }
        }
    ];
    
    for(var i = 0; i < localTestDataObjArray.length; i++)
    {
        var testFunc = (function(localTestDataObjIndex){
            
            var currentInsertStatementCreationalAssetsObj = {
                subjectColumnNameArray: [],
                subjectColumnNameSequenceStr: "",
                subjectColumnValueMarkerSequenceStr: ""
            };

            var currentLocalTestDataObj = localTestDataObjArray[localTestDataObjIndex];
            var currentColumnNameArray = currentLocalTestDataObj.subjectColumnNameArray;
            var currentExpectedInsertStatementCreationalAssetsObj = currentLocalTestDataObj.expectedInsertStatementCreationalAssetsObj;
            
            return function(assert){
                for(var j = 0; j < currentColumnNameArray.length; j++)
                    updateInsertStatementCreationalAssetsWithExt(currentInsertStatementCreationalAssetsObj, currentColumnNameArray[j]);

                assert.deepEqual(currentInsertStatementCreationalAssetsObj.subjectColumnNameArray, currentExpectedInsertStatementCreationalAssetsObj.subjectColumnNameArray);
                assert.equal(currentInsertStatementCreationalAssetsObj.subjectColumnNameSequenceStr, currentExpectedInsertStatementCreationalAssetsObj.subjectColumnNameSequenceStr);
                assert.equal(currentInsertStatementCreationalAssetsObj.subjectColumnValueMarkerSequenceStr, currentExpectedInsertStatementCreationalAssetsObj.subjectColumnValueMarkerSequenceStr);

            };
            
        })(i);
        
        QUnit.test("updateInsertStatementCreationalAssetsWithExt", testFunc);
    }
})()
*/

/*
//updateUpdateStatementCreationalAssetsWithExt test runner
(function(){
    var localTestDataObjArray = [
        {
            tableKeyColumnName: "testColumnName0",
            subjectColumnNameArray: ["testColumnName0"],
            expectedUpdateStatementCreationalAssetsObj: {
                subjectColumnNameArray: [],
                assignmentSequenceStr: ""
            }
        },
        {
            tableKeyColumnName: "testColumnName0",
            subjectColumnNameArray: ["testColumnName1"],
            expectedUpdateStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1"],
                assignmentSequenceStr: "testColumnName1 = (?)"
            }
        },
        {
            tableKeyColumnName: "testColumnName2", 
            subjectColumnNameArray: ["testColumnName1", "testColumnName2"],
            expectedUpdateStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1"],
                assignmentSequenceStr: "testColumnName1 = (?)"
            }
        },
        {
            tableKeyColumnName: "testColumnName2",
            subjectColumnNameArray: ["testColumnName1", "testColumnName2", "testColumnName3"],
            expectedUpdateStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1", "testColumnName3"],
                assignmentSequenceStr: "testColumnName1 = (?), testColumnName3 = (?)"
            }
        }
    ];
    
    for(var i = 0; i < localTestDataObjArray.length; i++)
    {
        var testFunc = (function(localTestDataObjIndex){
            
            var currentUpdateStatementCreationalAssetsObj = {
                subjectColumnNameArray: [],
                assignmentSequenceStr: "",
            };

            var currentLocalTestDataObj = localTestDataObjArray[localTestDataObjIndex];
            var currentTableKeyColumnName = currentLocalTestDataObj.tableKeyColumnName;
            var currentColumnNameArray = currentLocalTestDataObj.subjectColumnNameArray;
            var currentExpectedUpdateStatementCreationalAssetsObj = currentLocalTestDataObj.expectedUpdateStatementCreationalAssetsObj;

            return function(assert){
                for(var j = 0; j < currentColumnNameArray.length; j++)
                    updateUpdateStatementCreationalAssetsWithExt(currentUpdateStatementCreationalAssetsObj, currentTableKeyColumnName, currentColumnNameArray[j]);

                assert.deepEqual(currentUpdateStatementCreationalAssetsObj.subjectColumnNameArray, currentExpectedUpdateStatementCreationalAssetsObj.subjectColumnNameArray);
                assert.equal(currentUpdateStatementCreationalAssetsObj.assignmentSequenceStr, currentExpectedUpdateStatementCreationalAssetsObj.assignmentSequenceStr);
            };
            
        })(i);
        
        QUnit.test("updateUpdateStatementCreationalAssetsWithExt", testFunc);
    }
})()
*/

/*
//thourouglyRefineInsertStatementCreationalAssetCollectionExt test runner
(function(){
    
    var localTestDataObjArray = [
        {
            tableName: "testTableName0",
            subjectColumnNameArray: ["testColumnName1"],
            expectedInsertStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1"], 
                templateStr: "INSERT INTO testTableName0 (testColumnName1) VALUES (?)"
            }
        },
        {
            tableName: "testTableName1",
            subjectColumnNameArray: ["testColumnName1", "testColumnName2"],
            expectedInsertStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1", "testColumnName2"],
                templateStr: "INSERT INTO testTableName1 (testColumnName1, testColumnName2) VALUES (?, ?)"
            }
        },
        {
            tableName: "testTableName2",
            subjectColumnNameArray: ["testColumnName1", "testColumnName2", "testColumnName3"],
            expectedInsertStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1", "testColumnName2", "testColumnName3"],
                templateStr: "INSERT INTO testTableName2 (testColumnName1, testColumnName2, testColumnName3) VALUES (?, ?, ?)"
            }
        }
    ];
    
    for(var i = 0; i < localTestDataObjArray.length; i++)
    {
        var testFunc = (function(localTestDataObjIndex){
            
            var currentInsertStatementCreationalAssetsObj = {
                subjectColumnNameArray: [],
                subjectColumnNameSequenceStr: "",
                subjectColumnValueMarkerSequenceStr: ""
            };

            var currentLocalTestDataObj = localTestDataObjArray[localTestDataObjIndex];
            var currentTableName = currentLocalTestDataObj.tableName;
            var currentColumnNameArray = currentLocalTestDataObj.subjectColumnNameArray;
            var expectedInsertStatementCreationalAssetsObj = currentLocalTestDataObj.expectedInsertStatementCreationalAssetsObj;

            return function(assert){

                for(var j = 0; j < currentColumnNameArray.length; j++)
                    updateInsertStatementCreationalAssetsWithExt(currentInsertStatementCreationalAssetsObj, currentColumnNameArray[j]);

                thourouglyRefineInsertStatementCreationalAssetCollectionExt(currentInsertStatementCreationalAssetsObj, currentTableName);

                assert.deepEqual(currentInsertStatementCreationalAssetsObj.subjectColumnNameArray, expectedInsertStatementCreationalAssetsObj.subjectColumnNameArray);
                assert.equal(currentInsertStatementCreationalAssetsObj.templateStr, expectedInsertStatementCreationalAssetsObj.templateStr);
            };
            
        })(i);
        
        QUnit.test("thourouglyRefineInsertStatementCreationalAssetCollectionExt", testFunc);
    }
})()
*/


/*
//thourouglyRefineUpdateStatementCreationalAssetCollectionExt test runner
(function(){
    
    var localTestDataObjArray = [
        {
            tableName: "testTableName0",
            tableKeyColumnName: "testColumnName0",
            subjectColumnNameArray: ["testColumnName0"],
            expectedUpdateStatementCreationalAssetsObj: {
                subjectColumnNameArray: [],
                templateStr: null
            }
        },
        {
            tableName: "testTableName1",
            tableKeyColumnName: "testColumnName0",
            subjectColumnNameArray: ["testColumnName1"],
            expectedUpdateStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1", "testColumnName0"],
                templateStr: "UPDATE testTableName1 SET testColumnName1 = (?) WHERE testColumnName0 = (?)"
            }
        },
        {
            tableName: "testTableName2",
            tableKeyColumnName: "testColumnName2",
            subjectColumnNameArray: ["testColumnName1", "testColumnName2"],
            expectedUpdateStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1", "testColumnName2"],
                templateStr: "UPDATE testTableName2 SET testColumnName1 = (?) WHERE testColumnName2 = (?)"
            }
        },
        {
            tableName: "testTableName3", 
            tableKeyColumnName: "testColumnName2", 
            subjectColumnNameArray: ["testColumnName1", "testColumnName2", "testColumnName3"], 
            expectedUpdateStatementCreationalAssetsObj: {
                subjectColumnNameArray: ["testColumnName1", "testColumnName3", "testColumnName2"],
                templateStr: "UPDATE testTableName3 SET testColumnName1 = (?), testColumnName3 = (?) WHERE testColumnName2 = (?)"
            }
        }
    ];
    
    for(var i = 0; i < localTestDataObjArray.length; i++)
    {
        var testFunc = (function(localTestDataObjIndex){
            
            var currentUpdateStatementCreationalAssetsObj = {
                subjectColumnNameArray: [],
                assignmentSequenceStr: ""
            };

            var currentLocalTestDataObj = localTestDataObjArray[localTestDataObjIndex];
            var currentTableName = currentLocalTestDataObj.tableName;
            var currentTableKeyColumnName = currentLocalTestDataObj.tableKeyColumnName;
            var currentColumnNameArray = currentLocalTestDataObj.subjectColumnNameArray;
            var currentExpectedUpdateStatementCreationalAssetsObj = currentLocalTestDataObj.expectedUpdateStatementCreationalAssetsObj;

            return function(assert){

                for(var j = 0; j < currentColumnNameArray.length; j++)
                    updateUpdateStatementCreationalAssetsWithExt(currentUpdateStatementCreationalAssetsObj, currentTableKeyColumnName, currentColumnNameArray[j]);

                thoroughlyRefineUpdateStatementCreationalAssetCollectionExt(currentUpdateStatementCreationalAssetsObj, currentTableName, currentTableKeyColumnName);

                assert.deepEqual(currentUpdateStatementCreationalAssetsObj.subjectColumnNameArray, currentExpectedUpdateStatementCreationalAssetsObj.subjectColumnNameArray);
                assert.equal(currentUpdateStatementCreationalAssetsObj.templateStr, currentExpectedUpdateStatementCreationalAssetsObj.templateStr);
            };
            
        })(i);
        
        QUnit.test("thourouglyRefineUpdateStatementCreationalAssetCollectionExt", testFunc);
    }
})()
*/

/*
//procureSetOperationStatementCreationalAssets test runner
(function(){
    
    var localTestDataObjArray = [
        {
            tableName: "testTableName0",
            tableColumnDefinitionStr: "intKey INTEGER PRIMARY KEY",
            tableKeyColumnName: "intKey",
            expectedSetOperationStatementCreationAssetsObj: {
                insert: {
                    subjectColumnNameArray:["intKey"],
                    templateStr: "INSERT INTO testTableName0 (intKey) VALUES (?)"
                },
                update:{
                    subjectColumnNameArray: [],
                    templateStr: null
                }
            }
        },
        {
            tableName: "testTableName1",
            tableColumnDefinitionStr: "realKey REAL PRIMARY KEY, textVal TEXT",
            tableKeyColumnName: "realKey",
            expectedSetOperationStatementCreationAssetsObj: {
                insert: {
                    subjectColumnNameArray:["realKey", "textVal"],
                    templateStr: "INSERT INTO testTableName1 (realKey, textVal) VALUES (?, ?)"
                },
                update: {
                    subjectColumnNameArray: ["textVal", "realKey"],
                    templateStr: "UPDATE testTableName1 SET textVal = (?) WHERE realKey = (?)"
                }
            }
        },
        {
            tableName: "testTableName2",
            tableColumnDefinitionStr: "nullVal NULL, blobKey BLOB PRIMARY KEY",
            tableKeyColumnName: "blobKey",
            expectedSetOperationStatementCreationAssetsObj: {
                insert: {
                    subjectColumnNameArray:["nullVal", "blobKey"],
                    templateStr: "INSERT INTO testTableName2 (nullVal, blobKey) VALUES (?, ?)"
                },
                update: {
                    subjectColumnNameArray: ["nullVal", "blobKey"],
                    templateStr: "UPDATE testTableName2 SET nullVal = (?) WHERE blobKey = (?)"
                }
            }
        },
        {
            tableName: "testTableName3",
            tableColumnDefinitionStr: "realVal REAL, textKey TEXT PRIMARY KEY, intVal INTEGER",
            tableKeyColumnName: "textKey",
            expectedSetOperationStatementCreationAssetsObj: {
                insert:{
                    subjectColumnNameArray:["realVal", "textKey", "intVal"],
                    templateStr: "INSERT INTO testTableName3 (realVal, textKey, intVal) VALUES (?, ?, ?)"
                },
                update:{
                    subjectColumnNameArray: ["realVal", "intVal", "textKey"], 
                    templateStr: "UPDATE testTableName3 SET realVal = (?), intVal = (?) WHERE textKey = (?)"
                }
            }
        }
    ]
    
    for(var i = 0; i < localTestDataObjArray.length; i++)
    {
        var testFunc = (function(localTestDataObjIndex){
            
            var currentTestDataObj = localTestDataObjArray[localTestDataObjIndex];
        
            return function(assert){

                var setOperationStatementCreationAssetsObj = 
                    procureSetOperationStatementCreationalAssets(currentTestDataObj.tableName, currentTestDataObj.tableColumnDefinitionStr, currentTestDataObj.tableKeyColumnName);

                var expectedSetOperationStatementCreationAssetsObj = currentTestDataObj.expectedSetOperationStatementCreationAssetsObj;

                assert.deepEqual(setOperationStatementCreationAssetsObj.insert.subjectColumnNameArray, expectedSetOperationStatementCreationAssetsObj.insert.subjectColumnNameArray);
                assert.equal(setOperationStatementCreationAssetsObj.insert.templateStr, expectedSetOperationStatementCreationAssetsObj.insert.templateStr);

                assert.deepEqual(setOperationStatementCreationAssetsObj.update.subjectColumnNameArray, expectedSetOperationStatementCreationAssetsObj.update.subjectColumnNameArray);
                assert.equal(setOperationStatementCreationAssetsObj.update.templateStr, expectedSetOperationStatementCreationAssetsObj.update.templateStr);
            };
            
        })(i);
        
        QUnit.test("procureSetOperationStatementCreationalAssets", testFunc);
    }
})()
*/

/*
//webSQL_set test runner
(function(testCount){
    
    //The codes of the error objects that are spawned, correctly or incorrectly,
    //by an attempt to execute an integrity-constraint-violating statement.
    
    var CONSTRAINT_ERR_CODE = 6;
    
    var UNKNOWN_ERR_CODE = 0;       //Incorrectly spawned in Chrome by SQLTransactionErrorCallbacks which execute as a 
                                        //result of respectively associated SQLStatementErrorCallbacks that return values
                                        //other than false (the WebSQL spec mandates that such SQLTransactionErrorCallbacks
                                        //provide SQLError objects of the same type as those provided by the such respective
                                        //associate SQLStatementErrorCallbacks)
    /////
    
    var optionsObj = {
        databaseName: "Test",
        databaseDisplayName: "Baked Test",
        databaseVersion: "",
        estimatedDatabaseSize: 1024 * 1024,
        tableData: {name: "Main", columnDefinitions: "(key TEXT PRIMARY KEY, value1 INTEGER, value2 REAL, value3 NULL, value4 BLOB)", keyColumnName: "key"},
        tableIndexDataArray: [],

        setOnlyIfAbsent: undefined
    };
    
    var runDataObjArray  = [
        {setOnlyIfAbsent: false, doClearAfter: true},
        {setOnlyIfAbsent: true, doClearAfter: false},
        {setOnlyIfAbsent: false, doClearAfter: false},
        {setOnlyIfAbsent: true, doClearAfter: true}
    ];
        
    var runCount = runDataObjArray.length;

    var testFunc = function(assert){
        
        var run = function(testDataObjPivotIndex, runDataObjPivotIndex){
            
            var currentTestDataObj = testDataObjArray[testDataObjPivotIndex];

            var currentRunDataObj = runDataObjArray[runDataObjPivotIndex];
            var setOnlyIfAbsent = currentRunDataObj.setOnlyIfAbsent;
            var doClearAfter = currentRunDataObj.doClearAfter;

            optionsObj.setOnlyIfAbsent = setOnlyIfAbsent;

            var testCompleteFunc = function(){

                if(doClearAfter)
                    clear();

                if(++runDataObjPivotIndex === runCount)
                {
                    ++testDataObjPivotIndex;
                    runDataObjPivotIndex = 0;
                }

                if(testDataObjPivotIndex === testCount)
                {
                    clear();
                    QUnit.start();
                }
                else
                    run(testDataObjPivotIndex, runDataObjPivotIndex);
            }

            var failFunc = function(){ assert.ok(false); testCompleteFunc();}

            var setCheckFunc = function(database){

                var executeSetCheck = function(transaction){

                    var keyColumnName = optionsObj.tableData.keyColumnName;

                    var completeFunc = function(transaction, sqlResultSet){
                        var storedRow = sqlResultSet.rows.item(0);

                        for(var columnName in storedRow)
                            assert.equal(storedRow[columnName], currentTestDataObj.value[columnName]);

                       testCompleteFunc();
                    }

                    transaction.executeSql(
                        "SELECT * FROM " + optionsObj.tableData.name + " WHERE " + keyColumnName + " = (?)",
                        [currentTestDataObj.value[keyColumnName]],
                        completeFunc
                    );
                }

                database.transaction(executeSetCheck, failFunc);
            }

            var complete = function(processedItemCount, error){

                if(error)
                {
                    if(setOnlyIfAbsent && (error.code === CONSTRAINT_ERR_CODE || error.code === UNKNOWN_ERR_CODE))
                        assert.ok(true);
                    else
                        assert.ok(false);
                    
                    testCompleteFunc();
                }
                else
                    webSQL_executeStorageOperation(optionsObj, setCheckFunc, failFunc);
            }

            webSQL_set([currentTestDataObj], optionsObj, complete);
        };

        run(0, 0);
    };


    QUnit.asyncTest("webSQL_set", testFunc);

})(testDataObjArray.length)
*/


/*
//This test runner makes use of data in the storage facility that
//is created by setupGetOrRemoveTest, and as such requires the 
//function (i.e uncommented) in order to function as expected
//
//webSQL_get test runner
(function(){
    var pivotIndex = 0;

    var testFunc = function(assert){

        var testCompleteFunc = function(){

            if(++pivotIndex === testDataObjArray.length) 
            {
                clear();
                QUnit.start();
            }
            else
                getFunc();
        }

        var failFunc = function(){ assert.ok(false); testCompleteFunc();}

        var getFunc = function(){

            var currentTestDataObj = testDataObjArray[pivotIndex];
            var key = currentTestDataObj.value[optionsObj.tableData.keyColumnName];

            var getCheck = function(processedItemCount, keyValuePairsObj){

                if(processedItemCount === 1)
                    assert.deepEqual(keyValuePairsObj[key], currentTestDataObj.value);
                else
                    assert.ok(false);

                testCompleteFunc();
            }

            webSQL_get([key], optionsObj, getCheck);
        }

        var setupWrapper = function(database){setupGetOrRemoveTest(database, getFunc, failFunc)};
        webSQL_executeStorageOperation(optionsObj, setupWrapper, failFunc);
    }

    QUnit.asyncTest("webSQL_get", testFunc);

})()
*/




/*
//This test runner makes use of data in the storage facility that
//is created by setupGetOrRemoveTest, and as such requires the 
//function (i.e uncommented) in order to function as expected
//
//webSQL_remove test runner
(function(){

    var pivotIndex = 0;
    
    var testFunc = function(assert){

        var testCompleteFunc = function(){
            if(++pivotIndex === testDataObjArray.length)
            {
                clear();
                QUnit.start(); 
            }
            else
                removeFunc();
        }

        var failFunc = function(){assert.ok(false); testCompleteFunc()}

        var removeFunc = function(){
            
            var currentTestDataObj = testDataObjArray[pivotIndex];
            var key = currentTestDataObj.value[optionsObj.tableData.keyColumnName];


            var removeCheck = function(processedItemCount, keyValuePairsObj){

                var checkFunc = function(database){

                    var complete = function(transaction, sqlResultSet){
                        assert.strictEqual(sqlResultSet.rows.length, 0);
                        testCompleteFunc();
                    }

                    var executeCheckTransaction = function(transaction){
                        transaction.executeSql(
                            "SELECT * FROM " + optionsObj.tableData.name + " WHERE " + optionsObj.tableData.keyColumnName + " = (?)" ,
                            [key],
                            complete
                        )
                    }

                    database.transaction(executeCheckTransaction, failFunc);
                }

                webSQL_executeStorageOperation(optionsObj, checkFunc, failFunc);
            }

            webSQL_remove([key], optionsObj, removeCheck);
        }

        var setupWrapper = function(database){setupGetOrRemoveTest(database, removeFunc, failFunc)};
        webSQL_executeStorageOperation(optionsObj, setupWrapper, failFunc);
    }		

    QUnit.asyncTest("webSQL_remove", testFunc);
    
})()
*/



/*
//replaceSubstrings test runner
(function(){

    var replaceSubstringsTestArgObjArray = [
        {argumentStr: "This is a \"test\" string", expectedResultStr: "This is a @ string"},
        {argumentStr: "This is a \'test\' string",  expectedResultStr: "This is a @ string"},
        {argumentStr: "This is a \"test \'for a nested\' single quoted\" string",  expectedResultStr: "This is a @ string" },
        {argumentStr: "This is a \'test \"for a nested\" double quoted\' string", expectedResultStr: "This is a @ string" },
        {argumentStr: "This is a \'test \"for\"\' \'\"two nested\" double quoted\' strings", expectedResultStr: "This is a @ @ strings" },
        {argumentStr: "This is a \"test \'for\'\"\"\'two nested\' single quoted\" strings", expectedResultStr: "This is a @@ strings" },
        {argumentStr: "This is a \'test \"for\"\'\"\'two nested\' quoted\" strings", expectedResultStr: "This is a @@ strings" }
    ]

    for(var i = 0; i < replaceSubstringsTestArgObjArray.length; i++)
    {
        var testFunc = (function(pivotIndex){
            return function(assert){
                var currentArgObj = replaceSubstringsTestArgObjArray[pivotIndex];
                var replacementDataObj = replaceSubstrings(currentArgObj.argumentStr, "@");
                assert.strictEqual(replacementDataObj.str, currentArgObj.expectedResultStr);
            };
        })(i)

        QUnit.test("replaceSubstrings", testFunc);
    }
})()
*/


/*
//removeValueObjVariables test
(function(){

    var removeValueObjVariablesArgObjArray = [
        {argumentStr: "valueObj", expectedResultStr: ""},
        {argumentStr: "keyObj === 1 && valueObj.testProp === 2", expectedResultStr: "keyObj === 1 && testProp === 2"},
        {argumentStr: "testObj.valueObj === 1 && keyObj === 2", expectedResultStr: "testObj.valueObj === 1 && keyObj === 2"},
        {argumentStr: "testObj.valueObj.testProp", expectedResultStr: "testObj.valueObj.testProp"},
        {argumentStr: "testObj.valueObj.testProp === 1 && testObj1.valueObj === 2 && valueObj.testProp === 3", expectedResultStr: "testObj.valueObj.testProp === 1 && testObj1.valueObj === 2 && testProp === 3"}
    ];

    for(var i = 0; i < removeValueObjVariablesArgObjArray.length; i++)
    {
        var testFunc = (function(pivotIndex){
            return function(assert){

                var currentArgObj = removeValueObjVariablesArgObjArray[pivotIndex];
                var actualResultStr = removeValueObjVariables(currentArgObj.argumentStr);
                assert.strictEqual(actualResultStr, currentArgObj.expectedResultStr);
            }							
        })(i)

        QUnit.test("removeValueObjVariables", testFunc);
    }
})()
*/


/*
//neutralizeKeyObjExpressions test runner
(function(){

    var neutralizeKeyObjExpressionsArgObjArray = [
        {argumentStr: "keyObj === true && 1 === 1 || 2 === 2", expectedResultStr: "keyObj === true || 1 === 1 || 2 === 2"},
        {argumentStr: "1 === 1 || ((keyObj && 2 === 2) || 3 === 3)", expectedResultStr: "1 === 1 || ((keyObj || 2 === 2) || 3 === 3)"},
        {argumentStr: "1 === 1 || (2 === 2  && (3 === 3 || keyObj))", expectedResultStr: "1 === 1 || (2 === 2  && (3 === 3 || keyObj))"},
        {argumentStr: "(1 === 1 && keyObj) && (keyObj === 2)", expectedResultStr: "(1 === 1 || keyObj) || (keyObj === 2)"},
        {argumentStr: "testObj. keyObj == fakekeyObj && 1 === 1 && !keyObj", expectedResultStr: "testObj. keyObj == fakekeyObj && 1 === 1 || !keyObj"},
        {argumentStr: "1 === 1 && keyObj && {keyObj :  2}", expectedResultStr: "1 === 1 || keyObj && {keyObj :  2}"}
    ];

    for(var i = 0; i < neutralizeKeyObjExpressionsArgObjArray.length; i++)
    {
        var testFunc = (function(pivotIndex){
            return function(assert){
                var currentArgObj = neutralizeKeyObjExpressionsArgObjArray[pivotIndex];
                var actualResultStr = neutralizeKeyObjExpressions(currentArgObj.argumentStr);
                assert.strictEqual(actualResultStr, currentArgObj.expectedResultStr);
            }   
        })(i)

        QUnit.test("neutralizeKeyObjExpressions", testFunc);
    }
})()
*/


/*
//restoreSubstrings test runner
(function(){

    var restoreSubstringsArgObjArray = [
        {argumentStr: "This is @", strArray: ["a test"], expectedResultStr: "This is a test"},
        {argumentStr: "This is @ with @.", strArray: ["a test", "two strings"], expectedResultStr: "This is a test with two strings."},
        {argumentStr: "This is a test with @.", strArray: ["a \"nested double quoted\" string"], expectedResultStr:"This is a test with a \"nested double quoted\" string."},
        {argumentStr: "This is a test with @ .", strArray: ['a \'nested single quoted\' string'], expectedResultStr:"This is a test with a \'nested single quoted\' string ."},
        {argumentStr: "This is a test with @ @ @ .", strArray: ["two", "'differing'", '"nested strings"'], expectedResultStr:"This is a test with two 'differing' \"nested strings\" ."},
    ];

    for(var i = 0; i < restoreSubstringsArgObjArray.length; i++)
    {
        var testFunc = (function(pivotIndex){

            return function(assert){
                var currentArgObj = restoreSubstringsArgObjArray[pivotIndex];
                var actualResultStr = restoreSubstrings(currentArgObj.argumentStr, currentArgObj.strArray, "@");
                assert.strictEqual(actualResultStr, currentArgObj.expectedResultStr);
            }
        })(i)

        QUnit.test("restoreSubstrings", testFunc);
    }
})()
*/




/*
//This test runner makes use of data in the storage facility that
//is created by setupGetOrRemoveTest, and as such requires the 
//function (i.e uncommented) in order to function as expected
//
//getAll test runner
(function(){

    var testFilterDataObjArray = [
        {filterStr: "true", expectedDataItemCount: testDataObjArray.length},
        {filterStr: optionsObj.tableData.keyColumnName + " === '" + testDataObjArray[0].value.key + "'", expectedDataItemCount: 1}
    ];
    
    var pivotIndex = 0;

    var testFunc = function(assert){
        
        var testFilterDataObj;
        
        var testCompleteFunc = function(){
            if(++pivotIndex === testFilterDataObjArray.length)
            {
                clear();
                QUnit.start();   
            }
            else
                getAll();     
        }

        var failFunc = function(){
            assert.ok(false);
            testCompleteFunc();
        }

        var getAllComplete = function(processedItemCount, dataObjArray){
            assert.strictEqual(dataObjArray.length, testFilterDataObj.expectedDataItemCount);
            testCompleteFunc();
        }

        var getAll = function(){
            testFilterDataObj = testFilterDataObjArray[pivotIndex];
            webSQL_getAll(testFilterDataObj.filterStr, optionsObj, getAllComplete)
        };

        var setupWrapper = function(database){setupGetOrRemoveTest(database, getAll, failFunc)};
        webSQL_executeStorageOperation(optionsObj, setupWrapper, failFunc);
    }


    QUnit.asyncTest("getAllTest", testFunc);
})()
*/



//This test runner makes use of data in the storage facility that
//is created by setupGetOrRemoveTest, and as such requires the 
//function (i.e uncommented) in order to function as expected
//
//removeAll test runner
(function(){

    var testFilterDataObjArray = [
        {filterStr: optionsObj.tableData.keyColumnName + " === '" + testDataObjArray[0].value.key + "'", expectedDataItemCount: 1},
        {filterStr: "true", expectedDataItemCount: 1}
    ];
    
    var pivotIndex = 0;
        

    var testFunc = function(assert){
        
        var testFilterDataObj;
        
        var testCompleteFunc = function(){
            if(++pivotIndex === testFilterDataObjArray.length)
            {
                clear();
                QUnit.start();   
            }
            else
                removeAll();     
        }

        var failFunc = function(){
            assert.ok(false);
            testCompleteFunc();
        }

        var removeAllComplete = function(processedItemCount){
            assert.strictEqual(processedItemCount, testFilterDataObj.expectedDataItemCount);
            testCompleteFunc();
        }
        
        var removeAll = function(){
            testFilterDataObj = testFilterDataObjArray[pivotIndex];
            webSQL_removeAll(testFilterDataObj.filterStr, optionsObj, removeAllComplete)  
        }
        
        var setupWrapper = function(database){setupGetOrRemoveTest(database, removeAll, failFunc)};
        webSQL_executeStorageOperation(optionsObj, setupWrapper, failFunc);
    }

    QUnit.asyncTest("removeAllTest", testFunc);

})()

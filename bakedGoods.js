bakedGoods = function(){

	//Enum-like object containing values corresponding to load-related states an external file 
	var externalFileStatusObj = {NOT_LOADED: 0, LOADING: 1, LOADED: 2, ERROR: 3};

	//Contains key-value pairs each consisting of an external storage type and an object
	//containing data and functions related to the loading of the file that defines code
	//able to access the storage facility defined by the storage type
	var externalFileAssocAssetsWrapperObj = {
		flash: createExternalFileAssociatedAssetsObj(9, flash_isSupportingVersionInstalled),
		silverlight: createExternalFileAssociatedAssetsObj(3, silverlight_isSupportingVersionInstalled)   //Many of the facilities & classes used in the xap file require Silverlight >= 3
	};

	//Contains key-value pairs each consisting of an external storage type and an object containing
	//data structures which, depending on the storage operation status a given structure is associated
	//with, contain either functions or function-containing objects related to storage operations
	//associated with the paired storage type
	var externalStorageOperationAssetsWrapperObj = {
		flash: createExternalStorageOperationAssetObj(),
		silverlight: createExternalStorageOperationAssetObj()
	};

	window.bakedGoods_changeExternalFileStatus = changeExternalFileStatus;
	window.bakedGoods_completeExternalStorageOperation = completeExternalStorageOperation;
	
	
	var expirationDataAptStorageTypesArray =  ["indexedDB", "webSQL", "localStorage", "globalStorage", "fileSystem", "userData"];
	var expirationDataRepositoryName = "Baked_Goods_Expiration_Data";

	var defaultStorageTypeExpirationDataPrimedOptionsObj = {
		webSQL: {
			tableData: {name: expirationDataRepositoryName, keyColumnName: "key", columnDefinitions: "(key TEXT PRIMARY KEY, expirationTimeMillis INTEGER)"},
			tableIndexDataArray:[{name: "Expiration_Data_By_Time", columnNames: "(expirationTimeMillis)"}]
		}, 
		indexedDB:{
			objectStoreData: {name: expirationDataRepositoryName, keyPath: "key", autoIncrement: false},
			objectStoreIndexDataArray: [{name: "Expiration_Data_By_Time", keyPath: "expirationTimeMillis"}]
		}
	}; 	

	
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
			tableData: {name: "Main", columnDefinitions: "(key TEXT PRIMARY KEY, value TEXT)", keyColumnName: "key"}, 
			tableIndexDataArray: [],
			
			//Set operation pertinent options
			setOnlyIfAbsent: false
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
			xapPath: "ext_bin/BakedGoods.xap",

			storeScope: "application",
			conduitClass: "IsolatedStorageFile",

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
	
	
	
	/*********************************************************************************************/
	
	
	
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
         * Creates an object which consists of the properties of one or more objects.
         
         * @param donorObjArray         an array of Objects each containing the properties to be copied to {@code recipientObj}
         * @param copyOnlyIfAbsent      a boolean denoting whether the properties of the objects in {@code donorObjArray} 
					with key components that appear in respectively preceding objects should be copied										
         * @return                      an object which consists of the properties of the objects in {@code donorObjArray}
         */
        function aggregateObjectProperties(donorObjArray, copyOnlyIfAbsent)
        {
            var recipientObj = {};
            copyObjectProperties(recipientObj, donorObjArray, copyOnlyIfAbsent);
            
            return recipientObj;
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
         * Procures a string denoting the family of storage facilities to which a given storage facility belongs.
         
         * @param storageType               a String denoting a type of storage facility
         * @return                          a String denoting the family of storage types to which {@code storageType} belongs
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
	* Creates an object consisting of the key-value pair data items present in a String.
	
	* @param dataStr		a "_" delimited collection of substrings each
							consisting of a key and value
	* @return				an object consisting of all the key-value
							pairs present in {@code dataStr}
	*/
	function deserializeDataItemString(dataStr)
	{
		var locationDataArray = dataStr.split(";");
		var locationDataObj = {};
		
		//Loop through the seralized data item Strings in locationDataArray, tokenizing each
		//and creating a mapping between the resulting key and value in locationDataObj
		var locationDataItemCount = locationDataArray.length;
		for(var i = 0; i < locationDataItemCount; i++)
		{
			var currentKeyValuePairStr = locationDataArray[i];
			var keyValueSeperatorIndex = currentKeyValuePairStr.indexOf(":");

			var currentKey = currentKeyValuePairStr.substring(0, keyValueSeperatorIndex);
			var currentValue = decodeExpirationDataItemComponent(currentKeyValuePairStr.substring(keyValueSeperatorIndex + 1, currentKeyValuePairStr.length));
			
			locationDataObj[currentKey] = currentValue;
		}
		/////
	
		return locationDataObj;
	}
	
	
	
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
         * Determines if a given object is a String.
         
         * @param obj       an object
         * @return          true if {@code obj} is a String literal or String object, false otherwise
         */
        function isString(obj)
        {
            //Though this method of type determination is String-based, and thus, slower than its reference
            //-based alternatives, it is it is more robust and widely supported than said alternatives
            return (Object.prototype.toString.call(obj) === "[object String]");     
        }
	
	/***************************Cookie storage operation functions********************************/
	
	
	
   /**
	* Serializes data contained in an object that collectively describes 
	* the location of one or more data items in a cookie store.
	
	* @param optionsObj		an object containing cookie related storage operation preferences
	* @return				a specially formatted and delimited String consisting 
							of the location data contained in {@code optionsObj}
	*/
	function cookie_serializeLocationData(optionsObj)
	{
		return 	"domain:" 	+ encodeExpirationDataItemComponent(optionsObj.domain)
				+ ";path:" 	+ encodeExpirationDataItemComponent(optionsObj.path);
	}
	
	
	
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
	* @param complete				a function capable of progressing the execution of the set of 
									related storage operations this operation belongs to	
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
	* Performs a cookie remove operation on each item in the store keyed in a given collection.

	* @param dataArray				an Array of Strings, each of the name of a to-be-removed cookie
	* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
	* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to
	*/
	function cookie_remove(dataArray, optionsObj, complete)
	{
		return cookie_set(dataArray, optionsObj, complete, true);
	}
	
	
	
   /**
	* Retrieves the names and values of all the cookies accessible from the current origin.

	* @param optionsObj					an Object containing auxiliary data pertinent to the to-be-conducted operation
	* @param complete					a function capable of progressing the execution of the set of related storage operations this operation belongs to
	* @param isRemovalSuboperation		a boolean denoting whether or not this function was invoked by a parent removal operation
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

	* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
	* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to	
	*/
	function cookie_removeAll(optionsObj, complete)
	{
		var allCookieKeyArray;
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
							removedDataItemKeyArray.push(allCookieKeyArray[indexer]);
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

		* @return			a function capable of funneling the data resulting from a
							cookie getAll() operation in to a cookie remove() operation
		*/
		function createGetAllCompleteWrapper()
		{
		   /**
			* Progresses the execution of the set of constituent sub-operations in this storage operation.

			* @param processedItemCount			an integer denoting the number of items identified in {@code keyArray}
			* @param keyArray                               an Array containing the key of each persisted cookie
			*/
			function getAllComplete(processedItemCount, keyArray)
			{
				allCookieKeyArray = keyArray;
				cookie_set(keyArray, optionsObj, createRemoveAllCompleteWrapper(), true);
			}

			return getAllComplete;
		}

		cookie_getAll(optionsObj, createGetAllCompleteWrapper(), true);
	}
	
	
	
	/*********************************************************************************************/
	
	
	/**************************UserData storage operation functions*******************************/
	
	
	
   /**
	* Serializes data contained in an object that collectively describes 
	* the location of one or more data items in a userData store.
	
	* @param optionsObj		an object containing userData-related storage operation preferences
	* @return				a specially formatted and delimited String consisting 
							of the location data contained in {@code optionsObj}
	*/
	function userData_serializeLocationData(optionsObj)
	{
		return "storeName:" + encodeExpirationDataItemComponent(optionsObj.storeName);
	}
	
	
	
   /**
	* Loads and performs a storage operation on a userData store.
	
	* @param optionsObj					an Object containing auxiliary data pertinent to the to-be-conducted operation
	* @param storageOperationFunc		a function capable of carrying out a storage operation
	* @param complete					a function capable of progressing the execution of the set 
										of related data storage operations which this operation belongs
	* @param doesModify					a boolean denoting whether {@code storageOperationFunc} modifies the store
	*/
	function userData_executeStorageOperation(optionsObj, storageOperationFunc, complete, doesModify)
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
		*       			and responsible for the conclusion of the invoking storage operation
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
		*       			and responsible for the conclusion of the invoking storage operation
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
		*       			and responsible for the conclusion of the invoking storage operation
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
		*       			and responsible for the conclusion of the invoking storage operation
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
			if(error) argArray.push(error);
			
			complete.apply(complete, argArray);
		}

		userData_executeStorageOperation(optionsObj, removeAll, completeNow, true);
	}

	
	
	/*********************************************************************************************/
	
	
	/******************************Web Storage operation functions********************************/
	
	
	
   /**
	* Serializes data contained in an object that collectively describes 
	* the location of one or more data items in a web storage facility.
	
	* @param optionsObj		an object containing web storage related storage operation preferences
	* @return				a specially formatted and delimited String consisting 
							of the location data contained in {@code optionsObj}
	*/
	function webStorage_serializeLocationData(optionsObj)
	{
		return (optionsObj.hasOwnProperty("domain") ? "domain:" + encodeExpirationDataItemComponent(optionsObj.domain) : "");
	}
	

	
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
		*       			and responsible for the conclusion of the invoking storage operation
		*/
		function completeNow(error){ if(error) complete(i, error); else complete(i); }

		webStorage_executeStorageOperation(storageType, optionsObj, set, completeNow);
	}
	
	
	
   /**
	* Performs a web storage get operation on each item in the store keyed in a given collection.

	* @param storageType			a String of the name of the desired web storage facility
	* @param keyArray				an Array of Strings each denoting the name of an item persisted in the web Storage store
	* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
	* @param complete				a function capable of progressing the execution of the set 
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
		*       			and responsible for the conclusion of the invoking storage operation
		*/
		function completeNow(error){ if(error) complete(i, keyValuePairsObj, error); else complete(i, keyValuePairsObj); }

		webStorage_executeStorageOperation(storageType, optionsObj, get, completeNow);
	}
	
	
	
	/**
	* Performs a web storage remove operation on each item in the store keyed in a given collection.

	* @param storageType			a String of the name of the desired web storage facility
	* @param keyArray				an Array of Strings each denoting the name of an item persisted in the web storage store
	* @param optionsObj				an Object containing auxiliary data pertinent to the to-be-conducted operation
	* @param complete				a function capable of progressing the execution of the set of 
									related storage operations this operation belongs to	
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
		*       			and responsible for the conclusion of the invoking storage operation
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
		*       			and responsible for the conclusion of the invoking storage operation
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
		*       			and responsible for the conclusion of the invoking storage operation
		*/
		function completeNow(error){ if(error) complete(i, removedDataItemKeyArray, error); else complete(i, removedDataItemKeyArray); }

		webStorage_executeStorageOperation(storageType, optionsObj, removeAll, completeNow);
	}
	
	
	
	/*********************************************************************************************/
	
	
	/**************************webSQL storage operation functions*********************************/
	
	
	
   /**
	* Serializes data contained in an object that collectively 
	* describes the location of one or more data items in a WindowDatabase.
	
	* @param optionsObj		an object containing webSQL-related storage operation preferences
	* @return				a specially formatted and delimited String consisting 
							of the location data contained in {@code optionsObj}
	*/
	function webSQL_serializeLocationData(optionsObj)
	{
		return "databaseName:" 		+ encodeExpirationDataItemComponent(optionsObj.databaseName) 
				+ ";tableName:" 	+ encodeExpirationDataItemComponent(optionsObj.tableData.name)
				+ ";keyColumnName:" + encodeExpirationDataItemComponent(optionsObj.tableData.keyColumnName);
	}
	
	
	
   /**
	* Creates an object consisting of the webSQL-related location data present in a String.
	
	* @param dataStr		a "_" delimited collection of serialized data items which
							describe the a location in the current WindowDatabase
	* @return				an object consisting of all the key-value
							pairs present in {@code dataStr}
	*/
	function webSQL_createLocationDataObj(locationDataStr)
	{
		var locationDataObj = deserializeDataItemString(locationDataStr);
		locationDataObj["tableData"] = {name: locationDataObj.tableName, keyColumnName: locationDataObj.keyColumName};
		
		delete locationDataObj.tableName;
		delete locationDataObj.keyColumnName;
		
		return locationDataObj
	}
	
	
	
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

	* @param optionsObj					an object containing properties which identify a webSQL database
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

	* @param transaction		the transaction that the index creation statements are to be executed in
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

	* @param transaction		the transaction that the table creation statement is to be executed in
	* @param optionsObj			an object containing properties which describe a table in a webSQL database
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
                var operationAssetsObj = procureSetOperationStatementCreationalAssets();
                
                
                
                /**
                * Composes an object comprised of objects which each consist of data items
                * that can be collectively used to create statements of a distinct type capable
                * of placing tuples of data in to a given table when executed.
                
                * @return       an object comprised of two objects, respectively keyed by the strings "insert" and "update", which 
                *               each consist of data items that can collectively be used to create statements of the key-denoted type,
                *               which are capable of placing tuples of data in to {code optionsObj.tableData.name} when executed
                */
               function procureSetOperationStatementCreationalAssets()
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


                   var tableName = optionsObj.tableData.name;
                   var tableColumnDefinitionStr = optionsObj.tableData.columnDefinitions;
                   var tableKeyColumnName = optionsObj.tableData.keyColumnName;


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
                    *      - templateStr:                   A prepared INSERT statement capable of being used to insert a 
                    *                                       data tuple into {@code tableName}
                    *      - subjectColumnNameArray:        An array consisting of the names of columns of {@code tableName},
                    *                                       in the order in which the markers which respectively correspond to
                    *                                       the values of said columns appear in {@code templateStr}
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
                    *      - templateStr:                   A prepared UPDATE statement capable of being used to update
                    *                                       a data tuple in {@code tableName}
                    *      - subjectColumnNameArray:        An array consisting of the names of columns of {@code tableName},
                    *                                       in the order in which the markers which respectively correspond to
                    *                                       the values of said columns appear in {@code templateStr}
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
                   var isEnclosedInParentheses = /^\(.+\)$/.test(tableColumnDefinitionStr);
                   if(isEnclosedInParentheses) tableColumnDefinitionStr = tableColumnDefinitionStr.substring(1, tableColumnDefinitionStr.length - 1);
                   /////

                   //Split the column definitions string in to an array of individual column definitions
                   var columnDefinitionStrsArray = tableColumnDefinitionStr.split(",");

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
                    * @return               an Array consisting of the values keyed in {@code dataObj} in the same 
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
				else 				{if(isGet) complete(i, keyValuePairsObj); else complete(i);}
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
	* Creates a String able to be used in a WHERE clause of an 
	* SQL statement from a Javascript boolean expression String.

	* @param exprStr		a String representation of a Javascript boolean expression
	* @return				a String suitable for use in a WHERE clause of an SQL statement
	*/
	function webSQL_createWhereClauseString(exprStr)
	{
	   /**
		* Replaces a String's substrings with a given "placeholder" string.  

		* @param str				a String
		* @param placeholderStr		the String that will be used to replace the substrings of {@code str}
		* @return					an object containing:
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
		* @return					a String representation of the same boolean expression represented
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

		* @param exprStr		a String representation of a Javascript expression
		* @return			a String identical to {@code expressionStr} with 
							binary operators that can be recognized in SQLite
		*/
		function convertBinaryOperators(exprStr)
		{
			return exprStr.replace("&&", "AND").replace("||", "OR").replace("===", "==").replace("!==", "!=").replace(/\![^=]/, "~");
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
	* @param exprStr				a String representation of a Javascript boolean expression
	* @param optionsObj				an object containing auxiliary data pertinent to the to-be-conducted operation
	* @param complete				a function capable of progressing the execution of the set of related storage operations this operation belongs to
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

                * @param database		an object which provides a connection to a database
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

	
	
	/*********************************************************************************************/
	
	
	/**************************IndexedDB storage operation functions******************************/
	
	
	
   /**
	* Serializes data contained in an object that collectively 
	* describes the location of one or more data items in an IDBEnvironment.
	
	* @param optionsObj		an object containing indexedDB-related storage operation preferences
	* @return				a specially formatted and delimited String consisting 
							of the location data contained in {@code optionsObj}
	*/
	function indexedDB_serializeLocationData(optionsObj)
	{
		return  "databaseName:" 		+ encodeExpirationDataItemComponent(optionsObj.databaseName) 
				+ ";objectStoreName:" 	+ encodeExpirationDataItemComponent(optionsObj.objectStoreData.name) 
				+ ";keyPath:" 			+ encodeExpirationDataItemComponent(optionsObj.objectStoreData.keyPath);
	}
	
	
	
   /**
	* Creates an object consisting of the indexedDB-related location data present in a String.
	
	* @param locationDataStr		a "_" delimited collection of serialized data items which
							describe the a location in the current IDBEnvironment
	* @return				an object consisting of all the key-value
							pairs present in {@code dataStr}
	*/
	function indexedDB_createLocationDataObj(locationDataStr)
	{
		var locationDataObj = deserializeDataItemString(locationDataStr);
		locationDataObj["objectStoreData"] = {name: locationDataObj.objectStoreName, keyPath: locationDataObj.keyPath};
		
		delete locationDataObj.objectStoreName;
		delete locationDataObj.keyPath;
		
		return locationDataObj
	}
	
	
	
   /**
	* Executes a storage operation on an indexedDB database.

	* @param optionsObj							an object containing properties which identify an IDBDatabase
	* @param databaseOpenRequestHandlerFunc		a function associated with the to-be-conducted storage operation
												capable of utilizing the IDBRequest generated by the
												act of opening the database specified in {@code optionsObj}
	* @param accessErrorCompleteFunc			a function to execute in the event that the database 
												specified in {@code optionsObj} cannot be opened
	*/
	function indexedDB_executeStorageOperation(optionsObj, databaseOpenRequestHandlerFunc, accessErrorCompleteFunc)
	{
		var indexedDB = (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB);

		if(indexedDB)
		{
			var openDatabaseRequest = indexedDB.open(optionsObj.databaseName, optionsObj.databaseVersion);
			databaseOpenRequestHandlerFunc(openDatabaseRequest);
		}
		else
			accessErrorCompleteFunc();
	}
	
	
	
   /**
	* Performs an indexedDB set operation on a specified object store in a
	* specified database using data contained in a collection of objects.

	* @param dataArray		an Array of Objects each specifying a value to be persisted and (optionally) a key which will map it in the store
	* @param optionsObj     an object containing auxiliary data pertinent to the to-be-conducted operation
	* @param complete		a function capable of progressing the execution of the set of related storage operations this operation belongs to
	*/
	function indexedDB_set(dataArray, optionsObj, complete)
	{
		var i = 0;
		var dataCount = dataArray.length;
		
		//Will be used to help determine whether the databse connection created by this operation should be 
		//closed after its conclusion (a value of true indicates that the onversionchange event has been
		//fired, which prevents subsequent version changing connections to the database from being made)
		var wasUpgradeNeeded = false;     
		
		//Create a function that will be used to advance the set of operations  
		//that this operation belongs to in the event of its failure
		var errorComplete = createErrorCompleteFunction(complete, [0]);

	   /**
		* Assigns functions to handle the various events that may fire during
		* the handling of a request to open a database for a set operation.

		* @param openDatabaseRequest        an IDBOpenDBRequest 
		*/
		function handleOpenDatabaseRequest(openDatabaseRequest)
		{
			//Creates database structures using configuration data specified in optionsObj, provided the open() call
			//which spawned openDatabaseRequest was called with a database version higher than the current one. This is triggered before onsuccess()
			openDatabaseRequest.onupgradeneeded = function(){

				//Get a handle to the requested database and use it to create the 
				//object store specified by the pertinent properties in optionsObj
				var database = openDatabaseRequest.result;
				var targetObjectStore = database.createObjectStore(optionsObj.objectStoreData.name, optionsObj.objectStoreData);
				/////

				//Store the array of objects each containing configuration data for a 
				//prospective index of targetObjectStore in a local variable for easier access
				var objectStoreIndexDataArray = optionsObj.objectStoreIndexDataArray;

				//Loop through the objects in objectStoreIndexDataArray, using the
				//data contained in each to create an index for targetObjectStore
				var indexCount = objectStoreIndexDataArray.length;
				for(var i = 0; i < indexCount; i++)
				{
					var currentIndexDataObj = objectStoreIndexDataArray[i];
					targetObjectStore.createIndex(currentIndexDataObj.name, currentIndexDataObj.keyPath, currentIndexDataObj);
				}
				/////
				
				wasUpgradeNeeded = true;
			}
			/////

			//Delegates control flow to set() using openDatabaseRequest's result: the specified database
			openDatabaseRequest.onsuccess = function(){ set(openDatabaseRequest.result); }

			//Progresses the execution of the set of operations the parent operation
			//belongs to in the event the desired database cannot be accessed
			openDatabaseRequest.onerror = openDatabaseRequest.onblocked = errorComplete;
		}

	   /**
		* Performs a set operation using the data contained in the members objects
		* of {@code dataArray} on the object store specified in {@code optionsObj}.

		* @param database       the IDBDatabase object containing the object store that this operation will target
		*/
		function set(database)
		{
			//Create the transaction that the set operation is to take place in
			var setTransaction = database.transaction([optionsObj.objectStoreData.name], "readwrite");
			setTransaction.onerror = errorComplete;

			//Get a handle to the target object store
			var targetObjectStore = setTransaction.objectStore(optionsObj.objectStoreData.name);

			//Store the presence of a key path in a local variable for use in determining how the data in dataArray will be stored
			var hasKeyPath = (targetObjectStore.keyPath !== null);

		   /**
			* Advances the set operation.
			*/
			function advance()
			{
				if(++i >= dataCount)
				{
					if(wasUpgradeNeeded || optionsObj.closeConnection)
						database.close();
					complete(i);
				}
				else
					setDataItem();		//process the data item at i (which was just incremented in the 'if' clause)   		
			}

		   /**
			* Inserts data derived from an object in {@code dataArray} in to {@code targetObjectStore}.
			*/
			function setDataItem()
			{
				//Create the argument array for the set ("put") operation based on the presence of a key path for targetObjectStore
				var argArray = (hasKeyPath ? [dataArray[i].value] : [dataArray[i].value, dataArray[i].key]);

				//Create a request to insert the data contained in argArray in to targetObjectStore,
				//and specify advance() as the function to call upon success of the sub-operation
				var setRequest = targetObjectStore.put.apply(targetObjectStore, argArray); 
				setRequest.onsuccess = advance; 
				/////
			}

			setDataItem();	//starts the operation
		}

		indexedDB_executeStorageOperation(optionsObj, handleOpenDatabaseRequest, errorComplete);
	}
	
	
	
   /**
	* Performs an indexedDB get or remove operation on items in a specified object store/database
	* combo that are in a specified database that are keyed by Strings in a given collection.

	* @param operationType      a String denoting the desired type of operation
	* @param dataArray          an Array of Strings each denoting the key of tuple in the target table
	* @param optionsObj         an object containing auxiliary data pertinent to the to-be-conducted operation
	* @param complete           a function capable of progressing the execution of the set of related storage operations this operation belongs to
	* @param useIndex           an optional parameter denoting whether the to-be-carried out operation
								should be conducted using an index of the specified object store
	*/
	function indexedDB_getOrRemove(operationType, dataArray, optionsObj, complete, useIndex)
	{
		var isGet = (operationType === "get");      
		var keyValuePairsObj = (isGet ? {} : undefined);            
		
		var i = 0;
		var dataCount = dataArray.length;

		//Create a function that will be used to advance the set of operations  
		//that this operation belongs to in the event of its failure
		var errorComplete = (isGet ? createErrorCompleteFunction(complete, [0, {}])
								   : createErrorCompleteFunction(complete, [0]));

	   /**
		* Assigns functions to handle the various events that may fire during the
		* handling of a request to open a database for a get or remove operation.

		* @param openDatabaseRequest		an IDBOpenDBRequest 
		*/
		function handleOpenDatabaseRequest(openDatabaseRequest)
		{
			openDatabaseRequest.onsuccess = function(){ performOperation(openDatabaseRequest.result); };
			openDatabaseRequest.onerror = errorComplete;
		}

	   /**
		* Performs a get or remove operation on items in an object store specified
		* in {@code optionsObj} that are keyed by Strings in {@code dataArray}. 

		* @param database       the IDBDatabase object containing the object store that this operation will target
		*/
		function performOperation(database)
		{
			//Create the transaction that the get or remove operation is to take place in
			var transaction = database.transaction([optionsObj.objectStoreData.name], (isGet ? "readonly" : "readwrite"));
			transaction.onerror = errorComplete;

			//Get a handle to the target object store
			var targetSource = transaction.objectStore(optionsObj.objectStoreData.name);

			//If the use of a specific index of the target object store
			//is specified, then reassign targetSource to the index
			if(useIndex && optionsObj.objectStoreIndexDataArray.length > 0)	
			{
				var targetIndexName = optionsObj.objectStoreIndexDataArray[0].name;
				targetSource = targetSource.index(targetIndexName);
			}
			/////

			//Store the name of the target source member function which which will be used to 
			//perform the  storage sub-operation(s) in to a local variable for conveniece.
			//
			//Remove operations on indices are not supported directly; we must first conduct retrieval 
			//operations to procure the primary keys of the pertinent data items, using each primary key
			//to conduct a traditional (object store based) deletion removal operation
			var operationFuncName = ((isGet || useIndex) ? "get" : "delete");

			//Variable to store the request for the execution of a given 
			//sub-operation. This makes it accessible to advance()
			var operationRequest;
			

		   /**
			* Advances the operation.
			*/
			function advance()
			{
				if(++i >= dataCount)
				{
					if(optionsObj.closeConnection) database.close();
					
					if(isGet)   complete(i, keyValuePairsObj);
					else        complete(i);
				}
				else
					executeSubOperation();		//process the data item at i (which was just incremented in the 'if' clause)   		
			}
			
			
		   /**
			* Handles the successful conclusion of a sub-storage operation. In the
			* case of a retrieval operation, a mapping in keyValuePairsObj is established
			* between the operation's target item and the item's primary key.
			*/
			function handleOperationConsumation()
			{
				var value = operationRequest.result;

				if(!useIndex)   //if the operation's target source is an object store
				{
					if(isGet) keyValuePairsObj[dataArray[i]] = (value || null);                              
					advance();
				}
				else if(value !== undefined)    //if the operation's target store is an index, and there
				{                                   //is an item mapped to the currently processing index key

					//Create a request to retrieve the primary key of "value"
					var getKeyRequest = targetSource.getKey(dataArray[i]);
					
					//Specify a function to execute upon the successful 
					//retrieval of the pertinent item's primary key
					getKeyRequest.onsuccess = function(){

						if(isGet)   
						{                                 
							keyValuePairsObj[getKeyRequest.result] = value; 
							advance();
						}
						else    //original storage operation is removal
						{
							var deleteRequest = targetSource.objectStore["delete"](getKeyRequest.result);
							deleteRequest.onsuccess = advance;
						}
					}; 
					/////
				}
				else        //the operation's target store is an index, and there is no item mapped to the currently processing index key
					advance();
			}


		   /**
			* Retrieves or removes the data item keyed by a String in 
			* {@code dataArray} from the target object store.
			*/
			function executeSubOperation()
			{
				//Create a request to either retrieve or remove the item in the target object store 
				//keyed by the currently processing string in dataArray, and specify
				//handleOperationResult as the function to call upon success of the sub-operation
				operationRequest = targetSource[operationFuncName](dataArray[i]);
				operationRequest.onsuccess = handleOperationConsumation;
				/////
			}

			executeSubOperation();	//starts the get or remove operation
		}
		
		indexedDB_executeStorageOperation(optionsObj, handleOpenDatabaseRequest, errorComplete);
	}



	function indexedDB_get(dataArray, optionsObj, complete)
	{
		indexedDB_getOrRemove("get", dataArray, optionsObj, complete);
	}



	function indexedDB_remove(dataArray, optionsObj, complete)
	{
		indexedDB_getOrRemove("remove", dataArray, optionsObj, complete);
	}
	
	
	
	/**
	* Conducts an indexedDB get or remove operation on records in a specified 
	* object store which meet criteria specified in a supplied expression. 
	*
	* This function forwards execution to its unconditional equivalent provided the supplied 
	* expression is a simple equality expression with one side consisting of a reference to a
	* record's key or one of its properties (the latter also requiring the property's index
	* to be specified), and the other consisting of r-values and/or global l-values.

	* @param operationType      a String denoting the to-be-conducted type of storage operation 
	* @param exprStr		a String representation of a Javascript boolean expression
	* @param optionsObj		an object containing auxiliary data pertinent to the to-be-conducted storage operation
	* @param complete		a function capable of progressing the execution of the set of related storage operations this operation belongs to
	*/
	function indexedDB_getOrRemoveAll(operationType, exprStr, optionsObj, complete)
	{
		var isGet = (operationType === "get");
		var removeExpirationData = optionsObj.removeExpirationData;
		var returnsData = (isGet || removeExpirationData);

		var i = 0;
		var dataArray =  (returnsData ? [] : undefined);
		
		//Create a function that will be used to advance the set of operations  
		//that this operation belongs to in the event of its failure
		var errorComplete = (returnsData ? createErrorCompleteFunction(complete, [0, []])
										 : createErrorCompleteFunction(complete, [0]));	
									  
		
	   /**
		* Determines whether a String is a representation a simple equality expression. Such an
		* expression is defined as a a single expression with exactly one equality operator.

		* @param exprStr        a String representation of an expression
		* @return				true if {@code exprStr} is a single expression making use
								of exactly one equality (== or ===) operator, false otherwise
		*/
		function isSimpleEqualityExpression(exprStr)
		{
			var isSimpleEqualityExpr = false;

			//Redefine exprStr to be the string resulting from the 
			//removal of all of its contained string sequences
			exprStr = exprStr.replace(/(?:".*?")|(?:'.*?')/g, "");

			var logicalOpRegex = /(?:&&)|(?:\|\|)/;
			var hasLogicalOperator = logicalOpRegex.test(exprStr);

			if(!hasLogicalOperator)	//in other words, if exprStr represents a single expression
			{
				var equalityOpRegex = /[^=]===?[^=]/g;
				var equalityOpMatchCount = 0;

				//Iteratively search exprStr for substrings matching equalityOpRegex,
				//updating matchCount upon each successful match
				while(equalityOpRegex.exec(exprStr) !== null) equalityOpMatchCount++;
				isSimpleEqualityExpr = (equalityOpMatchCount === 1);
			}

			return isSimpleEqualityExpr;
		}
			
			
	   /**
		* Procures data from a String representing a simple equality expression that will be used
		* start the unconditional equivalent of the operation that the expression is related to,
		* provided it's determined the operation can be executed as an unconditional operation. A simple
		* equality expression is defined as a single expression with exactly one equality operator.

		* @param exprStr		a String representation of a simple equality expression
		* @return				null if it is determined that the conditional operation related to
		*                       {@code exprStr} cannot be conducted as an unconditional operation,  
		*                       otherwise an object consisting of the following properties:
									- key: 		  the value resulting from the evaluation of the r-value side of {@code exprStr} 
									- originType: the type of database structure expected to index the non-global l-value of {@code exprStr} 
		*/
		function procureUnconditionalOperationImpetusData(exprStr)
		{
			var impetusDataObj = null;

			//This regex will match a side of exprStr consisting of a single l-value
			//(the only l-value identifiers defined in the planned execution context of exprStr are 
			//global identifiers and the (application-reserved) "valueObj" and "keyObj" identifiers)
			var rValueComplementRegex = /(?:^\s*(?:(?:valueObj(?:(?:\s*\[(?:"|').+?(?:"|')\])|\s*\.[$\w]+)*)|keyObj)\s*===?)|(?:===?\s*(?:(?:valueObj(?:(?:\s*\[(?:"|').+?(?:"|')\])|\s*\.[$\w]+)*)|keyObj)\s*$)/;

			//This regex will match a side of exprStr that soley consists of the "keyObj" l-value
			var keyObjIncompleteEqualityRegex = /(?:===?\s*keyObj)|(?:keyObj\s*===?)/;

			var matchDataObj;
			if((matchDataObj = rValueComplementRegex.exec(exprStr)) != null)	//if there is a side of exprStr consisting of a single l-value
			{
				//Reassign exprStr to the unmatched part of exprStr; this will be a single
				//side of its represented expression which should yields a value when evaluated
				exprStr = matchDataObj.index === 0 
								? exprStr.substring(matchDataObj[0].length)
								: exprStr.substring(0, matchDataObj.index);
									
				//Evaluate exprStr to yield the result of its represented expression (since the arugment of eval is assumed to
				//be Javascript source code, we escape  the backslashes in exprStr beforehand to transform it in to its source
				//code representation). If exprStr contains non-global l-values, an exception will be thrown during evaluation
				var key = eval(escapeBackslashes(exprStr));

				//Determine the type of database structure expected to index to the matched l-value
				var originType = (keyObjIncompleteEqualityRegex.test(matchDataObj[0]) ? "objectStore" : "index"); 

				impetusDataObj = {key: key, originType: originType};
			}

			return impetusDataObj;
		}
			

	   /**
		* Wraps {@code complete} with a function that derives the arguments to
		* call it with from arguments that are supplied to the complete 
		* function of a non-conditional get/remove operation.
		*/
		function wrapComplete()
		{
			var originalCompleteFunc = complete;

			complete = function(i, keyValuePairsObj){
				
				//Restore the original progression function
				complete = originalCompleteFunc;	

				//Call the (restored) progression function, supplying it with arguments derived 
				//from the wrapper function's received arguments. Note that the set of circumstances   
				//necessary for this function to be invoked guarentee keyValuePairsObj contains 
				//zero or one key-value pairs (indicative of the fruitfullness of the operation)
				var isFruitful = false;
				for(var key in keyValuePairsObj)
				{
					isFruitful = true;
					complete(i, [{key: key, value: keyValuePairsObj[key]}]);
				}
					
				 if(!isFruitful)     complete(i, []);
			}
		}

		/**
		* Assigns functions to handle the various events that may fire during the
		* handling of a request to open a database for a conditional get or remove operation.

		* @param openDatabaseRequest		an IDBOpenDBRequest 
		*/
		function handleOpenDabaseRequest(openDatabaseRequest)
		{
			openDatabaseRequest.onsuccess = function(){ performOperation(openDatabaseRequest.result);}
			openDatabaseRequest.onerror = errorComplete;
		}

	   /**
		* Carries out a conditional get or remove operation on items in the object store specified
		* in {@code optionsObj}, that meet criterea specified in {@code exprStr}.

		* @param database		the IDBDatabase object containing the object store that this operation will target
		*/
		function performOperation(database)
		{
			//Create the transaction that the get or remove operation is to take place in
			var transaction = database.transaction([optionsObj.objectStoreData.name], (isGet ? "readonly" : "readwrite"));
			transaction.onerror = errorComplete;

			//Get a handle to the target object store
			var targetObjectStore = transaction.objectStore(optionsObj.objectStoreData.name);

			//Store the presence of a key path in a local variable for use in determining how,
			//if the operation yields data, that data will be inserted in to dataArray 
			var hasKeyPath = (targetObjectStore.keyPath !== null);
			
			//Determine if targetObjectStore is to be cleared by the to-be-performed operation
			var isClearOperation = (!isGet && (exprStr === "true"));
			
			if(!isClearOperation)
			{
				//Create a request to open a cursor on the target object store
				var openCursorRequest = targetObjectStore.openCursor();

				//Designate an anonymous function to execute upon the success of a cursor iteration 
				//(which occurs automatically once one is opened). The function performs the specified
				//storage operation on the currently processing record if evaluation of exprStr returns true.
				openCursorRequest.onsuccess = function(){
					var cursor = openCursorRequest.result;
					var canContinue = true;

					if(cursor)	//if there is a record to be processed
					{
						//Put the key and value objects of the current record in to local variables
						//with reserved identifiers. If the identifiers appear in exprStr, the
						//corresponding objects will be utilized in place of them during its evaluation
						var keyObj = cursor.key;
						var valueObj = cursor.value;
						/////

						if(eval(escapeBackslashes(exprStr)) === true)				//Since the arugment of eval is assumed to be Javascript source code, we escape the backslashes in 
						{																//exprStr, transforming it in to its source code representation, before feeding it to the function 
							if(isGet)
							{
								var resultObj = (hasKeyPath ? valueObj : {key: keyObj, value: valueObj});
								dataArray.push(resultObj);
								++i;
							}
							else	//delete
							{
								canContinue = false;		//Prevent the cursor from automatically iterating to the next record after this clause is exited

								//Create a request for the deletion of the currently processing record, and assign an anonymous
								//function to execute upon success of the operation which progresses the cursor to the next record
								var dataItemDeleteRequest = cursor["delete"]();
								dataItemDeleteRequest.onsuccess = function(){
										++i; 
										if(dataArray) dataArray.push(keyObj);
										cursor["continue"]();
								}
								/////
							}
						}

						//Iterate to the next record in the cursor's iteration direction.
						//This action uses the same request (and thus this same success handler)
						if(canContinue) cursor["continue"]();
					}
					else
					{
						if(optionsObj.closeConnection) database.close();
						
						if(returnsData) complete(i, dataArray);
						else            complete(i);
					}     
				}
			}
			else
			{
				//Create a request for the clearance of the target object store, and assign an 
				//anonymous function to execute upon success of the operation which concludes it
				var clearObjectStoreRequest = targetObjectStore.clear();
				clearObjectStoreRequest.onsuccess = function(){complete(0);};
				/////
			} 
		}


		var wasExecutionForwarded = false;

		if(isSimpleEqualityExpression(exprStr))
		{
			//Procure data which will be used to start the execution of this storage operation's unconditional
			//equivalent if it is determined that it can, and will be more efficient to be conducted that way.
			//If such a determination cannot be made, the result of this expression is null.
			var procuredProcessingDataObj = procureUnconditionalOperationImpetusData(exprStr); 

			//If the operation can be conducted as its unconditional equivalent, and its target storage structure
			//is an object store or specified index, then do so after wrapping the complete() function inside a
			//function that can supply it arguments in the form it accepts from the unconditional operation 
			if(procuredProcessingDataObj && (procuredProcessingDataObj.originType === "objectStore" || (optionsObj.objectStoreIndexDataArray.length > 0 && optionsObj.objectStoreIndexDataArray[0].unique)))
			{
				if(operationType === "get") wrapComplete();
				indexedDB_getOrRemove(operationType, [procuredProcessingDataObj.key], optionsObj, complete, (procuredProcessingDataObj.originType === "index"));
				wasExecutionForwarded = true;
			}
			/////
		}

		if(!wasExecutionForwarded)
			indexedDB_executeStorageOperation(optionsObj, handleOpenDabaseRequest, errorComplete);
	}
	
		
		
	function indexedDB_getAll(exprStr, optionsObj, complete)
	{
		indexedDB_getOrRemoveAll("get", exprStr, optionsObj, complete);
	}



	function indexedDB_removeAll(exprStr, optionsObj, complete)
	{
		indexedDB_getOrRemoveAll("remove", exprStr, optionsObj, complete);
	}
	
	
   
	/*********************************************************************************************/
	
	
	/*************************FileSystem storage operation functions*****************************/
	
	
	
   /**
	* Serializes data contained in an object that collectively describes
	* the location of one or more data items in a (HTML5) file system.
	
	* @param optionsObj		an object containing (HTML5) file system related storage operation preferences
	* @return				a specially formatted and delimited String consisting 
							of the location data contained in {@code optionsObj}
	*/
	function fileSystem_serializeLocationData(optionsObj)
	{
		return 	"storageType:" 		+ encodeExpirationDataItemComponent(optionsObj.storageType) 
				+ ";directoryPath:" + encodeExpirationDataItemComponent(optionsObj.directoryPath);
	}
	
	
	
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

            var quotaManagementObj = (optionsObj.storageType === Window.PERSISTENT ? navigator.webkitPersistentStorage : navigator.webkitTemporaryStorage);

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
            if(quotaManagementObj === navigator.webkitPersistentStorage)
            {
                var subAccessFunc = accessFunc;
                accessFunc = function(quotaByteSize){
                     quotaManagementObj.requestQuota(quotaByteSize, subAccessFunc, accessErrorCompleteFunc);
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
	* @param complete		a function capable of progressing the execution of the set of related storage operations this operation belongs to
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
				case "dataURL": 	readMethodName = "readAsDataURL"; 		break;
				case "arrayBuffer": readMethodName = "readAsArrayBuffer";	break;
				default: 			readMethodName = "readAsText"; 			break;
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
	
	
	
	/*********************************************************************************************/
	
	
	/*******************External storage operation general utility functions**********************/
	
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
	
	
	/*********************************************************************************************/
	
	
	/*****************************Flash storage operation functions*******************************/
	
	
	
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
	* Serializes data contained in an object that collectively describes 
	* the location of one or more data items in a Flash LSO.
	
	* @param optionsObj		an object containing LSO-related storage operation preferences
	* @return				a specially formatted and delimited String consisting 
							of the location data contained in {@code optionsObj}
	*/
	function flash_serializeLocationData(optionsObj)
	{
		return 	"lsoName:" 	+ encodeExpirationDataItemComponent(optionsObj.lsoName)
				+ ";lsoPath:" 	+ encodeExpirationDataItemComponent(optionsObj.lsoPath);
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

	
	
	/*********************************************************************************************/
	
	
	/*************************Silverlight storage operation functions*****************************/
	
	
	
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
	* Performs a sequence of operations which  ensure the essential conditions
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
	* Serializes data contained in an object that collectively describes 
	* the location of one or more data items in Silverlight Isolated Storage.
	
	* @param optionsObj		an object containing Isolated Storage-related storage operation preferences
	* @return				a specially formatted and delimited String consisting 
							of the location data contained in {@code optionsObj}
	*/
	function silverlight_serializeLocationData(optionsObj)
	{
		var conduitClass = optionsObj.conduitClass;
		var storedViaISF = (conduitClass === "IsolatedStorageFile");
		
		return 	"storeScope:" 	+ encodeExpirationDataItemComponent(optionsObj.storeScope)
				+ ";conduitClass:" 	+ encodeExpirationDataItemComponent(conduitClass)
				+ (storedViaISF ? ";directoryPath:" + encodeExpirationDataItemComponent(optionsObj.directoryPath): "");
	}



	/**
	 * Procures the name of the managed function designated to carry out a given
	 * type of storage operation using a given Isolated Storage-related class.
	  
	 *  @param storageTypeClass      a String denoting a store representing class related to Isolated Storage
	 *  @param operationType         a String denoting a storage operation type
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
		
		
		
	/*********************************************************************************************/
	
	
	
	var storageOperationFuncObj = {
		cookie:{
			set: cookie_set,
			get: cookie_get,
			remove: cookie_remove,
			getAll: cookie_getAll,
			removeAll: cookie_removeAll,
			serializeLocationData: cookie_serializeLocationData,
			createLocationDataObj: deserializeDataItemString
		},
		userData:{
			set: userData_set,
			get: userData_get,
			remove: userData_remove,
			getAll: userData_getAll,
			removeAll: userData_removeAll,
			serializeLocationData: userData_serializeLocationData,
			createLocationDataObj: deserializeDataItemString
		},
		webStorage:{
			set: webStorage_set,
			get: webStorage_get,
			remove: webStorage_remove,
			getAll: webStorage_getAll,
			removeAll: webStorage_removeAll,
			serializeLocationData: webStorage_serializeLocationData,
			createLocationDataObj: deserializeDataItemString
		},
		webSQL:{
			set: webSQL_set,
			get: webSQL_get,
			remove: webSQL_remove,
			getAll: webSQL_getAll,
			removeAll: webSQL_removeAll,
			serializeLocationData: webSQL_serializeLocationData,
			createLocationDataObj: webSQL_createLocationDataObj
		},
		indexedDB:{
			set: indexedDB_set,
			get: indexedDB_get,
			remove: indexedDB_remove,
			getAll: indexedDB_getAll,
			removeAll: indexedDB_removeAll,
			serializeLocationData: indexedDB_serializeLocationData,
			createLocationDataObj: indexedDB_createLocationDataObj
		},
		fileSystem:{
			set: fileSystem_set,
			get: fileSystem_get,
			remove: fileSystem_remove,
			getAll: fileSystem_getAll,
			removeAll: fileSystem_removeAll,
			serializeLocationData: fileSystem_serializeLocationData,
			createLocationDataObj: deserializeDataItemString
		},
		flash:{
			set: flash_set,
			get: flash_get,
			remove: flash_remove,
			getAll: flash_getAll,
			removeAll: flash_removeAll,
			serializeLocationData: flash_serializeLocationData,
			createLocationDataObj: deserializeDataItemString
		},
		silverlight:{
			set: silverlight_set,
			get: silverlight_get,
			remove: silverlight_remove,
			getAll: silverlight_getAll,
			removeAll: silverlight_removeAll,
			serializeLocationData: silverlight_serializeLocationData,
			createLocationDataObj: deserializeDataItemString
		}
	}
	
	
	
	/*********************************************************************************************/
	
	
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
	function createRegexFriendlyVersionOf(str)
	{
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\\\$&");
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

		var semicolonHex = "%" + ";".charCodeAt(0).toString(16);
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
				case ";":   encodedExpirationDataItemComponent += semicolonHex;     break;
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

		var semicolonHex = "%" + ";".charCodeAt(0).toString(16);
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
				//either its unicode form (if it represents a ";" "_" or "|"), or its longest 
				//0-index based substring that isn't a component to a hex sequence
				switch(charBuffer)
				{
					case semicolonHex:  expirationDataItemComponent += ";";           break;
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
                                                        expiration-time denoting) data of a persisted data item described in {@code storedItemDataCollectionObjArray}
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
			//(with a type/form implicitly specified by includeExpirationTime) that may either be a String uniquely identifying 
			//the item described by the object, or an object which contains an object, keyed by the string "value", consisting of 
                        //the aforementioned item-identifying string and the time the described item is set to expire
			var currentItemCount = currentStoredItemDataObjArray.length;
			for(var j = 0; j < currentItemCount; j++)
			{
				var currentDataObj = currentStoredItemDataObjArray[j];
				var keyStorageTypeLocationDataStr = currentDataObj.key + "_" + currentStorageType + "_" + currentDataObj.serializedLocationData;
                                
                                var expirationData = 
                                        includeExpirationTime
                                        ? {value: {key: keyStorageTypeLocationDataStr, expirationTimeMillis: currentDataObj.expirationTimeMillis}}
                                        : keyStorageTypeLocationDataStr;
                                        
				expirationDataArray.push(expirationData);		
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
		var dataArray = [{key: expirationDataRepositoryName, value: expirationDataBlob}];
                
                var optionsObj = {};
                var storageTypeOptionsObj = (defaultStorageTypeExpirationDataPrimedOptionsObj[storageType] || defaultStorageTypeOptionsObj[storageType]);
 
                //Establish a mapping between storageType and a copy of storageTypeOptionsObj, in optionsObj, so
                //that any modifications to be made to the nested object won't modify storageTypeOptionsObj itself 
                optionsObj[storageType] = {};
                copyObjectProperties(optionsObj[storageType], [storageTypeOptionsObj] , true);
                /////
                
                var functionsObj = {};
                
                conductStorageOperation("set", storageType, {data: dataArray, options: optionsObj, functions: functionsObj}, complete);
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
		var collectionCount = storedItemDataCollectionObjArray.length;
		for(var i = 0; i < collectionCount; i++)
		{
			var storedItemDataCollectionObj = storedItemDataCollectionObjArray[i];
			var storedItemDataArray = storedItemDataCollectionObj.dataArray;
			var encodedStorageType = encodeExpirationDataItemComponent(storedItemDataCollectionObj.storageType);

			//Loop through the objects in storedItemDataArray, using the key and expiration time 
			//contained in each along with encodedStorageType and location data to modify expirationDataBlob
			var dataItemCount = storedItemDataArray.length;
			for(var j = 0; j < dataItemCount; j++)
			{
				var currentDataObj = storedItemDataArray[j];
				var currentEncodedKey = encodeExpirationDataItemComponent(currentDataObj.key);
                                var currentEncodedSerializedLocationData = currentDataObj.serializedLocationData;   //the location data in this string was encoded during the construction of the string
                                
                                var encodedKeyStorageTypeLocationStr = currentEncodedKey + "_" + encodedStorageType + "_" + currentEncodedSerializedLocationData;
				var expirationDataItem = (currentDataObj.expirationTimeMillis !== undefined ? encodedKeyStorageTypeLocationStr + "_" + currentDataObj.expirationTimeMillis : undefined);	

				//Search for the expiration data item keyed by keyStorageTypeLocationStr
				var expirationDataItemKeyRegex = new RegExp("(?:^|\\|)" + createRegexFriendlyVersionOf(encodedKeyStorageTypeLocationStr) + "_\\d+(?:$|\\|)");
				var targetSubstrBeginIndex = expirationDataBlob.search(expirationDataItemKeyRegex);
				/////

				if(targetSubstrBeginIndex !== -1)		//if there is an expiration data item for this key/storage type/location combination
				{
                                        targetSubstrBeginIndex += (expirationDataBlob[targetSubstrBeginIndex] === "|" ?  1 : 0);
                                        
					var onePastTargetSubstrEndIndex = expirationDataBlob.indexOf("|", targetSubstrBeginIndex);
					onePastTargetSubstrEndIndex = (onePastTargetSubstrEndIndex === -1 ? expirationDataBlob.length : onePastTargetSubstrEndIndex);
                                        
					expirationDataBlob = expirationDataExistingItemModFunc(targetSubstrBeginIndex, onePastTargetSubstrEndIndex, expirationDataBlob, expirationDataItem);
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
	function conductExpirationDataStorageOperation(storageType, storageTypeCategoryToOperationTypeObj, storageTypeCategoryToDataEntityObj, complete)
	{
		var storageMetatype = procureStorageMetatype(storageType);
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
		function appendStringWithLeadingDelimiter(operandStr1, operandStr2)
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
																	replaceSubstring, appendStringWithLeadingDelimiter, addExpirationDataComplete);
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
				conductExpirationDataStorageOperation(currentStorageType, storageTypeCategoryToOperationTypeObj, storageTypeCategoryToDataEntityObj, complete);
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
		function removeSubstringWithTrailingDelimiter(targetSubstrBeginIndex, onePastTargetSubstrEndIndex, str)
		{
                        onePastTargetSubstrEndIndex += (onePastTargetSubstrEndIndex < str.length ? 1 : 0);
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
			var isSuccessfulGet = isSuccessful && (operationResultObj !== undefined);

			if(isSuccessfulGet)
			{
				var expirationDataContainerEntity = operationResultObj[expirationDataRepositoryName];

				//If expiration data was found in the currently processing storage type, call
				//updateSerializedExpirationData to remove from the retrieved expiration data,
				//that of each of the items described in storedItemDataCollectionObjArray
				if(expirationDataContainerEntity)
				{
					updateSerializedExpirationData(expirationDataContainerEntity, storedItemDataCollectionObjArray,
													removeSubstringWithTrailingDelimiter, reflectString, removeExpirationDataItemComplete);			
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
				conductExpirationDataStorageOperation(currentStorageType, storageTypeCategoryToOperationTypeObj, storageTypeCategoryToDataEntityObj, complete);
			}
		}

		run();
		return this;
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

		* @param expirationDataItemArray        a homogenous Array of Objects each containing consisting of the  key of  a data item, the storage facility
		*                                       that contains it, subsidiary data pinpointing the location inside the storage facility the data item
		*                                       is located in and (optionally) the time instant the item is set to expire
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
					var storageType = decodeExpirationDataItemComponent(currentKeyComponentArray[1]);
					var serializedLocationData = decodeExpirationDataItemComponent(currentKeyComponentArray[2]);
					/////

					//Get the index in expiredItemDataCollectionArray which stores the object containing the
					//array of Objects each consisting of data describing an expired data item in storageType
					var storageTypeIndex = storageTypeToIndexObj[storageType];

					//If such an object hasn't been created, create it
					if(storageTypeIndex === undefined)
					{
						storageTypeIndex = storageTypeToIndexObj[storageType] = expiredItemDataCollectionArray.length;
						expiredItemDataCollectionArray.push({storageType: storageType, dataArray: []});	
					}
					/////

					//Push an object containing dataItemKey and serializedLocationData on to the array of such data-describing
					//objects inside the object in expiredItemDataCollectionArray linked to storageType 
					expiredItemDataCollectionArray[storageTypeIndex].dataArray.push({key: dataItemKey, serializedLocationData: serializedLocationData});		
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
                        var curStorageMetatype = procureStorageMetatype(curStorageType);

			var curExpiredItemDataObj = curExpiredItemDataCollectionObj.dataArray[k];

			if(!dataItemRemovalArgObj.options[curStorageType]) dataItemRemovalArgObj.options[curStorageType] = {};
			var locationDataObj = storageOperationFuncObj[curStorageMetatype].createLocationDataObj(curExpiredItemDataObj.serializedLocationData);
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
	   
		* @param byStorageTypeRemovedItemCountObj       an Object which contains a single key value pair consisting of the sole storage facility
                *                                               in which the invoking removal sub-operation was conducted and the number of items removed
                *                                               by the sub-operation
		* @param byStorageTypeErrorObj                  an Object which contains a singled key-value pair consisting of the sole storage facility
                *                                               in which the invoking removal sub-operation was conducted and the error (if any) spawned by, 
		*                                               and responsible for the conclusion of, the sub-operation
		*/
		function removeComplete(byStorageTypeRemovedItemCountObj, byStorageTypeErrorObj)
		{
			var canConclude = true;
                        
                        //Obtain a handle to the currently processing expired item data collection and use the storage type,
                        //identified in the data collection, that the collection is associated with, and that the invoking 
                        //removal sub-operation was conducted in, to obtain the error (if any) spawned by, and responsible
                        //for the conclusion of, the sub-operation
                        var expiredItemDataCollectionObj = expiredItemDataCollectionArray[j];
                        var error = byStorageTypeErrorObj[expiredItemDataCollectionObj.storageType];
                        /////

			if(!error)
			{
				//Obtain a handle to the currently processing expired item data object
				var curExpiredItemDataObj = expiredItemDataCollectionObj.dataArray[k];

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
				conductExpirationDataStorageOperation(currentStorageType, storageTypeCategoryToOperationTypeObj, storageTypeCategoryToDataEntityObj, getExpirationDataComplete);
			}
		}

		run();
		return this;
	}
		

		
	/*********************************************************************************************/	
		
	
	
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
                
                //Given the capacity that this function has to change argObj.data, argObj is redefined as
                //shallow copy of itself with a substantive copy of the array (where "substantive" applies 
                //to the array itself and not necessarily the its contents), a measure which ensures that
                //the state of the original argObj is not changed
                var argObjCompositeCopy = aggregateObjectProperties([argObj, {data: argObj.data.slice(0)}], false);
                argObj = argObjCompositeCopy;
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
                                                
                                                var currentColumnValue = dataItemObj.value[currentColumnName];
                                                currentColumnValue = (isString(currentColumnValue) ? "'" + currentColumnValue + "'" : currentColumnValue);
                                                
						key += (key === "" ? "" : " && " ) + currentColumnName + " === " + currentColumnValue;
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
                
                //Given the capacity that this function has to change argObj.data, argObj is redefined as
                //shallow copy of itself with a substantive copy of the array (where "substantive" applies 
                //to the array itself and not necessarily the its contents), a measure which ensures that
                //the state of the original argObj is not changed
                var argObjCompositeCopy = aggregateObjectProperties([argObj, {data: argObj.data.slice(0)}], false);
                argObj = argObjCompositeCopy;
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
                * Creates an array consisting of the elements in a range in argObj.data
                * that can be expressed as [0,i), where i itself is in the range 
                * [0, argObj.data.length], which do not key values in a given Object.
		*
		* This function cannot discern between keys that are not present in the
                * argument Object and those which key null values. Thus, keys which
		* fall in to either category will be included in the returned array.

                * @param onePastFocalRangeEnd       an int of one past the index in {@code argObj.data} that   
                *                                   defines as the end of the focal range of this function 
                * @param keyValuePairObj            an Object consisting of key-value pairs which may or may not feature
                *                                   elements in the target range in {@code argObj.data} as keys
                * @return                           an Array consisting of the elements in the focal range in 
                *                                   {@code argObj.data} that map to null values in {@code keyValuePairsObj}
		*/
		function getAbsentDataKeys(onePastFocalRangeEnd, keyValuePairObj)
		{
			var absentDataKeysArray = [];
			var dataArray = argObj.data;

			//Loop through the keys in the focal range in dataArray, pushing those
			//on to absentDataKeysArray that don't map to meaningful values
			for(var i = 0; i < onePastFocalRangeEnd; i++)
			{
				var currentKey = dataArray[i];
				var currentValue = keyValuePairObj[currentKey];

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
			if(j < regenerationArgObjArray.length)
			{
				regenerationArgObjArray[j].functions = regenerationFunctionsObj;
				regenerationArgObjArray[j].complete = regenerateData;	//Designate this function to execute after the conclusion of the set operation
				set(regenerationArgObjArray[j++]);
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
				var absentDataKeysArray = getAbsentDataKeys(currentProcessedItemCount, retrievedKeyValuePairsObj);

				//Reconstitute the operation's key array as that which contains the keys 
				//that were unprocessed or deemed absent by the invoking sub-retrieval            
				Array.prototype.splice.apply(argObj.data, [0, currentProcessedItemCount]); 
                                Array.prototype.push.apply(argObj.data, absentDataKeysArray);
                                /////

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
		function createItemIdentificationCentricExpirationDataCollection(keyArray)
		{
			var expirationDataObjArray = [];
                        
                        var currentStorageMetatype = procureStorageMetatype(currentStorageType);

			//Create a String containing data that describes the location of items in currentStorageType keyed by the elements in keyArray 
			var storageTypeOptionsObj = procureStorageTypeOptions(currentStorageType, argObj.options[currentStorageType]);
			var serializedLocationData = storageOperationFuncObj[currentStorageMetatype].serializeLocationData(storageTypeOptionsObj);
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
				expirationDataCollectionArray.push(createItemIdentificationCentricExpirationDataCollection(resultObj));

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
		return getOrRemoveAll("getAll", argObj);
	}



	function removeAll(argObj)
	{
		return getOrRemoveAll("removeAll", argObj);	
	}
	
	

	return {
		set: set, 
		get: get,
		remove: remove,
		getAll: getAll,
		removeAll: removeAll,
		removeExpired: removeExpired
	}
}()

/*
	TODO:
			- Replace "complete" comments with those of a form similar to the ones in the "conditional operation complete functions"
			- Refactor webSQL removeAll to record removed item keys for expiration data removal
			- Explore flash params & object attributes
			- Perform ActionScript cleanup on unload
			- EncodeURL/DecodeURL for cookie storage operations
			- Consider allowing expiration data to be stored in flash and silverlight
			
			- Update webSQL and indexedDB unconditional retrieval and tests to examine the retreived values
			
			- FLASH ISSUE: Serialization of arguments for Javascript-to-Flash function marshalling is recursive. Deeply nested elements undergoing serialization may cause stack overflow
			
			- OPERA ISSUE: ActionScript function recursion is not allowed (effectively means storage operations cannot be nested (setTimeout can be used to bypass this))
			
			- OPERA BUG: webSQL API is visible even if access is not allowed (if access is not allowed, API members should be marked undefined or null)
			- OPERA BUG: Accessing scriptable managed code with a breakpoint set stalls the operation with no recourse (operation seems to break, but UI presents no way to progress past breakpoint) 

			- SQLITE BUG: Numbers with fractional components consisting of more than 15 digits are rounded when cast in to text
			
			- CHROME BUG: Errors don't correctly implement DOMError interface
                        - CHROME BUG: SQLTransactionErrorCallbacks which execute as a result of respectively associated SQLStatementErrorCallbacks that return values other 
                                      than false do not provide error arguments equivalent in type to those provided by said respective associate SQLStatementErrorCallbacks
			- CHROME BUG: readAsDataURL does not produce a dataURL with the target blob's media type
			- CHROME BUG: Root directory can be specified by using null, but doing so in a getDirectory call with the create flag set causes an error (such is not the case for other representations of the root)
*/
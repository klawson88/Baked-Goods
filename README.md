##About

BakedGoods is a comprehensive Javascript library which establishes a uniform interface that can be used to conduct
common storage operations in ALL native client-side storage facilities introduced before and by HTML5,
as well as popular external storage facilities, while maintaining the flexibility and options afforded to the user by each.

Specifically, the supported storage types are:

- cookies 
- userData 
- webStorage (sessionStorage, localStorage, and globalStorage)
- webSQL
- indexedDB
- HTML5 File System
- Flash Locally Shared Objects
- Silverlight Isolated Storage

Unlike many similar libraries:

- Library agnostic
- User-driven storage type selection process
- Error handling
- Batch processing
- Cascading and pervasive operations
- Conditional operations
- Custom storage types
- Custom storage operation functions
- Data expiration capabilities provided for all storage types
- Regeneration capabilities provided for all storage types


The code well structured, easy to follow, and extensively commented for the 
benefit of developers seeking to increase familiarity with any of the supported facilities, as 
well as developers seeking to add homogeneous, functionality-extending code with ease.

##How to use

BakedGoods provides **five** methods that can be used to conduct their namesake storage operations: `set()`, `get()`, `remove()`, `getAll()`, and `removeAll()`. 

All the methods take an object as an argument and utilize 3 properties in it:

- Either:
    - **data** (for `set()`, `get()`, and `remove()`):  An array consisting of data that will be the subject of the storage operation
             
    - **filter** (for `getAll()` and `removeAll()`):  a String representation of an expression that, when evaluated using an arbitrary data    item, must return true for that item to be subject to the operation (see "conditional operations" for more details)
- **storageTypes**: An array consisting of Strings denoting the storage facilities the storage operation is to be conducted in
    
- **options**: A object containing key-value pairs each consisting of a storage facility named in **storageTypes** and
              an object containing data that will collectively dictate how the storage operation is to be conducted in it
- **complete**:   A function to be called upon the conclusion of the storage operation


###set() 


    //Create objects containing operation preferences for each target storage facility. 
    //These objects, and values defined in them are all optional; BakedGoods provides sensible defaults
    var silverlightOptionsObj = {conduitClass: "IsolatedStorageFile", directoryPath: "/example_files"};
	var fileSystemOptionsObj = {storageType: Window.PERSISTENT, size: 2048 * 2048, directoryPath: "/example_files"};
	var optionsObj = {silverlight: silverlightOptionsObj, fileSystem: fileSystemOptionsObj};
    
    //Without comments
    bakedGoods.set({
    	data: [{key: "key1", value: "val1"}, {key: "key2", value: "val2"}],
		storageTypes: ["silverlight", "fileSystem", "localStorage"],
		options: optionsObj,
		complete: function(byStorageTypeStoredKeysObj, byStorageTypeErrorObj){}
	});
    
    //With comments
	bakedGoods.set({
		//Array of data items to store
		data: [{key: "key1", value: "val1"}, {key: "key2", value: "val2"}],
		
		//Array specifying the facilities the items are to be persisted in
		storageTypes: ["silverlight", "fileSystem", "localStorage"],
		
		//Object containing preferences for each subsidiary set() operation
		options: optionsObj,
		
		//Define a callback to be executed after completion
		//byStorageTypeStoredKeysObj:   Contains pairings each consisting of a target storage type and
                                        an array of the keys of items stored in it by the operation
		//byStorageTypeErrorObj:        Contains pairings each consisting of a storage type in which the 
                                        foperation ailed and the DOMError representing  the cause
		complete: function(byStorageTypeStoredKeysObj, byStorageTypeErrorObj){}
	});
    

	
	
	
###get()
    //Without comments
    bakedGoods.get({
		data: ["key1", "key2"],
		storageTypes: ["silverlight, "fileSystem"],
		options: optionsObj,
		complete: function(totalProcessedItemCount, resultDataObj, byStorageTypeErrorObj){}
	});

    //With comments
	bakedGoods.get({
		//Array of Strings keying the desired items
		data: ["key1", "key2"],
		
		//Array specifying facilities items are located in
		storageTypes: ["silverlight, "fileSystem"],
		
		//We're retrieving the data items persisted in the set() example, use same optionsObj
		options: optionsObj,
		
		//Define a callback to be executed after completion
		//totalProcessedItemCount: Number of items retrieved
		//resultDataObj: Contains pairings each consisting of a desired key and the item it keys in the first 
						 target storage facility it maps something in, or null if it wasn't found in any. If the
						 operation was disjoint, this will contain pairings each consisting of a storage type and
						 an object containing the data item key-value pairings procured from the it
		//byStorageTypeErrorObj: See set() example for explanation
		complete: function(totalProcessedItemCount, resultDataObj, byStorageTypeErrorObj){}
	});
	
	
###remove()

    //Without comments
    bakedGoods.remove({
		data: ["key1", "key2"],
		storageTypes: ["silverlight, "fileSystem"],
		options: optionsObj,
		complete: function(byStorageTypeRemovedItemKeysObj, byStorageTypeErrorObj){}
	});

    //With comments
    bakedGoods.remove({
		//Array of Strings keying the items to be removed
		data: ["key1", "key2"],
		
		//Array specifying facilities items are located in
		storageTypes: ["silverlight, "fileSystem"],
		
		//We're removing the data items persisted in the set() example, use same optionsObj
		options: optionsObj,
		
		//Define a callback to be executed after completion
		//byStorageTypeRemovedItemKeysObj:  Contains pairings each consisting of a target storage type
                                            and array of keys of items removed by this operation
		//byStorageTypeErrorObj:            See set() example for explanation
		complete: function(byStorageTypeRemovedItemKeysObj, byStorageTypeErrorObj){}
	});
	
	
###getAll()

    //Without comments
    bakedGoods.getAll({
		storageTypes: ["silverlight, "fileSystem"],
		options: optionsObj,
		complete: function(byStorageTypeResultDataObj, byStorageTypeErrorObj){}
	});

    //With comments
	bakedGoods.getAll({
		
		//Array specifying facilities items are located in
		storageTypes: ["silverlight, "fileSystem"],
		
		//We're removing the data items persisted in the set() example, use same optionsObj
		options: optionsObj,
		
		/Define a callback to be executed after completion
		//byStorageTypeResultDataObj:       Contains pairings each consisting of a target storage type and an array of all
										    the data items in it (in the objects of the form {key: _ , value: _})
		//byStorageTypeErrorObj:            See set() example for explanation
		complete: function(byStorageTypeResultDataObj, byStorageTypeErrorObj){}
	});
	
	
###removeAll()

    //Without comments
    bakedGoods.removeAll({
		storageTypes: ["silverlight, "fileSystem"],
		options: optionsObj,
		complete: function(byStorageTypeResultDataObj, byStorageTypeErrorObj){}
	});

    //With comments
    bakedGoods.removeAll({
	
		//Array specifying facilities items are located in
		storageTypes: ["silverlight, "fileSystem"],
		
		//We're retrieving the data items persisted in the set() example, use same optionsObj
		options: optionsObj,
		
		/Define a callback to be executed after completion
		//byStorageTypeResultDataObj:   Contains pairings each consisting of a target storage type 
										and the number of data items in it that were removed
		//byStorageTypeErrorObj:        See set() example for explanation
		complete: function(byStorageTypeResultDataObj, byStorageTypeErrorObj){}
	});
	
	
###removeExpired()

	//You may supply a user-defined function for any storage facility that may
	//contain expired item. The supplied function will then be used in place of 
	//the internal to remove the expired items from that particular facility
	//(see "User-defined storage operation functions" for details)
    bakedGoods.removeExpired();
	
###Storage type options

Values for any options that a given storage facility exposes can be
specified through the options object detailed in the above examples.
 
 The internal object which contains the default values used is shown below:

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
			swfPath: "ext_apps/BakedGoods.swf",

			lsoName: "Baked_Goods",
			lsoPath: null,

			elementID: "bakedGoods",
			elementParent: document.body,
			elementStyle: "visibility:none;position:absolute;left:0;top:0;width:1px;height1px;",

			allowScriptAccess: "sameDomain"
		},
		silverlight: {
			xapPath: "ext_apps/bakedGoods.xap",

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
	
<br/>

	
##Advanced


###Storage operation options

BakedGoods defines several storage operation-specific options that can alter the way they're performed:

	var defaultOperationOptionsObj = {
		set: {
        
			conductDisjointly: false, 	//if false, the target storage facilities will be looped through
                                        //in order, and for each, an attempt will be made to store the items
                                        //unable to be persisted in the facilities appearing before it 
										
										//if true, the entire set of data items supplied for the operation
                                        //will be persisted in each of the target storage facilities, in order
										
			recordExpirationData: false //if true, expiration-related data pertaining to each item that was
                                        //succesfully stored is recorded in a storage facility entity specifically
                                        /designated for such data. A call to bakedGoods.removeExpired() will   
                                        //remove data items regarded as expired at the time of the call 
		},
		get: {
        
			conductDisjointly: false,  	//if false, the target storage facilities will be looped through in order,
                                        //and for each, an attempt will be made to retrieve the items absent  
                                        //or unable to be retrieved from the facilities appearing before it 
										
										//if true, the entire set of keys supplied will be used in the retrieval
                                        //operation conducted for each target storage facility
										
			regenerate: false			//if true, any to-be-retrieved data item that is absent in a given 
                                        //target storage facility, but is retrieved from a facility appearing 
                                        //later than it will be restored in the former. You can supply the custom
                                        //functions you may have used to originally store the items, in an object keyed in 
                                        //the options object by "regenerationFunctions" (see "User-defined functions" below)
		},
		remove:{
        
			removeExpirationData: false	//if true, expiration-related data pertaining to 
                                        //each item that was removed is also removed
		},
		removeAll:{
        
			removeExpirationData: false	//if true, expiration-related data pertaining to 
                                        //each item that was removed is also removed
		}
	};
	
	
###Database types

WebSQL and IndexedDB based storage operations can be conducted through the interface just like non-database types.
This interface uniformity, however, introduces a few differences in the data you supply it.

	//Create objects containing operation preferences for equivalent databases in webSQL and indexedDB.
	//If the operation is a set(), and the referenced structures don't exist, they will be created automatically.
    var webSQLOptionsObj = {
		databaseName: "Example_DB",
		databaseDisplayName: "Example DB",
		databaseVersion: "",
		estimatedDatabaseSize: 1024 * 1024,
		tableData: {name: "Main", keyColumnName: "lastName", columnDefinitions: "(lastName TEXT PRIMARY KEY, firstName TEXT)"}, 
		tableIndexDataArray: [name: "First_Name_Index", columnNames: "firstName"]
	};
	
	var indexedDBOptionsObj = {
		databaseName: "Example_DB",
		databaseVersion: 1,
		objectStoreData: {name: "Main", keyPath: lastName, autoIncrement: false},
		objectStoreIndexDataArray: [{name: "First_Name_Index", keyPath: "firstName", unique: false, multiEntry: false}],
	};
	
	var optionsObj = {conductDisjointly: false, webSQL: webSQLOptionsObj, indexedDB: indexedDBOptionsObj};
	/////

    //Without comments
    bakedGoods.set({
		data: [{value: {lastName: "Obama", firstName: "Barack"}}, {value: {lastName: "Biden", firstName: "Joe"}}],
		storageTypes: [indexedDB, webSQL],
		options: optionsObj
		//...
	});
    
    //With comments
    bakedGoods.set({
	
		//For webSQL, tuples are exclusively supplied with just the "value" property. For indexedDB, this is also true
		//if a keyPath is set. If it isn't, data item objects are supplied the normal (key, value) way
		data: [{value: {lastName: "Obama", firstName: "Barack"}}, {value: {lastName: "Biden", firstName: "Joe"}}],
		
		//Assuming conductDisjointly is false, this will attempt to store  
		//the data in indexedDB, deferring to webSQL if it isn't supported
		storageTypes: [indexedDB, webSQL],
		
		options: optionsObj
		
		//... Any omitted object members previously described
	});



###Filesystem types

HTML5 File system and and IsolatedStorage (via IsolatedStorageFile) based storage operations can 
be conducted through the interface just like non-file system types. Additionally:

- `set()` operations can be supplied byte-level specifications (either for the entire supplied data item set or per data item)
- `get()` and `getAll()` operations can be supplied data format preferences (either for the entire supplied data item set or per data item)
- `removeAll()` operations can be supplied recursive and directory-inclusion specifications

<br/>

    bakedGoods.set({
	
		//File system specific properties are ignored by non file-system types.
		data: [{key: "key1", value: "value1", startPosition: 5, truncateBeforeWrite: true, truncatePosition: 10}],
	
		storageTypes: ["fileSystem", "silverlight", "cookie"]
		
		//... Any omitted object members previously described
	});
	
	
###Conditional operations

Conditional retrieval and removal operations can be performed in storage facilities that 
support structured data by using `getAll()` or `removeAll()` and supplying a filter expression:

    //Without comments
    bakedGoods.getAll({
		filter: "keyObj > 5 && valueObj.someProperty !== 'someValue'",								
		storageTypes: ["indexedDB", "webSQL", "flash", "silverlight"]
		//...
	});
    
    //With comments
    bakedGoods.getAll({
	
		//A String representation of an expression that, when evaluated (read: sanitize if necessary)
		//using an arbitrary data item, must return true for that item to be subject to the operation.
		filter: "keyObj > 5 && valueObj.someProperty !== 'someValue'",	//"keyObj" and "valueObj" are keywords reserved in 
                                                                        //the evaluation environment to refer to the key 
                                                                        //and value of a data item, respectively
												
		//Array specifying the faclities the items of interest are located in (the strings in this 
        //specific array denote all the storage types that conditional operations can be conducted on)
		storageTypes: ["indexedDB", "webSQL", "flash", "silverlight"],
	
		//... Any omitted object members previously described
	});
	
	
###User-defined storage operation functions

A user-defined function can be supplied for any storage type that is a target of a given operation. The supplied 
function will be executed instead of the internally-defined one mapped to that storage facility & operation combo:

    bakedGoods.set({		//or any of the other storage-operation interface members
	
		//... Argument object members previously described
		
		functions: {
			flash: function(){}
			.....
		}
	})
	
	
	//The signature of the function is dependant on the storage operation:
	
	//dataArray:    Contains the data items to be stored
	//optionsObj:   Contains the user-defined and/or default storage-type specific options for this operation
	//complete:     function(processedItemCount, errorObj){} Call when complete.
					    processedItemCount: # of processed items
					    errorObj: (optional) the caught, fatal error (if one was spawned)
	function set_customFunction(dataArray, optionsObj, complete){}
	
	
	//dataArray:    Contains the keys of the data items to be retrieved
	//optionsObj:   Contains the user-defined and/or default storage-type specific options for this operation
	//complete:     function(processedItemCount, keyValuePairsObj, errorObj){} Call when complete.
					    processedItemCount: # of processed items
					    keyValuePairsObj:   object containing pairs each consisting of
                                            a desired key and the value it keys
					    errorObj: (optional) the caught, fatal error (if one was spawned)
	function get_customFunction(keyArray, optionsObj, complete){}
	
	
	//dataArray:    Contains the keys of the data items to be removed
	//optionsObj:   Contains the user-defined and/or default storage-type specific options for this operation
	//complete:     function(processedItemCount, removedKeyArray, errorObj){} Call when complete.
					    processedItemCount: # of processed items
					    removedKeyArray:    Keys of removed items (must omit from argument list 
                                            if removeExpirationData is false)
					    errorObj: (optional) the caught, fatal error (if one was spawned)
	function remove_customFunction(keyArray, optionsObj, complete){}
	
	
	//exprStr:      Expression string to be used to procure criteria-meeting data items (must omit from
    //              argument list if facility can't be target of conditional operation (see relevant section))
	//optionsObj:   Contains the user-defined and/or default storage-type specific options for this operation
	//complete:     function(processedItemCount, keyValuePairsObj, errorObj){} Call when complete.
					    processedItemCount: # of processed items
					    dataItemObjArray: An array of the data items procured (each of the form {key: _, value: _}
					    errorObj: (optional) the caught, fatal error (if one was spawned)
	function getAll_customFunction(exprStr, optionsObj, complete){}
	
	
	//exprStr:      Expression string to be used to procure criteria-meeting data items (must omit from
    //              argument list if facility can't be target of conditional operation (see relevant section))
	//optionsObj:   Contains the user-defined and/or default storage-type specific options for this operation
	//complete:     function(processedItemCount, removedKeyArray, errorObj){} Call when complete.
					    processedItemCount: # of processed items
					    removedKeyArray: Keys of removed items (must omit from argument list
                        if removeExpirationData is false) 
					    errorObj: (optional) the caught, fatal error (if one was spawned)
	function removeAll_customFunction(exprStr, optionsObj, complete){}
	
	
###User defined storage facilities

User-defined storage facilities names can be supplied to the storage operation interface methods. 
A user-defined function for that type can then be supplied to perform an operation on the named type. 

This can be used to perform tricks that result in cleaner code:

    //This "retrieval" is actually a "set" operation in disguise. Assuming "key1" and "key2" don't key
	//anything in indexedDB, bakedGoods will execute the custom server function which can procure any
	//type of value to map to the keys. Because "regenerate" is true, the values will then be stored in indexedDB. 
	//Try manually retrieving data asynchonously and inserting it in to indexedDB: it's a guarenteed mess!
    
    bakedGoods.get({
		data: ["key1", "key2"],
		storageTypes: ["indexedDB", "server"],
		options: {regenerate: true},
		functions:{
			server: function(keyArray, optionsObj, complete){
				var resultKeyValueObj = {};
                
				//Asynchronously communicate with a server, generate some data ...
				
				complete(keyArray.length, resultKeyValueObj);
			}
		}
	});
    
<br />

##Repo contents
- **bakedGoods.js**: Main code file. Include it as a `<script>` reference in target HTML file(s)
- **ext_bin**: Contains binary files necessary to access the storage facilities made available by supported external plugins. To conduct a storage operation on an external storage facility:
    - Place the file in found in **ext** that is associated with the target storage facility on to your server
	- Call the desired storage operation method, supplying a String of the file's path as the value to the appropriate property in the options sub-object corresponding to the desired facility
- **ext_src: Contains the sources of the files in **ext_bin**
- **js_test**: Contains test-related files
- **index.html**: An HTML file referencing the test files in **js_test** (simply uncomment the reference to the desired  test and load the page to run it)

##Licensing and usage information

BakedGoods is licensed under the GNU General Public License (version 3). Licensing for proprietary software is available at a cost, inquire for more details. 

Informally, It'd be great to be notified of any derivatives or forks (or even better, issues or refactoring points that may inspire one)!

More informally, it'd **really** be great to be notified any uses in open-source, educational, or (if granted a license) commercial contexts.
Help me build my portfolio, if you found the library helpful it only takes an e-mail!
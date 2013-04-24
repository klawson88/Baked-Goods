package BakedGoods
{
	import flash.external.ExternalInterface;
	import flash.system.fscommand;
	import flash.system.Security;

	import flash.events.NetStatusEvent;
	import flash.display.Stage; 
	import flash.display.StageScaleMode; 
	import flash.display.Sprite;
	import flash.net.SharedObject;
	import flash.net.SharedObjectFlushStatus;

	
	
	/**
     * A Class capable of performing Locally Shared Object-based storage operations.
     
     * @author Kevin
     */
	public class BakedGoods extends Sprite
	{
		//Integers which contain the minimum width and height (respecively)
		//of a Flash dialog, defined by Flash documentation
		private static const DIALOG_MIN_WIDTH:int = 215;
		private static const DIALOG_MIN_HEIGHT:int = 138;
	
		
		/**
         * Constructs a BakedGoods Object.
         */
		public function BakedGoods()
		{
			var isSuccessful:Boolean = false;
				
			if(ExternalInterface.available)		//Note the absence of an alternative method to communicate to the container in the event ExternalInterface is not supported. 
			{										//Currently, none of the other Flash - to - Javascript communication methods (fscommand, getURL, navigateToURL) work 
													//consistently across the varying browser and flash combinations well enough to justify their use in such an event.
													
				//Explicitly enable this file access to the scripting environment of the container that the application is embedded in
				Security.allowDomain(loaderInfo.parameters.containerDomain);
				
				//Allow exceptions to be passed between the application and the scripting environment of the container it is embedded in
				ExternalInterface.marshallExceptions = true;

				//Set the size of the application to be fixed regardless of any size changes its containing 
				//element undergoes. This allows for the dynamic determination of the application's stage dimensions
				stage.scaleMode = StageScaleMode.NO_SCALE;
				
				//Attempt to register the methods in the interface of this object as
				//callable from the container that its application is embedded in
				try
				{
					ExternalInterface.addCallback("lso_set", lso_set);
					ExternalInterface.addCallback("lso_get", lso_get);
					ExternalInterface.addCallback("lso_remove", lso_remove);
					ExternalInterface.addCallback("lso_getAll", lso_getAll);
					ExternalInterface.addCallback("lso_removeAll", lso_removeAll);
					
					isSuccessful = true;
				}
				catch (error:Error) { }
				/////
				
				//Notify the application container of the successful loading of this file as well as the
				//success status of the establishment of this object's interface as callable from it
				ExternalInterface.call("bakedGoods_changeExternalFileStatus", "flash", isSuccessful);
			}
		}

		
		
		/**
         * Invokes a function in the container housing the application capable of handling 
         * the conclusion of a storage operation and the data resulting from it.
         
         * @param operationID           a String uniquely identifying a storage operation in the
         *                              client-side environment in which it was spawned
         * @param resultDataArray       an Object[] containing Object representations of data resulting from
         *                              the conclusion of the storage operation identified {@code operationID}
         */
		private function complete(operationID:String, operationResultDataArray:Array):void
		{
			ExternalInterface.call("bakedGoods_completeExternalStorageOperation", "flash", operationID, operationResultDataArray);
		}
		
		
		
		/**
		 * Executes a storage operation in a Locally Shared Object.
		 
		 * @param storageOperationFunc				a Function capable of performing a storage operation in a given Locally Shared Object
		 * @param completeStorageOperationFunc		a Function capable of meaningfully utilizing the data resulting 
		 * 											from the conclusion of the to-be-conducted storage operation
		 */
		private function executeStorageOperation(storageOperationFunc:Function, completeStorageOperationFunc:Function):void
		{
			var soError:Error;
			
			try { storageOperationFunc(); }
			catch (e:Error) { soError = e; }
			
			completeStorageOperationFunc(soError);
		}
		
		
		
		/**
		 * Performs a Locally Shared Object-based set operation using the 
		 * data-item describing data contained in elements in a given collection.
		 
		 * @param	dataArray		an Array of Objects each consisting of an object to be persisted in a
         *                          Locally Shared Object-linked file and a key which identifies it in said file
		 * @param	optionsObj		an Object containing auxiliary data pertinent
         *                          to the to-be-conducted storage operation
		 * @param	operationID		a String which uniquely identifies this storage operation in 
         *                          the client-side scripting environment in which it was spawned
		 */
		public function lso_set(dataArray:Array, optionsObj:Object, operationID:String):void
		{
			var processedItemCount:int = 0;
			var isFlushPending:Boolean = false;
			
			/**
             * Concludes the over-arching set operation, passing to a Javascript function
             * capable of handling such an event the number of data items processed, 
			 * as well as the error spawned by the operation, if any.
			 
			 * @param soError		the Error responsible for concluding the over-arching set operation
             */
			function completeSet(soError:Error):void
			{
				if (!isFlushPending) 
				{
					var argArray:Array = [processedItemCount];
					if (soError != null) argArray.push(soError);
					
					complete(operationID, argArray);
				}
			}
			
			/**
			 * Handles an event spawned by meaningful interaction with a dialog prompting
			 * for an increase of a Locally Shared Object's storage space.
			 
			 * @param	event		a NetStatusEvent spawned by user interaction with any of the elements which represent
			 * 					    a consent or denial option in an Locally Shared Object storage space increase prompt
			 */
			function setPendingComplete(event:NetStatusEvent):void
			{
				processedItemCount = (event.info.code == SharedObjectFlushStatus.FLUSHED ? dataArray.length : 0);
				isFlushPending = false;
				completeSet();
			}
			
		   /** 
			* Performs a set operation using the data contained in the member objects of {@code dataArray}
			* in the file linked to the Locally Shared Object specified in {@code optionsObj}.
			*/
			function set():void
			{
				//Obtain the SharedObject specified by data in optionsObj, procuring
				//a reference to the member Object containing its persisted data
				var locusLSO:SharedObject = SharedObject.getLocal(optionsObj.lsoName, optionsObj.lsoPath);
				var lsoData:Object = locusLSO.data;
				/////
			
				//Loop through the data item-representing objects in dataArraySO, establishing 
				//a pairing in locusLSO between the key and value contained in each
				var dataCount:int = dataArray.length;
				for(var i:int = 0; i < dataCount; i++)
				{
					var currentDataObj:Object = dataArray[i];
					lsoData[currentDataObj.key] = currentDataObj.value;
				}
				/////

				//Immediately serialize the data contained in locusLSO to its linked file
				var statusStr:String = locusLSO.flush();
				
				if(statusStr == SharedObjectFlushStatus.PENDING)		//If an increase in storage space is required to flush the data in locusLSO
				{	
					//Determine if a prompt for an increase in storage space is displayed (which will only occur if
					//the dimensions of the stage are greater than or equal to the established minimum dialog dimensions)
					var isPromptDisplayed:Boolean = (stage.stageWidth >= DIALOG_MIN_WIDTH && stage.stageHeight >= DIALOG_MIN_HEIGHT);
					
					if(isPromptDisplayed)
					{
						isFlushPending = true;
						
						//Attach an listener for events spawned from meaningful interaction with the displayed prompt
						locusLSO.addEventListener(NetStatusEvent.NET_STATUS, setPendingComplete);
					}
				}
				else
					processedItemCount = dataArray.length;
			}
			
			executeStorageOperation(set, completeSet);
		}

		
		
		/**
		 * Conducts an Locally Shared Object-based retrieval operation on data items keyed by Strings in a given collection.
		 
		 * @param	keyArray		an Array containing elements each identifying a data item 
         *                          in a given Locally Shared Object-linked file
		 * @param	optionsObj		an Object containing auxiliary data pertinent
         *                          to the to-be-conducted storage operation
		 * @param	operationID		a String which uniquely identifies this storage operation in 
         *                          the client-side scripting environment in which it was spawned
		 */
		public function lso_get(keyArray:Array, optionsObj:Object, operationID:String):void
		{
			//Will contain pairs each consisting of an element in keyArray and the object it keys
            //in the file linked to the Locally Shared Object specified in optionsObj
			var keyValuePairsObj:Object = { };
			
			var processedItemCount:int = 0;
			
			/**
             * Concludes the over-arching get operation, passing to a Javascript function capable of
			 * handling such an event the number of data items processed, data procured as a 
			 * result of the retrieval as well as the error spawned by the operation, if any.
			 
			 * @param soError		the Error responsible for concluding the over-arching get operation
             */
			function completeGet(soError:Error):void 
			{
				var argArray:Array = [processedItemCount, keyValuePairsObj];
				if (soError != null) argArray.push(soError);
				
				complete(operationID, argArray);
			}
			
			/** 
			* Performs a retrieval operation on the data items in the file linked to the Locally Shared Object  
			* specified in {@code optionsObj} that are identified by an element in {@code keyArray}.
			*/
			function get():void 
			{
				//Obtain the SharedObject specified by data in optionsObj, procuring
				//a reference to the member Object containing its persisted data
				var locusLSO:SharedObject = SharedObject.getLocal(optionsObj.lsoName, optionsObj.lsoPath);
				var lsoData:Object = locusLSO.data;
				/////
				
				//Loop through the elements in keyArray, establishing a pairing in
				//keyValuePairsObj between each and the object it keys (if any) in the 
				//file linked to lso, incrementing processedItemCount after each such operation
				var dataCount:int = keyArray.length;
				for(var i:int = 0; i < dataCount; i++, processedItemCount++)
				{
					var currentKey:Object = keyArray[i];
					var currentValue:Object = lsoData[currentKey];
					keyValuePairsObj[currentKey] = (currentValue || null);
				}
				/////
			}
			
			executeStorageOperation(get, completeGet);
		}
		
		
		
		/**
		 * Conducts a Locally Shared Object-based removal operation in a 
         * given store on data items keyed by Strings in a given collection.
		 
		 * @param keyArray        	an Array containing elements each identifying a data item 
         *                          in a given Locally Shard Object-related file
         * @param optionsSO			a Object containing auxiliary data pertinent to the to-be-conducted operation
         * @param operationID		a String identifying this storage operation in the client-side scripting environment in which it was spawned
		 */
		public function lso_remove(keyArray:Array, optionsObj:Object, operationID:String):void
		{
			var processedItemCount:int = 0;
			
			/**
             * Concludes the over-arching remove operation, passing to a Javascript function
             * capable of handling such an event the number of data items processed, 
			 * as well as the error spawned by the operation, if any.
			 
			 * @param soError		the Error responsible for concluding the over-arching remove operation
             */
			function completeRemove(soError:Error):void 
			{
				var argArray:Array = [processedItemCount];
				if (soError != null) argArray.push(soError);
				
				complete(operationID, argArray);
			}
			
			/**
			 * Removes data items identified by the elements in {@code keyArray} from
			 * the file linked to the Locally Shared Object specified in {@code optionsObj}.
			 */
			function remove():void
			{
				//Obtain the SharedObject specified by data in optionsObj, procuring
				//a reference to the member Object containing its persisted data
				var locusLSO:SharedObject = SharedObject.getLocal(optionsObj.lsoName, optionsObj.lsoPath);
				var lsoData:Object = locusLSO.data;
				/////
				
				//Loop through the key-value pairs in the file linked to locusLSO, appending 
				//Dictionaries for, and containing the constituents of, each to dataItemList
				var dataCount:int = keyArray.length;
				for(var i:int = 0; i < dataCount; i++) delete lsoData[keyArray[i]];
					
				//Immediately serialize the data contained in locusLSO to its linked file
				locusLSO.flush();
				
				//Set the number of items processed to the number of elements in keyArray (if execution has reached 
				//here, each item keyed by an element in keyArray has been successfully removed from the store)
				processedItemCount = dataCount;
			}

			executeStorageOperation(remove, completeRemove);
		}
		
		
		
		/**
		 * Performs a retrieval operation on all the data items present in a
		 * Locally Shared Object-linked file. The set of retrieved items will
		 * be filtered for particular items by the client-side, which, depending
		 * on the type storage operation responsible for invoking this function 
		 * may send back the filtered items for further processing.
		
		 * @param optionsObj        an Object containing auxilary data
         *                          pertinent to the to-be-conducted operation
         * @param operationID       a String identifying this storage operation in the 
         *                          client-side scripting environment in which it was created
		 */
		public function lso_getAll(optionsObj:Object, operationID:String):void
		{
			var dataItemObjArray:Array = [];
			var processedItemCount:int = 0;
			
			/**
             * Concludes the over-arching getAll operation, passing to a Javascript function capable of
			 * handling such an event the number of data items processed, data procured as a 
			 * result of the retrieval as well as the error spawned by the operation, if any.
			 
			 * @param soError		the Error responsible for concluding the over-arching get operation
             */
			function completeGetAll(soError:Error):void 
			{
				var argArray:Array = [processedItemCount, dataItemObjArray];
				if (soError != null) argArray.push(soError);
				
				complete(operationID, argArray);
			}
			
			/**
			 * Retrieves all the data from the file linked to the Locally Shared Object specified in {@code optionsObj}.
			 */
			function getAll():void
			{
				//Obtain the SharedObject specified by data in optionsObj, procuring
				//a reference to the member Object containing its persisted data
				var locusLSO:SharedObject = SharedObject.getLocal(optionsObj.lsoName, optionsObj.lsoPath);
				var lsoData:Object = locusLSO.data;
				/////
		
				//Loop through the key-value pairs in the file linked to locusLSO, appending 
				//Objects for, and containing the constituents of, each to dataItemList
				for (var key:Object in lsoData) dataItemObjArray.push( {key: key, value: lsoData[key]} );
			}
			
			executeStorageOperation(getAll, completeGetAll);
		}
		
		
		
		/**
         * Conducts removal or removal-precursory retrieval on all the data items
		 * present in the Locally Shared Object-linked file, dependant on the value
		 * of a boolean expression specifying the items to be processed.
         
         * @param exprStr           a String representation of a boolean expression
         * @param optionsSO         an Object containing auxilary data
         *                          pertinent to the to-be-conducted operation
         * @param operationID       a String identifying this storage operation in the 
         *                          client-side scripting environment in which it was created
         */
		public function lso_removeAll(exprStr:String, optionsObj:Object, operationID:String):void
		{
			/**
             * Concludes the over-arching remove operation, passing to a Javascript function
             * capable of handling such an event the number of data items processed, 
			 * as well as the error spawned by the operation, if any.
			 
			 * @param soError		the Error responsible for concluding the over-arching remove operation
             */
			function completeRemoveAll(soError:Error):void 
			{
				var argArray:Array = [0];
				if (soError != null) argArray.push(soError);
				
				complete(operationID, argArray);
			}
			
			/**
			 * Removes all the data from the file linked to the Locally Shared Object specified in {@code optionsObj}.
			 */
			function removeAll():void
			{
				//Obtain the SharedObject specified by data in optionsObj
				var locusLSO:SharedObject = SharedObject.getLocal(optionsObj.lsoName, optionsObj.lsoPath);
				
				//Clear and immediately serialize the (now absent) data in locusLSO to the 
				//file it is linked to. These actions clear the data in the linked file
				locusLSO.clear();
				locusLSO.flush();
				/////

				complete(operationID, [0]);
			}
			
			if (exprStr == "true")
				executeStorageOperation(removeAll, completeRemoveAll);
			else					
				lso_getAll(optionsObj, operationID);	
		}
	}
}



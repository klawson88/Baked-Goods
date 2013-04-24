using System;

using System.Collections.Generic;

using System.IO;
using System.IO.IsolatedStorage;

using System.Net;

using System.Windows;
using System.Windows.Browser;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;

using System.Text;
using System.Text.RegularExpressions;




namespace BakedGoods
{
    /**
     * A Class capable of performing storage operations inside a Isolated Storage facility.
     
     * @author Kevin
     */
    [ScriptableType]
    public class BakedGoods
    {
        //HtmlWindow which represents the browser window that the application containing this object is embedded in
        private HtmlWindow Window;



        /**
         * Constructs a BakedGoods Object.
         
         * @param paramWindow       the HtmlWindow which represents the browser window that the 
         *                          application containing the to-be-constructed object is embedded in
         */
        public BakedGoods(HtmlWindow paramWindow) { Window = paramWindow; }


        /**
         * Invokes a function in the container housing the application capable of handling 
         * the conclusion of a storage operation and the data resulting from it.
         
         * @param operationID           a String uniquely identifying a storage operation in the
         *                              client-side environment in which it was spawned
         * @param resultDataArray       an Object[] containing Object representations of data resulting from
         *                               the conclusion of the storage operation identified {@code operationID}
         */
        private void complete(String operationID, Object[] resultDataArray)
        {
            Window.Invoke("bakedGoods_completeExternalStorageOperation", "silverlight", operationID, resultDataArray);
        }

        /**
		 * Executes a storage operation in an Isolated Storage Facility.
		 
		 * @param storageOperationFunc				a Action capable of performing a storage operation in a given Isolated Storage Facility
		 * @param completeStorageOperationFunc		a Action<Exception> capable of meaningfully utilizing the data resulting 
		 * 											from the conclusion of the to-be-conducted storage operation
		 */
        private void executeStorageOperation(Action storageOperationAction, Action<Exception> completeStorageOperationAction)
        {
            Exception soException = null;

            try { storageOperationAction(); }
            catch (Exception e) { soException = e; }

            completeStorageOperationAction(soException);
        }



        /**
         * Procures an object capable of performing storage operations with automatic serialization
         * support on a specifc system-designated file in an Isolated Storage facility.
         
         * @param storeScope    a String denoting the scope of the Isolated Storage facility containing   
         *                      the file that the to-be-procured object serves as an abstraction for
         * @return              an IsolatedStorageSettings object capable of performing storage operations with automatic serialization 
         *                      support on a system-designated file for such operations in the store with the scope denoted by {@code storeScope}
         */
        private IsolatedStorageSettings getIsolatedStorageSettings(String storeScope)
        {
            Boolean isApplicationStoreDesired = storeScope.Equals("application");
            return (isApplicationStoreDesired ? IsolatedStorageSettings.ApplicationSettings : IsolatedStorageSettings.SiteSettings);
        }



        /**
         * Performs an IsolatedStorageSettings-based set operation using the data-item describing data contained in elements in a given collection.
         
         * @param dataArraySO       a ScriptObject containing ScriptObjects each consisting of an object to be persisted 
         *                          in an IsolatedStorageSettings-related file and a String which keys it in said file
         * @param optionsDic        a ScriptObject containing auxiliary data pertinent
         *                          to the to-be-conducted storage operation
         * @param operationID       a String which uniquely identifies this storage operation in 
         *                          the client-side scripting environment in which it was spawned
         */
        public void iss_set(ScriptObject dataArraySO, ScriptObject optionsSO, String operationID)
        {
            int processedItemCount = 0;


            /**
             * Concludes the over-arching set operation, passing to a Javascript function
             * capable of handling such an event the number of data items processed, 
			 * as well as the error spawned by the operation, if any.
			 
			 * @param e		the Exception responsible for concluding the over-arching set operation
             */
            Action<Exception> completeSet = delegate(Exception e)
            {
                var argArray = (e == null ? new Object[] { processedItemCount } : new Object[] { processedItemCount, e });
                complete(operationID, argArray);
            };


            /** 
             * Performs a set operation using the data contained in the member objects of {@code dataArraySO} 
             * in the IsolatedStorageSettings-related file specified in {@code optionsObj}.
             */
            Action set = delegate()
            {
                //Obtain an IsolatedStorageSettings object capable of conducting storage operations
                //in the store with the specified scope (such operations target a specific system-designated file)
                IsolatedStorageSettings iss = getIsolatedStorageSettings((String)optionsSO.GetProperty("storeScope"));

                //Loop through the data item-representing ScriptObjects in dataArraySO, 
                //establishing a pairing in iss  between the key and value contained in each
                int dataItemCount = (int)(double)dataArraySO.GetProperty("length");
                for (int i = 0; i < dataItemCount; i++)
                {
                    ScriptObject currentDataItemSO = (ScriptObject)dataArraySO.GetProperty(i);
                    String key = currentDataItemSO.GetProperty("key").ToString();
                    iss[key] = currentDataItemSO.GetProperty("value");
                }
                /////

                //Immediately serialize the data contained in iss to its linked file
                iss.Save();

                //Set the number of processed items to the number of data items represented in dataArray
                //(if execution reaches here, all of said data items have been successfully persisted)
                processedItemCount = dataItemCount;
            };

            executeStorageOperation(set, completeSet);
        }



        /**
         * Conducts an IsolatedStorageSettings-based retrieval operation in a 
         * given store on data items keyed by Strings in a given collection.
         
         * @param keyArraySO        a ScriptObject containing elements each identifying a data item 
         *                          in the IsolatedStorageSettings-related file located in a given store
         * @param optionsDic        a ScriptObject containin auxiliary data-pertinent to the to-be-conducted operation
         * @param operationID       a String which uniquely identifies this storage operation in
         *                          the client-side scripting environment in which it was spawned
         */
        public void iss_get(ScriptObject keyArraySO, ScriptObject optionsSO, String operationID)
        {
            //Will contain pairs each consisting of a String in keyArray and the object it keys
            //in the IsolatedStorageSettings-related file contained in the target store
            Dictionary<String, Object> keyValuePairsDic = new Dictionary<String, Object>();

            int processedItemCount = 0;


            /**
             * Concludes the over-arching get operation, passing to a Javascript function capable of
			 * handling such an event the number of data items processed, data procured as a 
			 * result of the retrieval as well as the error spawned by the operation, if any.
			 
			 * @param e		the Exception responsible for concluding the over-arching get operation
             */
            Action<Exception> completeGet = delegate(Exception e)
            {
                Object[] argArray = (e == null ? new Object[] { processedItemCount, keyValuePairsDic } 
                                               : new Object[] { processedItemCount, keyValuePairsDic, e });
                complete(operationID, argArray);
            };


            /** 
			* Performs a retrieval operation on the data items in the IsolatedStorageSettings-related  
			* file specified in {@code optionsObj} that are identified by an element in {@code keyArray}.
			*/
            Action get = delegate()
            {
                //Obtain an IsolatedStorageSettings object capable of conducting storage operations
                //in the store with the specified scope (such operations target a specific system-designated file)
                IsolatedStorageSettings iss = getIsolatedStorageSettings((String)optionsSO.GetProperty("storeScope"));

                //Loop through the elements in keyArray, establishing a pairing in
                //keyValuePairsDic between each and the object it keys (if any) in the 
                //file linked to iss, incrementing processedItemCount after each such operation
                int keyCount = (int)(double)keyArraySO.GetProperty("length");
                for (int i = 0; i < keyCount; i++, processedItemCount++)
                {
                    String key = keyArraySO.GetProperty(i).ToString();

                    Object value;
                    iss.TryGetValue(key, out value);
                    keyValuePairsDic[key] = value;
                }
                /////
            };

            executeStorageOperation(get, completeGet);
        }



        /**
         * Conducts an IsolatedStorageSettings-based removal operation in a 
         * given store on data items keyed by Strings in a given collection.
         
         * @param keyArraySO         a ScriptObject containing elements each identifying a data item 
         *                           in the IsolatedStorageSettings-related file located in a given store
         * @param optionsSO          a ScriptObject containing auxiliary data pertinent to the to-be-conducted operation
         * @param operationID        a String identifying this storage operation in the client-side scripting environment in which it was spawned
         */
        public void iss_remove(ScriptObject keyArraySO, ScriptObject optionsSO, String operationID)
        {
            int processedItemCount = 0;


            /**
             * Concludes the over-arching remove operation, passing to a Javascript function
             * capable of handling such an event the number of data items processed, 
			 * as well as the error spawned by the operation, if any.
			 
			 * @param e		the Exception responsible for concluding the over-arching remove operation
             */
            Action<Exception> completeRemove = delegate(Exception e)
            {
                Object[] argArray = (e == null ? new Object[] { processedItemCount } : new Object[] { processedItemCount, e });
                complete(operationID, argArray);
            };


            /**
			 * Removes data items identified by the elements in {@code keyArray} from the 
             * IsolatedStorageSettings-related file  specified in {@code optionsObj}.
			 */
            Action remove = delegate()
            {
                //Obtain an IsolatedStorageSettings object capable of conducting storage operations
                //in the store withthe specified scope (such operations target a specific system-designated file)
                IsolatedStorageSettings iss = getIsolatedStorageSettings((String)optionsSO.GetProperty("storeScope"));

                //Loop through the elements in keyArraySO, removing from iss (which 
                //contains the data of the file it is linked to) the item each keys
                int keyCount = (int)(double)keyArraySO.GetProperty("length");
                for (int i = 0; i < keyCount; i++)
                {
                    String key = keyArraySO.GetProperty(i).ToString();
                    iss.Remove(key);
                }
                /////

                //Immediately serialize the data in iss to its linked file
                iss.Save();

                //Set the number of items processed to the number of elements in keyArraySO (if execution has reached 
                //here, each item keyed by an element in keyArray has been successfully removed from the store)
                processedItemCount = keyCount;
            };

            executeStorageOperation(remove, completeRemove);
        }



        /**
         * Performs an Isolated Storage retrieval operation on all the data items present 
         * in the IsolatedStorageSettings-related file in a given store. The set of retrieved items
         * will be filtered for particular items by the client-side, which, depending on the type storage operation 
         * responsible for invoking this function may send back the filtered items for further processing.
         
         * @param optionsDic        a ScriptObject containing auxilary data
         *                          pertinent to the to-be-conducted operation
         * @param operationID       a String identifying this storage operation in the 
         *                          client-side scripting environment in which it was created
         */
        public void iss_getAll(ScriptObject optionsSO, String operationID)
        {
            //Will contain Dictonaries each consisting of the constituent key and value components 
            //(keyed by "keyObj" and "valueObj" respectively) of a data item in the
            //IsolatedStorageSettings-related file contained in the target store
            List<Dictionary<String, Object>> dataItemList = new List<Dictionary<String, Object>>();

            int processedItemCount = 0;

            /**
             * Concludes the over-arching get operation, passing to a Javascript function capable of
			 * handling such an event the number of data items processed, data procured as a 
			 * result of the retrieval as well as the error spawned by the operation, if any.
			 
			 * @param e		the Exception responsible for concluding the over-arching get operation
             */
            Action<Exception> completeGetAll = delegate(Exception e)
            {
                Object[] argArray = (e == null ? new Object[] {processedItemCount, dataItemList} 
                                               : new Object[] {processedItemCount, dataItemList, e});
                complete(operationID, argArray);
            };


            /**
			 * Retrieves all the data from the IsolatedStorageSettings-related file specified in {@code optionsObj}.
			 */
            Action getAll = delegate()
            {
                //Obtain an IsolatedStorageSettings object capable of conducting storage operations
                //in the store with the specified scope (such operations target a specific system-designated file)
                IsolatedStorageSettings iss = getIsolatedStorageSettings((String)optionsSO.GetProperty("storeScope"));

                //Loop through the key-value pairs in the file linked to iss, appending 
                //Dictionaries for, and containing the constituents of, each to dataItemList
                foreach (KeyValuePair<String, Object> dataItem in iss)
                    dataItemList.Add(new Dictionary<String, Object> { { "key", dataItem.Key }, { "value", dataItem.Value } });

                //Set the number of items processed to the number of items extracted from issStore
                processedItemCount = dataItemList.Count;

            };

            executeStorageOperation(getAll, completeGetAll);
        }



        /**
         * Conducts an Isolated Storage removal or removal-precursory retrieval on all the 
         * data items present in the IsolatedStorageSettings-related file in a given store,
         * dependant on the value of a boolean expression specifying the items to be processed.
         
         * @param exprStr           a String representation of a boolean expression
         * @param optionsSO         a ScriptObject containing auxilary data
         *                          pertinent to the to-be-conducted operation
         * @param operationID       a String identifying this storage operation in the 
         *                          client-side scripting environment in which it was created
         */
        public void iss_removeAll(String exprStr, ScriptObject optionsSO, String operationID)
        {
            int processedItemCount = 0;


            /**
             * Concludes the over-arching remove operation, passing to a Javascript function
             * capable of handling such an event the number of data items processed, 
			 * as well as the error spawned by the operation, if any.
			 
			 * @param e		the Exception responsible for concluding the over-arching remove operation
             */
            Action<Exception> completeRemoveAll = delegate(Exception e) 
            { 
                Object[] argArray = (e == null ? new Object[]{processedItemCount} : new Object[] {processedItemCount, e});
                complete(operationID, argArray);
            };


            /**
             * Removes all the data items from the IsolatedStorageSettings-related
             * file in the store specified in {@code optionsObj}.
             */
            Action removeAll = delegate()
            {
                //Obtain an IsolatedStorageSettings object capable of conducting storage operations
                //in the store with the specified scope (such operations target a specific system-designated file) 
                IsolatedStorageSettings iss = getIsolatedStorageSettings((String)optionsSO.GetProperty("storeScope"));

                //Record the number of data items currently in the file linked to iss
                int dataItemCount = iss.Count;

                //Clear and immediately serialize the (now absent) data in iss to the 
                //file it is linked to. These actions clear the data in the linked file
                iss.Save();
                iss.Clear();
                /////

                //Set the number of items processed to the number of data items present before the file linked to ISS was cleared
                processedItemCount = dataItemCount;        
            };           

            if (exprStr.Equals("true"))
                executeStorageOperation(removeAll, completeRemoveAll);
            else
                iss_getAll(optionsSO, operationID);   
        }



        ///////////////////////////////////////////////////////////////////////////////////////////



        /**
         * Procures a handle to an Isolated Storage facility.
         
         * @param storeScope    a String denoting the scope of Isolated Storage store the 
         *                      to-be-procured object serves as an abstraction for 
         * @return              the IsolatedStorageFile representation of the Isolated Storage facility denoted by {@code storeScope}
         */
        private IsolatedStorageFile getIsolatedStorageStore(String storeScope)
        {
            Boolean isApplicationStoreDesired = storeScope.Equals("application");
            return (isApplicationStoreDesired ? IsolatedStorageFile.GetUserStoreForApplication() : IsolatedStorageFile.GetUserStoreForSite());
        }



        /**
         * Writes data to a file in Isolated Storage.
         
         * @param store                 the IsolatedStorageFile manifestation of the Isolated Storage 
         *                              facility containing the file that is the target of the write
         * @param desiredFileMode       the FileMode object defining the procurement operation to be used to obtain the target file 
         * @param filePath              a String of the path to the file that is the target of the write
         * @param valueObject           an Object representation of the data to be written to the file identified by {@code filePath}
         * @param optionsDic            a Dictionary<String, Object> containing auxiliary data that collectively 
         *                              specifies the subtleties of, and dictates the execution of the write
         */
        private void write(IsolatedStorageFile store, FileMode desiredFileMode, String filePath, Object valueObject, Dictionary<String, Object> optionsDic)
        {
            Boolean isDataFormatBinary = optionsDic["dataFormat"].Equals("binary");
            Boolean truncateBeforeWrite = (Boolean)optionsDic["truncateBeforeWrite"];

            double truncatePosition = (double)optionsDic["truncatePosition"];
            double startPosition = (double)optionsDic["startPosition"];


            /**
             * Constructs an array of Doubles with the ordinally-keyed Doubles in a ScriptObject.
             
             * @param doubleDataArraySO     a ScriptObject containing zero-based ordinally keyed Doubles
             */
            Func<ScriptObject, Double[]> constructDoubleArray = delegate(ScriptObject doubleDataArraySO)
            {
                int doubleDataArrayLength = (int)(double)doubleDataArraySO.GetProperty("length");
                Double[] doubleDataArray = new Double[doubleDataArrayLength];

                //Sequentially insert each of the doubles keyed by ordinal properties in doubleDataArraySO in to doubleDataArray
                for (int i = 0; i < doubleDataArrayLength; i++)
                    doubleDataArray[i] = (Double)doubleDataArraySO.GetProperty(i);
                /////

                return doubleDataArray;
            };


            /**
             * Prepares an IsolatedStoageFileStream for a write operation as dictated by 
             * {@code truncateBeforeWrite}, {@code truncatePosition}, and {@code startPosition}.
             
             * @param fileStream        an IsolatedStorageFileStream opened on the file identified by {@code filePath}
             */
            Action<IsolatedStorageFileStream> prepareFileStream = delegate(IsolatedStorageFileStream fStream)
            {
                //Truncate the file past truncatePosition if such an operation is specified
                if (truncateBeforeWrite) fStream.SetLength((long)truncatePosition);

                //Advance the locus position of the stream to startPosition
                fStream.Seek((long)startPosition, System.IO.SeekOrigin.Begin);
            };


            //Open a stream with exclusive write access on the target file , create an object suitable for writing  
            //data to it in the desired format, and write valueObject to it at the specified position
            //(performing a precursory truncate past a specified position if such was specified)
            using (IsolatedStorageFileStream fStream = new IsolatedStorageFileStream(filePath, desiredFileMode, FileAccess.Write, store))
            {
                //Double.MaxValue is the value chosen to represent "one past the last" byte written
                //to the file. Redefine the operation position variables to be this value if necessary
                if (truncatePosition == Double.MaxValue)    truncatePosition = fStream.Length;
                if (startPosition == Double.MaxValue)       startPosition = fStream.Length;
                /////

                if (isDataFormatBinary)
                {
                    prepareFileStream(fStream);

                    //Create a BinaryWriter primed to write to fStream, and carry 
                    //out a write using a Double[] constructed from valueObject
                    using (BinaryWriter bWriter = new BinaryWriter(fStream))
                    {
                        Double[] valueDoubleArray = constructDoubleArray((ScriptObject)valueObject);
                        foreach (Double valueDouble in valueDoubleArray) bWriter.Write(valueDouble);
                    }
                    /////
                }
                else
                {
                    //Procure an Encoding object representation of the encoding specified in,
                    //optionsDic and determine the size of the Byte Order Mark in said encoding
                    String dataEncodingStr = (String)optionsDic["dataEncoding"];
                    if (dataEncodingStr == null) dataEncodingStr = "UTF-8";

                    Encoding dataEncoding = Encoding.GetEncoding(dataEncodingStr);
                    int byteOrderMarkSize = dataEncoding.GetByteCount('\uFEFF' + "");
                    /////

                    //Redefine the operation position variables to take in to consideration 
                    //the BOM assumed to be present the beginning of the file
                    truncatePosition = Math.Min(truncatePosition + byteOrderMarkSize, fStream.Length);
                    startPosition = Math.Min(startPosition + byteOrderMarkSize, fStream.Length);
                    /////

                    prepareFileStream(fStream);

                    //Create a StreamWriter primed to write to fStream, and carry 
                    //out a write using the String representation of valueObject
                    using (StreamWriter sWriter = new StreamWriter(fStream, dataEncoding))
                        sWriter.Write(valueObject);
                }
            }
            /////
        }



        /**
         * Conducts an Isolated Storage set operation using the data
         * contained in each element in a collection of ScriptObjects.
         
         * @code dataArray          a ScriptObject containing a collection of ScriptObjects each consisting of an object
         *                          to be persisted in Isolated Storage, a String which will name it in the store,
         *                          and (optionally) data to be used to dictate the write operation for that data item
         * @param optionsDic        a ScriptObject containing auxilary data pertinent to the to-be-conducted operation
         * @param operationID       a String identifying this storage operation in the 
         *                          client-side scripting environment in which it was created
         */
        public void isf_set(ScriptObject dataArraySO, ScriptObject optionsSO, String operationID)
        {
            int processedItemCount = 0;


            /**
             * Concludes the over-arching set operation, passing to a Javascript function
             * capable of handling such an event the number of data items processed, 
			 * as well as the error spawned by the operation, if any.
			 
			 * @param e		the Exception responsible for concluding the over-arching set operation
             */
            Action<Exception> completeSet = delegate(Exception e)
            {
                var argArray = (e == null ? new Object[] { processedItemCount } : new Object[] { processedItemCount, e });
                complete(operationID, argArray);
            };


            /** 
            * Performs a set operation using the data contained in the member objects of 
            * {@code dataArraySO} in the Isolated Storage facility specified in {@code optionsObj}.
            */
            Action set = delegate()
            {
               /**
                * Retrives the write-operation dictating datum present in either a ScriptObject 
                * representation of a data item or {@code optionsObj} keyed by a given String.
                 
                * @param dataItemSO        a ScriptObject containing identifying, payload, and
                *                          (optionally) operation-dictating data of a data item
                * @param optionKey         a String which keys a value in {@code optionsObj} and possibly
                *                          {@code dataItemSO} that keys data to be used to help dictate
                *                          a write operation on the data item represented by {@code dataItemSO} 
                * @return                  the Object in {@code dataItemSO} (or {@code optionsSO if no such
                *                          Object exists in the former) keyed by {@code optionKey} 
                */
                Func<ScriptObject, String, Object> getWriteOptionValue = delegate(ScriptObject dataItemSO, String optionKey)
                {
                    Object variableValue = dataItemSO.GetProperty(optionKey);
                    return (variableValue != null ? variableValue : optionsSO.GetProperty(optionKey));
                };


               /**
                * Collects the set of data that specifies the subtleties of, and dictates a write operation.
                 
                * @param dataItemSO       a ScriptObject containing identifying, payload, and
                *                         (optionally) operation-dictating data of a data item
                * @return                 a Dictionary<String, Object> containing the data in {@code dataItemSO} and {@code optionsSO}
                *                         (with data in the former superceding data which is identically keyed in the latter) that collectively 
                *                         specify the subtleties of, and dictates the write operation for the data item represented by {@code dataItemSO}
                */
                Func<ScriptObject, Dictionary<String, Object>> getWriteOptions = delegate(ScriptObject dataItemSO)
                {
                    Dictionary<String, Object> writeOptionsDic = new Dictionary<String, Object>(5);
                    writeOptionsDic["writeOnlyIfAbsent"] = getWriteOptionValue(dataItemSO, "writeOnlyIfAbsent");
                    writeOptionsDic["dataFormat"] = getWriteOptionValue(dataItemSO, "dataFormat");
                    writeOptionsDic["dataEncoding"] = getWriteOptionValue(dataItemSO, "dataEncoding");
                    writeOptionsDic["truncateBeforeWrite"] = getWriteOptionValue(dataItemSO, "truncateBeforeWrite");
                    writeOptionsDic["truncatePosition"] = getWriteOptionValue(dataItemSO, "truncatePosition");
                    writeOptionsDic["startPosition"] = getWriteOptionValue(dataItemSO, "startPosition");

                    return writeOptionsDic;
                };


                //Obtain a handle to the Isolated Storage facility with the specified scope, using it as the setting to
                //conduct write operations in the directory specified by optionsSO using the file-identifying,
                //payload, and operation-related data contained in each of the ScriptObjects in dataArraySO
                using (var store = getIsolatedStorageStore((String)optionsSO.GetProperty("storeScope")))
                {
                    String directoryPath = (String)optionsSO.GetProperty("directoryPath");
                    if (!(directoryPath.EndsWith("/") || directoryPath.EndsWith("\\"))) directoryPath += "/";

                    //If there are any missing components in the path to the specified directory, create them
                    if (!store.DirectoryExists(directoryPath)) store.CreateDirectory(directoryPath);

                    //Loop through the ScriptObjects in dataArraySO, using the write-operation related data contained 
                    //in each to conduct such an operation using the contained file-identifying and payload data
                    int dataItemCount = (int)(double)dataArraySO.GetProperty("length");
                    for (int i = 0; i < dataItemCount; i++)
                    {
                        ScriptObject currentDataItemSO = (ScriptObject)dataArraySO.GetProperty(i);

                        //Get the data which specifies the nuances of, and dictates execution of this write 
                        //operation (this data has either been specifically supplied for this data item,  
                        //or was specified for the entire set of data items to be processed
                        Dictionary<String, Object> writeOptionsDic = getWriteOptions(currentDataItemSO);

                        String currentFilePath = directoryPath + currentDataItemSO.GetProperty("key");
                        Object currentValueObject = currentDataItemSO.GetProperty("value");

                        Boolean writeOnlyIfAbsent = (Boolean)writeOptionsDic["writeOnlyIfAbsent"];
                        FileMode desiredFileMode = (writeOnlyIfAbsent ? FileMode.CreateNew : FileMode.OpenOrCreate);

                        write(store, desiredFileMode, currentFilePath, currentValueObject, writeOptionsDic);
                        processedItemCount++;
                    }
                    /////
                }
                /////

            };

            executeStorageOperation(set, completeSet);
        }



        /**
         * Conducts an Isolated Storage retrieval or removal operation on
         * files identifed by or in Objects in a given collection.
         
         * @param dataArraySO                   a ScriptObject consisting of ScriptObjects that each either identify or contain 
         *                                      identifying and operation related data pertaining to a data item to be processed
         * @param optionsSO                     a ScriptObject containing auxiliary data pertinent to the to-be-conducted operation
         * @param storageOperationSubAction     an Action<IsolatedStorageFile, String, Object> capable of 
         *                                      performing a storage operation on a given file in Isolated Storage
         * @param completeAction                an Action<Exception> capable of concluding the to-be-conducted storage operation and passing
         *                                      data resulting from it to the spawning client-side scripting environment
         */
        private void isf_getOrRemove(ScriptObject dataArraySO, ScriptObject optionsSO, 
            Action<IsolatedStorageFile, String, Object> storageOperationSubAction, Action<Exception> completeAction)
        {
            /**
             * Performs the storage operation defined by storageOperationSubAction on the data items identified by the 
             * elements in {@code dataArraySO}, using the operation-related preferences specified in {@code optionsSO}.
             */
            Action getOrRemove = delegate() 
            {
                //Obtain a handle to the Isolated Storage facility with the specified scope, performing the storage operation 
                //defined by storageOperationSubAction on the files identified by directory path in optionsDic 
                //and the identification data represented by or in each of the ScriptObjects in dataArray 
                using (var store = getIsolatedStorageStore((String)optionsSO.GetProperty("storeScope")))
                {
                    String directoryPath = (String)optionsSO.GetProperty("directoryPath");
                    if (!(directoryPath.EndsWith("/") || directoryPath.EndsWith("\\"))) directoryPath += "/";

                    //Loop through the ScriptObjects in dataArraySO, performing the base 
                    //storage operation defined by storageOperationSubAction on each
                    int dataObjectCount = (int)(double)dataArraySO.GetProperty("length");
                    for (int i = 0; i < dataObjectCount; i++)
                        storageOperationSubAction(store, directoryPath, dataArraySO.GetProperty(i));
                }
                /////
            };

            executeStorageOperation(getOrRemove, completeAction);
        }



        /**
         * Reads the contents of a file in Isolated Storage.
         
         * @param store             an IsolatedStorageFile manifestation of the facility that the file to be read is located in
         * @param filePath          a String of the path to the file in {@code store} that is to be read
         * @param dataFormat        a String denoting the format that the data in the file identified by {@code filePath} is to be read in
         * @param dataEncoding      a String denoting the encoding that the read is to be conducted in consideration with
         * @return                  an Object that either represents or consists of the data contained in the file identified by {@code filePath}
         */
        private Object readFile(IsolatedStorageFile store, String filePath, String dataFormat, String dataEncoding)
        {
            Object dataObject;

            //Open a stream with exlusive read access on  the target file, and utilize an object capable
            //of extracting the data from the file in the desired format to carry out the read
            using (IsolatedStorageFileStream fStream = new IsolatedStorageFileStream(filePath, FileMode.Open, FileAccess.Read, store))
            {
                if (dataFormat.Equals("binary"))
                {
                    List<Double> dataList = new List<Double>();

                    //Create a BinaryReader to read the binary data from fStream as a sequence of
                    //Doubles (which is the type used to represent all numbers in Javascript).
                    using (BinaryReader bReader = new BinaryReader(fStream))
                    {
                        while (fStream.Position < fStream.Length)
                            dataList.Add(bReader.ReadDouble());
                    }
                    /////

                    dataObject = dataList;
                }
                else     //dataFormat.equals("text")
                {
                    //Create a StreamReader to read the data from fStream as a sequence of chars
                    if (dataEncoding == null) dataEncoding = "UTF-8";
                    using (StreamReader sReader = new StreamReader(fStream, Encoding.GetEncoding(dataEncoding)))
                        dataObject = sReader.ReadToEnd();
                    /////
                }
            }
            /////

            return dataObject;
        }



        /**
         * Conducts an Isolated Storage data retrieval operation on 
         * files identified by or in Objects in a given collection.
         
         * @param dataArray         a ScriptObject consisting of ScriptObjects that each either identify or contain 
         *                          identifying and operation related data pertaining to a data item to be retrieved
         * @param optionsDic        a ScriptObject containing auxiliary data pertinent to the to-be-conducted operation
         * @param operationID       a String uniquely identifying this storage operation in the 
         *                          client-side scripting environment in which it was created
         */
        public void isf_get(ScriptObject dataArraySO, ScriptObject optionsSO, String operationID)
        {
            //Will contain key-value pairs each consisting of the name of a file in Isolated Storage 
            //denoted or represented by an element in dataArray, and the contents of that file 
            Dictionary<String, Object> keyValuePairsDic = new Dictionary<String, Object>();

            int processedItemCount = 0;

            /**
             * Concludes the over-arching retrieval operation, passing to a Javascript function capable of handling
             * such an event the number of files successfully read along with the data resulting from the operation.
             
             *  @param e        the Exception responsible for concluding the over-arching get operation
             */
            Action<Exception> completeGet = delegate(Exception e)
            {
                Object[] argArray = (e == null ? new Object[] { processedItemCount, keyValuePairsDic }
                                               : new Object[] { processedItemCount, keyValuePairsDic, e });
                complete(operationID, argArray);
            };


            /**
             * Performs a read operation on the file identified by the currently processing ScriptObject
             * in {@code dataArraySO} located in the directory specified by {@code optionsSO}.
             
             * @param store             an IsolatedStorageFile manifestation of the facility containing
             *                          the file identified by {@code directoryPath} and {@code dataObject}
             * @param directoryPath     a String of the path to the Directory containing the file to be read
             * @param dataObject        an Object either identifying, or containing identifying and 
             *                          operation-related data pertaining to a data item to be processed
             */
            Action<IsolatedStorageFile, String, Object> get = delegate(IsolatedStorageFile store, String directoryPath, Object dataObject)
            {
                String fileName;
                String dataFormat;
                String dataEncoding;

                if (dataObject is ScriptObject)     
                {
                    ScriptObject dataSO = (ScriptObject)dataObject;
                    fileName = dataSO.GetProperty("key").ToString();
                    dataFormat = (dataSO.GetProperty("dataFormat") != null ? (String)dataSO.GetProperty("dataFormat") : (String)optionsSO.GetProperty("dataFormat"));
                    dataEncoding = (dataSO.GetProperty("dataEncoding") != null ? (String)dataSO.GetProperty("dataEncoding") : (String)optionsSO.GetProperty("dataEncoding"));
                }
                else
                {
                    fileName = dataObject.ToString();
                    dataFormat = (String)optionsSO.GetProperty("dataFormat");
                    dataEncoding = (String)optionsSO.GetProperty("dataEncoding");
                }

                keyValuePairsDic[fileName] = readFile(store, directoryPath + fileName, dataFormat, dataEncoding);
                processedItemCount++;
            };

            isf_getOrRemove(dataArraySO, optionsSO, get, completeGet);
        }



        /**
         * Conducts an Isolated Storage removal operation on files
         * identified by Strings in a given collection.
         
         * @param keyArray          a ScriptObject containing Strings which each name
         *                          a file to be removed from Isolated Storage
         * @param optionsSO         a ScriptObject containing auxiliary data
         *                          pertinent to the to-be-conducted operation
         * @param operationID       a String uniquely identifying this storage operation in the 
         *                          client-side environment in which it was created
         */
        public void isf_remove(ScriptObject keyArraySO, ScriptObject optionsSO, String operationID)
        {
            int processedItemCount = 0;


            /**
             * Concludes the over-arching removal operation, passing to a Javascript  
             * function capable of handling such an event the number of files deleted.
              
             * @param e		the Exception responsible for concluding the over-arching remove operation
             */
            Action<Exception> completeRemove = delegate(Exception e)
            {
                Object[] argArray = (e == null ? new Object[] { processedItemCount } : new Object[] { processedItemCount, e });
                complete(operationID, argArray);
            };


            /**
             * Performs a removal operation on the file identified by the directory path specified in
             * {@code optionsSO} and the String located at the current processing index in {@code keyArray}.
             
             * @param store             an IsolatedStorageFile manifestation of the facility containing
             *                          the file identified by {@code directoryPath} and {@code fileName}
             * @param directoryPath     a String of the path to the directory containing the file to be removed
             * @param fileName          a String of the name of the file to be removed
             */
            Action<IsolatedStorageFile, String, Object> remove = delegate(IsolatedStorageFile store, String directoryPath, Object fileName)
            {
                store.DeleteFile(directoryPath + fileName.ToString());
                processedItemCount++;
            };

            isf_getOrRemove(keyArraySO, optionsSO, remove, completeRemove);
        }



        /**
         * Performs an Isolated Storage read or removal operation on all child (and if 
         * specified, deeper descendent) files and directories (optionally) in a given directory.
         
         * @param optionsSO                         a ScriptObject containing auxiliary data
         *                                          pertinent to the to-be-conducted operation
         * @param canPerformDirStorageOperation     a Func capable of determining whether the storage operation defined\
         *                                          by {@code storageOperationSubAction}  can be performed on a given directory.
         *                                          A null value indicates the storage operation is not defined for directories
         * @param storageOperationSubAction         an Action capable of carrying out a storage operation on an Isolated Storage entity
         * @param completeAction                    an Action<Exception> capable of concluding the storage operation defined by {@code storageOperationSubAction}
         */
        private void isf_getOrRemoveAll(ScriptObject optionsSO ,Func<String, Boolean> canPerformDirStorageOperation,
                                        Action<IsolatedStorageFile, String, String> storageOperationSubAction, Action<Exception> completeAction)
        {
            /**
             * Performs the storage operation defined by storageOperationSubAction on on the data items identified by the 
             * elements in {@code dataArraySO}, using the operation-related preferences specified in {@code optionsSO}
             */
            Action getOrRemoveAll = delegate()
            {
                //Will contain Strings of the names of file system entites that  
                //will be, and/or will contain entities that will be processed
                Stack<String> storageEntityNameStack = new Stack<String>();

                //Will contain Dictionaries that each possess the path of a Directory and the number of its children represented in storageEntityNameStack
                Stack<Dictionary<String, Object>> directoryDataDicStack = new Stack<Dictionary<String, Object>>();

                Boolean isStorageOperationDefinedForDirs = (canPerformDirStorageOperation != null);

                /**
                 * Collects the names of the storage entities of interest
                 * inside a directory in an Isolated Storage facility.
             
                 * @param store             an IsolatedStorageFile manifestation of the facility containing the entities of interest
                 * @param directoryPath     a String of the path to the directory containing the storage entities of interest
                 * @param isRecursive       a Boolean denoting whether or not the names of the child 
                 *                          directories of {@code directoryPath} are to be collected
                 */
                Action<IsolatedStorageFile, String, Boolean> bufferDirectoryChildStorageEntityNames = delegate(IsolatedStorageFile store, String directoryPath, Boolean isRecursive)
                {
                    //Will contain the names of the desired entities in the directory identified by directoryPath
                    List<String> storageEntityNameList = new List<String>();

                    //Ensure the directory path ends with a separator so the following wildcard-expressions operations work properly
                    if (!(directoryPath.EndsWith("/") || directoryPath.EndsWith("\\"))) directoryPath += "/";

                    //Add the names of the files and directories (if specified) contained in the directory identified by directoryPath
                    storageEntityNameList.AddRange(store.GetFileNames(directoryPath + "*"));
                    if (isRecursive) storageEntityNameList.AddRange(store.GetDirectoryNames(directoryPath + "*"));
                    /////

                    //Push on to directoryDataDicStack a Dictionary containing directoryPath
                    //and the number of child file-system entities it contains
                    directoryDataDicStack.Push(new Dictionary<String, Object> { { "directoryPath", directoryPath }, { "childEntityCount", storageEntityNameList.Count } });

                    //Loop through the Strings in storageEntityNameList, pushing each on to storageEntityNameStack
                    foreach (String storageEntityName in storageEntityNameList) storageEntityNameStack.Push(storageEntityName);
                };

                //Obtain a handle to the Isolated Storage facility with the specified scope, performing the storage operation 
                //defiend by storageOperationSubAction on the entities in the directory specified in optionsSO
                using (var store = getIsolatedStorageStore((String)optionsSO.GetProperty("storeScope")))
                {
                    String originDirectoryPath = (String)optionsSO.GetProperty("directoryPath");
                    Boolean isRecursive = (Boolean)optionsSO.GetProperty("recursive");

                    bufferDirectoryChildStorageEntityNames(store, originDirectoryPath, isRecursive);

                    //Maintaining the following loop invariant: the number keyed by "childEntityCount" in the 
                    //directory-representing Dictionary at the top of directoryDataDicStack is equal to the number of
                    //elements (counting from the top) in storageEntityNameStack which name child entities of the directory. 
                    //Maintainance will be carried out by performing the desired storage operation on the applicable represented entities.
                    while (directoryDataDicStack.Count > 0)
                    {
                        //Extract from the top of directoryDataDicStack the path of the represented directory and number
                        //of child storage entities it has that are named (at the top) of storageEntityNameStack
                        Dictionary<String, Object> currentDirectoryDic = directoryDataDicStack.Peek();
                        String currentDirectoryNamePath = (String)currentDirectoryDic["directoryPath"];
                        int currentDirUnprocessedChildEntityCount = ((int)currentDirectoryDic["childEntityCount"]);
                        /////

                        if (currentDirUnprocessedChildEntityCount > 0)  //if the storage entity at the top of storageEntityNameStack is a child of currentDirectoryNamePath
                        {
                            String currentEntityName = storageEntityNameStack.Pop();
                            String currentEntityPathName = currentDirectoryNamePath + currentEntityName;

                            if (isRecursive && store.DirectoryExists(currentEntityPathName))
                                bufferDirectoryChildStorageEntityNames(store, currentEntityPathName, isRecursive);
                            else if (store.FileExists(currentEntityPathName))
                                storageOperationSubAction(store, currentDirectoryNamePath, currentEntityName);

                            //Maintain (or if currentDirectoryDic is no longer at the top of the stack, pre-emptively maintain) the loop invariant
                            currentDirectoryDic["childEntityCount"] = currentDirUnprocessedChildEntityCount - 1;
                        }
                        else
                        {
                            if (isStorageOperationDefinedForDirs && canPerformDirStorageOperation(currentDirectoryNamePath))
                                storageOperationSubAction(store, currentDirectoryNamePath, "");

                            directoryDataDicStack.Pop();
                        }
                        /////
                    }
                    /////
                }
                /////
            
            };

            executeStorageOperation(getOrRemoveAll, completeAction);
        }



        /**
         * Conducts an Isolated Storage retrieval operation on the child (and if
         * specified deeper descendent) files contained in a given directory. 
         
         * @param optionsSO         a ScriptObject containing auxiliary data pertinent to the to-be-conducted operation
         * @param operationID       a String uniquely identifying this storage operation in the 
         *                          client-side environment in which it was created
         */
        public void isf_getAll(ScriptObject optionsSO, String operationID)
        {
            //Will contain Dictionaries each consisting of a String of the 
            //path to a file and an Object representing or containing its data.
            List<Dictionary<String, Object>> dataDicList = new List<Dictionary<String, Object>>();

            int processedItemCount = 0;

            String dataFormat = (String)optionsSO.GetProperty("dataFormat");
            String dataEncoding = (String)optionsSO.GetProperty("dataEncoding");


            /**
             * Concludes the over-arching getAll operation, passing to a Javascript function capable of handling 
             * such an event the number of files read as well as the data resulting from the operation.
             
             *  @param e        the Exception responsible for concluding the over-arching getAll operation
             */
            Action<Exception> completeGetAll = delegate(Exception e)
            {
                Object[] argArray = (e == null ? new Object[] { processedItemCount, dataDicList }
                                               : new Object[] { processedItemCount, dataDicList, e });
                complete(operationID, argArray);
            };


            /**
             * Reads the contents of a file in Isolated Storage and creates
             * an element in dataDicList consisting of the file's name and data.
             
             * @param store             an IsolatedStorageFile manifestation of the facility which contains the file to be read
             * @param directoryPath     a String of the path to the directory containing the file identified to be read
             * @param fileName          a String of the name of the file to be read
             */
            Action<IsolatedStorageFile, String, String> get = delegate(IsolatedStorageFile store, String directoryPath, String fileName)
            {
                String filePath = directoryPath + fileName;

                Object fileDataObject = readFile(store, filePath, dataFormat, dataEncoding);
                dataDicList.Add(new Dictionary<String, Object> { { "key", filePath }, { "value", fileDataObject } });
                processedItemCount++;
            };

            isf_getOrRemoveAll(optionsSO, null, get, completeGetAll);
        }



        /**
         * Conducts an Isolated Storage removal operation on the child (and if
         * specified deeper descendent) files contained in a given directory.
         
         * @param optionsDic        a ScriptObject containing auxiliary data pertinent to the to-be-conducted operation
         * @param operationID       a String uniquely identifying this storage operation in the 
         *                          client-side environment in which it was created
         */
        public void isf_removeAll(ScriptObject optionsSO, String operationID)
        {
            int processedItemCount = 0;

            //Extract data from optionsSO that specify both the nature of the removal operations as well as its target entities
            Boolean isRecursive = (Boolean)optionsSO.GetProperty("recursive");
            Boolean removeDirectories = isRecursive && (Boolean)optionsSO.GetProperty("removeDirectories");
            Boolean removeTargetDirectory = isRecursive && (Boolean)optionsSO.GetProperty("removeTargetDirectory");
            /////

            //Ensure that the directory path specified for this operation has no duplicate seperators and trailing whitespace. This
            //modified path String will be used to test whether each to-be-processed directory is the directory specified in optionsDic
            String standardizedOriginDirectoryPath = Regex.Replace((String)optionsSO.GetProperty("directoryPath"), "(?:/|\\\\)+", "/").Trim();

            //Replace the parameter directoryPath with the standardized one (it will be extracted from optionsDic in functions it is passed to)
            optionsSO.SetProperty("directoryPath", standardizedOriginDirectoryPath);


            /**
             * Concludes the over-arching removeAll operation, passing to a Javascript function capable 
             * of handling such an event the number of file system entities deleted.
             
             * @param e		the Exception responsible for concluding the over-arching removeAll operation
             */
            Action<Exception> completeRemoveAll = delegate(Exception e)
            {
                Object[] argArray = (e == null ? new Object[] { processedItemCount } : new Object[] { processedItemCount, e });
                complete(operationID, argArray);
            };


            /**
             * Determines (based on data in {@code optionsSO}) whether a given directory can be deleted.
             
             * @param directoryPath     a String of the path to a directory
             */
            Func<String, Boolean> canRemoveDirectory = delegate(String directoryPath){
                Boolean isTargetDirectory = directoryPath.Equals(standardizedOriginDirectoryPath);
                return (isTargetDirectory && removeTargetDirectory || !isTargetDirectory && removeDirectories);
            };


            /**
             * Deletes a file system entity from Isolated Storage.
             
             * @param store             an IsolatedStorageFile manifestation of the facility which contains the entity to be deleted
             * @param directoryPath     a String of the path to the directory containing the entity to be deleted
             * @param entityName        a String of the name of the file system entity to be deleted
             */
            Action<IsolatedStorageFile, String, String> remove = delegate(IsolatedStorageFile store, String directoryPath, String entityName)
            {
                String storeEntityPathName = directoryPath + entityName;

                if (store.DirectoryExists(storeEntityPathName))
                    store.DeleteDirectory(storeEntityPathName);
                else
                    store.DeleteFile(storeEntityPathName);

                processedItemCount++;
            };


            /**
             * Deletes an Isolated Storage facility.
             */
            Action clearStore = delegate()
            {
                //Obtain a handle to the Isolated Storage facility with the specified scope and remove it
                using (var store = getIsolatedStorageStore((String)optionsSO.GetProperty("storeScope")))
                    store.Remove();
                /////

                completeRemoveAll(null);
            };

            Boolean isClearStoreRequest = (removeDirectories && standardizedOriginDirectoryPath.Equals("/"));

            if (isClearStoreRequest)
               clearStore();
            else
                isf_getOrRemoveAll(optionsSO, canRemoveDirectory, remove, completeRemoveAll);
        }
    }
}

/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.CollaborationHelper");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper");

i2d.pp.mrpcockpit.reuse.util.CollaborationHelper = {

	/**
	 * Set the OData Model that shall be used for the calls to the backend.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	setODataModel : function(oModel, backendVersion) {
		this.oModelGlobal = oModel;
		this.backendVersion = backendVersion;
	},

	/**
	 * This method reads a 'Change Request' from the backend.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	readRequest : function(oModel) {
		var oDataModel = this.oModelGlobal;
		//var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_CHANGEREQUEST;
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_CHANGEREQUESTVENDOR;
		var changeRequest = null; 

		// Build the URL and the filter condition
		var filter = "MRPElement eq '";
		filter += oModel.PurchaseOrderID;
		filter += "' and MRPElementItem eq '";
		filter += oModel.ItemID;
		filter += "' and MRPElementScheduleLine eq '";
		filter += oModel.ScheduleLineID;
		filter += "' and Type eq '";
		filter += oModel.Type;
		filter += "'";
		// Build the parameters for the URL
		var oUrlParams = new Array();
		var tmp = "$filter=" + filter;
		oUrlParams.push(tmp);
		// Read Purchase Order in a synchronous call
		oDataModel.read(url, null, oUrlParams, false, function(oData, oResponse) {
			changeRequest = oResponse.data.results[0];
		}, function(oError) {
			changeRequest = null;
		});
		return changeRequest;
	},

	/**
	 * This method updates a 'Change Request' to the backend within a batch request. Info: SAP type DATS has to be
	 * provided as "yyyy-MM-ddT00:00:00" *
	 * 
	 * @param sClientApp
	 *          string indicating the calling client application. It is required to distinguish between x30 apps and 540
	 *          because the values for the PO/TO are calculated differently
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	updateRequestBatch : function(oDataDialog, oHandler, sClientApp) {

		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		var aChangeOperations = new Array();
		var oDataModel = this.oModelGlobal;
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_UPDATE;

		oDataModel.setUseBatch(true);
		oDataModel.clearBatch();

		// ---------------------------------------------------------------------
		// Check mandatory data in the model
		// ---------------------------------------------------------------------
		// return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";

		// ---------------------------------------------------------------------
		// OData: Change Request - Update just a small subset of data
		// ---------------------------------------------------------------------
		var oData = {};
		oData.SolutionRequestStatus = oDataDialog.SolutionRequestStatus;
		oData.SolutionRequestNote = oDataDialog.SolutionRequestNote;
		oData.VendorResponse = oDataDialog.VendorResponse;

		if (sClientApp === "x30") {
			// if called from the x30 where fields are provided by dialog and fields are named differently
			// oData.MRPElementChangeOpenQuantity = (oDataDialog.MRPElementChangeOpenQuantity).toString();
			// oData.MRPElementOpenQuantity = (oDataDialog.MRPElementOpenQuantity).toString();

			// Write Changed Availability Date in 'DATS'
			oData.MRPElementChgAvailyOrRqmtDate = oDateFormat.format(oDataDialog.MRPElementChgAvailyOrRqmtDate) + "T00:00:00";

			// oData.MRPElementAvailyOrRqmtDate = oDateFormat.format(oDataDialog.MRPElementAvailyOrRqmtDate) + "T00:00:00";

			// ---------the new Total Quantity fields--------------
			// Write the quantities
			oData.MRPElementChangedTotalQuantity = (oDataDialog.MRPElementChangedTotalQuantity).toString();
			oData.MRPElementChgAvailyOrRqmtDate = oDateFormat.format(oDataDialog.MRPElementChgAvailyOrRqmtDate) + "T00:00:00";
		} else {
			// if called from the Change Request app - all fields are read by ODATA
			// oData.MRPElementChangeOpenQuantity = oDataDialog.MRPElementChangeOpenQuantity;
			// oData.MRPElementOpenQuantity = oDataDialog.MRPElementOpenQuantity;
			// oData.MRPElementChgAvailyOrRqmtDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
			// oData.MRPElementAvailyOrRqmtDate = oDataDialog.MRPElementAvailyOrRqmtDate;
			// Fill changed data (CR edit)
			if(oDataDialog.MRPElementChangedTotalQuantity){
				oData.MRPElementChangedTotalQuantity = (oDataDialog.MRPElementChangedTotalQuantity).toString();
			}
			if(oDataDialog.MRPElementChgAvailyOrRqmtDate){
				oData.MRPElementChgAvailyOrRqmtDate = oDateFormat.format(oDataDialog.MRPElementChgAvailyOrRqmtDate) + "T00:00:00";
			}
			if(oDataDialog.VendorResponse === i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_PROPOSED &&
				 oDataDialog.MaterialShortageSolnRequestLine === null ){ 
				var oDataProposal = {};
				oDataProposal.MRPElementProposedTotalQty = (oDataDialog.MRPElementProposedQuantity).toString();
				if (oDataDialog.MRPElementProposedDate) {
					var oDate = oDataDialog.MRPElementProposedDate;
					oDataProposal.MRPElementProposedDate = oDateFormat.format(oDate) + "T00:00:00";
					oDataProposal.MRPElementScheduleLine = oDataDialog.MRPElementScheduleLine;
					oDataProposal.MaterialShortageSolnRequest = oDataDialog.MaterialShortageSolnRequest;
					var sODataRequestTypeProposal = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_CREATE;
					var urlProposal = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_CHANGEREQUESTPROPOSAL;
				}
			}else if(oDataDialog.VendorResponse !== i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_PROPOSED && 
							 oDataDialog.MaterialShortageSolnRequestLine !== null ){
				  var oDataProposal = {};
					var urlProposal = "/"+ oDataDialog.ChRequest_To_ChRequestProposal.__list[0];
					var sODataRequestTypeProposal = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_DELETE;
			}
		}

		// Create the batch for CR and add batch to the array of operations
		aChangeOperations.push(oDataModel.createBatchOperation(this._buildUrlForChangeRequestUpdate(oDataDialog),
													 sODataRequestType, oData, null));
		// create New Proposal
		if(sODataRequestTypeProposal){ 
			// Add the batch to the array of operations
			aChangeOperations.push(oDataModel.createBatchOperation(urlProposal,
														 sODataRequestTypeProposal, oDataProposal, null));
		}
		
		// Collect the batch operation
		oDataModel.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - synchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
		// Return 'success'
		return "";
	},

	/**
	 * This method creates a new 'Change Request' to the backend within a batch request. Info: SAP type DATS has to be
	 * provided as "yyyy-MM-ddT00:00:00"
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	createRequestBatch : function(oDataDialog, oHandler) {

		var aChangeOperations = new Array();
		var oDataModel = this.oModelGlobal;
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_CHANGEREQUEST;
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_CREATE;
		oDataModel.setUseBatch(true);
		oDataModel.clearBatch();

		// ---------------------------------------------------------------------
		// Check mandatory data in the model
		// ---------------------------------------------------------------------
		// return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";

		// ---------------------------------------------------------------------
		// OData: Change Request - Create
		// ---------------------------------------------------------------------
		// Create the data for the operation
		var oData = this._buildODataForChangeRequestCreation(oDataDialog);
		// Create the batch
		var oChangeOperationCR = oDataModel.createBatchOperation(url, sODataRequestType, oData, null);
		// Add the batch to the array of operations
		aChangeOperations.push(oChangeOperationCR);
		// Collect the batch operation
		oDataModel.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - synchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
		// Return 'success'
		return "";
	},

	/**
	 * This method deletes a 'Accepted shortage' to the backend. Info: SAP type DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00"
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	deleteShortageAcceptBatch : function(oModel, oHandler) {

		if (this.backendVersion === 1) {
			// call Wave 3 Interface
			return i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper.deleteShortageAcceptBatch(oModel, oHandler);
		}

		// Date format object for conversion purposes
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		var aChangeOperations = [];
		var oData = {};
		// The time interval is part of the key and has to be converted
		var materialshortagestartdate = oDateFormat.format(oModel.MaterialShortageStartDate) + "T00:00:00";
		var materialshortageenddate = oDateFormat.format(oModel.MaterialShortageEndDate) + "T00:00:00";

		// ---------------------------------------------------------------------
		// OData: Delete 'Accepted shortage'
		// ---------------------------------------------------------------------
		var oDataModel = this.oModelGlobal;

		// Build the URL to define the OData service and the keys for the shortage to delete
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_ACCEPTSHORTAGE
				+ "(MaterialShortageProfile='" + oModel.MaterialShortageProfile + "',MaterialShortageProfileCount='"
				+ oModel.MaterialShortageProfileCount + "',MaterialID='" + oModel.MaterialID + "',MRPPlant='" + oModel.MRPPlant
				+ "',MRPArea='" + encodeURIComponent(oModel.MRPArea) + "',MRPPlanningSegmentType='" + oModel.MRPPlanningSegmentType
				+ "',MRPPlanningSegmentNumber='" + oModel.MRPPlanningSegmentNumber + "',MaterialShortageStartDate=datetime'"
				+ encodeURIComponent(materialshortagestartdate) + "',MaterialShortageEndDate=datetime'" + encodeURIComponent(materialshortageenddate)
				+ "')"; 

		// Define the OData Delete operation
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_DELETE;
		// Create the batch
		var oChangeOperation = oDataModel.createBatchOperation(url, sODataRequestType, oData, null);
		// Add the batch to the array of operations
		aChangeOperations.push(oChangeOperation);
		// Collect the batch operation
		oDataModel.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - Asynchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, true);
		// Return 'success'
		return "";
	},

	/**
	 * This method creates a 'Accept shortage' to the backend in batch mode. Info: SAP type DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00"
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	createShortageAcceptBatch : function(oDataDialog, oHandler) {

		if (this.backendVersion === 1) {
			// call Wave 3 Interface
			return i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper.createShortageAcceptBatch(oDataDialog, oHandler);
		}

		var aChangeOperations = new Array();
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_ACCEPTSHORTAGE;
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_CREATE;
		var oDataModel = this.oModelGlobal;
		oDataModel.setUseBatch(true);
		oDataModel.clearBatch();

		// ---------------------------------------------------------------------
		// Check mandatory data in the model
		// Note: MRPPlanningSegmentNumber is allowed to be ""
		// ---------------------------------------------------------------------
		if (!oDataDialog.MaterialShortageProfile || !oDataDialog.MaterialShortageProfileCount || !oDataDialog.MaterialID
				|| !oDataDialog.MRPPlant || !oDataDialog.MRPArea || !oDataDialog.MRPPlanningSegmentType
				|| !oDataDialog.MaterialShortageStartDate || !oDataDialog.MaterialShortageEndDate) {
			// A mandatory field is missing
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}

		// ---------------------------------------------------------------------
		// OData: Accept Shortage - Create
		// ---------------------------------------------------------------------
		// Accept Shortage
		var oData = {};
		// Keys
		oData.MaterialShortageProfile = oDataDialog.MaterialShortageProfile;
		oData.MaterialShortageProfileCount = oDataDialog.MaterialShortageProfileCount;
		oData.MaterialID = oDataDialog.MaterialID;
		oData.MRPPlant = oDataDialog.MRPPlant;
		oData.MRPArea = oDataDialog.MRPArea;
		oData.MRPPlanningSegmentType = oDataDialog.MRPPlanningSegmentType;
		oData.MRPPlanningSegmentNumber = oDataDialog.MRPPlanningSegmentNumber;
		oData.MaterialShortageStartDate = oDateFormat.format(oDataDialog.MaterialShortageStartDate) + "T00:00:00";
		oData.MaterialShortageEndDate = oDateFormat.format(oDataDialog.MaterialShortageEndDate) + "T00:00:00";

		// Additional Info
		oData.MaterialShortageQuantity = (oDataDialog.MaterialShortageQuantity).toString();
		oData.AcceptShortageNote = oDataDialog.SolutionRequestNote;

		// Create the batch
		var oChangeOperation = oDataModel.createBatchOperation(url, sODataRequestType, oData, null);
		// Add the batch to the array of operations
		aChangeOperations.push(oChangeOperation);
		// Collect the batch operation
		oDataModel.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - Asynchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, true);
		// Return 'success'
		return "";
	},

	/**
	 * This method updates a 'Purchase Order' and (optional) a 'Change Request'. DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00" Example Result:
	 * "ScheduleLines(PurchaseOrderID='4500003069',ItemID='00010',ScheduleLineID='0001'"
	 * 
	 * @param oDataDialog
	 *          object containing the required data to identify and update a purchase/transfer order <BR>
	 *          general required fields in the object: <BR>
	 *          {MRPElement, MRPElementItem, MRPElementScheduleLine, MaterialID} <BR>
	 *          x30 apps require additional fields in this object: <BR>
	 *          {MRPElementChangeOpenQuantity, MaterialShortageSolutionType, MRPElementChgAvailyOrRqmtDate,
	 *          MRPElementAvailyOrRqmtDate, MRPElementOpenQuantity, MRPElementChangeOpenQuantity} <BR>
	 *          If a required field is missing the client gets a direct error message
	 *          !!! OrderedQuantity & OrderedChangedQuantity are now used for PurchaseOrder  instead of TotalQuantity!!!
	 * @param oHandler
	 *          object containing a success- and error handler function for OData call backs
	 * @param bChangeRequestExists
	 *          boolean indicating whether the client wants to also update the related change request for the given PO/TO.
	 *          Attention: The client has to guarantee that the CR really exists - it is not checked and more and might
	 *          result in errors.
	 * @param sClientApp
	 *          string indicating the calling client application. It is required to distinguish between x30 apps and 540
	 *          because the values for the PO/TO are calculated differently
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	updatePurchaseOrderBatch : function(oDataDialog, oHandler, bChangeRequestExists, sClientApp) {
		if (this.backendVersion === 1) {
			// call Wave 3 Interface
			return i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper.writePurchaseOrderBatch(oDataDialog, null, oHandler);
		}

		var aChangeOperations = new Array();
		// Define the OdataRequestType for an update call
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_UPDATE;
		var oDataModel = this.oModelGlobal;
		oDataModel.setUseBatch(true);
		oDataModel.clearBatch();

		// ---------------------------------------------------------------------
		// Check mandatory data in the model
		// ---------------------------------------------------------------------
		if (!oDataDialog.MRPElement || !oDataDialog.MRPElementItem || !oDataDialog.MRPElementScheduleLine
				|| !oDataDialog.MaterialID) {
			// A mandatory field is missing
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}

		// if called from the x30 where fields are provided by dialog and fields are named differently
		if (sClientApp === "x30") {
			if (!oDataDialog.MaterialShortageSolutionType || !oDataDialog.MRPElementChgAvailyOrRqmtDate
					|| !oDataDialog.MRPElementAvailyOrRqmtDate || !oDataDialog.OrderedQuantity
					|| !oDataDialog.OrderedChangedQuantity) {
				// A mandatory field is missing
				return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
			}
		}

		// Adjust the item id that is required as key for the MM call.
		var sItemId = this._adaptItemIdForMM(oDataDialog.MRPElementItem);

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Update
		// The ETag was calculated by the backend within the solution call and passed
		// to the client. It is sent back in the MM call in order to let the backend
		// check the consistency of the business object.
		// ---------------------------------------------------------------------
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_MM_PO_SCHEDLINE;
		url += "(PurchaseOrderID='";
		url += oDataDialog.MRPElement;
		url += "',ItemID='";
		url += sItemId;
		url += "',ScheduleLineID='";
		url += oDataDialog.MRPElementScheduleLine;
		url += "')";

		// Build the values for the purchase order update for the given calling app
		var oEntry = this._buildODataForPurchaseOrderUpdate(oDataDialog, sClientApp);
		// Build the parameters
		var oParams = {};
		oParams.sETag = "W/\"'" + oDataDialog.ChangeStateID + "'\"";
		// Create the batch operation
		var oChangeOperationPO = oDataModel.createBatchOperation(url, sODataRequestType, oEntry, oParams);
		// Add the batch to the array of operations
		aChangeOperations.push(oChangeOperationPO);

		// ---------------------------------------------------------------------
		// OData: Change Request - Update
		// Just in case there is an existing Change Request for the PO
		// ---------------------------------------------------------------------
		if (bChangeRequestExists === true) {
			// Define the parameters for the service of the change request
			sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_UPDATE;
			// Build the values for the purchase order update for the given calling app
			var sMaterialShortageDefinitionID = "";
			var oData = this._buildODataForChangeRequestUpdate(oDataDialog, sClientApp, sMaterialShortageDefinitionID);
			// Build the URL with the keys for the update operation
			url = this._buildUrlForChangeRequestUpdate(oDataDialog);
			// Create the batch
			var oBatchOperation = oDataModel.createBatchOperation(url, sODataRequestType, oData, null);
			// Add the batch to the array of operations
			aChangeOperations.push(oBatchOperation);
		}

		// Collect the batch operation
		oDataModel.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - synchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
		// Return 'success'
		return "";
	},

	/**
	 * This method builds the Odata data structure to update a purchase order
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	_buildODataForPurchaseOrderUpdate : function(oDataDialog, sClientApp) {
		// Date format object for conversion purposes
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		// Contrainer for return values
		var oEntry = {};
		// Based on the calling client app we use different fields for the result values
		switch (sClientApp) {
			case "x30" :
				// called from the x30 where fields are provided by dialog and fields are named differently
				var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
				oEntry.DeliveryDate = oDateFormat.format(oDate) + "T00:00:00";
				oEntry.PurchasingDocumentOrderQty = (oDataDialog.OrderedChangedQuantity).toString();
				break;
			case "540" :
				// called from the Change Request app - all fields are read by ODATA
				if (oDataDialog.VendorResponse === i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_PROPOSED) {
					// if vendor proposal selected then update PO with proposed change request data
					oEntry.DeliveryDate = oDataDialog.MRPElementProposedDate;
					oEntry.PurchasingDocumentOrderQty = oDataDialog.MRPElementProposedQuantity;
				} else {
					// else update PO with the requested change request data
					oEntry.DeliveryDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
					oEntry.PurchasingDocumentOrderQty = oDataDialog.MRPElementChangedTotalQuantity;
				}
				break;
			default :
				jQuery.sap.log.error("CollaborationHelper:_buildODataForPurchaseOrderUpdate - unknown client app: "
						+ sClientApp);
		}
		return oEntry;
	},

	/**
	 * This method builds the Odata data structure to update a Change Request
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	_buildODataForChangeRequestUpdate : function(oDataDialog, sClientApp, sMaterialShortageDefinitionID) {
		// Date format object for conversion purposes
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		// Contrainer for return values
		var oEntry = {};
		oEntry.SolutionRequestStatus = oDataDialog.SolutionRequestStatus;
		// Based on the calling client app we use different fields for the result values
		switch (sClientApp) {
			case "x30" :
				// If called from the x30 where fields are provided by dialog and fields are named differently
				// Build the shortage profile
				// Shortage Definition wasn't provided by solution call -> concatenate the profile
				sMaterialShortageDefinitionID = oDataDialog.MaterialShortageProfile + oDataDialog.MaterialShortageProfileCount;
				// Changed Delivery Date (value provided by user)
				oEntry.MRPElementChgAvailyOrRqmtDate = oDateFormat.format(oDataDialog.MRPElementChgAvailyOrRqmtDate)
						+ "T00:00:00";

				// ---------the new Total Quantity fields--------------
				// Write the quantities
				oEntry.MRPElementOriginalTotalQty = (oDataDialog.MRPElementOriginalTotalQty).toString();
				oEntry.MRPElementChangedTotalQuantity = (oDataDialog.MRPElementChangedTotalQuantity).toString();

				break;
			case "540" :
				// If called from the Change Request app - all fields are read by ODATA
				sMaterialShortageDefinitionID = oDataDialog.MaterialShortageDefinitionID;
				oEntry.SolutionRequestNote = oDataDialog.SolutionRequestNote;

				// ---------the new Total Quantity fields--------------
				// Write the quantities
				oEntry.MRPElementOriginalTotalQty = oDataDialog.MRPElementOriginalTotalQty;
				oEntry.MRPElementChangedTotalQuantity = oDataDialog.MRPElementChangedTotalQuantity;
				oEntry.MRPElementChgAvailyOrRqmtDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;

				break;
			default :
				jQuery.sap.log.error("CollaborationHelper:_buildODataForChangeRequestUpdate - unknown client app: "
						+ sClientApp);
		}
		return oEntry;
	},

	/**
	 * This method builds the Odata data structure to create a Change Request in a batch call
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	_buildODataForChangeRequestCreation : function(oDataDialog) {
		// Date format object for conversion purposes
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		var oEntry = {};

		// Keys
		oEntry.MRPElement = oDataDialog.MRPElement;
		// Adjust the item id that is required as key for the MM call.
		oEntry.MRPElementItem = this._adaptItemIdForMM(oDataDialog.MRPElementItem);
		oEntry.MRPElementScheduleLine = oDataDialog.MRPElementScheduleLine;
		// Fill that with the data from the model
		oEntry.Vendor = oDataDialog.Vendor; // ID with max 10 chars
		oEntry.SupplyingPlant = oDataDialog.SupplyingPlant; // In case of TO this field is used
		oEntry.SolutionRequestStatus = oDataDialog.SolutionRequestStatus;
		oEntry.MaterialID = oDataDialog.MaterialID;
		oEntry.SolutionRequestNote = oDataDialog.SolutionRequestNote;
		oEntry.MRPPlant = oDataDialog.MRPPlant;
		oEntry.MRPArea = oDataDialog.MRPArea;
		oEntry.MRPPlanningSegmentType = oDataDialog.MRPPlanningSegmentType;
		oEntry.MRPPlanningSegmentNumber = oDataDialog.MRPPlanningSegmentNumber;
		oEntry.MRPElementCategory = oDataDialog.MRPElementCategory;
		oEntry.MaterialGoodsReceiptDuration = oDataDialog.MaterialGoodsReceiptDuration;
		// Write the quantities
		oEntry.MRPElementOpenQuantity = (oDataDialog.MRPElementOpenQuantity).toString();
		// Write Target Date in 'DATS'
		oEntry.MRPElementChgAvailyOrRqmtDate = oDateFormat.format(oDataDialog.MRPElementChgAvailyOrRqmtDate) + "T00:00:00";
		// Write Original Date in 'DATS'
		oEntry.MRPElementAvailyOrRqmtDate = oDateFormat.format(oDataDialog.MRPElementAvailyOrRqmtDate) + "T00:00:00";

		// ---------the new Total Quantity fields--------------
		// Write the quantities
		oEntry.MRPElementOriginalTotalQty = (oDataDialog.MRPElementOriginalTotalQty).toString();
		oEntry.MRPElementChangedTotalQuantity = (oDataDialog.OrderedChangedQuantity).toString();
		// Write Availability Date in 'DATS'
		oEntry.AvailabilityDate = oDateFormat.format(oDataDialog.AvailabilityDate) + "T00:00:00";

		return oEntry;
	},

	/**
	 * This method updates a 'Purchase Requisition' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00"
	 * Example Result: "PurchaseReqItems(PurchaseRequisitionID='0010030950',ItemID='00010'"
	 * 
	 * @return {string} empty for success, string if exception occured
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	updatePurchaseRequisitionBatch : function(oDataDialog, oHandler) {
		if (this.backendVersion === 1) {
			// call Wave 3 Interface
			return i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper.writePurchaseRequisitionBatch(oDataDialog, null,
					oHandler);
		}

		var aChangeOperations = new Array();
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		var oDataModel = this.oModelGlobal;
		oDataModel.setUseBatch(true);
		oDataModel.clearBatch();

		// ---------------------------------------------------------------------
		// Check mandatory data in the model
		// ---------------------------------------------------------------------
		if (!oDataDialog.MRPElement || !oDataDialog.MRPElementItem || !oDataDialog.MaterialShortageSolutionType
				|| !oDataDialog.MaterialID || !oDataDialog.MRPElementChgAvailyOrRqmtDate
				|| !oDataDialog.MRPElementAvailyOrRqmtDate || !oDataDialog.MRPElementOriginalTotalQty
				|| !oDataDialog.MRPElementChangedTotalQuantity) {
			// A mandatory field is missing
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}

		// Adjust the item id that is required as key for the MM call.
		var sItemId = this._adaptItemIdForMM(oDataDialog.MRPElementItem);

		// ---------------------------------------------------------------------
		// OData: Purchase Requisition Update
		// The ETag is calculated by the backend within the solution call and passed
		// to the client. It is sent back in the MM call in order to let the backend
		// check the consistency of the business object.
		// ---------------------------------------------------------------------
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_MM_PR_ITEM;
		url += "(PurchaseRequisitionID='";
		url += oDataDialog.MRPElement;
		url += "',ItemID='";
		url += sItemId;
		url += "')";

		var oEntry = {};
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		oEntry.DeliveryDate = oDateFormat.format(oDate) + "T00:00:00";
		oEntry.RequestedQuantity = (oDataDialog.MRPElementChangedTotalQuantity).toString();
		// Manually changed requisitions should always be fixed
		oEntry.PurchaseRequisitionIsFixed = true;
		var oParams = {};
		oParams.sETag = "W/\"'" + oDataDialog.ChangeStateID + "'\"";
		// Create the batch
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_UPDATE;
		var oChangeOperationPR = oDataModel.createBatchOperation(url, sODataRequestType, oEntry, oParams);
		// Add the batch to the array of operations
		aChangeOperations.push(oChangeOperationPR);

		// Collect the batch operation
		oDataModel.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - synchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
		// Return 'success'
		return "";
	},

	/**
	 * This method creates a 'Purchase Order' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00" Example
	 * Result:
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */

	createPurchaseOrderBatch : function(oDataDialog, oHandler) {
		if (this.backendVersion === 1) {
			// call Wave 3 Interface
			return i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper
					.createPurchaseOrderBatch(oDataDialog, null, oHandler);
		}

		var aChangeOperations = new Array();
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		var Constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;
		// Set these keys hard-coded; Requirement of backend.
		var MRPElementItem = "00010";
		var MRPElementScheduleLine = "0001";
		var AccountAssignmentID = "01";

		// ---------------------------------------------------------------------
		// Check mandatory data in the model
		// ---------------------------------------------------------------------
		if (!oDataDialog.MRPElementChgAvailyOrRqmtDate || !MRPElementItem || !MRPElementScheduleLine
				|| !oDataDialog.PurchasingOrganisation || !oDataDialog.MRPElementChangedTotalQuantity
				|| !oDataDialog.ReceivingPlant || !oDataDialog.MaterialID || !oDataDialog.MaterialBaseUnit
				|| !AccountAssignmentID) {
			// A mandatory field is missing
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}
		if (oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_PO_CREATE && !oDataDialog.Vendor) { // "PO_CREATE"
			// no vendor is provided for the creation of the PO
			// this scenario should not be possible, as unsourced cards are not suggested by the backend
			// ONE CODE LINE >>>
			if (i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
				if (this.getModel('ServiceVersions')) {
					return i2d.pp.mrpcockpit.reuse.util.Helper.getSpecialTextForFieldInt({sI18nID : "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PO", 
						sSoHI18nID : "SOLUTION_DIALOG_MSG_VENDOR_MISSING_POSoH", sModSI18nID : "SOLUTION_DIALOG_MSG_VENDOR_MISSING_POModS", 
						iServiceVersion : this.getModel('ServiceVersions').getData().iServiceSchemaVersion});			
				}
			}
			// ONE CODE LINE <<<
			
			return "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PO";
		}
		if (oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TO_CREATE && !oDataDialog.SupplyingPlant) { // "TO_CREATE"
			// no supplying plant is provided for the creation of the PO
			// this scenario should not be possible, as unsourced cards are not suggested by the backend
			return "SOLUTION_DIALOG_MSG_SUPPLYING_PLANT_MISSING_TO";
		}

		var oDataModel = this.oModelGlobal;

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Schedule Lines
		// ---------------------------------------------------------------------
		var oSchedLine = {};
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		oSchedLine.ItemID = MRPElementItem;
		oSchedLine.ScheduleLineID = MRPElementScheduleLine;
		if (!oDate) {
			oSchedLine.DeliveryDate = " ";
		} else {
			oSchedLine.DeliveryDate = oDateFormat.format(oDate) + "T00:00:00";
		}
		oSchedLine.PurchasingDocumentOrderQty = this.replaceEmptyValues((oDataDialog.MRPElementChangedTotalQuantity)
				.toString());

		var a = new Array();
		a.push(oSchedLine);

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Account Assignment
		// ---------------------------------------------------------------------
		var oAccountAssignment = {};
		oAccountAssignment.ItemID = MRPElementItem;
		oAccountAssignment.AccountAssignmentID = AccountAssignmentID;
		oAccountAssignment.SalesOrder = this.replaceEmptyValues(oDataDialog.SalesOrder);
		oAccountAssignment.SalesOrderItem = this.replaceEmptyValues(oDataDialog.SalesOrderItem);
		oAccountAssignment.WBSElement = this.replaceEmptyValues(oDataDialog.WBSElement);
		var e = new Array();
		e.push(oAccountAssignment);

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Items
		// ---------------------------------------------------------------------
		var oItems = {};

		oItems.ItemID = MRPElementItem;
		oItems.AcctAssignmentCategory = this.replaceEmptyValues(oDataDialog.AcctAssignmentCategory);
		oItems.Material = this.replaceEmptyValues(oDataDialog.MaterialID);
		oItems.PurchasingDocumentOrderQty = this.replaceEmptyValues((oDataDialog.MRPElementChangedTotalQuantity).toString());
		oItems.PurgDocOrderQuantityUnit = this.replaceEmptyValues(oDataDialog.MaterialBaseUnit);
		oItems.ReceivingPlant = this.replaceEmptyValues(oDataDialog.ReceivingPlant);
		oItems.SupplyingStorageLocation = this.replaceEmptyValues(oDataDialog.SupplyingStorageLocation);
		oItems.ReceivingStorageLocation = this.replaceEmptyValues(oDataDialog.ReceivingStorageLocation);
		oItems.PurchasingInfoRecord = this.replaceEmptyValues(oDataDialog.PurchasingInfoRecord);
		oItems.PurchaseContract = this.replaceEmptyValues(oDataDialog.PurchaseContract);
		oItems.PurchaseContractItem = this.replaceEmptyValues(oDataDialog.PurchaseContractItem);
		oItems.MaterialGoodsReceiptDuration = this.replaceEmptyValues(oDataDialog.MaterialGoodsReceiptDuration);
		oItems.MMPurchaseOrderScheduleLines = a;
		oItems.MMPurchaseOrderAccAssignments = e;
		var b = new Array();
		b.push(oItems);

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Header
		// ---------------------------------------------------------------------
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_MM_PO_HEADER;
		var oHeader = {};
		// oHeader.PurchaseOrderType = oDataDialog.PurchaseOrderType;
		oHeader.PurchasingOrganisation = oDataDialog.PurchasingOrganisation;
		oHeader.PurchasingGroup = oDataDialog.PurchasingGroup;
		oHeader.CompanyCode = oDataDialog.CompanyCode;
		oHeader.Vendor = this.replaceEmptyValues(oDataDialog.Vendor);
		oHeader.SupplyingPlant = this.replaceEmptyValues(oDataDialog.SupplyingPlant);
		if (oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TO_CREATE) {
			oHeader.StockTransportOrderIndicator = true; // internal procurement
		} else {
			oHeader.StockTransportOrderIndicator = false; // external procurement
		}
		oHeader.MMPurchaseOrderItems = b;

		// Create the batch
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_CREATE;
		var oCreateOperationPO = oDataModel.createBatchOperation(url, sODataRequestType, oHeader, null);
		// Add the batch to the array of operations
		aChangeOperations.push(oCreateOperationPO);
		// Collect the batch operation
		oDataModel.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - synchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
		// Return 'success'
		return "";
	},

	/**
	 * Due to an issue in the Gateway we have to provide a blank instead of empty values see internal message 0003720323
	 * 2013
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	replaceEmptyValues : function(value) {
		if (!value) {
			return " ";
		} else {
			return value;
		}
	},

	/**
	 * This method creates a 'Purchase Requisition' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00"
	 * Example Result:
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */

	createPurchaseRequisitionBatch : function(oDataDialog, oHandler) {
		if (this.backendVersion === 1) {
			// call Wave 3 Interface
			return i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper.createPurchaseRequisitionBatch(oDataDialog, null,
					oHandler);
		}

		var aChangeOperations = new Array();
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		var Constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;
		// Set these keys hard-coded; Requirement of backend.
		var MRPElementItem = "00010";
		// var MRPElementScheduleLine = "0001";
		var AccountAssignmentID = "01";

		// // ---------------------------------------------------------------------
		// // Check mandatory data in the model
		// // ---------------------------------------------------------------------
		if (!oDataDialog.MRPElementChgAvailyOrRqmtDate || !MRPElementItem || !oDataDialog.MRPElementChangedTotalQuantity
				|| !oDataDialog.MaterialID || !oDataDialog.MaterialBaseUnit || !AccountAssignmentID) {
			// A mandatory field is missing
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}

		if (oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_PO_CREATE && !oDataDialog.Vendor) {
			// create PR
			// no vendor is provided for the creation of the PR
			// this scenario should not possible as unsourced cards are not provided by the backend

			// ONE CODE LINE >>>
			if (i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
				if (this.getModel('ServiceVersions')) {
					return i2d.pp.mrpcockpit.reuse.util.Helper.getSpecialTextForFieldInt({sI18nID : "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PR", 
						sSoHI18nID : "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PRSoH", sModSI18nID : "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PRModS", 
						iServiceVersion : this.getModel('ServiceVersions').getData().iServiceSchemaVersion});			
				}
			}
			// ONE CODE LINE <<<
			return "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PR"; // flgSuccess;
		}
		if (oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TO_CREATE && !oDataDialog.SupplyingPlant) {
			// no supplying plant is provided for the creation of the TR
			// this scenario should not possible as unsourced cards are not provided by the backend
			return "SOLUTION_DIALOG_MSG_SUPPLYING_PLANT_MISSING_TR";
		}
		if (oDataDialog.Vendor && !oDataDialog.PurchasingOrganisation) {
			// in case a vendor is provided the purchasing organization is mandatory
			// the purchasing organization should be provided by the solution call
			return "SOLUTION_DIALOG_MSG_PURCHASING_ORGANIZATION_MISSING_PR";
		}

		var oDataModel = this.oModelGlobal;

		// ---------------------------------------------------------------------
		// OData: Purchase Requisition - Account Assignment
		// ---------------------------------------------------------------------
		var oAccountAssignment = {};
		oAccountAssignment.ItemID = MRPElementItem;
		oAccountAssignment.AccountAssignmentID = AccountAssignmentID;
		oAccountAssignment.SalesOrder = this.replaceEmptyValues(oDataDialog.SalesOrder);
		oAccountAssignment.SalesOrderItem = this.replaceEmptyValues(oDataDialog.SalesOrderItem);
		oAccountAssignment.WBSElement = this.replaceEmptyValues(oDataDialog.WBSElement);

		var e = new Array();
		e.push(oAccountAssignment);

		// ---------------------------------------------------------------------
		// OData: Purchase Requisition - Items
		// ---------------------------------------------------------------------
		var oItems = {};
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		oItems.ItemID = MRPElementItem;
		oItems.PurchasingOrganisation = this.replaceEmptyValues(oDataDialog.PurchasingOrganisation);
		oItems.PurchasingGroup = this.replaceEmptyValues(oDataDialog.PurchasingGroup);
		// oItems.PurchasingDocumentItemCategory = this.replaceEmptyValues(oDataDialog.PurchasingDocumentCategory);
		oItems.PurchasingDocumentItemCategory = this.replaceEmptyValues(oDataDialog.MaterialProcurementType);
		oItems.SupplyingPlant = this.replaceEmptyValues(oDataDialog.SupplyingPlant);
		oItems.AcctAssignmentCategory = this.replaceEmptyValues(oDataDialog.AcctAssignmentCategory);
		oItems.Material = this.replaceEmptyValues(oDataDialog.MaterialID);
		oItems.PurReqQuantityUnit = this.replaceEmptyValues(oDataDialog.MaterialBaseUnit);
		oItems.ReceivingPlant = this.replaceEmptyValues(oDataDialog.ReceivingPlant);
		oItems.SupplyingStorageLocation = this.replaceEmptyValues(oDataDialog.SupplyingStorageLocation);
		oItems.ReceivingStorageLocation = this.replaceEmptyValues(oDataDialog.ReceivingStorageLocation);
		oItems.PurchasingInfoRecord = this.replaceEmptyValues(oDataDialog.PurchasingInfoRecord);
		oItems.PurchaseContract = this.replaceEmptyValues(oDataDialog.PurchaseContract);
		oItems.PurchaseContractItem = this.replaceEmptyValues(oDataDialog.PurchaseContractItem);
		oItems.RequestedQuantity = this.replaceEmptyValues((oDataDialog.MRPElementChangedTotalQuantity).toString());
		oItems.FixedVendor = this.replaceEmptyValues(oDataDialog.Vendor);

		if (!oDate) {
			oItems.DeliveryDate = " ";
		} else {
			oItems.DeliveryDate = oDateFormat.format(oDate) + "T00:00:00";
		}

		oItems.MaterialGoodsReceiptDuration = this.replaceEmptyValues(oDataDialog.MaterialGoodsReceiptDuration);
		oItems.MMPurchaseReqAccAssignments = e;

		// Manually created requisitions should always be fixed
		oItems.PurchaseRequisitionIsFixed = true;

		var b = new Array();
		b.push(oItems);

		// ---------------------------------------------------------------------
		// OData: Purchase Requisition - Header
		// ---------------------------------------------------------------------
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_MM_PR_HEADER;
		var oHeader = {};
		oHeader.MMPurchaseRequisitionItems = b;

		// Create the batch
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_CREATE;
		var oCreateOperationPR = oDataModel.createBatchOperation(url, sODataRequestType, oHeader, null);
		// Add the batch to the array of operations
		aChangeOperations.push(oCreateOperationPR);
		// Collect the batch operation
		oDataModel.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - synchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
		// Return 'success'
		return "";
	},

	/**
	 * This method creates a 'Purchase Order' based on an existing 'Purchase Requisition'. DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00" Example Result:
	 * 
	 * oDataDialog.MRPElementOriginalTotalQty oDataDialog.MRPElementChangedTotalQuantity
	 * oDataDialog.MRPElementOpenQuantity oDataDialog.MRPElementChangeOpenQuantity
	 * OpenQuantity + ChangedTotal Quantity â€“ TotalQuantity
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	convertPurchaseRequisitionBatch : function(oDataDialog, oHandler) {

		// If values have changed first an update of the Purchase Requisition needs to be triggered
		if ((oDataDialog.MRPElementChgAvailyOrRqmtDate !== oDataDialog.MRPElementAvailyOrRqmtDate) ||
				(oDataDialog.MRPElementChangedTotalQuantity !== oDataDialog.MRPElementOriginalTotalQty)) {
			 this.updatePurchaseRequisitionBatch(oDataDialog, oHandler);
		};
		
		var nOpenQuantity = (parseInt(oDataDialog.MRPElementOpenQuantity));
		var nConvertQuantity = nOpenQuantity + oDataDialog.MRPElementChangedTotalQuantity - oDataDialog.MRPElementOriginalTotalQty;
		if (nConvertQuantity < 1) {
	     // update before deleted already the document - therefore no conversion takes place		
			 return "";
		}
		var aChangeOperations = new Array();
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		var Constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;
		// Set these keys hard-coded; Requirement of backend.
		var MRPElementItem = "00010";
		var MRPElementScheduleLine = "0001";

		// ---------------------------------------------------------------------
		// Check mandatory data in the model
		// ---------------------------------------------------------------------
		if (!oDataDialog.MRPElementChgAvailyOrRqmtDate || !MRPElementItem || !MRPElementScheduleLine
				|| !oDataDialog.MRPElementChangedTotalQuantity || !oDataDialog.MRPElement) {
			// A mandatory field is missing
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}

		if ((oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_PR_CHANGE
				|| oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_PR_INCREASE || oDataDialog.MaterialShortageSolutionType === Constants.SSOLUTIONTYPE_PR_RESCHEDULE)
				&& !oDataDialog.Vendor) {
			// no vendor is provided for the creation of the PO
			// this scenario should not possible as unsourced cards are not provided by the backend
			// ONE CODE LINE >>>
			if (i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
				if (this.getModel('ServiceVersions')) {
					return i2d.pp.mrpcockpit.reuse.util.Helper.getSpecialTextForFieldInt({sI18nID : "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PO", 
						sSoHI18nID : "SOLUTION_DIALOG_MSG_VENDOR_MISSING_POSoH", sModSI18nID : "SOLUTION_DIALOG_MSG_VENDOR_MISSING_POModS", 
						iServiceVersion : this.getModel('ServiceVersions').getData().iServiceSchemaVersion});			
				}
			}
			// ONE CODE LINE <<<
			return "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PO";
		}

		if ((oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TOR_CHANGE
				|| oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TOR_INCREASE || oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TOR_RESCHEDULE)
				&& !oDataDialog.SupplyingPlant) {
			// no supplying plant is provided for the creation of the TO
			// this scenario should not possible as unsourced cards are not provided by the backend
			return "SOLUTION_DIALOG_MSG_SUPPLYING_PLANT_MISSING_TO";
		}

		var oDataModel = this.oModelGlobal;

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Schedule Lines
		// ---------------------------------------------------------------------
		var oSchedLine = {};
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		oSchedLine.ItemID = MRPElementItem;
		oSchedLine.ScheduleLineID = MRPElementScheduleLine;
		if (!oDate) {
			oSchedLine.DeliveryDate = " ";
		} else {
			oSchedLine.DeliveryDate = oDateFormat.format(oDate) + "T00:00:00";
		}
		oSchedLine.PurchasingDocumentOrderQty = this.replaceEmptyValues((nConvertQuantity)
				.toString());
		var a = new Array();
		a.push(oSchedLine);

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Items
		// ---------------------------------------------------------------------
		var oItems = {};
		oItems.ItemID = MRPElementItem;
		oItems.MaterialGoodsReceiptDuration = this.replaceEmptyValues(oDataDialog.MaterialGoodsReceiptDuration);
		oItems.PurchaseRequisition = this.replaceEmptyValues(oDataDialog.MRPElement);
		oItems.PurchaseRequisitionItem = MRPElementItem;
		oItems.MMPurchaseOrderScheduleLines = a;
		var b = new Array();
		b.push(oItems);

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Header
		// ---------------------------------------------------------------------
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_MM_PO_HEADER;
		var oHeader = {};
		// set indicator in case a stock transport order is to be created
		if (oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TOR_CHANGE
				|| oDataDialog.SolutionTyp === Constants.SOLUTIONTYPE_TOR_INCREASE
				|| oDataDialog.SolutionTyp === Constants.SOLUTIONTYPE_TOR_RESCHEDULE) {
			oHeader.StockTransportOrderIndicator = true; // internal procurement --> create TO
		} else {
			oHeader.StockTransportOrderIndicator = false; // external procurement --> create PO
		}
		oHeader.MMPurchaseOrderItems = b;

		// Create the batch
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_CREATE;
		var oCreateOperationPO = oDataModel.createBatchOperation(url, sODataRequestType, oHeader, null);
		// Add the batch to the array of operations
		aChangeOperations.push(oCreateOperationPO);
		// Collect the batch operation
		oDataModel.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - synchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
		// Return 'success'
		return "";
	},

	/**
	 * Cross Navigation to Change Request App after click on CR icon in supply/demand list
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
	 */
	onCRPressed : function(oEvent) {
		// The data of the currently selected supply demand item is
		// encapsulated in the event
		var oSource = oEvent.getSource();
		var oContext = oSource.getBindingContext();
		var oSdItem = oContext.getObject();
		// Now do the navigation and return any error message
		return this.navToCRApp(oSdItem);
	},

	/**
	 * Cross Navigation to Change Request App
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
	 */
	navToCRApp : function(oContext) {
		var sError = "";
		var dummy = "";
		// Parameters that are transferred to the Change Request App
		var oParams = ({
			"MaterialID" : oContext.Material,
			"SupplyingPlant" : oContext.BusinessPartnerPlant,
			"MRPElementCategory" : oContext.MRPElementCategory,
			"MRPElement" : oContext.MRPElement,
			"MRPElementItem" : oContext.MRPElementItem,
			"MRPElementScheduleLine" : oContext.MRPElementScheduleLine,
			"SolutionRequestStatus" : oContext.SolutionRequestStatus,
			"Vendor" : oContext.Vendor
		});
		
	  // navigate to "manage" applications
		var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
		var oCrossAppNavigator = fgetService && fgetService("CrossApplicationNavigation");
		if (oCrossAppNavigator) {
			// Navigate to 'Change Request App'
			var bHash = i2d.pp.mrpcockpit.reuse.util.CommonConstants.NavToCR;
			var oPersonalizationService = sap.ushell.Container.getService("Personalization");
			var sContainerName = bHash;// "MRPCockpitNavigation." + this.sViewNumber;
			if (oPersonalizationService.getContainer) {
				oPersonalizationService.getContainer(sContainerName, {
					validity : i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_STATE_VALIDITY_TIME
				}).fail(function() {
					sap.ca.ui.utils.busydialog.releaseBusyDialog();
					jQuery.sap.log.error("Loading personalization data failed.");
				}).done(function(oContainer) {
					oContainer.setItemValue("Navigation", oParams);
					oContainer.save().done(function() {
						sap.ca.ui.utils.busydialog.releaseBusyDialog();
						// trigger navigation
						oCrossAppNavigator.toExternal({
		          target : { semanticObject : "MRPChangeRequest",
		                 						 action : "manage"},
		          params : {"navigationID" : bHash}
						});	
					}.bind(this));
				}.bind(this));
			} else {
			sError = this.oResourceBundle.getText("messNoLaunchpad");
			return sError;
			}
		}
	},
	
	/**
	 * Cross Navigation to Purchase Order App
	 */		
	navToPOApp : function(oPOItem) {                        
        
        if(oPOItem){          
            var sPONum = oPOItem.MRPElement;  
            var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
            var oCrossAppNavigator = fgetService && fgetService("CrossApplicationNavigation");    
             
            if (oCrossAppNavigator){                       
               // trigger navigation
                   oCrossAppNavigator.toExternal({
                        target: { shellHash:"PurchaseOrder-manage&/managePO/DISPLAY_PO/" + sPONum }
                });                                                                                
            }
        }
        
	},
	
	/**
	 * Cross Navigation to Sales Order App
	 */		
	navToSOApp : function(oSOItem) {                        
      	 	  
      var para = {
             FPM_START_PAGE_ID : "START",
             MODE : 3,
             BO_KEY : oSOItem.MRPElement // vbeln
      };        

      if(oSOItem){          
          var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
          var oCrossAppNavigator = fgetService && fgetService("CrossApplicationNavigation");               
          // trigger navigation          
          if (oCrossAppNavigator) {
        	  oCrossAppNavigator.toExternal({
                    target : {
                           semanticObject : "SalesOrder",
                           action : "maintainSFSWebClient"
                    },
                    params : para
              });              
          }
      }      
	},  

	/**
	 * Generate a hash key
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
	 */
	_keyGen : function() {
		return jQuery.sap.uid();// (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	},

	_buildUrlForChangeRequestUpdate : function(oDataDialog) {
		var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_CHANGEREQUEST;
		// If it is an update operation - add the keys to the Update operation
		url += "(guid'";
		url += oDataDialog.MaterialShortageSolnRequest;
		url += "')";
		return url;
	},
	
	/**
	 * The MM interfaces just work with a item id length of 5 characters. The rest of the app uses 6 characters for the
	 * item id. The decision was made to just chop the first "0" of the item id in order to be compliant to the required
	 * format of MM.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	_adaptItemIdForMM : function(sItemId) {
		var sItemIDResult = sItemId;
		if (sItemIDResult.length > 5) {
			sItemIDResult = sItemIDResult.substring(1);
		}
		return sItemIDResult;
	},

	/**
	 * This method updates one or more Change Request Documents in a batch operation.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
	 */
	updateChangeRequestDocumentsBatch : function(aChangeRequests, oHandler) {
		
		var aChangeOperations = new Array();
		// Define the OdataRequestType for an update call
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_UPDATE;
		
		var oDataModel = this.oModelGlobal;
		oDataModel.setUseBatch(true);
		oDataModel.clearBatch();			  		
		
		for (var i=0; i<aChangeRequests.length; i++){	
//		  // Check mandatory data in the model
//			if (!aChangeRequests[i].MaterialShortageSolnRequest) {
//				// A mandatory field is missing
//				return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
//			}			
  	  //add Items to batch Request
			var sItemPath = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_CHANGEREQUEST;
			// If it is an update operation - add the keys to the Update operation
			sItemPath += "(guid'";
			sItemPath += aChangeRequests[i].MaterialShortageSolnRequest;
			sItemPath += "')";
			
		  // Create the entries
			var oEntry = {};
			oEntry.SolutionRequestStatus = i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_REQUESTED;
			
	    // Create the parameters
		  var oParams = {};
		  oParams.sETag = "W/\"'" + aChangeRequests[i].ChangeStateID + "'\"";
			
		  // Create the batch
			var oBatchOperation = oDataModel.createBatchOperation(sItemPath, sODataRequestType, oEntry, oParams);				
		  // Collect the batch operation
			oDataModel.addBatchChangeOperations([oBatchOperation]);
		}
								
		// Submit the batch - synchronous call
		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
		// Return 'success'. Method always returns success as in case of an error corresponding callback is
		// executed
		return "";		
	},
	
		
		/**
		 * This method updates a 'Planned Order' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00"
		 * Example Result: "QuickViews(MRPElement='6385033',MRPElementItem='000001',MRPElementScheduleLine='0000',MRPElementCategory='SB')"
		 * 
		 * @return {string} empty for success, string if exception occured
		 * @memberOf i2d.pp.mrpcockpit.reuse.util.CollaborationHelper
		 */
	updatePlannedOrderBatch : function(oDataDialog, oHandler) {

			var aChangeOperations = new Array();
			// Date format object for conversion purposes			
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern : "yyyy-MM-dd"
			});
			var oDataModel = this.oModelGlobal;
			oDataModel.setUseBatch(true);
			oDataModel.clearBatch();

			// ---------------------------------------------------------------------
			// Check mandatory data in the model
			// ---------------------------------------------------------------------
			if (!oDataDialog.MRPElement || !oDataDialog.MRPElementItem || !oDataDialog.MaterialShortageSolutionType
					|| !oDataDialog.MaterialID || !oDataDialog.OrderFinishDate || !oDataDialog.ChangedOrderFinishDate 
					|| !oDataDialog.MRPElementOriginalTotalQty || !oDataDialog.MRPElementChangedTotalQuantity) {
				// A mandatory field is missing
				return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
			}

			// Adjust the item id that is required as key for the MM call.
			var sItemId = this._adaptItemIdForMM(oDataDialog.MRPElementItem);

			// What should be done - only update planned order or follow up action
			var oPlanChange = false;
			var oPlanConvert = false;
			if ((oDataDialog.OrderFinishDate === oDataDialog.ChangedOrderFinishDate) &&
					(oDataDialog.MRPElementOriginalTotalQty === oDataDialog.MRPElementChangedTotalQuantity)) {
			  	// if quantity and date are not changed - only make conversion
			  	oPlanChange = false;
			} else {
          oPlanChange = true;
			};		
			if (oDataDialog.DialogActivity === i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_EXECUTE) {
			  	// if activity = 000 - only PlanChange - else make conversion too
			  	oPlanConvert = false;
			} else {
          oPlanConvert = true;
			};				
			
			var url = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_QUICKVIEWS;
			url += "(MRPElement='";
			url += oDataDialog.MRPElement;
			url += "',MRPElementItem='";
			url += sItemId;
			url += "',MRPElementScheduleLine='";
			url += oDataDialog.MRPElementScheduleLine;	
			url += "',MRPElementCategory='";
			url += oDataDialog.MRPElementCategory;				
			url += "')";

			
			// First backend call when update of planned order is requested
			if (oPlanChange === true) {
				oDataDialog.QuickviewCategory = i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.CHANGE_PLANORD;
		
		  	var oEntry = {};
	  		oEntry.MRPElement = oDataDialog.MRPElement;
	  		var oDate = oDataDialog.ChangedOrderFinishDate;
	  		oEntry.OrderFinishDate = oDateFormat.format(oDate) + "T12:00:00";
	  		oEntry.TotalQuantity = (oDataDialog.MRPElementChangedTotalQuantity).toString();
	   		oEntry.QuickviewCategory = oDataDialog.QuickviewCategory;
		  	oEntry.PlannedOrder = oDataDialog.PlannedOrder;
	  		// Create the batch
	  		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_UPDATE;
	  		var oChangeOperation = oDataModel.createBatchOperation(url, sODataRequestType, oEntry, null);
	  		// Add the batch to the array of operations
	  		aChangeOperations.push(oChangeOperation);

		  	// Collect the batch operation
	  		oDataModel.addBatchChangeOperations(aChangeOperations);
	  		// Submit the batch - synchronous call
	  		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
	    };		

	    var aChangeOperations = [];
	    oDataModel.clearBatch();
	    
			// Second backend call when conversion of planned order is requested
			if (oPlanConvert === true) {
				switch (oDataDialog.DialogActivity) {
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_EXECUTE :
						// change Planned Order
						oDataDialog.QuickviewCategory = i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.CHANGE_PLANORD;
						break;
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_REQ_CONVERT :
						// change Planned Order + convert to Purchase Requisition
						oDataDialog.QuickviewCategory = i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.CONV_REQ;
						break;
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_PROC_CONVERT :
						// change Planned Order + convert to Process Order
						oDataDialog.QuickviewCategory = i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.CONV_PROC;
						break;
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_PROD_CONVERT :
						// change Planned Order + convert to Production Order
						oDataDialog.QuickviewCategory = i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.CONV_PROD;
						break;
				};	
		
		  	var oEntry = {};
	  		oEntry.MRPElement = oDataDialog.MRPElement;
	  		var oDate = oDataDialog.ChangedOrderFinishDate;
	  		oEntry.OrderFinishDate = oDateFormat.format(oDate) + "T12:00:00";
	  		oEntry.TotalQuantity = (oDataDialog.MRPElementChangedTotalQuantity).toString();
	   		oEntry.QuickviewCategory = oDataDialog.QuickviewCategory;
		  	oEntry.PlannedOrder = oDataDialog.PlannedOrder;
	  		// Create the batch
	  		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_UPDATE;
	  		var oChangeOperation = oDataModel.createBatchOperation(url, sODataRequestType, oEntry, null);
	  		// Add the batch to the array of operations
	  		aChangeOperations.push(oChangeOperation);

		  	// Collect the batch operation
	  		oDataModel.addBatchChangeOperations(aChangeOperations);
	  		// Submit the batch - synchronous call
	  		oDataModel.submitBatch(oHandler.fnSuccess, oHandler.fnError, false);
	    };	    
					
		// Return 'success'			
			return "";
		}
	
};

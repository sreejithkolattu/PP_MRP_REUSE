/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");

i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper = {

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
	 * This method maps the old fields of wave 3 to wave 5
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	_mapOData3ToOdata5 : function(oDataDialog) {

		oDataDialog.MRPElementChangedTotalQuantity = oDataDialog.MRPElementChangeOpenQuantity;
		oDataDialog.MRPElementOriginalTotalQty = oDataDialog.MRPElementOpenQuantity;
		oDataDialog.OrderQuantityUnitDcmls = oDataDialog.TargetQuantityUnitDcmls;
		oDataDialog.OrderUnitOfMeasureTechnicalName = oDataDialog.UnitOfMeasureTechnicalName;
	},

	/**
	 * This method maps the new fields of wave 5 to wave 3
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	_mapOData5ToOdata3 : function(oDataDialog) {
		oDataDialog.MRPElementChangeOpenQuantity = oDataDialog.MRPElementChangedTotalQuantity;
		oDataDialog.MRPElementOpenQuantity = oDataDialog.MRPElementOriginalTotalQty;
		oDataDialog.TargetQuantityUnitDcmls = oDataDialog.OrderQuantityUnitDcmls;
		oDataDialog.UnitOfMeasureTechnicalName = oDataDialog.OrderUnitOfMeasureTechnicalName;
		oDataDialog.MRPElementItem = this._adaptItemIdForMM(oDataDialog.MRPElementItem);
	},

	/**
	 * The MM interfaces just work with a item id length of 5 characters. The rest of the app uses 6 characters for the
	 * item id. The decision was made to just chop the first "0" of the item id in order to be compliant to the required
	 * format of MM.
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	_adaptItemIdForMM : function(sItemId) {
		var sItemIDResult = sItemId;
		if (sItemIDResult.length > 5) {
			sItemIDResult = sItemIDResult.substring(1);
		}
		return sItemIDResult;
	},

	/**
	 * This method reads a 'Change Request' from the backend.
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	readRequest : function(oModel) {

		// ---------------------------------------------------------------------
		// OData: Change Request - Read
		// ---------------------------------------------------------------------
		var url = "/RequestNotes";
		var requestTab = null;

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

		var oUrlParams = new Array();
		var tmp = "$filter=" + filter;
		oUrlParams.push(tmp);

		// Read Purchase Order
		this.oModelGlobal.read(url, null, oUrlParams, false, function(oData, oResponse) {
			requestTab = oResponse.data.results[0];
		}, function(oError) {
			requestTab = null;
		});

		return requestTab;
	},

	/**
	 * This method writes a 'Change Request' to the backend. Info: SAP type DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00"
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	writeRequest : function(oDataDialog, requestTab) {

		var flgSuccess = false;
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});

		// ---------------------------------------------------------------------
		// OData: Change Request - Write
		// ---------------------------------------------------------------------
		var url = "/RequestNotes";

		// Update Purchase Order
		var oData = {};
		// Keys
		oData.MRPElement = oDataDialog.MRPElement;
		oData.MRPElementItem = oDataDialog.MRPElementItem;
		oData.MRPElementScheduleLine = oDataDialog.MRPElementScheduleLine;

		// Fill that with the data from the model
		oData.Vendor = oDataDialog.Vendor; // ID with max 10 chars
		oData.MaterialShortageSolutionType = oDataDialog.MaterialShortageSolutionType;
		oData.SolutionRequestStatus = oDataDialog.SolutionRequestStatus;
		oData.MaterialID = oDataDialog.MaterialID;
		oData.SolutionRequestNote = oDataDialog.SolutionRequestNote;
		oData.MaterialShortageSolnRequest = "";
		oData.DummyMrpReqNote = "";

		// Write the quantities
		oData.MRPElementTargetQuantity = (oDataDialog.MRPElementChangeOpenQuantity).toString();
		oData.MRPElementOriginalQuantity = (oDataDialog.MRPElementOpenQuantity).toString();
		// Write Target Date in 'DATS'
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		oData.MRPElementTargetDate = oDateFormat.format(oDate) + "T00:00:00";
		// Write Original Date in 'DATS'
		oDate = oDataDialog.MRPElementAvailyOrRqmtDate;
		oData.MRPElementOriginalDate = oDateFormat.format(oDate) + "T00:00:00";

		this.oModelGlobal.create(url, oData, null, function() {
			flgSuccess = true;
		}, function(oError) {
			flgSuccess = false;
		});

		return flgSuccess;
	},
	/**
	 * This method writes a 'Change Request' to the backend. Info: SAP type DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00"
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	deleteShortageAccept : function(oModel, requestTab) {

		// map the fields to the old oData format
		this._mapOData5ToOdata3(oModel);

		var flgSuccess = false;
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});

		var materialshortagestartdate = oDateFormat.format(oModel.MaterialShortageStartDate) + "T00:00:00";
		var materialshortageenddate = oDateFormat.format(oModel.MaterialShortageEndDate) + "T00:00:00";

		// ---------------------------------------------------------------------
		// OData: Change Request - Write
		// ---------------------------------------------------------------------

		var url = "/AcceptedShortages(MaterialShortageProfile='" + oModel.MaterialShortageProfile
				+ "',MaterialShortageProfileCount='" + oModel.MaterialShortageProfileCount + "',MaterialID='"
				+ oModel.MaterialID + "',MRPPlant='" + oModel.MRPPlant + "',MRPArea='" + oModel.MRPArea
				+ "',MRPPlanningSegmentType='" + oModel.MRPPlanningSegmentType + "',MRPPlanningSegmentNumber='"
				+ oModel.MRPPlanningSegmentNumber + "',MaterialShortageStartDate=datetime'" + materialshortagestartdate
				+ "',MaterialShortageEndDate=datetime'" + materialshortageenddate

				+ "')";

		this.oModelGlobal.remove(url, {
			fnSuccess : function() {
				flgSuccess = "";
			},
			fnError : function(oError) {
				flgSuccess = false;
			}
		});

		return flgSuccess;
	},

	/**
	 * This method writes a 'Change Request' to the backend. Info: SAP type DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00"
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	writeShortageAccept : function(oDataDialog, requestTab) {

		// map the fields to the old oData format
		this._mapOData5ToOdata3(oDataDialog);

		var flgSuccess = false;
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});

		// ---------------------------------------------------------------------
		// OData: Accept Shortage - Write
		// ---------------------------------------------------------------------
		var url = "/AcceptedShortages";

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

		// additional Info
		oData.MaterialShortageQuantity = (oDataDialog.MaterialShortageQuantity).toString();
		oData.AcceptShortageNote = oDataDialog.SolutionRequestNote;

		this.oModelGlobal.create(url, oData, null, function() {
			flgSuccess = "";
		}, function(oError) {
			flgSuccess = false;
		});

		return flgSuccess;
	},
	/**
	 * This method deletes a 'Accepted shortage' to the backend. Info: SAP type DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00"
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	deleteShortageAcceptBatch : function(oModel, oHandler) {

		// map the fields to the old oData format
		this._mapOData5ToOdata3(oModel);

		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});
		var aChangeOperations = [];
		var oData = {};

		var materialshortagestartdate = oDateFormat.format(oModel.MaterialShortageStartDate) + "T00:00:00";
		var materialshortageenddate = oDateFormat.format(oModel.MaterialShortageEndDate) + "T00:00:00";

		// ---------------------------------------------------------------------
		// OData: Change Request - Write
		// ---------------------------------------------------------------------

		var url = "/AcceptedShortages(MaterialShortageProfile='" + oModel.MaterialShortageProfile
				+ "',MaterialShortageProfileCount='" + oModel.MaterialShortageProfileCount + "',MaterialID='"
				+ oModel.MaterialID + "',MRPPlant='" + oModel.MRPPlant + "',MRPArea='" + oModel.MRPArea
				+ "',MRPPlanningSegmentType='" + oModel.MRPPlanningSegmentType + "',MRPPlanningSegmentNumber='"
				+ oModel.MRPPlanningSegmentNumber + "',MaterialShortageStartDate=datetime'" + encodeURIComponent(materialshortagestartdate)
				+ "',MaterialShortageEndDate=datetime'" + encodeURIComponent(materialshortageenddate) + "')";

		// Define the OData Delete operation
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_DELETE;
		// Create the batch
		var oChangeOperation = this.oModelGlobal.createBatchOperation(url, sODataRequestType, oData, null);
		// Add the batch to the array of operations
		aChangeOperations.push(oChangeOperation);
		// Collect the batch operation
		this.oModelGlobal.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - Asynchronous call
		this.oModelGlobal.submitBatch(oHandler.fnSuccess, oHandler.fnError, true);
		// Return 'success'
		return "";
	},

	/**
	 * This method writes a 'Change Request' to the backend. Info: SAP type DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00"
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	createShortageAcceptBatch : function(oDataDialog, oHandler) {

		// map the fields to the old oData format
		this._mapOData5ToOdata3(oDataDialog);

		var aChangeOperations = new Array();
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});

		// ---------------------------------------------------------------------
		// OData: Accept Shortage - Write
		// ---------------------------------------------------------------------
		var sODataRequestType = i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_CREATE;
		var url = "/AcceptedShortages";
		this.oModelGlobal.setUseBatch(true);
		this.oModelGlobal.clearBatch();

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

		// additional Info
		oData.MaterialShortageQuantity = (oDataDialog.MaterialShortageQuantity).toString();
		oData.AcceptShortageNote = oDataDialog.SolutionRequestNote;

		// Create the batch
		var oChangeOperation = this.oModelGlobal.createBatchOperation(url, sODataRequestType, oData, null);
		// Add the batch to the array of operations
		aChangeOperations.push(oChangeOperation);
		// Collect the batch operation
		this.oModelGlobal.addBatchChangeOperations(aChangeOperations);
		// Submit the batch - Asynchronous call
		this.oModelGlobal.submitBatch(oHandler.fnSuccess, oHandler.fnError, true);
		// Return 'success'
		return "";
	},

	/**
	 * This method writes a 'Purchase Order' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00" Example
	 * Result: "ScheduleLines(PurchaseOrderID='4500003069',ItemID='00010',ScheduleLineID='0001'"
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */

	writePurchaseOrder : function(oDataDialog, requestTab) {

		var flgSuccess = false;

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Write
		// ---------------------------------------------------------------------
		var url = "/MMPurchaseOrderScheduleLines(PurchaseOrderID='";
		url += oDataDialog.MRPElement;
		url += "',ItemID='";
		url += oDataDialog.MRPElementItem;
		url += "',ScheduleLineID='";
		url += oDataDialog.MRPElementScheduleLine;
		url += "')";

		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});

		// Update Purchase Order
		var oEntry = {};
		oEntry.DeliveryDate = oDateFormat.format(oDate) + "T00:00:00";
		oEntry.PurchasingDocumentOrderQty = (oDataDialog.MRPElementChangeOpenQuantity).toString();
		var oParams = {};

		// The ETag is calculated by the backend within the solution call and passed
		// to the client. It is sent back in the MM call in order to let the backend
		// check the consistency of the business object.
		oParams.sETag = "W/\"'" + oDataDialog.ChangeStateID + "'\"";

		oParams.fnSuccess = function() {
			flgSuccess = true;
		};
		oParams.fnError = function(oError) {
			flgSuccess = false;
		};
		oParams.bMerge = true;
		this.oModelGlobal.update(url, oEntry, oParams);
		return flgSuccess;
	},

	/**
	 * This method writes a 'Purchase Requisition' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00"
	 * Example Result: "PurchaseReqItems(PurchaseRequisitionID='0010030950',ItemID='00010'"
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */

	writePurchaseRequisition : function(oDataDialog, requestTab) {

		var flgSuccess = false;

		// ---------------------------------------------------------------------
		// OData: PP_PURCH_ORD_MRP_COCKPIT
		// ---------------------------------------------------------------------

		var url = "/MMPurchaseRequisitionItems(PurchaseRequisitionID='";
		url += oDataDialog.MRPElement;
		url += "',ItemID='";
		url += oDataDialog.MRPElementItem;
		url += "')";

		// Update Purchase Requisition
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});

		var oEntry = {};
		oEntry.DeliveryDate = oDateFormat.format(oDate) + "T00:00:00";
		oEntry.RequestedQuantity = (oDataDialog.MRPElementChangeOpenQuantity).toString();
		// Manually changed requisitions should always be fixed
		oEntry.PurchaseRequisitionIsFixed = true;

		// The ETag is calculated by the backend within the solution call and passed
		// to the client. It is sent back in the MM call in order to let the backend
		// check the consistency of the business object.
		var oParams = {};
		oParams.sETag = "W/\"'" + oDataDialog.ChangeStateID + "'\"";

		oParams.fnSuccess = function() {
			flgSuccess = true;
		};
		oParams.fnError = function(oError) {
			flgSuccess = false;
		};
		oParams.bMerge = true;

		this.oModelGlobal.update(url, oEntry, oParams);
		return flgSuccess;
	},

	/**
	 * This method writes a 'Purchase Order' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00" Example
	 * Result: "ScheduleLines(PurchaseOrderID='4500003069',ItemID='00010',ScheduleLineID='0001'"
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	writePurchaseOrderBatch : function(oDataDialog, requestTab, oHandler) {
		// map the fields to the old oData format
		this._mapOData5ToOdata3(oDataDialog);

		var aChangeOperations = new Array();
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});

		// ---------------------------------------------------------------------
		// Check mandatory data in the model
		// ---------------------------------------------------------------------
		if (!oDataDialog.MRPElement || !oDataDialog.MRPElementItem || !oDataDialog.MRPElementScheduleLine
				|| !oDataDialog.MaterialShortageSolutionType || !oDataDialog.MaterialID
				|| !oDataDialog.MRPElementChgAvailyOrRqmtDate || !oDataDialog.MRPElementAvailyOrRqmtDate
				|| !oDataDialog.MRPElementOpenQuantity || !oDataDialog.MRPElementChangeOpenQuantity) {
			// A mandatory field is missing - probably not provided by the solution
			// call.
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}

		// ---------------------------------------------------------------------
		// OData: Purchase Order - Write
		// ---------------------------------------------------------------------

		this.oModelGlobal.setUseBatch(true);
		this.oModelGlobal.clearBatch();

		var url = "/MMPurchaseOrderScheduleLines(PurchaseOrderID='";
		url += oDataDialog.MRPElement;
		url += "',ItemID='";
		url += oDataDialog.MRPElementItem;
		url += "',ScheduleLineID='";
		url += oDataDialog.MRPElementScheduleLine;
		url += "')";

		// Update Purchase Order
		var oEntry = {};
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		oEntry.DeliveryDate = oDateFormat.format(oDate) + "T00:00:00";
		oEntry.PurchasingDocumentOrderQty = (oDataDialog.MRPElementChangeOpenQuantity).toString();

		// The ETag is calculated by the backend within the solution call and passed
		// to the client. It is sent back in the MM call in order to let the backend
		// check the consistency of the business object.
		var oParams = {};
		oParams.sETag = "W/\"'" + oDataDialog.ChangeStateID + "'\"";

		// MERGE = Update
		var oChangeOperationPO = this.oModelGlobal.createBatchOperation(url, "MERGE", oEntry, oParams);

		aChangeOperations.push(oChangeOperationPO);

		// ---------------------------------------------------------------------
		// OData: Change Request - Write
		// ---------------------------------------------------------------------

		url = "/RequestNotes";

		// Keys
		var oData = {};
		oData.MRPElement = oDataDialog.MRPElement;
		oData.MRPElementItem = oDataDialog.MRPElementItem;
		oData.MRPElementScheduleLine = oDataDialog.MRPElementScheduleLine;

		// Fill that with the data from the model
		oData.Vendor = oDataDialog.Vendor; // ID with max 10 chars
		oData.MaterialShortageSolutionType = oDataDialog.MaterialShortageSolutionType;
		oData.SolutionRequestStatus = oDataDialog.SolutionRequestStatus;
		oData.MaterialID = oDataDialog.MaterialID;
		oData.SolutionRequestNote = oDataDialog.SolutionRequestNote;
		oData.MaterialShortageSolnRequest = "";
		oData.DummyMrpReqNote = "";

		// Write the quantities
		oData.MRPElementTargetQuantity = (oDataDialog.MRPElementChangeOpenQuantity).toString();
		oData.MRPElementOriginalQuantity = (oDataDialog.MRPElementOpenQuantity).toString();
		// Write Target Date in 'DATS'
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		oData.MRPElementTargetDate = oDateFormat.format(oDate) + "T00:00:00";
		// Write Original Date in 'DATS'
		oDate = oDataDialog.MRPElementAvailyOrRqmtDate;
		oData.MRPElementOriginalDate = oDateFormat.format(oDate) + "T00:00:00";

		// For Rel-1.1 we don't write Change Requests at all
		// POST = Create
		// var oChangeOperationCR = this.oModelGlobal.createBatchOperation(url, "POST", oData, null);
		// aChangeOperations.push(oChangeOperationCR);

		// ---------------------------------------------------------------------
		// Call the batch update
		// ---------------------------------------------------------------------

		this.oModelGlobal.addBatchChangeOperations(aChangeOperations);

		// Asynchronous call
		this.oModelGlobal.submitBatch(oHandler.fnSuccess, oHandler.fnError, true);

		return "";
	},

	/**
	 * This method writes a 'Purchase Requisition' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00"
	 * Example Result: "PurchaseReqItems(PurchaseRequisitionID='0010030950',ItemID='00010'"
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	writePurchaseRequisitionBatch : function(oDataDialog, requestTab, oHandler) {
		// map the fields to the old oData format
		this._mapOData5ToOdata3(oDataDialog);

		var aChangeOperations = new Array();
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern : "yyyy-MM-dd"
		});

		// ---------------------------------------------------------------------
		// Check mandatory data in the model
		// ---------------------------------------------------------------------
		if (!oDataDialog.MRPElement || !oDataDialog.MRPElementItem || !oDataDialog.MaterialShortageSolutionType
				|| !oDataDialog.MaterialID || !oDataDialog.MRPElementChgAvailyOrRqmtDate
				|| !oDataDialog.MRPElementAvailyOrRqmtDate || !oDataDialog.MRPElementOpenQuantity
				|| !oDataDialog.MRPElementChangeOpenQuantity) {
			// A mandatory field is missing - probably not provided by the solution
			// call.
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}

		// ---------------------------------------------------------------------
		// OData: Purchase Requisition Write
		// ---------------------------------------------------------------------

		this.oModelGlobal.setUseBatch(true);
		this.oModelGlobal.clearBatch();

		var url = "/MMPurchaseRequisitionItems(PurchaseRequisitionID='";
		url += oDataDialog.MRPElement;
		url += "',ItemID='";
		url += oDataDialog.MRPElementItem;
		url += "')";

		// Update Purchase Requisition
		var oEntry = {};
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		oEntry.DeliveryDate = oDateFormat.format(oDate) + "T00:00:00";
		oEntry.RequestedQuantity = (oDataDialog.MRPElementChangeOpenQuantity).toString();
		// Manually changed requisitions should always be fixed
		oEntry.PurchaseRequisitionIsFixed = true;

		// The ETag is calculated by the backend within the solution call and passed
		// to the client. It is sent back in the MM call in order to let the backend
		// check the consistency of the business object.
		var oParams = {};
		oParams.sETag = "W/\"'" + oDataDialog.ChangeStateID + "'\"";

		// MERGE = Update
		var oChangeOperationPR = this.oModelGlobal.createBatchOperation(url, "MERGE", oEntry, oParams);

		aChangeOperations.push(oChangeOperationPR);

		// ---------------------------------------------------------------------
		// OData: Change Request - Write
		// ---------------------------------------------------------------------

		url = "/RequestNotes";

		// Keys
		var oData = {};
		oData.MRPElement = oDataDialog.MRPElement;
		oData.MRPElementItem = oDataDialog.MRPElementItem;
		oData.MRPElementScheduleLine = oDataDialog.MRPElementScheduleLine;

		// Fill that with the data from the model
		oData.Vendor = oDataDialog.Vendor; // ID with max 10 chars
		oData.MaterialShortageSolutionType = oDataDialog.MaterialShortageSolutionType;
		oData.SolutionRequestStatus = oDataDialog.SolutionRequestStatus;
		oData.MaterialID = oDataDialog.MaterialID;
		oData.SolutionRequestNote = oDataDialog.SolutionRequestNote;
		oData.MaterialShortageSolnRequest = "";
		oData.DummyMrpReqNote = "";

		// Write the quantities
		oData.MRPElementTargetQuantity = (oDataDialog.MRPElementChangeOpenQuantity).toString();
		oData.MRPElementOriginalQuantity = (oDataDialog.MRPElementOpenQuantity).toString();
		// Write Target Date in 'DATS'
		var oDate = oDataDialog.MRPElementChgAvailyOrRqmtDate;
		oData.MRPElementTargetDate = oDateFormat.format(oDate) + "T00:00:00";
		// Write Original Date in 'DATS'
		oDate = oDataDialog.MRPElementAvailyOrRqmtDate;
		oData.MRPElementOriginalDate = oDateFormat.format(oDate) + "T00:00:00";

		// For Rel-1.1 we don't write Change Requests at all
		// POST = Create
		// var oChangeOperationCR = this.oModelGlobal.createBatchOperation(url, "POST", oData, null);
		// aChangeOperations.push(oChangeOperationCR);

		// ---------------------------------------------------------------------
		// Call the batch update
		// ---------------------------------------------------------------------

		this.oModelGlobal.addBatchChangeOperations(aChangeOperations);

		// Asynchronous call
		this.oModelGlobal.submitBatch(oHandler.fnSuccess, oHandler.fnError, true);

		return "";

	},

	/**
	 * This method writes a 'Purchase Order' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00" Example
	 * Result:
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */

	createPurchaseOrderBatch : function(oDataDialog, requestTab, oHandler) {
		// map the fields to the old oData format
		this._mapOData5ToOdata3(oDataDialog);

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
				|| !oDataDialog.PurchasingOrganisation || !oDataDialog.MRPElementChangeOpenQuantity
				|| !oDataDialog.ReceivingPlant || !oDataDialog.MaterialID || !oDataDialog.MaterialBaseUnit
				|| !AccountAssignmentID) {
			// A mandatory field is missing - probably not provided by the solution
			// call.
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}
		if (oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_PO_CREATE && !oDataDialog.Vendor) { // "PO_CREATE"
			// no vendor is provided for the creation of the PO
			// this scenario should not be possible, as unsourced cards are not suggested by the backend
			return "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PO";
		}
		if (oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TO_CREATE && !oDataDialog.SupplyingPlant) { // "TO_CREATE"
			// no supplying plant is provided for the creation of the PO
			// this scenario should not be possible, as unsourced cards are not suggested by the backend
			return "SOLUTION_DIALOG_MSG_SUPPLYING_PLANT_MISSING_TO";
			// flgSuccess;
		}


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
		oSchedLine.PurchasingDocumentOrderQty = this.replaceEmptyValues((oDataDialog.MRPElementChangeOpenQuantity)
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
		oItems.PurchasingDocumentOrderQty = this.replaceEmptyValues((oDataDialog.MRPElementChangeOpenQuantity).toString());
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
		var url = "/MMPurchaseOrderHeaders";
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

		// POST = Create
		var oCreateOperationPO = this.oModelGlobal.createBatchOperation(url, "POST", oHeader, null);
		aChangeOperations.push(oCreateOperationPO);

		// ---------------------------------------------------------------------
		// Call the batch update
		// ---------------------------------------------------------------------
		this.oModelGlobal.addBatchChangeOperations(aChangeOperations);
		// Asynchronous call
		this.oModelGlobal.submitBatch(oHandler.fnSuccess, oHandler.fnError, true);
		return "";
	},

	replaceEmptyValues : function(value) {
		// Due to an issue in the Gateway we have to provide a blank instead of empty values
		// see internal message 0003720323 2013
		if (!value) {
			return " ";
		} else {
			return value;
		}
	},

	/**
	 * This method writes a 'Purchase Requisition' to the backend. DATS has to be provided as "yyyy-MM-ddT00:00:00"
	 * Example Result:
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */

	createPurchaseRequisitionBatch : function(oDataDialog, requestTab, oHandler) {
		// map the fields to the old oData format
		this._mapOData5ToOdata3(oDataDialog);

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
		if (!oDataDialog.MRPElementChgAvailyOrRqmtDate || !MRPElementItem || !oDataDialog.MRPElementChangeOpenQuantity
				|| !oDataDialog.MaterialID || !oDataDialog.MaterialBaseUnit || !AccountAssignmentID) {
			// A mandatory field is missing - probably not provided by the solution
			// call.
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}

		if (oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_PO_CREATE && !oDataDialog.Vendor) {
			// create PR
			// no vendor is provided for the creation of the PR
			// this scenario should not possible as unsourced cards are not provided by the backend
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
		oItems.RequestedQuantity = this.replaceEmptyValues((oDataDialog.MRPElementChangeOpenQuantity).toString());
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
		var url = "/MMPurchaseRequisitionHeaders";
		var oHeader = {};
		oHeader.MMPurchaseRequisitionItems = b;

		// POST = Create
		var oCreateOperationPR = this.oModelGlobal.createBatchOperation(url, "POST", oHeader, null);
		aChangeOperations.push(oCreateOperationPR);

		// ---------------------------------------------------------------------
		// Call the batch update
		// ---------------------------------------------------------------------
		this.oModelGlobal.addBatchChangeOperations(aChangeOperations);
		// Asynchronous call
		this.oModelGlobal.submitBatch(oHandler.fnSuccess, oHandler.fnError, true);

		return "";
	},

	/**
	 * This method creates a 'Purchase Order' based on an existing 'Purchase Requisition'. DATS has to be provided as
	 * "yyyy-MM-ddT00:00:00" Example Result:
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	convertPurchaseRequisitionBatch : function(oDataDialog, requestTab, oHandler) {

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
				|| !oDataDialog.MRPElementChangeOpenQuantity || !oDataDialog.MRPElement) {
			// A mandatory field is missing - probably not provided by the solution
			// call.
			return "SOLUTION_DIALOG_MSG_MANDATORY_KEY_DATA_MISSING";
		}

		if ((oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_PR_CHANGE
				|| oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_PR_INCREASE || oDataDialog.MaterialShortageSolutionType === Constants.SSOLUTIONTYPE_PR_RESCHEDULE)
				&& !oDataDialog.Vendor) {
			// no vendor is provided for the creation of the PO
			// this scenario should not possible as unsourced cards are not provided by the backend
			return "SOLUTION_DIALOG_MSG_VENDOR_MISSING_PO";
		}

		if ((oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TOR_CHANGE
				|| oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TOR_INCREASE || oDataDialog.MaterialShortageSolutionType === Constants.SOLUTIONTYPE_TOR_RESCHEDULE)
				&& !oDataDialog.SupplyingPlant) {
			// no supplying plant is provided for the creation of the TO
			// this scenario should not possible as unsourced cards are not provided by the backend
			return "SOLUTION_DIALOG_MSG_SUPPLYING_PLANT_MISSING_TO";
		}


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

		oSchedLine.PurchasingDocumentOrderQty = this.replaceEmptyValues((oDataDialog.MRPElementChangeOpenQuantity)
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
		var url = "/MMPurchaseOrderHeaders";
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

		// POST = Create
		var oCreateOperationPO = this.oModelGlobal.createBatchOperation(url, "POST", oHeader, null);
		aChangeOperations.push(oCreateOperationPO);

		// ---------------------------------------------------------------------
		// Call the batch update
		// ---------------------------------------------------------------------
		this.oModelGlobal.addBatchChangeOperations(aChangeOperations);
		// Asynchronous call
		this.oModelGlobal.submitBatch(oHandler.fnSuccess, oHandler.fnError, true);

		return "";
	},

	/**
	 * This method extracts an error message out of a given XML which has the error message within the section <message>
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	extractErrorMsgFromXml : function(sXml) {
		var sText = "";
		try {
			var oParser = new DOMParser();
			var xmlDoc = oParser.parseFromString(sXml, "text/xml");
			var aMsg = xmlDoc.getElementsByTagName("message");
			// Check if the required node has been found in the xml
			if (aMsg.length > 0) {
				// Success: It is an XML and the message can be extracted out of the node
				// Ensure that the node has the required format
				sText = aMsg[0].childNodes[0].nodeValue;
			} else {
				// Failure: It is probably an JSON
				var oModelJSON = new sap.ui.model.json.JSONModel();
				oModelJSON.setJSON(sXml);
				sText = oModelJSON.oData.error.message.value;
			}
		} catch (e) {
			// If an exception occurred (could be with IE9), we try to extract the message out of JSON.
			// If that fails, we use the whole response within the details.
			var oModelJSON = new sap.ui.model.json.JSONModel();
			oModelJSON.setJSON(sXml);
			// Ensure that the JSON has the required format
			if (oModelJSON.oData && oModelJSON.oData.error && oModelJSON.oData.error.message
					&& oModelJSON.oData.error.message.value) {
				sText += oModelJSON.oData.error.message.value;
			} else {
				sText = sXml;
			}
		}
		return sText;
	},

	/**
	 * This method extracts an error message out of a given array of HTTP response objects which contain a XML or JSON
	 * which has the error message within the section <message>
	 * 
	 * @memberOf Wave3CollaborationHelper
	 */
	extractErrorMsgFromBatchResponse : function(aErrorResponses) {
		var sErrorText = "";
		var sText = "";
		var oResponse = null;
		for ( var i = 0; i < aErrorResponses.length; i++) {
			if (i > 0) {
				sErrorText += "; ";
			}
			oResponse = aErrorResponses[i].response;
			sText = i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper.extractErrorMsgFromXml(oResponse.body);
			sErrorText += sText;
		}
		return sErrorText;
	}

};

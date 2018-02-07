/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.CommonConstants");

//"use strict";
/**
 * Default constructor<br>
 * 
 * @class This is a static class for constants
 * @constructor
 * @public
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants = {};

/**
 * constants for Events
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED = "i2d.pp.mrpcockpit.reuse.fragments.DialogChange";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_CHANNELID_CARD_PREVIEW = "i2d.pp.materialshortge.details.preview";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_CHANNELID_SOLCARD = "i2d.pp.materialshortge.details.solCard";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_CHANNELID_AOR_CHANGED = "i2d.pp.mrpcockpit.reuse.view.AoRHandler.AORChange";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_CHANNELID_CHANGE_REQUEST = "i2d.pp.changerequest.details.Changed";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_CHANNELID_CHANGE_REQUEST_STR = "i2d.pp.changerequest.details.ChangedSTR";

i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_PROCESSED = "processed";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_EXECUTE = "execute";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_SetToRequested = "setToRequested";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_RUN = "run";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_OK = "ok";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_CANCEL = "cancel";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_ERROR = "error";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_DIALOG_START = "dialogStart";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_DIALOG_CANCEL = "dialogCancel";

/**
 * constants for the solution cards
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_STATE_ENABLED = "01";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_STATE_DISABLED = "02";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_STATE_ACTIVE = "03";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_STATE_LOCKED = "04";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_STATE_CLICKED = "05";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_STATE_HIDDEN = "06";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_TYPE_ACCEPTED = "01";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_TYPE_REJECTED = "02";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_TYPE_PENDING = "03";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_TYPE_CANCELLED = "04";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_CATEGORY_ACCEPT = "01";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_CATEGORY_INCREASE = "02";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_CATEGORY_RESCHEDULE = "03";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_CATEGORY_CHANGE = "04";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_ICON_ACCEPT = "sap-icon://accept";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_ICON_ACCEPT_REMOVE = "sap-icon://accept";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_ICON_INCREASE = "sap-icon://BusinessSuiteInAppSymbols/icon-increase";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_ICON_RESCHEDULE = "sap-icon://BusinessSuiteInAppSymbols/icon-expedite";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_ICON_CHANGE = "sap-icon://edit";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_ICON_TRANSFER = "sap-icon://shipping-status";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_ICON_PROCURE = "sap-icon://cart-2";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_AREA_INSIDE = "OnCard";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_AREA_ICON = "OnIcon";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_AREA_EXECUTE = "OnExecute";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_AREA_OUTSIDE = "NotOnCard";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_AREA_SCROLLLEFT = "OnScrollLeft";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CARD_AREA_SCROLLRIGHT = "OnScrollRight";
/**
 * constants for MRP elements
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_ORDRES = "AR";
// Category - Purchase Requisition
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS = "BA";
// Category - Subcontractor Requirements of Material Provided
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SUBREQ = "BB";
// Category - PO Item
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_POITEM = "BE";
// Category - Process Order
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRCORD = "BR";
// Category - Production Order
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRDORD = "FE";
// Category - Maintenance Order
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PMORDR = "IH";
// Category - Shipping Notification
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SHPGNT = "LA";
// Category - SA Delivery Schedule Line
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SCHLNE = "LE";
// Category - Network Order
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_NTWORD = "NE";
// Category - Planned Order
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PLDORD = "PA";
// Category - Planned Independent Requirement
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_INDREQ = "PP";
// Category - Returns Item
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_RETURN = "RP";
// Category - Dependent Requirement
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_DEPREQ = "SB";
// Category - Stock Transfer Order
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_RELORD = "U1";
// Category - Release Order for a Stock Transfer Requisition
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRQREL = "U2";
//Category - Release Order for a Stock Transfer Requisition
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PLOREL = "U3";
// Category - Reservation in Another Plant
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STTRES = "UL";
// Category - Stock Transfer Reservation
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_TRNRES = "UR";
// Category - Order
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_CUSORD = "VC";
// Category - Plant Stock
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK = "WB";
// Business Partner Type - Supplier
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_SUPPLIER = "1";
// Business Partner Type - Customer
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_CUSTOMER = "2";
// Business Partner Type - IssuingLocation
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_ISSUINGLOC = "3";
// Business Partner Type - ReceivingLocation
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_RECEIVLOC = "4";

/**
 * constants for the MaterialShortageSolutionType
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_ACCEPT = "00";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_ACCEPT_REMOVE = "01";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_CREATE = "11";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_INCREASE = "12";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_RESCHEDULE = "13";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_CREATE = "14";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_INCREASE = "15";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_RESCHEDULE = "16";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_CREATE = "17";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_INCREASE = "18";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_RESCHEDULE = "19";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_CREATE = "20";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_INCREASE = "21";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_RESCHEDULE = "22";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_CHANGE = "23";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_CHANGE = "24";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_CHANGE = "25";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_CHANGE = "26";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_STOCK_CHANGE = "41";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_VENDOR_CHANGE = "42";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_UNSRC_CHANGE = "43";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_PLANT_CHANGE = "44";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_PROD_CHANGE = "45";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_REPLANT_CHANGE = "46";

/**
 * constants for the Solution Dialog Action
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_PO_CHANGE = "PO_CHANGE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_TO_CHANGE = "TO_CHANGE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_PO_CREATE = "PO_CREATE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_TO_CREATE = "TO_CREATE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_PR_CHANGE = "PR_CHANGE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_PR_CREATE = "PR_CREATE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_PR_CONVERT = "PR_CONVERT";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_TOR_CHANGE = "TOR_CHANGE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_TOR_CREATE = "TOR_CREATE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_TOR_CONVERT = "TOR_CONVERT";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_ACCEPT = "SHORTAGE_ACCEPT";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_PA_CHANGE = "PA_CHANGE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_PROD_CONVERT = "PROD_CONVERT";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_PROC_CONVERT = "PROC_CONVERT";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogAction_REQ_CONVERT = "REQ_CONVERT";


/**
 * constants for the Solution Dialog / Activity
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_EXECUTE = "01";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_CR_REQUEST = "02";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_CR_COLLECT = "03";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_PROD_CONVERT = "04";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_PROC_CONVERT = "05";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_REQ_CONVERT = "06";
/**
 * constants for Change Requests / SolutionRequestStatus
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_REQUESTED = "01";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_APPLIED = "02";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_DISCARDED = "03";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_ANSWERED = "04";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_COLLECTED = "05";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_CLOSED = "C1";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_ACTIVE = true;
i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_INACTIVE = false;

/**
 * constants for Change Requests / VendorResponseStatus
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_ACCEPTED = "01";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_REJECTED = "02";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_PROPOSED = "03";

/**
 * constants for Change Requests / Communication Channel
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.COMMUNICATION_CHANNEL_TEL = "01";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.COMMUNICATION_CHANNEL_MAIL_DIRECT = "02";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.COMMUNICATION_CHANNEL_MAIL_COLLECTIVE = "03";

/**
 * constants for CRUD / OData Operations
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_CREATE = "POST";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_READ = "GET";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_UPDATE = "MERGE";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.CRUD_DELETE = "DELETE";

/**
 * constants for OData / Entity Sets
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_CHANGEREQUEST = "/ChangeRequests";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_CHANGEREQUESTVENDOR = "/ChangeRequestVendors"; 
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_CHANGEREQUESTPROPOSAL = "/ChangeRequestProposals";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_ACCEPTSHORTAGE = "/AcceptedShortages";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_MM_PO_HEADER = "/MMPurchaseOrderHeaders";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_MM_PO_SCHEDLINE = "/MMPurchaseOrderScheduleLines";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_MM_PR_HEADER = "/MMPurchaseRequisitionHeaders";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_MM_PR_ITEM = "/MMPurchaseRequisitionItems";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ODATA_ENTITYSET_QUICKVIEWS = "/QuickViews";
/**
 * MasterList Status
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_SHORTAGE = 0;
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_ACCEPTED = 1;
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PENDING = 2;
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PROCESSED = 3;
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_NO_SHORTAGE = 4;

/**
 * Days of Supply Duration, i.e. how long lasts the current stock/supply
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.DAYS_OF_SUPPLY_NO_SHORTAGE = 999;

/**
 * Detail/Solution View
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE = "0"; // green
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_SAFETYSTOCK = "1"; // yellow
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_BELOWZERO = "2"; // red
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED = "6"; // grey

i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_S3 = "S3";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_S4 = "S4";

/**
 * Demand Types
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.DEMAND_TYPE_SALES_ORDER = "1";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.DEMAND_TYPE_TRANSPORT_ORDER = "2";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.DEMAND_TYPE_PRODUCTION_ORDER = "4";

/**
 * Constants for AoR
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.AOR_DEFINITION_CANCELED = "AOR_DEFINITION_CANCELED";
i2d.pp.mrpcockpit.reuse.util.CommonConstants.AOR_DEFINITION_FAILED = "AOR_DEFINITION_FAILED";

/**
 * Constants for Quick View Category
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT = {
	PRDORD : "031",
	ORDRES : "032",
	PRCORD : "033",
	PLANORD_STOCK : "041",
	PLANORD_VENDOR : "042",
	PLANORD_UNSRC : "043",
	PLANORD_PLANT : "044",
	PLANORD_PROD : "045",
	PLANORD_REPLANT : "046",
	CHANGE_PLANORD : "000",
	CONV_REQ : "100",
	CONV_PROD : "200",
	CONV_PROC : "300"
};

/**
 * ConstantsObject as MRP Element Category Model
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRPElementCategory = {
	MRP_ELEMENT_CATEGORY_ORDRES : "AR",
	// Category - Purchase Requisition
	MRP_ELEMENT_CATEGORY_PURRQS : "BA",
	// Category - Subcontractor Requirements of Material Provided
	MRP_ELEMENT_CATEGORY_SUBREQ : "BB",
	// Category - PO Item
	MRP_ELEMENT_CATEGORY_POITEM : "BE",
	// Category - Process Order
	MRP_ELEMENT_CATEGORY_PRCORD : "BR",
	// Category - Production Order
	MRP_ELEMENT_CATEGORY_PRDORD : "FE",
	// Category - Maintenance Order
	MRP_ELEMENT_CATEGORY_PMORDR : "IH",
	// Category - Shipping Notification
	MRP_ELEMENT_CATEGORY_SHPGNT : "LA",
	// Category - SA Delivery Schedule Line
	MRP_ELEMENT_CATEGORY_SCHLNE : "LE",
	// Category - Network Order
	MRP_ELEMENT_CATEGORY_NTWORD : "NE",
	// Category - Planned Order
	MRP_ELEMENT_CATEGORY_PLDORD : "PA",
	// Category - Planned Independent Requirement
	MRP_ELEMENT_CATEGORY_INDREQ : "PP",
	// Category - Returns Item
	MRP_ELEMENT_CATEGORY_RETURN : "RP",
	// Category - Dependent Requirement
	MRP_ELEMENT_CATEGORY_DEPREQ : "SB",
	// Category - Stock Transfer Order
	MRP_ELEMENT_CATEGORY_RELORD : "U1",
	// Category - Release Order for a Stock Transfer Requisition
	MRP_ELEMENT_CATEGORY_PRQREL : "U2",
	//Category - Release Order for a Stock Transfer Requisition
	MRP_ELEMENT_CATEGORY_PLOREL : "U3",
	// Category - Reservation in Another Plant
	MRP_ELEMENT_CATEGORY_STTRES : "UL",
	// Category - Stock Transfer Reservation
	MRP_ELEMENT_CATEGORY_TRNRES : "UR",
	// Category - Order
	MRP_ELEMENT_CATEGORY_CUSORD : "VC",
	// Category - Plant Stock
	MRP_ELEMENT_CATEGORY_STOCK : "WB"
};

/**
 * Constants for Routing
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ROUTING = {
	DETAIL : "MRPDetailRoute",
	SUB_DETAIL : "subDetail",
	SUB_DETAIL_WAVE3 : "subDetail_Wave3"
};

i2d.pp.mrpcockpit.reuse.util.CommonConstants.NavToCR = "MRPCockpitNavigation.540";

/**
 * Constants for View State
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_STATE_VALIDITY_TIME = 60;

/**
 * Constants for Model S backend check
 */
i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S = 99;
i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT = false;

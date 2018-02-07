/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.QuickViewHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");
/**
 * Helper for Quick Views <br>
 * 
 * Mapping Logic: <br>
 * 
 * 001 sales order <br>
 * 
 * 010 Purchase Order (Vendor) <br>
 * 011 Stock Transport Order (receiving plant) <br>
 * 012 Contract Release Order (supplying plant) <br>
 * 
 * 021 Purchase Requisition (Vendor) <br>
 * 022 Transfer Requisition (receiving Plant) <br>
 * 023 Transfer Requisition (supplying Plant) <br>
 * 024 Unsourced Requisition (w/o plant) <br>
 * 
 * 031 Production Order (Finished Products), PrdOrd <br>
 * 032 Production Order (Components) , OrdRes <br>
 * 033 Process Order (Finished Products & Components) , PrcOrd <br>
 * 
 * 041 Planned Order (Inhouse Production / Make-To-Stock) <br>
 * 042 Planned Order (External Procurement - Supplier) <br>
 * 043 Planned Order (External Procurement - Unsourced) <br>
 * 044 Planned Order (External Procurement - Stock Transfer Sender Side) <br>
 * 045 Planned Order (External Procurement - Component Requirement) <br>
 * 046 Planned Order (External Procurement - Stock Transfer Receiving Plant) <br>
 * 
 */
i2d.pp.mrpcockpit.reuse.util.QuickViewHelper = {

	_quickViewMetaData : {

		// Sales Order, VC
		"001" : {
			semanticObject : "SalesOrder",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : false,
			editFragment : "",
			solutionType : "",
			mrpElemParamName : "SalesOrder"
		},

		// Purchase Order, BE
		"010" : {
			semanticObject : "PurchaseOrder",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_CHANGE,
			mrpElemParamName : "PurchaseOrder"
		},

		// Stock Transport Order (from the perspective of a receiving plant), BE
		"011" : {
			semanticObject : "PurchaseOrder",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_CHANGE,
			mrpElemParamName : "PurchaseOrder"
		},

		// Contract Release Order (=Stock Transport Order (from the perspective of a supplying plant)), U1
		"012" : {
			semanticObject : "PurchaseOrder",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : false,
			editFragment : "",
			solutionType : "",
			mrpElemParamName : "PurchaseOrder"
		},

		// Purchase Requisition, BA
		"021" : {
			semanticObject : "PurchaseRequisition",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_CHANGE,
			mrpElemParamName : "PurchaseRequisition",
			mrpElemItemParamName : "PurchaseRequisitionItem",
			mrpElemItemValueLength : 5
		},

		// Stock Transport Requisition (from the perspective of a receiving plant), BA
		"022" : {
			semanticObject : "PurchaseRequisition",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_CHANGE,
			mrpElemParamName : "PurchaseRequisition",
			mrpElemItemParamName : "PurchaseRequisitionItem",
			mrpElemItemValueLength : 5
		},

		// Stock Transport Requisition (from the perspective of a supplying plant), U2
		"023" : {
			semanticObject : "PurchaseRequisition",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : false,
			editFragment : "",
			solutionType : "",
			mrpElemParamName : "PurchaseRequisition",
			mrpElemItemParamName : "PurchaseRequisitionItem",
			mrpElemItemValueLength : 5
		},

		// Unsourced Requisition (w/o plant), BA
		"024" : {
			semanticObject : "PurchaseRequisition",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_CHANGE,
			mrpElemParamName : "PurchaseRequisition",
			mrpElemItemParamName : "PurchaseRequisitionItem",
			mrpElemItemValueLength : 5
		},

		// Production Order (Finished Products), FE	
		"031" : {
			semanticObject : "ProductionOrder",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : false,
			editFragment : "",
			solutionType : "",
			mrpElemParamName : "ProductionOrder"
		},

		// Production Order (Components), AR
		"032" : {
			semanticObject : "ProductionOrder",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : false,
			editFragment : "",
			solutionType : "",
			mrpElemParamName : "ProductionOrder"
		},

		// Process Order (Finished Products & Components), BR		
		"033" : {
			semanticObject : "ProcessOrder",
			transactionAction : "display",
			factsheetAction : "displayFactSheet",
			editAllowed : false,
			editFragment : "",
			solutionType : "",
			mrpElemParamName : "ProcessOrder"
		},
		
		// Planned Order (Inhouse Production / Make-To-Stock), PA
		// TODO: Add the edit functionality
		"041" : {
			semanticObject : "PlannedOrder",
			transactionAction : "change",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_STOCK_CHANGE,
			mrpElemParamName : "PlannedOrder"
		},

		// Planned Order (External Procurement - Supplier), PA
		// TODO: Add the edit functionality
		"042" : {
			semanticObject : "PlannedOrder",
			transactionAction : "change",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_VENDOR_CHANGE,
			mrpElemParamName : "PlannedOrder"
		},

		// Planned Order (External Procurem. - Unsourced), PA
		// TODO: Add the edit functionality
		"043" : {
			semanticObject : "PlannedOrder",
			transactionAction : "change",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_UNSRC_CHANGE,
			mrpElemParamName : "PlannedOrder"
		},

		// Planned Order (External Procurement - Stock Transfer Sender Side), PA
		// TODO: Add the edit functionality
		"044" : {
			semanticObject : "PlannedOrder",
			transactionAction : "change",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_PLANT_CHANGE,
			mrpElemParamName : "PlannedOrder"
		},

		// Planned Order (External Procurement / Component Requirement), PA
		// TODO: Add the edit functionality
		"045" : {
			semanticObject : "PlannedOrder",
			transactionAction : "change",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_PROD_CHANGE,
			mrpElemParamName : "PlannedOrder"
		},		

		// Planned Order (External Procurement - Stock Transfer Receiving Plant), PA
		// TODO: Add the edit functionality
		"046" : {
			semanticObject : "PlannedOrder",
			transactionAction : "change",
			factsheetAction : "displayFactSheet",
			editAllowed : true,
			editFragment : "i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange",
			solutionType : i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_REPLANT_CHANGE,
			mrpElemParamName : "PlannedOrder"
		}
		
	},

	getQuickViewMetaData : function(quickViewCategory) {
		return this._quickViewMetaData[quickViewCategory];
	},

	/**
	 * Returns the name of the xml fragment which defines the internal structure and visual representation of the quick
	 * view instance (e.g. i2d.pp.mrpcockpit.reuse.fragments.SalesOrderQuickView")
	 * 
	 * @memberOf QV
	 */
	getQuickViewFragment : function(mrpElementCategory) {

		switch (mrpElementCategory) {

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_CUSORD :
				return "i2d.pp.mrpcockpit.reuse.fragments.SalesOrderQuickView";

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_POITEM :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_RELORD :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRQREL :
				return "i2d.pp.mrpcockpit.reuse.fragments.PurchaseOrderQuickView";

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRDORD :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRCORD :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_ORDRES :
				return "i2d.pp.mrpcockpit.reuse.fragments.ProductionOrderQuickView";

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PLDORD :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_DEPREQ :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PLOREL :
				return "i2d.pp.mrpcockpit.reuse.fragments.PlannedOrderQuickView";

			default :
				return undefined;
		}
	},

	/**
	 * Returns the name of the navigation target object, used for any object related navigation (such as the navigation to
	 * the fact sheet or to the backend navigation)
	 */
	getSemanticObject : function(quickViewCategory) {
		var metaData = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getQuickViewMetaData(quickViewCategory);
		if (metaData) {
			return metaData.semanticObject;
		} else {
			return undefined;
		}
	},

	/**
	 * Returns the name of the navigation action for the backend transaction (in most cases "display")
	 */
	getTransactionAction : function(quickViewCategory) {
		var metaData = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getQuickViewMetaData(quickViewCategory);
		if (metaData) {
			return metaData.transactionAction;
		} else {
			return undefined;
		}
	},

	/**
	 * Returns the name of the navigation action for the fact sheet (in most cases "displayFactSheet")
	 */
	getFactsheetAction : function(quickViewCategory) {
		var metaData = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getQuickViewMetaData(quickViewCategory);
		if (metaData) {
			return metaData.factsheetAction;
		} else {
			return undefined;
		}
	},

	/**
	 * Returns the navigation parameter object for factsheet navigation
	 */
	getNavigationParameter : function(quickViewCategory, mrpElement, mrpElementItem, plannedOrder) {
		var metaData = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getQuickViewMetaData(quickViewCategory);
		if (metaData) {
			var navigationParameter = {};
			if (metaData.mrpElemParamName) {
				// quick view category 045 -> mrpElement does not contain the planned order number
				if (quickViewCategory === "045"){ 
					navigationParameter[metaData.mrpElemParamName] = plannedOrder;
				}
				else {
				  navigationParameter[metaData.mrpElemParamName] = mrpElement;
			    }
		    }
			if (metaData.mrpElemItemParamName && mrpElementItem) {
				// Unfortunately we have to handle item numbers with different length
				// So if the length of the item number is specified we use only this number of characters
				if (metaData.mrpElemItemValueLength) {
					// Use the right-most metaData.mrpElemItemValueLength number of characters of the item number
					// remove leading characters if necessary
					navigationParameter[metaData.mrpElemItemParamName] = mrpElementItem.slice(-metaData.mrpElemItemValueLength);
				} else {
					navigationParameter[metaData.mrpElemItemParamName] = mrpElementItem;
				}
			}
			return navigationParameter;
		} else {
			return undefined;
		}
	},

	/**
	 * Returns true if the supplied MRPElementCategory has a QuickView and shall be therefore clickable to open this quick
	 * view
	 */
	isHyperlinkActive : function(mrpElementCategory, serviceSchemaVersion, SourceMRPElementCategory) {

		// if not provided, get the service schema version to check whether the backend does support QuickViews
		var iServiceSchemaVersion = serviceSchemaVersion;
		if (!iServiceSchemaVersion) {
			// prerequisite to get the versions model here is that the versions model is initialized (see onInit of s2.parent
			// using the interoperability helper) and that the versions model is bound to the view (done in S3.parent)
			iServiceSchemaVersion = this.getModel("ServiceVersions").getData().iServiceSchemaVersion;
		}
		switch (iServiceSchemaVersion) {
		 	  // in general the service schema version does support QuickViews, so it depends on the
			  // MRPElementCategory, if a QuickView shall be provided or not
			
			case 1 :// service schema version 1 (= wave 3) does not support QuickViews at all, therefore no QuickView link
				// shall be provided
				return false;
			
			case 2 :// service schema version 2 (= wave 5) not all QuickViews are already supported, therefore only the implemented 
			 // QuickView links shall be provided
				switch (mrpElementCategory) {
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_CUSORD :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_POITEM :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_RELORD :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRQREL :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRDORD :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PLDORD :
						return true;
					
					default :
						return false;
				}
				
			default :// service schema version 3 (= wave 7) all QuickViews are supported, therefore all QuickView links
				// shall be provided				

				switch (mrpElementCategory) {
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_CUSORD :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_POITEM :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_RELORD :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRQREL :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRDORD :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PLDORD :
						return true;

				// QuickView links below are new in wave 7	
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_ORDRES :
						if ((SourceMRPElementCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRDORD) ||
						    (SourceMRPElementCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRCORD)) {
							 return true;
						} else {
						   return false;
						};
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRCORD :						
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_DEPREQ :
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PLOREL :
						return true;

				  default :
						return false;
				}
		}
	},

	/**
	 * Returns true if the quick view shall provide a button to open a quick edit dialog
	 */
	isEditAllowed : function(quickViewCategory) {
		var metaData = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getQuickViewMetaData(quickViewCategory);
		if (metaData) {
			return metaData.editAllowed;
		} else {
			return false;
		}
	},

	/**
	 * Returns the xml fragment of the quick edit dialog
	 */
	getEditFragment : function(quickViewCategory) {
		var metaData = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getQuickViewMetaData(quickViewCategory);
		if (metaData) {
			return metaData.editFragment;
		} else {
			return undefined;
		}
	},

	/**
	 * Needed by the quick edit dialog to control which kind of change shall be executed (e.g change a purchase order,
	 * change a stock transport order, ...)
	 */
	getSolutionType : function(quickViewCategory) {
		var metaData = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getQuickViewMetaData(quickViewCategory);
		if (metaData) {
			return metaData.solutionType;
		} else {
			return undefined;
		}
	},

	/**
	 * Returns true (=visible) if the production plant is different to the own plant and therefore relevant for displaying
	 * 
	 * @param {string}
	 *          prodPlant - the production Plant
	 * @param {string}
	 *          mrpPlant - the own plant
	 */
	getProductionPlantVisible : function(prodPlant, mrpPlant) {
		return prodPlant !== mrpPlant ? true : false;
	},

	/**
	 * Returns the form title for the contact section of the planned order quick view
	 * 
	 * @param {string}
	 *          quickViewCategory - a planned order quick view category
	 */
	getPlannedOrderContactTitle : function(quickViewCategory) {
		// ONE CODE LINE >>>
		if (!i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
			// ONE CODE LINE <<<
			switch (quickViewCategory) {
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_STOCK :
					return this.getModel('Common_i18n').getResourceBundle().getText("INTERNAL_CONTACT");
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_VENDOR :
					return this.getModel('Common_i18n').getResourceBundle().getText("VENDOR_INFO");
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_UNSRC :
					return this.getModel('Common_i18n').getResourceBundle().getText("VENDOR_INFO");
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PLANT :
					return this.getModel('Common_i18n').getResourceBundle().getText("SUPPLYING_PLANT");
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PROD :
					return this.getModel('Common_i18n').getResourceBundle().getText("INTERNAL_CONTACT");
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_REPLANT :
					return this.getModel('Common_i18n').getResourceBundle().getText("RECEIVING_PLANT");				
		}
			// ONE CODE LINE >>>
		} else {
			var sI18nID, sSoHI18nID, sModSI18nID;
			switch (quickViewCategory) {
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_STOCK :
					sI18nID = "INTERNAL_CONTACT";
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_VENDOR :
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_UNSRC :
					sI18nID = "VENDOR_INFO";
					sSoHI18nID = sI18nID + "SoH";
					sModSI18nID = sI18nID + "ModS";
					if (this.getModel('ServiceVersions')) {
						sI18nID = i2d.pp.mrpcockpit.reuse.util.Helper.getSpecialTextForFieldInt({sI18nID : sI18nID, 
							sSoHI18nID : sSoHI18nID, sModSI18nID : sModSI18nID, 
							iServiceVersion : this.getModel('ServiceVersions').getData().iServiceSchemaVersion});
					}
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PLANT :
					sI18nID = "SUPPLYING_PLANT";
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PROD :
					sI18nID = "INTERNAL_CONTACT";
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_REPLANT :
					sI18nID = "RECEIVING_PLANT";
					break;
			}
			if (sI18nID) {
				return this.getModel('Common_i18n').getResourceBundle().getText(sI18nID);
			}
		}
		// ONE CODE LINE <<<
	},

	/**
	 * Returns the text provided in parameter text1 if the procurement type provided in quickViewCategory is "internal
	 * procurement" (quick view category Planned Order Make-to-stock)
	 */
	getTextByProcurementType : function(quickViewCategory, text1, text2) {
		return ((quickViewCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_STOCK) ||
		        (quickViewCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PROD))
				? text1
				: text2;
	},
	
	/**
	 * Returns the text provided in parameter text1 if the quickViewCategory is production order (PRDORD, ORDRES)
	 *  otherwise return text for process order (PRCORD)
	 */
	getTextProductionOrProcess : function(quickViewCategory, text1, text2) {
		return ((quickViewCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PRDORD) ||
            (quickViewCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.ORDRES))
				? text1
				: text2;
	},	

	/**
	 * Returns true if the quickViewCategory is equal to the required one
	 */
	getVisibilityByQuickViewType : function(quickViewCategory, requiredCategory1) {
		if ((quickViewCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_STOCK) ||
        (quickViewCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PROD)) {
				return true;
			} else {
				return false;
			}		
		},	

	/**
	 * Returns true if the quickViewCategory is NOT equal to the required one
	 */
	getVisibilityByNotQuickViewType : function(quickViewCategory, requiredCategory1) {
		if ((quickViewCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_STOCK) ||
        (quickViewCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PROD)) {
				return false;
			} else {
				return true;
			}		
		},
			
	/**
	 * Returns true if the given value is not initial and currentCategory equals to one of the given required categories
	 * 
	 * @param {any}
	 *          value1 - value to be checked for initial
	 * @param {string}
	 *          currentCategory - the currently used quick view category
	 * @param {string}
	 *          requiredCategory[1,2,3,4] - the quick view category for which the data field shall be visible ...
	 */
	matchCategoryAndHasValue : function(value1, currentCategory, requiredCategory1, requiredCategory2, requiredCategory3, requiredCategory4) {
		var hasValue = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(value1);
		return (hasValue && (currentCategory === requiredCategory1 || currentCategory === requiredCategory2 || currentCategory === requiredCategory3 || currentCategory === requiredCategory4));
	},

	/**
	 * Returns true if one of the given values is not initial and currentCategory equals to one of the given required
	 * categories
	 * 
	 * @param {any}
	 *          value1 - one of the values being part of the initial check
	 * @param {any}
	 *          value2 - one of the values being part of the initial check
	 * @param {string}
	 *          currentCategory - the currently used quick view category
	 * @param {string}
	 *          requiredCategory[1,2,3,4] - the quick view category for which the data field shall be visible ...
	 */
	matchCategoryAndHasValues : function(value1, value2, currentCategory, requiredCategory1, requiredCategory2,
			requiredCategory3, requiredCategory4) {
		var hasValue = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(value1, value2);
		return (hasValue && (currentCategory === requiredCategory1 || currentCategory === requiredCategory2 || currentCategory === requiredCategory3 || currentCategory === requiredCategory4));
	},

	/**
	 * Returns true if one of the given values is not initial and currentCategory equals to one of the given required
	 * categories
	 * 
	 * @param {any}
	 *          value1 - one of the values being part of the initial check
	 * @param {any}
	 *          value2 - one of the values being part of the initial check
	 * @param {any}
	 *          value3 - one of the values being part of the initial check
	 * @param {string}
	 *          currentCategory - the currently used quick view category
	 * @param {string}
	 *          requiredCategory[1,2,3,4] - the quick view category for which the data field shall be visible ...
	 */
	matchCategoryAndHasValues3 : function(value1, value2, value3, currentCategory, requiredCategory1, requiredCategory2,
			requiredCategory3, requiredCategory4) {
		var hasValue = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(value1, value2, value3);
		return (hasValue && (currentCategory === requiredCategory1 || currentCategory === requiredCategory2 || currentCategory === requiredCategory3 || currentCategory === requiredCategory4));
	},

	
	/**
	 * Returns true if one of the given values is not initial and currentCategory equals to one of the given required
	 * categories
	 * 
	 * @param {any}
	 *          value1 - one of the values being part of the initial check
	 * @param {any}
	 *          value2 - one of the values being part of the initial check
	 * @param {any}
	 *          value3 - one of the values being part of the initial check
	 @param {any}
	 *          value4 - one of the values being part of the initial check          
	 * @param {string}
	 *          currentCategory - the currently used quick view category
	 * @param {string}
	 *          requiredCategory[1,2,3,4] - the quick view category for which the data field shall be visible ...
	 */
	matchCategoryHasValues5 : function(value1, value2, value3, value4, quickViewCategory) {
	
		if ((value1 == null || value1 == "") ||
				(value2 == null || value2 == "") ||
				(value3 == null || value3 == "") || 
				(value4 == null || value4 == "") ||
			  (quickViewCategory == null || quickViewCategory == "")) {
			    return false; 
		};	
		
		switch (quickViewCategory) {
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PROD :
				if (value1 == 0 &&
						value2 == 0 &&
						value3 == 0 &&
						value4 == 0) {
					return false;
				} else {
					return true;
				}
		default :
			    return false;
		}
	},	
		
	/**
	 * Returns true if one of the given values is not initial and currentCategory equals to one of the given required
	 * categories
	 * 
	 * @param {any}
	 *          value1 - one of the values being part of the initial check
	 * @param {any}
	 *          value2 - one of the values being part of the initial check
	 * @param {any}
	 *          value3 - one of the values being part of the initial check
	 * @param {any}
	 *          value4 - one of the values being part of the initial check
	 * @param {string}
	 *          currentCategory - the currently used quick view category
	 * @param {string}
	 *          requiredCategory[1,2,3,4] - the quick view category for which the data field shall be visible ...
	 */
	matchCategoryHasValues4DiffPlants : function(value1, value2, value3, value4, currentCategory, requiredCategory1, requiredCategory2,
			requiredCategory3, requiredCategory4) {
	
		if   (value1 == null ||
				  value2 == null ||
				  value3 == null ||
				  value4 == null) {
			    return;
		};
		
		if (value3 === value4) {
			if ((value1 == 0) || (value1 == '') &&
					(value2 == 0) || (value2 == '') &&
					(value3 == 0) || (value3 == '') &&
					(value4 == 0) || (value4 == '')) {
				return (false && (currentCategory === requiredCategory1 || currentCategory === requiredCategory2 || currentCategory === requiredCategory3 || currentCategory === requiredCategory4));
			} 
				return (true  && (currentCategory === requiredCategory1 || currentCategory === requiredCategory2 || currentCategory === requiredCategory3 || currentCategory === requiredCategory4));

		} else if (value3 !== value4) {
			  return (true  && (currentCategory === requiredCategory1 || currentCategory === requiredCategory2 || currentCategory === requiredCategory3 || currentCategory === requiredCategory4));
		}
	},	
	
	/**
	 * Returns true for all values (also 0) and currentCategory equals to one of the given required categories
	 * 
	 * @param {any}
	 *          value1 - value to be checked
	 * @param {string}
	 *          currentCategory - the currently used quick view category
	 * @param {string}
	 *          requiredCategory[1,2,3,4] - the quick view category for which the data field shall be visible ...
	 */
	matchCategoryForEveryValue : function(value1, currentCategory, requiredCategory1, requiredCategory2,
			requiredCategory3, requiredCategory4) {
		var everyValue = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isValueGreaterEqualZero(value1);
		return (everyValue && (currentCategory === requiredCategory1 || currentCategory === requiredCategory2 || currentCategory === requiredCategory3 || currentCategory === requiredCategory4));
	},

	/**
	 * Returns true if the currentCategory equals to the given required category
	 * @param {any}
	 *          value1 - value to be checked
	 * @param {string}
	 *          quickViewCategory - the currently used quick view category
	 */
	matchCategoryUnsrc : function(value1, quickViewCategory) {
		if (quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_UNSRC) {
			return true;
		} else {
			return false;
		}
	},
	
	/**
	 * Returns true if the currentCategory equals to the given required category
	 * @param {any}
	 *          value1 - value to be checked
	 * @param {string}
	 *          quickViewCategory - the currently used quick view category
	 */
	matchCategoryVendor : function(value1, quickViewCategory) {
		if ((quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_VENDOR) ||
			 (quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_UNSRC)) {
			return true;
		} else {
			return false;
		}
	},	
	
	/**
	 * Returns true if the currentCategory equals to the given required category
	 * @param {any}
	 *          value1 - value to be checked
	 * @param {string}
	 *          quickViewCategory - the currently used quick view category
	 */
	matchCategoryProcurement : function(value1, quickViewCategory) {
		if ((quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_STOCK) ||
			 (quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PROD)) {
			return true;
		} else {
			return false;
		}
	},	
	
	/**
	 * Returns true if the currentCategory equals to the planned order category
	 * @param {any}
	 *          value1 - value to be checked
	 * @param {string}
	 *          quickViewCategory - the currently used quick view category
	 */
	matchCategoryPlanned : function(value1, quickViewCategory) {
		if ((quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_STOCK) ||
				(quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_VENDOR) ||
				(quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_UNSRC) ||
				(quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PLANT) ||
				(quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PROD) ||
				(quickViewCategory == i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_REPLANT)) {
			return true;
		} else {
			return false;
		}
	},	

	/**
	 * Returns true if value1 hasValue and value1 is NOT equal to value2
	 * @param {any}
	 *          value1 - value2 to be checked
	 */
	matchDifferentValue : function(value1, value2) {
		var hasValue = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(value1);
		return (hasValue && (value1 !== value2));
	},	
	
	// handle event also for projects without S3parent .extend
	handlePressDispoElementQuickView : function(evt, that) {

		// Save the control which raised the event. This is used in openBy of the popover.
		// The popover will be placed relative to this control.
		that._oSelectedMRPElementItem = evt.getSource();
		var oMrpElementData = that._oSelectedMRPElementItem.getBindingContext().getObject();

		// setup the quick View container if needed, it will hold a single quick view instance for each mrp element
		// category
		if (!that._oQuickViewContainer) {
			that._oQuickViewContainer = {};
		}

		// Determine the name of the view that has to be used for the current MRP element category
		var sViewName = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper
				.getQuickViewFragment(oMrpElementData.MRPElementCategory);

		var oQuickView = undefined;

		// Check if we already have an instance of the quick view
		if (!that._oQuickViewContainer[sViewName]) {

			// No view instance does exist, so create a new one
			oQuickView = sap.ui.xmlfragment(sViewName, that);
			// set ServiceVersion Model for using in popover
			oQuickView.setModel(that.oApplicationImplementation.getApplicationModel("ServiceVersions"),"ServiceVersions");
			// i18n model must be loaded before the actual data model.
			// Otherwise the formatters cannot access the resouce bundle when the first data is being processed.
			oQuickView.setModel(that.getView().getModel("Common_i18n"), "Common_i18n");
  		oQuickView.setModel(that.getView().getModel());

			// register the quick view as a separate model, this allows the xml views to pass the constants to
			// formatter methods
			var oQuickViewConstModel = new sap.ui.model.json.JSONModel(
					i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT);
			oQuickView.setModel(oQuickViewConstModel, "QuickViewConstantsModel");
			
			// MRP Element Category Model for usage as constants for formatter methods 
			var oMRPElementConstModel = new sap.ui.model.json.JSONModel(
					i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRPElementCategory);
			oQuickView.setModel(oMRPElementConstModel, "MRPElementConstantsModel");
			
		} else {
			// restore and reuse the instance which was previously instantiated for the same category
			oQuickView = that._oQuickViewContainer[sViewName];
		}

		var quickViewPath = "/QuickViews(";

		if (oMrpElementData.MRPElementCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_ORDRES) {
			quickViewPath += "MRPElementCategory='" + encodeURIComponent(oMrpElementData.SourceMRPElementCategory) + "',";
			quickViewPath += "MRPElement='" + encodeURIComponent(oMrpElementData.SourceMRPElement) + "',";
			quickViewPath += "MRPElementItem='" + encodeURIComponent(oMrpElementData.SourceMRPElementItem) + "',";
			quickViewPath += "MRPElementScheduleLine='" + encodeURIComponent(oMrpElementData.SourceMRPElementScheduleLine)
					+ "'";
		} else {
			quickViewPath += "MRPElementCategory='" + encodeURIComponent(oMrpElementData.MRPElementCategory) + "',";
			quickViewPath += "MRPElement='" + encodeURIComponent(oMrpElementData.MRPElement) + "',";
			quickViewPath += "MRPElementItem='" + encodeURIComponent(oMrpElementData.MRPElementItem) + "',";
			quickViewPath += "MRPElementScheduleLine='" + encodeURIComponent(oMrpElementData.MRPElementScheduleLine) + "'";
		}

		quickViewPath += ")";
		// Trigger the Odata call for the QuickView data
		oQuickView.bindElement(quickViewPath);

		// Save the view instance for later reuse
		// This is necessary to avoid duplicate ID errors that occur when a second instance of the same view is
		// created
		that._oQuickViewContainer[sViewName] = oQuickView;
		// The popover will be opened when the Odata call is finished, i.e. in _onModelLoaded.
	},

	/**
	 * Destroys all saved Quick View controls
	 */
	destroyQuickViews : function(that) {
		if (that._oQuickViewContainer) {
			for ( var i in that._oQuickViewContainer) {
				if (that._oQuickViewContainer[i]) {
					that._oQuickViewContainer[i].destroy();
					that._oQuickViewContainer[i] = undefined;
				}
			}
		}
	},

	/**
	 * 
	 * Returns true if at least one of the given text fields is not initial
	 * values: 'ProductionSupervisor', 'Vendor', 'BusinessPartnerPlant'
	 * VENDOR & UNSRC got own logic in ContactInformationQuickView.fragment
	 */
	matchCategoryValueInAnyField : function(value, value2, value3, quickViewCategory) {
		switch (quickViewCategory) {
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_STOCK :
				if (value == null || value == "") {
					return false;
				} else {
					return true;
				}
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_VENDOR :
				return false;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_UNSRC :
				return false;
/**			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_VENDOR :
				if (value2 == null || value2 == "") {
					return false;
				} else {
					return true;
				}
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_UNSRC :
				return true;
*/
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PLANT :
				if (value3 == null || value3 == "") {
					return false;
				} else {
					return true;
				}
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_PROD :
				if (value == null || value == "") {
					return false;
				} else {
					return true;
				}
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT.PLANORD_REPLANT :
				if (value3 == null || value3 == "") {
					return false;
				} else {
					return true;
				}
		}
	}

};

/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.CommonFormatter");
jQuery.sap.require("sap.ca.ui.model.format.DateFormat");
jQuery.sap.require("sap.ca.ui.model.format.NumberFormat");
jQuery.sap.require("sap.ca.ui.model.format.QuantityFormat");

i2d.pp.mrpcockpit.reuse.util.CommonFormatter = {

	/**
	 * hides the quantity if the shortage has status "Accepted" or "Processed"
	 * 
	 * @memberOf CommonFormatter
	 */
	hideQuantityBasedOnStatus : function(value, precision, statusCode) {
		// if status is "accepted" or "pending", shortage quantity shall not be
		// displayed
		switch (Number(statusCode)) {

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_ACCEPTED : // Accepted
				return "";

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PENDING : // Request
				// Pending
				if (value) {
					return sap.ca.ui.model.format.NumberFormat.getInstance({
						decimals : precision
					}).format(value);
				}
				return "";

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PROCESSED : // Processed
				return "";

			default :
				if (value === 0.000) {
					return "";
				} else if (value) {
					return sap.ca.ui.model.format.NumberFormat.getInstance({
						decimals : precision
					}).format(value);
				}
		}
	},

	/**
	 * Color formatting of different status
	 * 
	 * @memberOf CommonFormatter
	 */
	colorFormatObjectStatus : function(statusCode, supplyDuration, shortQuantity) {

		// identify no shortage until MASTER_LIST_STATUS_NO_SHORTAGE is provided from the backend
		if ((statusCode == "") && (supplyDuration == 0) && (shortQuantity == 0)) {
			// No shortage
			return sap.ui.core.ValueState.Success;
		}

		switch (Number(statusCode)) {
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_SHORTAGE :
				// Shortage
				return sap.ui.core.ValueState.None;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_ACCEPTED :
				// Accepted
				return sap.ui.core.ValueState.Success;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PENDING :
				// Request Pending
				return sap.ui.core.ValueState.None;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PROCESSED :
				// Processed
				return sap.ui.core.ValueState.Success;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_NO_SHORTAGE :
				// No shortage
				return sap.ui.core.ValueState.Success;
			default :
				return sap.ui.core.ValueState.None;
		}
	},

	// returns the icons indicating the status of a request
	requestStatusIcon : function(requestStatus) {
		// We want to display just the pending status in the supply demand item list
		if (requestStatus === i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_PENDING) {
			return "sap-icon://pending";
		} else {
			return "";
		}
	},

	// returns the icons indicating the status of a request on the solution view
	requestStatusIconSolView : function(requestStatus, catID, quantity) {
		// If the MRP Element is the plant stock, or the values is negative we don't
		// display the status
		// if (catID === "WB" || (quantity < 0)) {
		if (catID === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK || (quantity < 0)) {
			return "";
		} else {
			return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.requestStatusIcon(requestStatus);
		}
	},

	/**
	 * This method decides whether to show the notes on the solution dialog or not based on the current status of the
	 * change request. Used in solution dialog to show the note-area
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	getSolutionDialogNotesVisible : function(iDialogActivity) {
		if (iDialogActivity === i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_EXECUTE) {
			return false;
		} else {
			return true;
		}
	},

	/**
	 * This method decides whether to show the icon in the S3/S4 Supply Demand Items section based on the status of the
	 * Change Request
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	getChangeRequestVisibility : function(requestStatus, catID, quantity) {
		if (requestStatus === i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_REQUESTED
				|| requestStatus === i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_ANSWERED
				|| requestStatus === i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_COLLECTED) {
			return true;
		} else {
			return false;
		}
	},

	/**
	 * This method determines the tooltip for the Change Request Icon that is shown on the S4 screen in the area of the
	 * supply demand items. Important: This method also sets CCS classes that are responsible for the color of the icon.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	getChangeRequestTooltip : function(iRequestStatus, iVendorResponse) {
		if (iRequestStatus === i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_REQUESTED) {
			this.addStyleClass("sapMRPIconNormal");
			return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_CREATED");
		} else if (iRequestStatus === i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_COLLECTED) {
			this.addStyleClass("sapMRPIconNormal");
			return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_COLLECTED");
		} else if (iRequestStatus === i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_ANSWERED) {
			switch (iVendorResponse) {
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_ACCEPTED :
					this.addStyleClass("sapMRPIconGreen");
					return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_ACCEPTED");
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_REJECTED :
					this.addStyleClass("sapMRPIconRed");
					return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_REJECTED");
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_PROPOSED :
					this.addStyleClass("sapMRPIconOrange");
					// ONE CODE LINE : NO TOOLTIP!>>> NO oController, no aDiffFieldText, so do the uncool version
					if (i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
						if (this.getModel('ServiceVersions')) {
							var sI18nID = i2d.pp.mrpcockpit.reuse.util.Helper.getSpecialTextForFieldInt({sI18nID : "REQUEST_STATUS_TOOLTIP_PROPOSED", 
								sSoHI18nID : "REQUEST_STATUS_TOOLTIP_PROPOSEDSoH", sModSI18nID : "REQUEST_STATUS_TOOLTIP_PROPOSEDModS", 
								iServiceVersion : this.getModel('ServiceVersions').getData().iServiceSchemaVersion});
							return this.getModel('Common_i18n').getResourceBundle().getText(sI18nID);
						}
					}
					// ONE CODE LINE <<<
					return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_PROPOSED");
				default :
					this.addStyleClass("sapMRPIconNormal");
					return this.getModel('Common_i18n').getResourceBundle().getText("CARD_TIT_UNKNOWN");
			}
		} else {
			this.addStyleClass("sapMRPIconNormal");
			return "";
		}
	},

	/**
	 * This method returns the icons indicating - firm requisition - released production order - partially delivered Used
	 * in S3 Supply Demand Items
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	flagIconSrc : function(isFirm, isReleased, isPartiallyDelivered) {
		if (isFirm) {
			return "sap-icon://locked";

			// When isPartiallyDelivered is true, isReleased is always true as well
			// because status "released" is prerequisite for "partially delivered",
			// but we want to display only "partially delivered". So isPartiallyDdelivered
			// has to be checked before isReleased is checked.
		} else if (isPartiallyDelivered) {
			return "sap-icon://BusinessSuiteInAppSymbols/icon-partially-delivered";

		} else if (isReleased) {
			return "sap-icon://BusinessSuiteInAppSymbols/icon-approved";

		} else {
			return "";
		}
	},

	/**
	 * This method decides whether the icon shall be visible. If one of the bound fields is true, the icon shall be
	 * visible
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	flagIconVisible : function(isFirm, isReleased, isPartiallyDelivered) {
		if (isFirm) {
			return true;
		} else if (isPartiallyDelivered) {
			return true;
		} else if (isReleased) {
			return true;
		} else {
			return false;
		}
	},

	/**
	 * This method returns a tooltip for the icons indicating - firm requisition - released production order - partially
	 * delivered
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	flagIconTooltip : function(isFirm, isReleased, isPartiallyDelivered, context) {
		if (!context) {
			context = this;
		}
		if (isFirm) {
			return context.getModel('Common_i18n').getResourceBundle().getText("IS_FIRM");

			// When isPartiallyDelivered is true, isReleased is always true as well
			// because status "released" is prerequisite for "partially delivered",
			// but we want to display only "partially delivered". So isPartiallyDdelivered
			// has to be checked before isReleased is checked.
		} else if (isPartiallyDelivered) {
			return context.getModel('Common_i18n').getResourceBundle().getText("IS_PARTIALLY_DELIVERED");
		} else if (isReleased) {
			return context.getModel('Common_i18n').getResourceBundle().getText("IS_RELEASED");
		} else {
			return "";
		}
	},

	/**
	 * This method returns the icons indicating - firm requisition - released production order - partially delivered Used
	 * in S4 Solution View
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	flagIconSolView : function(isFirm, isReleased, isPartiallyDelivered, catID, quantity) {
		// If the MRP Element is the plant stock, or the values is negative we don't
		// display the flags
		if (catID === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK || (quantity < 0)) {
			return "";
		} else {
			return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconSrc(isFirm, isReleased, isPartiallyDelivered);
		}
	},

	/**
	 * This method decides whether the icon shall be visible Used in S4 Solution View
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	flagIconSolViewVisible : function(isFirm, isReleased, isPartiallyDelivered, catID, quantity) {
		if (catID === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK || (quantity < 0)) {
			return false;
		} else {
			return true;
		}
	},

	/**
	 * This method returns a tooltip for the icons indicating - firm requisition - released production order - partially
	 * delivered
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	flagIconSolViewTooltip : function(isFirm, isReleased, isPartiallyDelivered, catID, quantity) {
		// If the MRP Element is the plant stock, or the values is negative we don't
		// display the flags
		if (catID === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK || (quantity < 0)) {
			return "";
		} else {
			return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconTooltip(isFirm, isReleased, isPartiallyDelivered,
					this);
		}
	},

	// returns the icon indicating a supply or a demand in the table
	// based on a positive or negative quantity.
	sditemicon : function(quantity, catID) {
		if ((Number(quantity) == 0) || i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(catID)) {
			return "sap-icon://BusinessSuiteInAppSymbols/icon-current-stock";
		}
		if (Number(quantity) < 0) {
			return "sap-icon://down";
		} else {
			return "sap-icon://up";
		}
	},

	// returns the tooltip indicating a supply or a demand in the table
	// based on a positive or negative quantity.
	sditemtooltip : function(quantity, catID) {
		if ((Number(quantity) == 0) || i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(catID)) {
			return this.getModel('Common_i18n').getResourceBundle().getText("XTOL_CURRENT_STOCK");
		}
		if (Number(quantity) < 0) {
			return this.getModel('Common_i18n').getResourceBundle().getText("XTOL_REQIREMENT_QTY");
		} else {
			return this.getModel('Common_i18n').getResourceBundle().getText("XTOL_RECEIPT_QTY");
		}
	},

	// returns a shortage indication (true or false) based on a given value
	// at the moment value 0 defines the shortage
	isShortage : function(value) {
		if (value < 0) {
			return true;
		} else {
			return false;
		}
	},

	// TODO: clarify concatenating in that way is allowed
	// returns relevant information about the mrp element dependendent on the MRP element category
	categoryLongName : function(catID, catName, name, item, documentType, sourceCatID, sourceName, sourceItem) {

		switch (catID) {

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_INDREQ : // Planned Idependent
				// Requirements
				return catName + " " + documentType;

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SUBREQ : // Subcontractor
				// requirements of
				// material provided
				if (!sourceItem) {
					return catName + " " + sourceName + " (" + sourceCatID + ")";
				} else {
					return catName + " " + sourceName + "-" + sourceItem + " (" + sourceCatID + ")";
				}
				break;

//			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_DEPREQ : // Dependent requirement
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_ORDRES :// Dependent reservation
				return catName + " " + sourceName;

			default : // all other MRP element categories
				if (!item) {
					return catName + " " + name;
				} else {
					return catName + " " + name + "-" + item;
				}
		}

	},

	/**
	 * Defines a separate CSS class for Supply/Demand arrow icons in S3 and S4 views
	 * 
	 */
	sdIconState : function(value, catID) {

		if ((Number(value) == 0) || i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(catID)) {
			return sap.ui.core.ValueState.None;
		}
		if (Number(value) > 0) {
			return sap.ui.core.ValueState.Success;
		} else {
			return sap.ui.core.ValueState.Error;
		}

	},		
	
	/**
	 * Returns an HTML "mailto:" link for the given mail address
	 */
	email : function(value) {
		return "mailto:" + value;
	},

	/**
	 * Returns an HTML "tel:" link for the given number. Special characters are removed if needed
	 */
	tel : function(value) {
		if (value) {
			value = value.replace(/[\s\-\[\]\/\{\}\(\)\*\?\.\\\^\$\|]/g, "");
			return "tel:" + value;
		}
		return value;
	},

	getVendorOrPlantLabel : function(solutionType) {
		switch (solutionType) {
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_CREATE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_INCREASE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_RESCHEDULE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_CREATE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_INCREASE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_RESCHEDULE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_CHANGE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_CHANGE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_VENDOR_CHANGE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_UNSRC_CHANGE :
				return this.getModel('Common_i18n').getResourceBundle().getText("VENDOR");
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_CREATE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_INCREASE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_RESCHEDULE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_CREATE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_INCREASE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_RESCHEDULE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_CHANGE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_CHANGE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_PLANT_CHANGE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_REPLANT_CHANGE :
				return this.getModel('Common_i18n').getResourceBundle().getText("PLANT");
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_STOCK_CHANGE :
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_PROD_CHANGE :
				return this.getModel('Common_i18n').getResourceBundle().getText("PRODUCTION_SUPERVISOR");
		}
	},

	getVendorOrPlantName : function(plantID, name) {
		if (plantID) {
			if (name) {
				return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_PARENTHESIS", [plantID, name]);
			} else {
				return plantID;
			}
		} else if (name) {
			return name;
		} else {
			return this.getModel('Common_i18n').getResourceBundle().getText("NOT_YET_DETERMINED");
		}
	},

	quantity : function(quantity, precision) {
		var value = Math.abs(quantity);
		return sap.ca.ui.model.format.NumberFormat.getInstance({
			decimals : precision
		}).format(value);

	},

	stockQuantity : function(quantity, precision) {
		var quant = Number(quantity);
		return sap.ca.ui.model.format.NumberFormat.getInstance({
			decimals : precision
		}).format(quant);
	},

	stockQuantitySolView : function(quantity, precision, unit) {
		var quant = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.stockQuantity(quantity, precision);

		return quant + " " + unit;
	},

	/**
	 * Returns true if the supplied MRPElementCategory is a purchase requisition or a stock transfer requisition
	 */
	isRequisition : function(catID) {
		if ((catID == i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS)
				|| (catID == i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRQREL)) {
			return true;
		}
		return false;

	},

	/**
	 * Returns true if the supplied MRPElementCategory is not a purchase requisition or a stock transfer requisition
	 */
	isNoRequisition : function(catID) {
		return !i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isRequisition(catID);
	},

	/**
	 * Returns true if an MRPElementCategory is no stock category
	 */
	isSupplyDemandItem : function(catID) {
		return !i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(catID);
	},

	// Returns true if an MRPElementCategory is a stock category
	isStockItem : function(catID) {
		return (catID === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK);
	},

	hideStockDate : function(catID, date) {
		if (date && !i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(catID)) {
			return date.toLocaleDateString();
		} else {
			return "";
		};
	},

	/**
	 * Merging Key for the Available Quantity. Category, Date and Quantity needs to be considered
	 */
	availableQuantityMergingKey : function(catID, date, quantity) {
		if (catID === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK) {
			return catID + date + quantity;
		}
		return date + quantity;
	},

	/**
	 * Refactoring for new Stock control
	 * 
	 * @author Vladimir (please keep it for a while)
	 */
	/*
	 * getStockClass : function (catID, mrpAvailability) { var className = "sapMRPStockHiddenBtn"; if (catID === "WB" ||
	 * mrpAvailability === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE) { className =
	 * "sapMRPStockHiddenBtn"; } return className; },
	 */

	// converts begin and end date into one string
	dateTo : function(dateBegin, dateEnd) {

		var dateBeginTxt = (new sap.ca.ui.model.type.Date()).oOutputFormat.format(dateBegin, {
			style : 'medium'
		});
		var dateEndTxt = (new sap.ca.ui.model.type.Date()).oOutputFormat.format(dateEnd, {
			style : 'medium'
		});

		return this.getModel('Common_i18n').getResourceBundle().getText("DATE_TO", [dateBeginTxt, dateEndTxt]);

	},

	vendorOrReq : function(requirementCounter, catID, name, type, businessPartnerID, documentType, assembly, safetyStock,
			precision, unit) {
		if (Number(requirementCounter) > 0) {
			return "";
		} else {
			return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getBusinessPartnerName(catID, name, type, businessPartnerID,
					documentType, assembly, safetyStock, precision, unit, this);
		}

	},

	/**
	 * Returns a combination of the supplied value and the suffix 'day(s)' If the supplied value is empty, the returned
	 * combination is also empty
	 */
	formatDayValue : function(dayValue) {

		if (dayValue && (dayValue == 1)) {
			return this.getModel('Common_i18n').getResourceBundle().getText("ONE_DAY");
		} else if (dayValue && (dayValue > 1)) {
			return this.getModel('Common_i18n').getResourceBundle().getText("DAYS", [dayValue]);
		} else {
			return "";
		}
	},

	/**
	 * Returns 'No' for Boolean.FALSE or empty value <br>
	 * Returns YES' in any other case
	 */
	formatBooleanValue : function(booleanValue, context) {
		if (!context) {
			context = this;
		}
		if (booleanValue) {
			return context.getModel('Common_i18n').getResourceBundle().getText("YES_TEXT");
		} else {
			return context.getModel('Common_i18n').getResourceBundle().getText("NO_TEXT");
		}
	},

	getRequirements : function(reqCount, catID, catName, name, item, documentType, sourceCatID, sourceName, sourceItem) {

		if (Number(reqCount) > 0) {
			return this.getModel('Common_i18n').getResourceBundle().getText("REQUIREMENT_COUNT", [reqCount]);
		}

		return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.categoryLongName(catID, catName, name, item, documentType,
				sourceCatID, sourceName, sourceItem);

	},

	// returns the business partner information dependent on the MRP element category
	getBusinessPartnerName : function(catID, name, type, businessPartnerID, documentType, assembly, safetyStock,
			precision, unit, context) {
		if (!context) {
			context = this;
		}
		var unsourcedTxt = context.getModel('Common_i18n').getResourceBundle().getText("UNSOURCED");
		var plantLong = context.getModel('Common_i18n').getResourceBundle()
				.getText("PLANT_LONG", [businessPartnerID, name]);

		var formattedQuantity = 0;

		switch (catID) {

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK : // stock
				if (Number(safetyStock) > 0) {
					formattedQuantity = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.stockQuantity(safetyStock, precision);
					return context.getModel('Common_i18n').getResourceBundle().getText("SAFETY_STOCK", [formattedQuantity, unit]);
				} else {
					return context.getModel('Common_i18n').getResourceBundle().getText("NO_SAFETY_STOCK");
				}
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS : // purchase requisition
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_POITEM : // purchase order
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SHPGNT : // shipping notification
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SCHLNE : // SA delivery schedule
				// line
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_RETURN : // returns item
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STTRES : // reservation in another
				// plant
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_TRNRES : // stock transfer
				// reservation
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_RELORD : // stock transfer order
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRQREL : // stock Transfer
				// requisition
				if (type === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_SUPPLIER
						|| type === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_CUSTOMER) {
					// in case business partner is a supplier or customer, return only the name of the business partner
					return name;
				} else if (type === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_ISSUINGLOC
						|| type === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_RECEIVLOC) {
					// in case the business partner is a plant, return plant id and plant name formatted
					return plantLong;
				} else {
					// if no business partner is provided, return unsourced text
					return unsourcedTxt;
				}
				break;

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_CUSORD : // sales order
				if (!name) {
					return unsourcedTxt;
				} else {
					return name;
				}
				break;

			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRCORD : // process order
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRDORD : // production order
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PMORDR : // maintenance order
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_NTWORD : // network order
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PLDORD : // planned order
				return documentType;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SUBREQ : // Subcontractor
				// requirements of
				// material provided
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_DEPREQ : // Dependent requirement
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_ORDRES : // Dependent reservation
				return assembly;
			default : // all other MRP element categories
				return "";
		}

	},

	/**
	 * Returns true if at least one of the given arguments is not initial <br>
	 * Returns false if all given arguments are initial, strings representing an empty quantity (e.g. "0.000") are also
	 * considered as initial
	 */
	hasValue : function() {

		// "a", true
		// "0.5", true
		// -5, true
		// "2014-10-01T12:00:00", true
		// "+497544970", true

		// "", false
		// " ", false
		// 0, false
		// "0.000", false

		for ( var i in arguments) {
			if (arguments[i] && !(/^\s*$/.test(arguments[i])) && (Number(arguments[i]) !== 0)) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Returns true if both given arguments are not initial <br>
	 * Returns false if at least one of the given arguments is initial <br>
	 * Strings representing an empty quantity (e.g. "0.000") are also considered as initial
	 */
	hasValueAll : function(value, value2) {

		// "", false
		// " ", false
		// 0, false
		// "0.000", false
		if ((!value || /^\s*$/.test(value) || (Number(value) == 0))
				|| (!value2 || /^\s*$/.test(value2) || (Number(value2) == 0))) {
			return false;
		}
		// "a", true
		// "0.5", true
		// -5, true
		// "2014-10-01T12:00:00", true
		// "+497544970", true
		return true;
	},

	/**
	 * Returns true if the first given argument is not initial and the second argument is initial<br>
	 * Returns false in all other cases <br>
	 * Strings representing an empty quantity (e.g. "0.000") are also considered as initial
	 */
	hasFirstValueOnly : function(value, value2) {

		// "", false
		// " ", false
		// 0, false
		// "0.000", false
		if (((value && !/^\s*$/.test(value)) || (Number(value) != 0))
				&& (!value2 || /^\s*$/.test(value2) || (Number(value2) == 0))) {
			return true;
		}
		// "a", true
		// "0.5", true
		// -5, true
		// "2014-10-01T12:00:00", true
		// "+497544970", true
		return false;
	},

	/**
	 * Color formatting of object number (detailed view)
	 * 
	 * @memberOf CommonFormatter
	 */
	colorFormatStockStatus : function(statusCode) {

		// Switch Button Coloring
		switch (statusCode) {
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE : // grey
				// no Button!
				return sap.ui.core.ValueState.None;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_SAFETYSTOCK : // yellow
				return sap.ui.core.ValueState.Warning;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_BELOWZERO : // red
				return sap.ui.core.ValueState.Error;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED : // grey
				return sap.ui.core.ValueState.None;
			default :
				return sap.ui.core.ValueState.None;
		}

	},

	/**
	 * line Break for status Text
	 * 
	 * @memberOf CommonFormatter
	 */
	formatLineBreak : function(sText) {
		if (sText) {
			var aArr = sText.split(" ");
			var slineBreak = aArr[0] + "\n" + aArr.slice(1).join(" ");
			return slineBreak;
		} else {
			return "";
		}
	},

	/**
	 * Returns the merging key for the available quantity. The MRP elements shall be grouped by date and id, so these two
	 * attributes are concatenated and returned as merging key. In order to avoid that the stock line is merged, we return
	 * a different merging key for the stock line
	 */
	// getMergingKeyStock : function(catID, date, quantity) {
	// if (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(catID)) {
	// return catID;
	// } else {
	// return date + "-" + quantity;
	// }
	// },
	/**
	 * refactor: haven'tfind the way how to use scaffolding formatter directly in XML that's why the wrapper here
	 * 
	 * @author: d046669
	 */

	numberFormat : function(number, decimals) {
		return sap.ca.ui.model.format.NumberFormat.getInstance({
			decimals : decimals
		}).format(number);
	},

	numberWithNoLeadingZeros : function(number) {
		if (number && typeof (number) === "string") {
			return number.replace(/^0*((?:[1-9]\d*)|0)$/, "$1");
		} else {
			return number;
		}
	},

	formatDateShort : function(dDate) {
		if (dDate) {
			return sap.ca.ui.model.format.DateFormat.getDateInstance({
				style : "short"}).format(dDate);
		};
		return "";
	},

	formatQuantity : function(value, precision, unit) {
		if (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(value)) {
			if (unit) {
				var sFormattedValue = sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(value, unit, precision);
				return sFormattedValue + " " + unit;
			};
			return value;
		};
		return "";
	},
	
	/**
	 * Tries to format the quantity and returns the value multiplied with -1 
	 */
	formatQuantityMultiplyMinusOne : function(value, precision, unit) {
		if (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(value)) {
						if (unit) {
				var sFormattedValue = sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(value, unit, precision);
				var multipliedValue = sFormattedValue * (-1);
				return multipliedValue + " " + unit;
			};
			var multipliedValue = sFormattedValue * (-1);
			return multipliedValue;
		};
		return false;
	},

	formatQuantityWithSign : function(value, precision, unit) {
		if (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(value)) {
			if (unit) {
				var sFormattedValue = sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(value, unit, precision);
				if (value > 0){
					return "+" + sFormattedValue + " " + unit;
					} else {
						return sFormattedValue + " " + unit;
				};
			};
			if (value > 0){
				return "+" + value;
				} else {
					return value;
			};
		};
		return "";
	},

	/**
	 * Returns a string of the form {minValue} {unit} / {mavValue} {unit}
	 * 
	 */
	formatMinMaxQuantity : function(minValue, maxValue, precision, unit) {
		// Format the values according to the precision and concatenate the unit
		var minValueFormatted = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.formatQuantity(minValue, precision, unit);
		var maxValueFormatted = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.formatQuantity(maxValue, precision, unit);

		// Finally concatenate both values separated by /
		// Note: Even when one value is initial we want to return the "/". Otherwise the user could not
		// recognize if the value is the min or the max value.
		// NEW --> if both values are empty - no / should be shown
		if (((minValue == 0) || (minValue == null)) && ((maxValue == 0) || (maxValue == null))) {
			return "";
		} else if ((((minValue == 0) || (minValue == null)) && ((maxValue > 0) || (maxValue > null))) ||
		          (((minValue > 0) || (minValue > null)) && ((maxValue == 0) || (maxValue = null)))) {
		      	return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_BLANK", 
		      		[minValueFormatted, maxValueFormatted]);
		       } else {
		        return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_SLASH",
			      	[minValueFormatted, maxValueFormatted]);
		};
	},

	formatRatioInPct : function(value, precision) {
		if ((value != null) && (precision != null)) {
			var sFormattedValue = sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(value, precision);
			return sFormattedValue + " " + "%";
		};
		return value + " " + "%";
	},

	formatTitle : function(title, text) {
		if ((title === null) || (title === "")) {
			return text;
		} else {
			return title;
		};

	},

	formatText : function(title, text) {
		if ((title === null) || (title === "")) {
			return null;
		} else {
			return text;
		};
	},

	/**
	 * Returns true (visible) for desktop device <BR>
	 * Returns false (hidden) for mobile devices
	 */
	visibleOnlyOnDesktop : function() {
		if (sap.ui.Device.system.desktop) {
			return true;
		} else {
			return false;
		}
	},

	/**
	 * Returns e.g. "Partial delivery allowed (9 times)" if both parameters are supplied <br>
	 * Returns e.g. "Only complete delivery allowed" if only the first parameter is supplied
	 */
	getPartialDelivery : function(partialDeliveryStatus, numberOfPartialDeliveries) {
		if (partialDeliveryStatus && numberOfPartialDeliveries) {
			return this.getModel('Common_i18n').getResourceBundle().getText("PARTIAL_DELIVERY",
					[partialDeliveryStatus, numberOfPartialDeliveries]);
		} else if (partialDeliveryStatus && !numberOfPartialDeliveries) {
			return partialDeliveryStatus;
		} else {
			return "";
		}
	},

	/**
	 * Returns a combination of <code>mainString</code> and <code>additionalString</code> with
	 * <code>additionalString</code> in parenthesis <br>
	 * i.e. mainString (additionalString)
	 */
	getTextPairWithParenthesis : function(mainString, additionalString, context) {
		if (!context) {
			context = this;
		}
		if (mainString && additionalString) {
			return context.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_PARENTHESIS",
					[mainString, additionalString]);
		} else if (mainString && !additionalString) {
			return mainString;
		} else if (!mainString && additionalString) {
			return additionalString;
		} else {
			return "";
		}
	},

	/**
	 * Returns a combination of <code>firstString</code> and <code>secondString</code> separated by a "Dash" <br>
	 * i.e. firstString - secondString <br>
	 * If one string is not supplied, only the other w/o a separator is displayed, e.g. "secondString"
	 */
	getTextPairWithDash : function(mainString, additionalString) {
		if (mainString && additionalString) {
			return this.getModel('Common_i18n').getResourceBundle()
					.getText("TUPEL_WITH_DASH", [mainString, additionalString]);
		} else if (mainString) {
			return mainString;
		} else if (additionalString) {
			return additionalString;
		} else {
			return "";
		}
	},

	/**
	 * Returns a combination of <code>firstString</code> and <code>secondString</code> separated by a "Slash" <br>
	 * i.e. firstString / secondString <br>
	 * If one string is not supplied, only the other w/o a separator is displayed, e.g. "secondString"
	 */
	getTextPairWithSlash : function(firstString, secondString) {
		if (firstString && secondString) {
			return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_SLASH", [firstString, secondString]);
		} else if (firstString) {
			return firstString;
		} else if (secondString) {
			return secondString;
		} else {
			return "";

		}
	},

	/**
	 * Converts both given strings into Boolean values and returns these strings separated by a "Slash" <br>
	 * i.e. No / Yes <br>
	 */
	getBooleanPairWithSlash : function(firstString, secondString) {
		firstString = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.formatBooleanValue(firstString, this);
		secondString = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.formatBooleanValue(secondString, this);
		return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_SLASH", [firstString, secondString]);
	},

	/**
	 * Returns one out of two texts depending on the boolean value of the first parameter
	 */
	getAlternativeText : function(bSelect, sText1, sText2, sText1SoH, sText2SoH, sText1ModS, sText2ModS) {
		// ONE CODE LINE >>>
		if (i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
			var sI18nID, sI18nIDSoH, sI18nIDModS;
			if (bSelect) {
				sI18nID = sText1; 
				sI18nIDSoH = (sText1SoH) ? sText1SoH : sI18nID;
				sI18nIDModS =  (sText1ModS) ? sText1ModS : sI18nID;
			} else {
				sI18nID = sText2;
				sI18nIDSoH = (sText2SoH) ? sText2SoH : sI18nID;
				sI18nIDModS =  (sText2ModS) ? sText2ModS : sI18nID;
			}
			
			if (!this.getModel('ServiceVersions')) {
				return sI18nID;
			}	else if (this.getModel('ServiceVersions').getData().iServiceSchemaVersion === i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S) {
		    return sI18nIDModS;
		  } else {
		    return sI18nIDSoH;
		  }
		}
		// ONE CODE LINE <<<
		return (bSelect) ? sText1 : sText2;
	},

	/**
	 * Returns one out of 3 texts depending on the boolean value of the first two parameters
	 */
	getTextOutOf3Alternatives : function(bSelect1, bSelect2, sText1, sText2, sText3, sText2SoH, sText2ModS) {
		if (bSelect1) {
			return sText1;
		} else if (bSelect2) {
			// ONE CODE LINE >>>
			if (i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
				if (!this.getModel('ServiceVersions')) {
					return sText2;
				}	else if (this.getModel('ServiceVersions').getData().iServiceSchemaVersion === i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S) {
			    return sText2ModS;
			  } else {
			    return sText2SoH;
			  }
			}
			// ONE CODE LINE <<<
			return sText2;
		} else {
			return sText3;
		}
	},

	/**
	 * Returns the second argument if the MRP element category is purchase requisition<br>
	 * Returns the third argument if the MRP element category is not purchase requisition<br>
	 */
	getPurchaseDocumentText : function(catID, purchaseRequisitionText, purchaseOrderText) {
		if (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isRequisition(catID)) {
			return purchaseRequisitionText;
		} else {
			return purchaseOrderText;
		}
	},

	/**
	 * Returns either MRP area or plant as "MRP Area <MRP Area ID>" or "Plant <PlantID>" respectively
	 */
	getMRPAreaOrPlant : function(mrpArea, plant, context) {
		if (!context) {
			context = this;
		}
		if (plant && (!mrpArea || mrpArea === plant)) {
			// Plant has a value and either MRP area is empty or has the same value as plant
			return context.getModel('Common_i18n').getResourceBundle().getText("PLANT_WITH_ID", [plant]);
		} else if (mrpArea) {
			// MRP area is not empty and differs from plant
			// The MRP area starts with the plant ID so it is sufficient to display the MRP area
			return context.getModel('Common_i18n').getResourceBundle().getText("MRPAREA_WITH_ID", [mrpArea]);
		} else {
			// MRP area and plant are empty
			// Just in case... But there should always at least be a plant available
			return "";
		}
	},

	/**
	 * Returns either "MRP Area" or "Plant" as string
	 */
	getMRPAreaOrPlantLabel : function(mrpArea, plant, context) {
		if (!context) {
			context = this;
		}
		if (plant && (!mrpArea || mrpArea === plant)) {
			// Plant has a value and either MRP area is empty or has the same value as plant
			return context.getModel('Common_i18n').getResourceBundle().getText("PLANT");
		} else if (mrpArea) {
			// MRP area is not empty and differs from plant
			// The MRP area starts with the plant ID so it is sufficient to display the MRP area
			return context.getModel('Common_i18n').getResourceBundle().getText("MRPAREA");
		} else {
			// MRP area and plant are empty
			// Just in case... But there should always at least be a plant available
			return "";
		}
	},

	/**
	 * Returns the material number with MRP area or plant in parenthesis like this: {material number} (plant {plant ID})
	 * The logic to select MRP area or plant is implemented in getMRPAreaOrPlant()
	 */
	getMaterialWithPlant : function(material, mrpArea, plant) {
		// Create the string with either MRP area or plant
		var plantOrMRPArea = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getMRPAreaOrPlant(mrpArea, plant, this);
		// Create the string with material and MRP area/plant in parenthesis
		return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getTextPairWithParenthesis(material, plantOrMRPArea, this);
	},

	/**
	 * Returns the material number with MRP area or plant in parenthesis like this: {material number} (plant {plant ID})
	 * The logic to select MRP area or plant is implemented in getMRPAreaOrPlant()
	 */
	getMaterialWithPlantTooltip : function(mrpArea, plant) {
		// Create the label for either MRP Area or Plant
		var plantOrMRPAreaLabel = i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getMRPAreaOrPlantLabel(mrpArea, plant, this);
		// Create the string with "Material Number" and label MRP Area/Plant in parenthesis
		return this.getModel('Common_i18n').getResourceBundle().getText("MATERIAL_NUMBER_PLANT_TOOLTIP",
				[plantOrMRPAreaLabel]);
	},

	formatPlantController : function(name, id) {
		if (name && id) {
			return name + " (" + id + ")";
		} else if (name) {
			return name;
		} else if (id) {
			return id;
		} else {
			return null;
		}
	},

	/**
	 * Returns true if the stock control shall be rendered as Button (false = render as Label)
	 * 
	 * @param {Number}
	 *          mrpAvailability
	 * @param {String}
	 *          mrpElementCategory
	 * @param {Boolean}
	 *          decisionSupport (true if we want to have a shortage button)
	 * @param {String}
	 *          backendVersion - the backends service schema version
	 */
	allowSolutionNavigation : function(mrpAvailability, mrpElementCategory, decisionSupport, backendVersion) {

		if (backendVersion === 1) {

			if (mrpAvailability !== i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE
					&& mrpElementCategory !== i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK) {
				return true;
			} else {
				return false;
			}

		} else {
			return decisionSupport;
		}

	},
	
	/**
	 * more neutral wrapper
	 */
	showStockNavigation : function(mrpAvailability, mrpElementCategory, decisionSupport, backendVersion) {
		return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.allowSolutionNavigation(mrpAvailability, mrpElementCategory, decisionSupport, backendVersion);
	},
	
	/**
	 * returns the correct CSS class based on Stock situation
	 * 
	 * @param {Number}
	 *          mrpAvailability
	 */
	stockCSSClass: function (mrpAvailability) {
		
		switch (mrpAvailability) {
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE : // green
				return "sapMRPStockNoShortage";
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_SAFETYSTOCK : // yellow
				return "sapMRPShortageSafetyStock";
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_BELOWZERO : // red
				return "sapMRPShortage";
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED : // grey
				return "sapMRPShortageAccepted";
			default :
				return "sapMRPStockNoShortage";
		}
	},
	
	formatDateLong : function(dDate) {
		if (dDate) {
			return sap.ca.ui.model.format.DateFormat.getDateInstance({
				style : "long"}).format(dDate);
		}
	},

	textStockAvailability : function(sAvailabilityChart) {
		// return "Stock in 21 Days";

		// if (sAvailabilityChart) {
		return this.getModel('Common_i18n').getResourceBundle().getText("VisualStatusForecast", ['21']);
		// };
	},
	
	
	lapseOfStockAvailability : function(Text) {
		// return "Stock in 21 Days";

		// if (sAvailabilityChart) {
		return this.getModel('Common_i18n').getResourceBundle().getText( Text, ['21']);
		// };
	},

	deleteFirstLeadingZeros : function(number) {
		if (number) {
			// Also true for "00", "000"...
			if (number == 0) {
				return "0";
			}
		} else {
			return "";
		}
	},

	formatDelay : function(number) {
		if (number) {
			// Also true for "00", "000"...
			if (number == 0) {
					return this.getModel('Common_i18n').getResourceBundle().getText("DAYS", [0]);
			} else if ((number == 1) || (number == -1)) {
					return this.getModel('Common_i18n').getResourceBundle().getText("DAY", [number.replace(/^(0+)/g, '')]);
			} else if (number > 0) {
					return this.getModel('Common_i18n').getResourceBundle().getText("DAYS", [number.replace(/^(0+)/g, '')]);
			} else {
					return this.getModel('Common_i18n').getResourceBundle().getText("DAYS", [number]);
			}
		} else {
				return "";
		}
	},

	formatDelayInt : function(number) {
		if (number == 0) {
				return this.getModel('Common_i18n').getResourceBundle().getText("DAYS", [0]);
		} else if ((number == 1) || (number == -1)) {
				return this.getModel('Common_i18n').getResourceBundle().getText("DAY", [number]);
		} else {
				return this.getModel('Common_i18n').getResourceBundle().getText("DAYS", [number]);
		}
	},

	/**
	 * Returns time in a short format e.g 10:30PM
	 */
	formatTimeShort : function(dDate) {
		if (dDate) {
			return sap.ca.ui.model.format.DateFormat.getTimeInstance({
				style : "short"	}).format(dDate);
		}
		return "";
	},

	/**
	 * Returns Button Text for EditButton of QuickView
	 */
	getQVEditButtonText : function(catID, CRstatus) {
		switch(catID){
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS:
				return this.getModel('Common_i18n').getResourceBundle().getText("QV_PR_EditButton");
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_POITEM:
				if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getChangeRequestVisibility(CRstatus)){
					return this.getModel('Common_i18n').getResourceBundle().getText("QV_CR_EditButton");
				}else{
					return this.getModel('Common_i18n').getResourceBundle().getText("QV_PO_EditButton");
				}
				break;
			default:
				return "";
		}
	},
	
	joinedByHyphen : function(value1,value2 ) {
			return value1 + "-" + value2;
	},
	
	// returns a true or false based on a given value
	// value 0 should be handled different than a value greater 0
	isValueGreaterEqualZero : function(value) {
		var lnumber = Math.round(value);
		if (lnumber >= 0) {
			return true;
		} else {
			return false;
		}
	},
	
	formatQuantityAlways : function(value, precision, unit) {
	  if (unit) {
			var sFormattedValue = sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(value, unit, precision);
			return sFormattedValue + " " + unit;
		};
		return value;
	},
	
	/**
	 * Returns a combination of the supplied value and the suffix 'day(s)' If the supplied value is empty, the returned
	 * combination is also filled
	 */
	formatDayValueAlways : function(dayValue) {

		if (dayValue && (dayValue == 1)) {
			return this.getModel('Common_i18n').getResourceBundle().getText("ONE_DAY");
		} else if (dayValue && (dayValue > 1)) {
			return this.getModel('Common_i18n').getResourceBundle().getText("DAYS", [dayValue]);
		} else {
			return this.getModel('Common_i18n').getResourceBundle().getText("DAYS", [dayValue]);
		}
	},
	
	/**
	 * Returns a Min/Max or only Min or Max depending on filled value
	 */
	formatMinMaxQuantityText : function(minValue, maxValue) {

		if ((minValue > 0) && (maxValue > 0)) {
			return this.getModel('Common_i18n').getResourceBundle().getText("MIN_MAX_LOT_SIZE");
		} else if ((minValue > 0) && (maxValue < 1)) {
			return this.getModel('Common_i18n').getResourceBundle().getText("xfldMaterialMinLotSizeQty");
		} else if ((minValue < 1) && (maxValue > 0)) {
			return this.getModel('Common_i18n').getResourceBundle().getText("xfldMaterialMaxLotSizeQty");			
		} else {
			return this.getModel('Common_i18n').getResourceBundle().getText("MIN_MAX_LOT_SIZE");
		}
	},
	
	/**
	 * Returns false (hidden) for ModelS
	 */
	releaseVisibleCheck : function(value,that) {
		if(!that){
		  that = this;
		}
		var iVersion = that.getModel('ServiceVersions').getData().iServiceSchemaVersion;
		if(iVersion === i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S) {
			return false;  		 /** ModelS invisible */
		} else {
			return true;		/** SoH visible */
		}	
	},	

	
	/**
	 * Returns true (show) for ModelS
	 */
	visibleForModelS : function(value,that) {
		if(!that){
		  that = this;
		}
		var iVersion = that.getModel('ServiceVersions').getData().iServiceSchemaVersion;
		if(iVersion === i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S) {
			return true;  		 /** ModelS visible */
		} else {
			return false;		   /** SoH invisible */
		}	
	},	
	
	/**
	 * Returns hidden for ModelS and mobile devices
	 */	
	visibleCheck : function() {
		
		if( (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.visibleOnlyOnDesktop() === false) || (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.releaseVisibleCheck(null,this) === false) ) {
			return false;  				/**  ModelS or Mobile device */
		} else {
			return true;				/** SoH and Desktop device  */
		}		
	},	
	
	/**
	 * Check if PO Navigation should be visible on PO Quickview
	 * SOH on Mobile -> Invisible and visible for the rest
	 */	
	VisibleCheckPONavigation : function() {
		
		if( (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.visibleOnlyOnDesktop() === false) && (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.releaseVisibleCheck(null,this) === true) ) {
			return false;  				/**  SoH and Mobile device */
		} else {
			return true;				/** Visible for rest */
		}		
	},		
	
	/**
	 * Returns a Version dependent text sSuite/ModelS/sLog vs. SoH Texts  / USES THE SWITCH ONE_CODELINE_TEXT
	 */
	formatVersionTextSoHVsSLog : function(textID, textIDSoH, textIDModelS) {
		// ONE CODELINE
		if (i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
			if (!this.getModel('ServiceVersions')) {
				return textIDSoH;
			}	else if (this.getModel('ServiceVersions').getData().iServiceSchemaVersion === i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S) {
		    return textIDModelS;
		  } else {
		    return textIDSoH;
		  }
		} else {
	    return textID;
		}
	},

	/**
	 * Returns a text which depends on sSuite/ModelS/sLog vs. SoH  / DOES NOT use the switch ONE_CODELINE_TEXT
	 */
	formatTextSoHVsSLog : function(textSoH, textModelS) {
			if (!this.getModel('ServiceVersions')) {
				return textSoH;
			}	else if (this.getModel('ServiceVersions').getData().iServiceSchemaVersion === i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S) {
		    return textModelS;
		  } else { // default is the SoH Text, in case the ServiceVersion can not be calculated (missing model)
		    return textSoH;
		  }
	},

	/**
	 * Truncates the input text to 5 characters and concatenates 35 characters to simulate long material numbers.
	 */
	formatLAMA : function(sMatNr) {
		if (sMatNr !== null){
			var sTextPattern = "OxOxOxOxOxOxOxOxO-";
			return sMatNr + "-" + sTextPattern.slice(sMatNr.length - 1) + "TestLongMaterialNumber";
		}
	},
	
	formatDateDaysAgo : function(dDate){
		if (dDate) {
			return sap.ca.ui.model.format.DateFormat.getDateInstance({
				style : "daysAgo"}).format(dDate);
		};
		return "";
	},

	formatStatusState : function(status, vendorResponse){
		var oValueState = "None";
		switch (status) {
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_REQUESTED:	//Requested 
			  oValueState = "Error"; 
			  break;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_APPLIED: //Applied			
				oValueState = "Success"; 
				break;			
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_DISCARDED:	//Discarded 
				oValueState = "Error"; 
				break;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_ANSWERED:	//Answered 
				if (vendorResponse === i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_ACCEPTED) {  //"Accepted" 
				  oValueState = "Success"; 							
			   }	else if (vendorResponse === i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_REJECTED) { //"Rejected" 
				  oValueState = "Error"; 			
			   }	else if (vendorResponse === i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_PROPOSED) { //"New Proposal" 
				  oValueState = "Warning"; 				
			   }		
				break;	
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_COLLECTED:	//New 
				oValueState = "None"; 
				break;
			case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_CLOSED:	//Closed 
				oValueState = "None"; 
				break;
			default :
				oValueState = "None"; 		
		}	
		
		return oValueState;
		
	},
	
	/**
	 * This method decides whether to show the edit button or not depending on flag MRPElementIsEditable
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.CommonFormatter
	 */
	getIsEditButtonVisible : function(MRPElementIsEditable) {
		if (MRPElementIsEditable === 'X') {
			return true;
		} else {
			return false;
		}
	},
	
	noMatchedValue : function(value,notAllowedValue){
		if(value && notAllowedValue){
			if(value === notAllowedValue){
				return false;
			}
			return true;
		}
	},
	
	catNotAllowedAndHasValue : function(value,cat,notAllowedCat){
		if(cat && notAllowedCat){
			if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.noMatchedValue(cat,notAllowedCat)){
				if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(value)){
					return true;
				}
				return false;
			}
			return false;
		}	
}

};



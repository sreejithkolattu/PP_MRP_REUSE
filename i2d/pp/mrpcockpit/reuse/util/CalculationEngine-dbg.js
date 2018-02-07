/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.CalculationEngine");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");

/**
 * Constructor
 * 
 * @param oModelI18N
 *          object representing the i18n model of reuse which is used to extract the I18N bundle
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine = function(oModelI18N) {
	// Shortcut to the MRP constants
	this.Constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;
	// The model used to extract the I18N resource bundle
	this.oModelI18N = oModelI18N;
};

/**
 * This method represents the template for the preview algorithm for supply demand items in the table
 * 
 * @param aModelClone
 *          array of cloned objects representing the supply demand items. This array is the basic set of data that is
 *          used and changed within the preview: <BR>
 *          -MRPElementAvailyOrRqmtDate (Availability Date) <BR>
 *          -MRPAvailableQuantity (Available Quantity SUM shown as 'Available' in table) <BR>
 *          -MRPElementOpenQuantity (Quantity of the MRP Element shown in table) <BR>
 *          -MRPElement (used as key to find the active element in list)<BR>
 *          -MRPElementCategory (used as key to find the active element in list)<BR>
 *          -MRPElementItem (used as key to find the active element in list)<BR>
 *          -MRPElementScheduleLine (used as key to find the active element in list)<BR>
 *          -ChangedMrpElement (output ; boolean if the element has been changed within the preview)<BR>
 *          -InitialShortage (output ; boolean if the element has been an initial shortage)<BR>
 *          -Index (output ; ongoing number for the current element
 * @param oCard
 *          object representing the selected solution card. The object contains the relevant information for the preview
 *          data: <BR>
 *          -MaterialShortageSolutionType (optional - used to identify the algorithm of the preview
 *          create/reschedule/increase)<BR>
 *          -ChangedAvailabilityDate (new value for availability date used for preview)<BR>
 *          -MRPElementChangeOpenQuantity (new value for quantity used for preview)<BR>
 *          -MRPElementExternalID (used as key to find the active element in list)<BR>
 *          -MRPElementCategory (used as key to find the active element in list)<BR>
 *          -MRPElementItemExternalID (used as key to find the active element in list)<BR>
 *          -MRPElementScheduleLineExtID (used as key to find the active element in list)<BR>
 *          -MRPElementCategoryShortName (used as 3. sort criteria in the list)<BR>
 *          -Vendor (just for 'create' use case - used to set MRPElementBusinessPartner for the UI)<BR>
 *          -VendorName (just for 'create PO' use case - used to set MRPElementBusinessPartner for the UI)<BR>
 *          -SupplyingPlant (just for 'create TO' use case - used to set MRPElementBusinessPartner for the UI)<BR>
 * @param dShortageStartDate
 *          date object representing the start date of the shortage. Can be 'null' if called out of 540.
 * @param dShortageEndDate
 *          date object representing the end date of the shortage. Can be 'null' if called out of 540.
 * @param dDateTody
 *          date object representing the current date. It is passed from the outside in order to be able to enable unit
 *          testing for this class.
 * @return [] <BR>
 *         1. Status Code {0, OK ; -1, Missing Input Data ; -2 Invalid Input Data} <BR>
 *         2. Array of Supply Demand Items
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.previewTable = function(aModelClone, oCard,
		dShortageStartDate, dShortageEndDate, dDateToday) {

	this._dShortageStartDate = dShortageStartDate;
	this._dShortageEndDate = dShortageEndDate;
	this._aSupDemItems = [];

	// Check if the required data for the preview is given
	if (!oCard) {
		// Missing input data
		return [-1, this._aSupDemItems];
	}

	// Check if the given data for the preview is valid
	if (!this.isInputDataValid(dDateToday, oCard.ChangedAvailabilityDate)) {
		// Invalid input data
		return [-2, this._aSupDemItems];
	}

	// ---------------------------------------------
	// Initialize the supply demand items
	this._aSupDemItems = aModelClone;
	this.initSupDemItems();

	// ---------------------------------------------
	// Find the 'active' supply demand item that is
	// affected by the selected solution card
	var oSupDemItem = this.getActiveSupplyDemandItem(oCard);
	if (!oSupDemItem && oCard.MaterialShortageSolutionType !== this.Constants.SOLUTIONTYPE_ACCEPT) {
		oSupDemItem = this.createActiveSupplyDemandItem(oCard);
	}

	// ---------------------------------------------
	// Get the 'category' that results out of the supply
	// demand item in combination with the solution card
	var sCardCategory = this.getSupDemItemCategory(oSupDemItem, oCard);

	// ---------------------------------------------
	// Run the preview based on the determined 'category'
	switch (sCardCategory) {
		case this.Constants.CARD_CATEGORY_INCREASE :
			this.runPreviewTypeIncrease(oCard, oSupDemItem);
			break;
		case this.Constants.CARD_CATEGORY_RESCHEDULE :
			this.runPreviewTypeReschedule(oCard, oSupDemItem);
			break;
		case this.Constants.CARD_CATEGORY_CHANGE :
			this.runPreviewTypeChange(oCard, oSupDemItem);
			break;
		case this.Constants.CARD_CATEGORY_ACCEPT :
			// Do nothing in case of 'accept shortage'
			break;
	}

	// Return the new/adapted model
	return [0, this._aSupDemItems];

};

/**
 * This method checks if the input data is valid. <BR>
 * Check 1 - Is the target date in the past?<BR>
 * Check 2 - Is the time interval valid?<BR>
 * 
 * @param dToday
 *          date object representing the current date
 * @param dTarget
 *          date object representing the destination defined in the solution card that has been calculated within the
 *          solution call
 * @returns true||false
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.isInputDataValid = function(dToday, dTarget) {
	// Temporary Date from Today without hours, minutes, ...
	var dTodayTemp = new Date(dToday.getUTCFullYear(), dToday.getUTCMonth(), dToday.getUTCDate());
	var dTargetTmp = new Date(dTarget.getUTCFullYear(), dTarget.getUTCMonth(), dTarget.getUTCDate());
	var bValid = true;
	// Check 1 - Is the target date in the past?
	if (dTargetTmp.getTime() < dTodayTemp.getTime()) {
		bValid = false;
	}
	// Check 2 - Is the time interval valid?
	else if (this._dShortageStartDate && this._dShortageEndDate) {
		if (!(this._dShortageStartDate instanceof Date) || !(this._dShortageEndDate instanceof Date)) {
			bValid = false;
		} else if (this._dShortageStartDate > this._dShortageEndDate) {
			bValid = false;
		}
	}
	return bValid;
};

/**
 * This method prepares the array of supply demand items regarding the quantity fields and some flags that are used for
 * the UI representation of the supply demand items.<BR>
 * -Convert strings to numbers<BR>
 * -Mark the items with initial shortage (stock < critialQuantity) for UI<BR>
 * -Mark all elements as 'not changed' for initialization<BR>
 * 
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.initSupDemItems = function() {
	for ( var i = 0; i < this._aSupDemItems.length; i++) {
		var object = this._aSupDemItems[i];
		// Convert to numbers for the calculation
		object.MRPElementOpenQuantity = parseFloat(object.MRPElementOpenQuantity);
		object.MRPAvailableQuantity = parseFloat(object.MRPAvailableQuantity);
		object.ChangedMrpElement = false;
		// Info: We mark both - requirements and supplies!
		if (object.MRPAvailableQuantity < object.MaterialShortageCriticalQty) {
			// relevant for coloring of the preview. This item will be shown as solved when stock exceeds the safety stock
			object.InitialShortage = true;
		}
	}
};

/**
 * This method determines the 'category' that is required to realize the preview for the selected combination of
 * solution card and supply demand item. Following mapping:<BR>
 * -CARD(Accept) -> ACCEPT<BR>
 * -CARD(Create PO || Create TO) -> RESCHEDULE<BR>
 * -CARD(AvailDate)==ITEM(AvailDate)&&CARD(Quantity)<>ITEM(Quantity) -> INCREASE<BR>
 * -CARD(AvailDate)<>ITEM(AvailDate)&&CARD(Quantity)==ITEM(Quantity) -> RESCHEDULE<BR>
 * -CARD(AvailDate)<>ITEM(AvailDate)&&CARD(Quantity)<>ITEM(Quantity) -> CHANGE<BR>
 * 
 * @param oCard
 *          object representing the selected solution card
 * @param oSubDemItem
 *          object representing the related supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.getSupDemItemCategory = function(oSupDemItem, oCard) {

	var sCardCategory = "";

	switch (oCard.MaterialShortageSolutionType) {
		// -CARD(Accept) -> ACCEPT
		case this.Constants.SOLUTIONTYPE_ACCEPT :
			sCardCategory = this.Constants.CARD_CATEGORY_ACCEPT;
			break;
		case this.Constants.SOLUTIONTYPE_PO_CREATE :
		case this.Constants.SOLUTIONTYPE_TO_CREATE :
			// CARD(Create PO || Create TO) -> RESCHEDULE
			sCardCategory = this.Constants.CARD_CATEGORY_RESCHEDULE;
			break;
		default :
			// For any other Solution Type we have to consider the dates and quantities to determine the category
			var dSupElDateOld = oSupDemItem.MRPElementAvailyOrRqmtDate;
			var dSupElDateNew = oCard.ChangedAvailabilityDate;
			var iSupElQuanOld = oSupDemItem.MRPElementOpenQuantity;
			var iSupElQuanNew = parseFloat(oCard.MRPElementChangeOpenQuantity);
			if (dSupElDateNew && dSupElDateOld) {
				if (dSupElDateOld.getTime() === dSupElDateNew.getTime() && iSupElQuanOld !== iSupElQuanNew) {
					// CARD(AvailDate)==ITEM(AvailDate)&&CARD(Quantity)<>ITEM(Quantity) -> INCREASE
					sCardCategory = this.Constants.CARD_CATEGORY_INCREASE;
				}
				if (dSupElDateOld.getTime() !== dSupElDateNew.getTime() && iSupElQuanOld === iSupElQuanNew) {
					// CARD(AvailDate)<>ITEM(AvailDate)&&CARD(Quantity)==ITEM(Quantity) -> RESCHEDULE
					sCardCategory = this.Constants.CARD_CATEGORY_RESCHEDULE;
				}
				if (dSupElDateOld.getTime() !== dSupElDateNew.getTime() && iSupElQuanOld !== iSupElQuanNew) {
					// CARD(AvailDate)<>ITEM(AvailDate)&&CARD(Quantity)<>ITEM(Quantity) -> CHANGE
					sCardCategory = this.Constants.CARD_CATEGORY_CHANGE;
				}
			}
			break;
	}
	return sCardCategory;
};

/**
 * This method searches and returns the active supply demand item that correspond to the selected solution card.
 * 
 * @param oCard
 *          object representing the selected solution card
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.getActiveSupplyDemandItem = function(oCard) {
	var oSupDemItem = null;
	switch (oCard.MaterialShortageSolutionType) {
		case this.Constants.SOLUTIONTYPE_PO_CREATE :
		case this.Constants.SOLUTIONTYPE_TO_CREATE :
			break;
		default :
			for ( var i = 0; i < this._aSupDemItems.length; i++) {
				var object = this._aSupDemItems[i];
				if (object.MRPElement === oCard.MRPElementExternalID && object.MRPElementCategory === oCard.MRPElementCategory
						&& object.MRPElementItem === oCard.MRPElementItemExternalID
						&& object.MRPElementScheduleLine === oCard.MRPElementScheduleLineExtID) {
					oSupDemItem = object;
				}
			}
			break;
	}
	return oSupDemItem;
};

/**
 * This method adds a new supply demand item to the existing array of supply demand items. This is used to realize
 * previews containing 'new' elements that will be created when using the selected solution card. The idea is to create
 * the new item at the end of the array with an availability date far in the future. The system will then use the new
 * dates out of the solution card and will trigger a 'Reschedule'
 * 
 * @param oCard
 *          object representing the selected solution card
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.createActiveSupplyDemandItem = function(oCard) {

	var oDateInFarFuture = new Date("3333", "03", "03");
	// In case of a new element, we don't have an ID. So
	// we just set it to a constant. This assures that we
	// don't find an existing item.
	oCard.MRPElementExternalID = "";
	if (this.oModelI18N) {
		var oBundle = this.oModelI18N.getResourceBundle();
		oCard.MRPElementExternalID = "[" + oBundle.getText("NEW") + "]";
	}

	var oSupDemItem = new Object();
	oSupDemItem.Index = this._aSupDemItems.length + 1;
	oSupDemItem.MRPElement = oCard.MRPElementExternalID;
	oSupDemItem.MRPElementAvailyOrRqmtDate = oDateInFarFuture;
	oSupDemItem.MRPElementOpenQuantity = parseFloat(oCard.MRPElementChangeOpenQuantity);
	oSupDemItem.UnitOfMeasureTechnicalName = oCard.UnitOfMeasureTechnicalName;
	oSupDemItem.MaterialID = oCard.MaterialID;
	oSupDemItem.ChangedMrpElement = true;
	oSupDemItem.MRPElementCategoryShortName = oCard.MRPElementCategoryShortName;

	switch (oCard.MaterialShortageSolutionType) {
		case this.Constants.SOLUTIONTYPE_PO_CREATE :
			oSupDemItem.Vendor = oCard.Vendor;
			oSupDemItem.VendorName = oCard.VendorName;
			oSupDemItem.MRPElementCategory = this.Constants.MRP_ELEMENT_CATEGORY_POITEM;
			oSupDemItem.MRPElementBusinessPartnerType = this.Constants.MRP_ELEMENT_BUSINESSPARTNERTYPE_SUPPLIER;
			oSupDemItem.MRPElementBusinessPartnerID = oCard.Vendor;
			oSupDemItem.MRPElementBusinessPartnerName = oCard.VendorName;
			break;
		case this.Constants.SOLUTIONTYPE_TO_CREATE :
			oSupDemItem.MRPElementCategory = this.Constants.MRP_ELEMENT_CATEGORY_RELORD;
			oSupDemItem.MRPElementBusinessPartnerType = this.Constants.MRP_ELEMENT_BUSINESSPARTNERTYPE_ISSUINGLOC;
			oSupDemItem.MRPElementBusinessPartnerID = oCard.SupplyingPlant;
			oSupDemItem.MRPElementBusinessPartnerName = oCard.VendorName;
			break;
	}
	this._aSupDemItems.push(oSupDemItem);
	return oSupDemItem;
};

/**
 * This method sets the data of the active supply demand item based on the selected solution card.
 * 
 * @param oCard
 *          object representing the selected solution card
 * @param oSubDemItem
 *          object representing the related supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.setActiveSupDemItem = function(oCard, oSupDemItem) {
	// Transfer the new 'Availability Date' from the solution card to the supply demand item
	oSupDemItem.MRPElementAvailyOrRqmtDate = oCard.ChangedAvailabilityDate;
	// Transfer the new 'Quantity' from the solution card to the supply demand item
	oSupDemItem.MRPElementOpenQuantity = parseFloat(oCard.MRPElementChangeOpenQuantity);
	// Mark the supply demand items as 'changed' (relevant for the UI for coloring)
	oSupDemItem.ChangedMrpElement = true;
};

/**
 * This method realized the preview-algorithm for a solution card 'Increase'.
 * 
 * @param oCard
 *          object representing the selected solution card
 * @param oSubDemItem
 *          object representing the related supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.runPreviewTypeIncrease = function(oCard, oSupDemItem) {

	var iDelta = 0;
	var dSupElDateOld = oSupDemItem.MRPElementAvailyOrRqmtDate;
	var iSupElQuanOld = oSupDemItem.MRPElementOpenQuantity;
	var iSupElQuanNew = parseFloat(oCard.MRPElementChangeOpenQuantity);

	// Update the active supply demand item with the data of the solution card.
	this.setActiveSupDemItem(oCard, oSupDemItem);

	// Adapt the available quantities based on the given shortage period. If the supply demand item
	// is outside the period, the quantity is set to [empty]
	this.adaptAvailableQuantities();

	// Increase all items below the active supply demand item.
	iDelta = iSupElQuanNew - iSupElQuanOld;
	for ( var i = 0; i < this._aSupDemItems.length; i++) {
		var object = this._aSupDemItems[i];
		object.Index = i + 1;
		if (!this.isItemStockLine(object)) {
			if (!this.isShortageIntervalDefined() || this.isItemInShortageInterval(object)) {
				if (object.MRPElementAvailyOrRqmtDate >= dSupElDateOld) {
					object.MRPAvailableQuantity += iDelta;
				}
			}
		}
	}
};

/**
 * This method determines the source position of the supply demand item in the array. This depends on the MRPElement
 * (internal id) and the type of the MRP Element (category)
 * 
 * @param oSubDemItem
 *          object representing the related supply demand item
 * 
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.findSourcePosition = function(oSupDemItem) {
	var iPosSource = 0;
	for ( var i = 0; i < this._aSupDemItems.length; i++) {
		var object = this._aSupDemItems[i];
		if (object.MRPElement === oSupDemItem.MRPElement && object.MRPElementCategory === oSupDemItem.MRPElementCategory
				&& object.MRPElementItem === oSupDemItem.MRPElementItem
				&& object.MRPElementScheduleLine === oSupDemItem.MRPElementScheduleLine) {
			iPosSource = i;
			break;
		}
	}
	return iPosSource;
};

/**
 * This method determines the target position of the supply demand item in the array. This depends on the 'availability
 * date' and also based on the short name of the MRP element category and finally the ID(MRPElement)
 * 
 * @param oCard
 *          object representing the selected solution card
 * @param oSubDemItem
 *          object representing the related supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.findTargetPosition = function(oCard, oSupDemItem) {

	var dSupElDateNew = oCard.ChangedAvailabilityDate;

	// Find its target position
	var iTarget = this._aSupDemItems.length;
	for ( var i = 0; i < this._aSupDemItems.length; i++) {
		var object = this._aSupDemItems[i];

		// 1.Check: if the element is the Stock, this is not our target position
		if (!this.isItemStockLine(object)) {
			// 2a.Check: if the new element is later than this one, this is not our target position
			if (dSupElDateNew.getTime() < object.MRPElementAvailyOrRqmtDate.getTime()) {
				// the element is not later, so this is our position
				iTarget = i;
				break;
				// 2b.Check: if the new element is at the same date, we have to
			} else if (object.MRPElementAvailyOrRqmtDate.getTime() === dSupElDateNew.getTime()) {
				// 3a.Check: if the current element is a demand, the new element (always supply) comes first
				if (object.MRPElementOpenQuantity < 0) {
					iTarget = i;
					break;
					// 3b.Check: if the element is no supply, it is sorted by name
				} else if (object.MRPElementCategoryShortName > oSupDemItem.MRPElementCategoryShortName) {
					iTarget = i;
					break;
				} else if (object.MRPElementCategoryShortName === oSupDemItem.MRPElementCategoryShortName) {
					// 4.Check: if the name is equal, we sort by ID
					if (object.MRPElement > oSupDemItem.MRPElement) {
						iTarget = i;
						break;
					}
				}
			}
		}
	}
	return iTarget;
};

/**
 * This method checks if the given element/line of the table is a stockline
 * 
 * @param object
 *          object representing the current supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.isItemStockLine = function(object) {
	if (object.MRPElementCategory === this.Constants.MRP_ELEMENT_CATEGORY_STOCK) {
		return true;
	} else {
		return false;
	}
};

/**
 * This method checks if the given element/line of the table is a supply
 * 
 * @param object
 *          object representing the current supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.isItemSupply = function(object) {
	if (object.MRPElementOpenQuantity < 0) {
		// If the quantity is below zero, it is a demand
		return false;
	} else {
		// If the quantity is larger than zero, it is a supply
		return true;
	}
};

/**
 * This method checks if the given element/line of the table is in the defined shortage interval
 * 
 * @param object
 *          object representing the current supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.isItemInShortageInterval = function(object) {
	var dDate = object.MRPElementAvailyOrRqmtDate;

	if ((this._dShortageStartDate <= dDate) && (dDate <= this._dShortageEndDate)) {
		return true;
	} else {
		return false;
	}
};

/**
 * This method checks if the client has provided a shortage interval
 * 
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.isShortageIntervalDefined = function() {
	if (this._dShortageStartDate === null || this._dShortageEndDate === null) {
		return false;
	} else {
		return true;
	}
};

/**
 * This method checks if the given element/line of the table is a stockline
 * 
 * @param object
 *          object representing the current supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.isItemStockLine = function(object) {
	if (object.MRPElementCategory === this.Constants.MRP_ELEMENT_CATEGORY_STOCK) {
		return true;
	} else {
		return false;
	}
};

/**
 * This method calculates the new quantity for the active supply demand item based on the location where the supply
 * demand item is re-arranged.
 * 
 * Info : The array has already been re-arranged. That means that in case of reschedule, the item has already moved to
 * the target position. In case of procure, the item has already been inserted in the array. <BR>
 * Info2: The array has been arranged in that way, that - for the same day - all supplies are 'in front' of the first
 * demand
 * 
 * @param oCard
 *          object representing the selected solution card
 * @param oSubDemItem
 *          object representing the related supply demand item
 * @param iTarget
 *          integer representing the target position in the array of supply demand items
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.setActiveSupDemItemQuantity = function(oCard, oSupDemItem,
		iTarget) {

	var dSupElDateNew = oCard.ChangedAvailabilityDate;
	var iQuanNew = oCard.MRPElementChangeOpenQuantity;
	var iQuan = "";

	if (this._aSupDemItems.length === 1) {
		// If there is just one item at all. It's not a realistic use case but we never know...
		iQuan = 0;
	} else if ((iTarget > 0) && iTarget === this._aSupDemItems.length - 1) {
		// If the rescheduled item is inserted at the last position, we use the stock quantity of the
		// next to last item (just relevant for 'procure' and 'transfer')
		iQuan = this._aSupDemItems[iTarget - 1].MRPAvailableQuantity;
	} else if ((iTarget > 0)
			&& this._aSupDemItems[iTarget - 1].MRPElementAvailyOrRqmtDate.getTime() === dSupElDateNew.getTime()
			&& !this.isItemStockLine(this._aSupDemItems[iTarget - 1])) {
		// If the rescheduled item is on the same day as the previous item, we take the same stock quantity
		// (we've inserted behind)
		// This happens if there is already a supply for the target date and we've added a second one...
		iQuan = this._aSupDemItems[iTarget - 1].MRPAvailableQuantity;
	} else if (this._aSupDemItems[iTarget + 1].MRPElementAvailyOrRqmtDate.getTime() === dSupElDateNew.getTime()) {
		// If the rescheduled item is on the same day as the next item, we have to check
		// if the next item is a supply or a demand.
		// In case of a supply, we take the stock from the next item
		// In case of a demand and there is NO previous item, we take the stock from the next item
		// In case of a demand and there is a previous item, we take the stock from the previous item
		if (this.isItemSupply(this._aSupDemItems[iTarget + 1]) === true) {
			// It is a supply, so use its stock as reference
			iQuan = this._aSupDemItems[iTarget + 1].MRPAvailableQuantity;
					//- this._aSupDemItems[iTarget + 1].MRPElementOpenQuantity;
		} else if (iTarget === 0) {
			// It is a demand, but there's no previous item. So use the demands stock as reference
			iQuan = this._aSupDemItems[iTarget + 1].MRPAvailableQuantity
					- this._aSupDemItems[iTarget + 1].MRPElementOpenQuantity;
		} else {
			// It is a demand, so use previous items stock as reference
			iQuan = this._aSupDemItems[iTarget - 1].MRPAvailableQuantity;
		}
	} else if (this._aSupDemItems[iTarget + 1].MRPElementAvailyOrRqmtDate.getTime() !== dSupElDateNew.getTime()
			&& iTarget === 0) {
		// If it is a different day and we're the first item in the list, we don't know the real stock.
		// So we take the next item's stock and reduce it by the quantity of the given item
		iQuan = this._aSupDemItems[iTarget + 1].MRPAvailableQuantity - iQuanNew;
	} else if (this._aSupDemItems[iTarget + 1].MRPElementAvailyOrRqmtDate.getTime() !== dSupElDateNew.getTime()
			&& (iTarget > 0)) {
		// If it is a different day but we have previous
		// items, we use the stock quantity of the item before
		iQuan = this._aSupDemItems[iTarget - 1].MRPAvailableQuantity;
	}
	this._aSupDemItems[iTarget].MRPAvailableQuantity = iQuan;
};

/**
 * This method adapts the available quantities of the supply demand items. The decision is made by checking if the item
 * is within the given shortage interval
 * 
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.adaptAvailableQuantities = function() {
	var oItem = null;
	// If the shortage interval is not defined, we skip the adaption (e.g. used for change requests)
	if (this._dShortageStartDate === null || this._dShortageEndDate === null) {
		return;
	}
	// If the shortage inteval is defined, we supress the available quantities of all items that are
	// not part of the interval
	for ( var i = 0; i < this._aSupDemItems.length; i++) {
		oItem = this._aSupDemItems[i];
		if (!this.isItemInShortageInterval(oItem)) {
			oItem.MRPAvailableQuantity = "";
		}
	}
};

/**
 * This method realized the preview-algorithm for a solution card 'Reschedule'.
 * 
 * The idea is to adjust each supply demand item in between of the new date and the former old date and increase the
 * quantity of each item by the new quantity of the supply demand item that has been rescheduled/changed.
 * 
 * @param oCard
 *          object representing the selected solution card
 * @param oSubDemItem
 *          object representing the related supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.runPreviewTypeReschedule = function(oCard, oSupDemItem) {

	var dSupElDateOld = oSupDemItem.MRPElementAvailyOrRqmtDate;
	var dSupElDateNew = oCard.ChangedAvailabilityDate;
	var iSupElQuanNew = parseFloat(oCard.MRPElementChangeOpenQuantity);
	var iSupElQuanOld = parseFloat(oCard.MRPElementOpenQuantity);

	// Update the active supply demand item with the data of the solution card.
	this.setActiveSupDemItem(oCard, oSupDemItem);

	// The source position is determined using the id and the type of the selected supply demand item
	var iPosSource = this.findSourcePosition(oSupDemItem);

	// Cut the supply demand item out of the array
	var aItemToMove = this._aSupDemItems.splice(iPosSource, 1);

	// Find its target position in the array comparing its date, type and name
	var iPosTarget = this.findTargetPosition(oCard, oSupDemItem);

	// Insert the item back to the array at the determined target position
	this._aSupDemItems.splice(iPosTarget, 0, aItemToMove[0]);

	// Determine the stock quantity that should be
	// displayed for the rescheduled item
	this.setActiveSupDemItemQuantity(oCard, oSupDemItem, iPosTarget);

	// Adapt the available quantities based on the given shortage period. If the supply demand item
	// is outside the period, the quantity is set to [empty]
	this.adaptAvailableQuantities();

	// Since a 'reschedule' affects position of a supply demand item in the list, we have to adapt
	// the quantity of those items that are in between of the old and the new date.
	// It depends on the 'direction', in which the item has been rescheduled. Check whether the reschedule has moved the
	// affected item to the front (further to the present) or to the back
	// (further in the future)
	if (dSupElDateNew < dSupElDateOld) {
		// If the item has been rescheduled to the 'front', we have to adjust each supply demand item in between of the
		// new date and the former old date and increase the quantity of each item by the NEW quantity
		// of the supply demand item that has been rescheduled/changed.
		for ( var i = 0; i < this._aSupDemItems.length; i++) {
			var object = this._aSupDemItems[i];
			object.Index = i + 1;
			if (!this.isItemStockLine(object)) {
				if (!this.isShortageIntervalDefined() || this.isItemInShortageInterval(object)) {
					if (((object.MRPElementAvailyOrRqmtDate >= dSupElDateNew))
							&& ((object.MRPElementAvailyOrRqmtDate < dSupElDateOld))) {
						object.MRPAvailableQuantity += iSupElQuanNew;
					}
				}
			}
		}
	} else {
		// If the item has been rescheduled to the 'back', we have to adjust each supply demand item in between of the
		// former old date and the new date and decrease its quantity of each item by the OLD quantity
		// of the supply demand item that has been rescheduled/changed.
		for ( var i = 0; i < this._aSupDemItems.length; i++) {
			var object = this._aSupDemItems[i];
			object.Index = i + 1;
			if (!this.isItemStockLine(object)) {
				if (!this.isShortageIntervalDefined() || this.isItemInShortageInterval(object)) {
					if (((object.MRPElementAvailyOrRqmtDate >= dSupElDateOld))
							&& ((object.MRPElementAvailyOrRqmtDate < dSupElDateNew))) {
						object.MRPAvailableQuantity -= iSupElQuanOld;
					}
				}
			}
		}

	}
};

/**
 * This method realized the preview-algorithm for a solution card 'Change'. * A change can be technically represented by
 * a combination of a reschedule and an increase with a slight modification. The idea is to run a normal reschedule task
 * of the supply demand item first. Then we have to additionally increase all supply demand items below the original
 * date by the delta (between its new and old quantity) of the changed supply demand item.
 * 
 * @param oCard
 *          object representing the selected solution card
 * @param oSubDemItem
 *          object representing the related supply demand item
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.runPreviewTypeChange = function(oCard, oSupDemItem) {

	var iDelta = 0;
	var dSupElDateOld = oSupDemItem.MRPElementAvailyOrRqmtDate;
	var dSupElDateNew = oCard.ChangedAvailabilityDate;
	var iSupElQuanOld = oSupDemItem.MRPElementOpenQuantity;
	var iSupElQuanNew = parseFloat(oCard.MRPElementChangeOpenQuantity);

	// Step 1: Run a reschedule of the given supply demand item
	this.runPreviewTypeReschedule(oCard, oSupDemItem);

	// Step 2: Since a 'change' also affects the quantity, we have to adjust the quantity of supply demand items as well.
	// We have to adjust by the delta between the old and the new quantity.
	iDelta = iSupElQuanNew - iSupElQuanOld;
	// It depends on the 'direction', in which the items has been rescheduled.
	if (dSupElDateOld < dSupElDateNew) {
		// If the item has been rescheduled to the 'back', increase the quantity of of all supply demand items
		// below the new/target date
		for ( var i = 0; i < this._aSupDemItems.length; i++) {
			var object = this._aSupDemItems[i];
			object.Index = i + 1;
			if (!this.isItemStockLine(object)) {
				if (!this.isShortageIntervalDefined() || this.isItemInShortageInterval(object)) {
					// Increase all supply demand items below the new date
					if (object.MRPElementAvailyOrRqmtDate >= dSupElDateNew) {
						object.MRPAvailableQuantity += iDelta;
					}
				}
			}
		}
	} else {
		// If the item has been rescheduled to the 'front', increase the quantity of of all supply demand items
		// below the old/source date
		for ( var i = 0; i < this._aSupDemItems.length; i++) {
			var object = this._aSupDemItems[i];
			object.Index = i + 1;
			if (!this.isItemStockLine(object)) {
				if (!this.isShortageIntervalDefined() || this.isItemInShortageInterval(object)) {
					// Increase all supply demand items below the old date
					if (object.MRPElementAvailyOrRqmtDate >= dSupElDateOld) {
						object.MRPAvailableQuantity += iDelta;
					}
				}
			}
		}
	}
};

/**
 * This method returns all supply demand items that belong to a given supply demand item
 * 
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.getSDItemsForShortage = function(oSupDemItem, oModelData) {

	var oSDItem = {};
	var aSDItem = [];

	for ( var sKey in oModelData) {
		if (oModelData.hasOwnProperty(sKey)) {
			if (sKey.substr(0, 17) == "SupplyDemandItems") {

				oSDItem = oModelData[sKey];

				if ((oSDItem.MRPPlant === oSupDemItem.MRPPlant) && (oSDItem.MaterialID === oSupDemItem.MaterialID)
						&& (oSDItem.MRPArea === oSupDemItem.MRPArea) && (oSDItem.MRPPlant === oSupDemItem.MRPPlant)
						&& (oSDItem.MRPPlanningSegmentType === oSupDemItem.MRPPlanningSegmentType)
						&& (oSDItem.MRPPlanningSegmentNumber === oSupDemItem.MRPPlanningSegmentNumber)) {

					aSDItem.push(oSDItem);
				}
			}
		}
	}

	return aSDItem;
};

// ----------------------------------------------------------------------
// Preview for the CHART
// ----------------------------------------------------------------------

/**
 * This method converts the data of the OData model used for the views into data for a JSON model of the chart
 * 
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.formatChartDate = function(oDate) {
	var sDate = oDate.toString();
	if (sDate === "Invalid Date") {
		return sDate;
	} else {
		return oDate.toISOString();
	}
};

/**
 * This method converts the data of the OData model used for the views into data for a JSON model of the chart It
 * aggregates all supplies per day and all demands per day. It adds any missing dates within the time period of the data
 * in sSDItems, so the result contains one entry per day within this time period.
 * 
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.initialChartData = function(aSDItems, sDateFrom, sDateTo,
		iChartScrollPos) {

	// convert the supply and demand items of the original OData model
	// into
	// supplies and demands per day needed for the chart model

	// create an initial data object
	var oDateStart = new Date(sDateFrom);
	var oDateEnd = new Date(sDateTo);
	oDateEnd = new Date(oDateEnd.getTime() + 24 * 3600 * 1000);

	var oModelData = {
		shiftLeft : iChartScrollPos,
		decimals : 0,
		startBalance : 0,
		minStock : 0,
		safetyStock : 0,
		minDate : this.formatChartDate(oDateStart),
		maxDate : this.formatChartDate(oDateEnd),
		minDateOld : "", // old minimum date for resetting
		maxDateOld : "", // old minimum date for resetting
		oMinDate : oDateStart, // minimum date as object for later comparison
		oMaxDate : oDateEnd, // maximum date as object for later comparison
		chartData : [],
		deltas : []
	};

	// collect the supplies and demands per day and calculate the minimum
	// and
	// maximum date
	var l = (aSDItems && aSDItems.length) ? aSDItems.length : 0;
	var oSDItem;
	var oFlowsPerDay = {};
	var sDate = "";
	var oDate;
	var oMinDate = null;
	var oMaxDate = null;
	var fVal = 0;
	var fMinGreen = null;
	var fMaxYellow = null;
	var fMinYellow = null;
	var fMaxRed = null;

	for ( var i = 0; i < l; i++) {

		oSDItem = aSDItems[i];

		// get the quantity (the initial stock is delivered in a separate field)
		fVal = (i === 0) ? parseFloat(oSDItem.MRPAvailableQuantity) : parseFloat(oSDItem.MRPElementOpenQuantity);
		// get the date
		oDate = oSDItem.MRPElementAvailyOrRqmtDate;
		sDate = this.formatChartDate(oDate);

		if (!oMaxDate && oSDItem.MRPEvaluationHorizonInDays) {
			var iEvalHorizon = parseInt(oSDItem.MRPEvaluationHorizonInDays);
			oMaxDate = new Date(oDate.getTime() + iEvalHorizon * 24 * 3600 * 1000);
		}

		if (!oMinDate || (oDate < oMinDate)) {
			oMinDate = oDate;
		}
		if (!oMaxDate || (oDate > oMaxDate)) {
			oMaxDate = oDate;
		}

		if (i === 0) {
			oModelData.decimals = parseInt(oSDItem.TargetQuantityUnitDcmls);
			oModelData.startBalance = fVal;
			oModelData.minStock = parseFloat(oSDItem.MaterialShortageThresholdQty);
			oModelData.safetyStock = parseFloat(oSDItem.MaterialShortageCriticalQty);
		} else {
			if (!oFlowsPerDay[sDate]) {
				oFlowsPerDay[sDate] = {
					date : sDate,
					demand : 0,
					supply : 0,
					shortageAccepted : oSDItem.MRPAvailability === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED,
					shortageDefId : oSDItem.MaterialShortageDefinitionID
				};
			}
			if (fVal < 0) {
				oFlowsPerDay[sDate].demand += fVal;
			} else {
				oFlowsPerDay[sDate].supply += fVal;
			}
		}
	}

	// fill days without supply and demand between min and max date with
	// zero and
	// add all days into the chart data array
	if (oMinDate && oMaxDate) {

		var oLastShortage = {
			shortageAccepted : false,
			defId : ""
		};

		for ( var oDate = oMinDate; oDate <= oMaxDate; oDate = new Date(oDate.getTime() + 24 * 3600 * 1000)) {
			var sDate = this.formatChartDate(oDate);

			if (oFlowsPerDay[sDate]) {
				oLastShortage = {
					shortageAccepted : oFlowsPerDay[sDate].shortageAccepted,
					defId : oFlowsPerDay[sDate].shortageDefId
				};
				oModelData.chartData.push({
					date : oDate,
					demand : oFlowsPerDay[sDate].demand,
					supply : oFlowsPerDay[sDate].supply,
					shortageAccepted : oFlowsPerDay[sDate].shortageAccepted,
					shortageDefId : oFlowsPerDay[sDate].shortageDefId
				});
			} else {
				oModelData.chartData.push({
					date : oDate,
					demand : 0,
					supply : 0,
					shortageAccepted : oLastShortage.shortageAccepted,
					shortageDefId : oLastShortage.defId
				});
			}
		}
	}

	// return the data for the model
	return oModelData;
};

/**
 * This method returns the deltas that apply due to the selected solution card
 * 
 * @param oCard
 *          object representing the selected solution card. The object contains the relevant information for the preview
 *          data: <BR>
 *          -MaterialShortageSolutionType (optional - used to identify the algorithm of the preview
 *          create/reschedule/increase)<BR>
 *          -AvailabilityDate (old value for availability date)<BR>
 *          -ChangedAvailabilityDate (new value for availability date used for preview)<BR>
 *          -MRPElementOpenQuantity (old value for quantity)<BR>
 *          -MRPElementChangeOpenQuantity (new value for quantity used for preview)<BR>
 *          -MRPElementExternalID (used as key to find the active element in list)<BR>
 *          -MRPElementCategory (used as key to find the active element in list)<BR>
 *          -MRPElementItemExternalID (used as key to find the active element in list)<BR>
 *          -MRPElementScheduleLineExtID (used as key to find the active element in list)<BR>
 *          -MRPElementCategoryShortName (used as 3. sort criteria in the list)<BR>
 *          -MaterialID<BR>
 *          -Vendor (just for 'create' use case - used to set MRPElementBusinessPartner for the UI)<BR>
 *          -VendorName (just for 'create PO' use case - used to set MRPElementBusinessPartner for the UI)<BR>
 *          -SupplyingPlant (just for 'create TO' use case - used to set MRPElementBusinessPartner for the UI)<BR>
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.previewChartData = function(oCard) {

	var oDateOld = (oCard.AvailabilityDate) ? oCard.AvailabilityDate : oCard.ChangedAvailabilityDate;
	var oDateNew = oCard.ChangedAvailabilityDate;

	var sDateOld = this.formatChartDate(oDateOld);
	var fValOld = parseFloat(oCard.MRPElementOpenQuantity);
	var sDateNew = this.formatChartDate(oDateNew);
	var fValNew = parseFloat(oCard.MRPElementChangeOpenQuantity);

	// set deltas
	var aDeltas = [];
	if (sDateOld === sDateNew) {
		aDeltas = [{
			date : oDateOld,
			demand : (fValNew < 0) ? -fValOld + fValNew : 0,
			supply : (fValNew > 0) ? -fValOld + fValNew : 0
		}];
	} else {
		aDeltas = [{
			date : oDateOld,
			demand : (fValOld < 0) ? -fValOld : 0,
			supply : (fValOld > 0) ? -fValOld : 0
		}, {
			date : oDateNew,
			demand : (fValNew < 0) ? fValNew : 0,
			supply : (fValNew > 0) ? fValNew : 0
		}];
	}

	return {
		oPreviewDate : oDateNew,
		sPreviewDate : sDateNew,
		deltas : aDeltas
	};
};

/**
 * This method represents the template for the preview algorithm for supply demand items in the chart
 * 
 * @memberOf i2d.pp.mrpcockpit.reuse.util.CalculationEngine
 */
i2d.pp.mrpcockpit.reuse.util.CalculationEngine.prototype.previewChart = function() {

};

/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.Wave3Helper");

/**
 * This class encapsulates all methods which are only needed for Wave 3 All methods have to be called with context
 */
i2d.pp.mrpcockpit.reuse.util.Wave3Helper = {

	/**
	 * Calculates and returns the shortage period for wave 3 <br>
	 * This method was initially part of S3parent.js controller
	 */
	calcShortagePeriod : function(oDate) {

		var view = this.getView();
		var oData = view.getModel().oData;
		var oSDItemTable = this.getView().byId("SDItems");
		var aItems = (oSDItemTable) ? oSDItemTable.getItems() : [];
		var l = (aItems && aItems.length) ? aItems.length : 0;
		var oItem;
		var shortageItem;
		var firstDate = null;
		var lastDate = null;

		for ( var i = 1; i < l; i++) {
			// get item from the model
			oItem = oData[aItems[i].getBindingContext().getPath().slice(1)];

			if (oItem.MRPElementAvailyOrRqmtDate < oDate) {
				// get first date on or before the given date so that the
				// stock is always below zero until the given date
				if (i2d.pp.mrpcockpit.reuse.util.Wave3Helper.isShortage.call(this, oItem)) {
					shortageItem = oItem;
					firstDate = (!firstDate) ? oItem.MRPElementAvailyOrRqmtDate : firstDate;
				} else if (!i2d.pp.mrpcockpit.reuse.util.Wave3Helper.isShortage.call(this, oItem)) {
					firstDate = null;
					shortageItem = null;
				}
			} else if (oItem.MRPElementAvailyOrRqmtDate.getTime() == oDate.getTime()) {
				shortageItem = oItem;
				firstDate = (!firstDate) ? oItem.MRPElementAvailyOrRqmtDate : firstDate;
			} else {
				// get the last date on or after the given date so that th
				// stock is always below zero until that date
				if (i2d.pp.mrpcockpit.reuse.util.Wave3Helper.isShortage.call(this, oItem)) {
					firstDate = (!firstDate) ? oItem.MRPElementAvailyOrRqmtDate : firstDate;
				} else {
					lastDate = new Date(oItem.MRPElementAvailyOrRqmtDate.getTime() - 24 * 3600 * 1000);
					break;
				}
			}
		}

		// if no start date is found, the date of the initial stock must be
		// the start date
		if (!firstDate && (l > 0)) {
			oItem = oData[aItems[0].getBindingContext().getPath().slice(1)];
			shortageItem = oItem;
			firstDate = oItem.MRPElementAvailyOrRqmtDate;
		}
		// if no end date is found, the shortage last til infinite
		if (!lastDate) {
			lastDate = new Date();
			// set 31.12.9999 in UTC (december = 11)
			lastDate.setUTCFullYear(9999);
			lastDate.setUTCMonth(11);
			lastDate.setUTCDate(31);
			lastDate.setUTCHours(0);
		}

		return {
			shortageItem : shortageItem,
			firstDate : firstDate,
			lastDate : lastDate
		};
	},

	/**
	 * Returns whether there is a shortage for the passed item or not<br>
	 * This method was initially part of S3parent.js controller
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.Wave3Helper
	 * @param oItem
	 */
	isShortage : function(oItem) {
		return (oItem.MRPAvailability !== i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE);
		// if status shall not be used, compare oItem.MRPAvailableQuantity with the new treshhold amounts instead
	},

	/**
	 * Create path for solution view call <br>
	 * This method was initially part of S4parent.js controller
	 * 
	 * @memberOf S4
	 */
	getPathSolutionView : function() {
		var path = "/PPMRPSolHeaders(";
		path += "MaterialID='" + encodeURIComponent(this.navParameter.MaterialID);
		path += "',MRPPlant='" + encodeURIComponent(this.navParameter.MRPPlant);
		path += "',MRPArea='" + encodeURIComponent(this.navParameter.MRPArea);
		path += "',MRPPlanningSegmentType='" + encodeURIComponent(this.navParameter.MRPPlanningSegmentType);
		path += "',MRPPlanningSegmentNumber='" + encodeURIComponent(this.navParameter.MRPPlanningSegmentNumber);
		path += "',MaterialShortageDefinitionID='" + encodeURIComponent(this.navParameter.MaterialShortageDefinitionID);
		path += "',MaterialShortageStartDate=datetime'" + encodeURIComponent(this.dateStart);
		path += "',MaterialShortageEndDate=datetime'" + encodeURIComponent(this.dateEnd);
		path += "')";
		return path;
	},

	/**
	 * Returns the template for the list (Supply Demand Items)
	 * 
	 * @memberOf S4parent
	 */
	_getListTemplate : function(sId, oContext) {

		// The sId contains the view name. We use this name to get the
		// reference to that view and therefore its controller.
		// We need the controller because there's defined whether to make the change request icon clickable or not
		var bClickable = true; // Default
		var oCore = sap.ui.getCore();
		var id = sId.split("--")[0];
		var oView = oCore.getElementById(id);
		if (oView) {
			bClickable = oView.getController()._bCrIconClickable;
		}

		// Prepare the icon for the change request
		var oIconCr = new sap.ui.core.Icon(
				{
					visible : "{parts: [{path:'SolutionRequestStatus'}, {path:'MRPElementCategory'}, {path:'MRPElementOpenQuantity'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getChangeRequestVisibility'}",
					src : "sap-icon://request",
					tooltip : "{parts: [{path:'SolutionRequestStatus'}, {path:'VendorResponse'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getChangeRequestTooltip'}"
				});

		// Decide whether to make the change request icon clickable
		if (bClickable === true) {
			// Attach the press event handler to the icon
			oIconCr.attachPress(function(evt) {
				// Navigate to the Change Request App
				var sError = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.onCRPressed(evt);
				// Error handling for the navigation
				if (sError) {
					sap.ca.ui.message.showMessageBox({
						type : sap.ca.ui.message.Type.ERROR,
						message : sError
					});
				}
			});
		}

		// Prepare the icons for the indicator
		var oIconIndicator = new sap.ui.core.Icon(
				{
					visible : "{parts: [{path:'MRPElementQuantityIsFirm'}, {path:'MRPElementIsReleased'}, {path:'MRPElementIsPartiallyDelivered'}, {path:'MRPElementCategory'}, {path:'MRPElementOpenQuantity'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconSolViewVisible'}",
					tooltip : "{parts: [{path:'MRPElementQuantityIsFirm'}, {path:'MRPElementIsReleased'}, {path:'MRPElementIsPartiallyDelivered'}, {path:'MRPElementCategory'}, {path:'MRPElementOpenQuantity'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconSolViewTooltip'}",
					src : "{parts: [{path:'MRPElementQuantityIsFirm'}, {path:'MRPElementIsReleased'}, {path:'MRPElementIsPartiallyDelivered'}, {path:'MRPElementCategory'}, {path:'MRPElementOpenQuantity'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconSolView'}"
				});

		// Build the main ColumnListItem for the supply demand items
		var oTemplate = new sap.m.ColumnListItem(
				{
					unread : false,
					cells : [
							// Date
							new sap.m.Label(
									{
										text : "{path: 'MRPElementAvailyOrRqmtDate', type:'sap.ca.ui.model.type.Date', formatOptions: {style:'short'}}",
										visible : "{path:'MRPElementCategory', formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isSupplyDemandItem'}",
										customData : [new sap.ui.core.CustomData(
												{
													key : "hideStockDate",
													value : "{parts: [{path:'MRPElementCategory'},{path:'MRPElementAvailyOrRqmtDate'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hideStockDate'}"
												})]
									}),
							// Indicators
							new sap.ui.layout.HorizontalLayout({
								content : [oIconIndicator, oIconCr]
							}),
							// MRP Element
							new sap.m.ObjectIdentifier(
									{
										title : "{parts:[{path: 'NumberOfRequirements'}, {path: 'MRPElementCategory'}, {path: 'MRPElementCategoryShortName'}, {path: 'MRPElement'}, {path: 'MRPElementItem'}, {path: 'MRPElementDocumentType'}, {path: 'SourceMRPElementCategory'}, {path: 'SourceMRPElement'}, {path: 'SourceMRPElementItem'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getRequirements'}",
										text : "{parts:[{path: 'NumberOfRequirements'}, {path: 'MRPElementCategory'}, {path: 'MRPElementBusinessPartnerName'}, {path: 'MRPElementBusinessPartnerType'}, {path: 'MRPElementBusinessPartnerID'}, {path: 'MRPElementDocumentType'}, {path: 'Assembly'}, {path: 'MaterialSafetyStockQty'}, {path: 'TargetQuantityUnitDcmls'}, {path: 'UnitOfMeasureTechnicalName'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.vendorOrReq'}"
									}),
							// Quantity
							new sap.ui.layout.HorizontalLayout(
									{
										content : [

												// Status Error
												new sap.m.ObjectStatus(
														{
															icon : "{parts:[{path: 'MRPElementOpenQuantity'}, {path: 'MRPElementCategory'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.sditemicon'}",
															state : "{parts:[{path: 'MRPElementOpenQuantity'}, {path: 'MRPElementCategory'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.sdIconState'}",
															tooltip : "{parts:[{path: 'MRPElementOpenQuantity'}, {path: 'MRPElementCategory'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.sditemtooltip'}"
														}),
												new sap.m.Text({
													width : "0.5rem"
												}),

												// Quantity
												new sap.m.ObjectNumber(
														{
															number : "{parts:[ {path: 'MRPElementOpenQuantity'}, {path: 'TargetQuantityUnitDcmls'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.quantity'}",
															numberUnit : "{UnitOfMeasureTechnicalName}",
															emphasized : false
														})]
									}).addStyleClass("sapMRPStockQty"),

							// Available
							new sap.m.ObjectNumber(
									{
										number : "{parts:[{path: 'MRPAvailableQuantity'}, {path: 'TargetQuantityUnitDcmls'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.numberFormat'}",
										numberUnit : "{UnitOfMeasureTechnicalName}",
										visible : "{path: 'StockQuantityVisible'}",
										customData : {
											Type : "sap.ui.core.CustomData",
											key : "getMergingKey",
											value : "{parts:[{path:'MRPElementCategory'}, {path: 'MRPElementAvailyOrRqmtDate'}, {path: 'MRPAvailableQuantity'}], formatter: 'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.availableQuantityMergingKey'}"
										}
									}).addStyleClass("sapMRPAvailableQuantity")]
				});

		var value = parseFloat(oContext.getProperty("MRPAvailableQuantity"));
		// below critical quantity, the material is below safety stock
		var valueCritical = parseFloat(oContext.getProperty("MaterialShortageCriticalQty"));
		// below threshold, the material is short
		var valueThreshold = parseFloat(oContext.getProperty("MaterialShortageThresholdQty"));
		// Get the current object that is used
		var oObject = oContext.getObject();

		// *******************************************************
		// Do the coloring of the supply demand items
		// *******************************************************
		// remove all style classes
		oTemplate.removeStyleClass("sapMRPShortage");
		oTemplate.removeStyleClass("sapMRPShortageSolved");
		oTemplate.removeStyleClass("sapMRPElementChanged");
		oTemplate.removeStyleClass("sapMRPShortageAccepted");
		oTemplate.removeStyleClass("sapMRPShortageSafetyStock");

		if (oObject.MRPAvailability === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED) {
			// Shortage was accepted.
			oTemplate.addStyleClass("sapMRPShortageAccepted");

		} else {
			// Standard behavior we are either in the initial call or in the preview.
			if (oObject.ChangedMrpElement && oObject.ChangedMrpElement === true) {
				// This is the changed element in the preview. It will be highlighted separately.
				oTemplate.addStyleClass("sapMRPElementChanged");
			} else if ((value < valueThreshold)) {
				// material is short, below the threshold.
				oTemplate.addStyleClass("sapMRPShortage");
			} else if (value < valueCritical) {
				// Value is below safety stock
				oTemplate.addStyleClass("sapMRPShortageSafetyStock");
			} else if ((value >= valueCritical) && (oObject.InitialShortage && oObject.InitialShortage === true)) {
				// This element was initially below safety stock but has been increased in the preview.
				oTemplate.addStyleClass("sapMRPShortageSolved");
			}
		}

		return oTemplate;
	},

	/**
	 * Search for an element with ID == stockElementId in the subtree of the elements in <code>contentArray</code>. Set
	 * the safety stock as text attribute of the found element. We search just for the first occurrence of
	 * <code>stockElementId</code>.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.Wave3Helper
	 */
	_writeSafetyStock : function(contentArray, safetyStockText, stockElementId) {
		for ( var cellIndex = 0; cellIndex < contentArray.length; cellIndex++) {
			if (contentArray[cellIndex].getId().indexOf(stockElementId) != -1) {
				// stock element found, set safety stock
				contentArray[cellIndex].setText(safetyStockText);
				return true;
			}
			// search for stock element in child elements
			if (contentArray[cellIndex].getContent
					&& this._writeSafetyStock(contentArray[cellIndex].getContent(), safetyStockText, stockElementId)) {
				// stock element found in one of the children, so we are done
				return true;
			}
		}
		// indicate that we did not find the stock element in the given array (and its child elements)
		return false;
	},

	/**
	 * Determines the safety stock from the binding context of the supply/demand item table and writes the safety stock
	 * into the stock line.
	 * 
	 * @param oView -
	 *          the S3 view
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.Wave3Helper
	 */
	determineAndWriteSafetyStock : function(oView) {
		// the sd items table of s3
		var supDemTable = oView.byId("SDItems");
		// all sup dem Items in s3
		var supDemItemsS3 = supDemTable.getItems();
		// the row of the sup dem item of s3
		var supDemItemS3;
		// the business object of one sup dem item of s3
		var supDemItemS3Object;
		// the resource bundle
		var i18nModel = oView.getModel("Common_i18n");
		var oBundleCommon = i18nModel.getResourceBundle();

		// If the detail screen is opened directly from a URL it may happen that the detail call
		// finishes before the master call has finished. In that case the supply/demand item table
		// has no binding context yet, and thus we cannot determine the safety stock here.
		// In that case we should remove the safety stock text entirely to avoid that
		// "No safety stock" is displayed which may be wrong. So if there is no binding context for
		// the supply/demand item table the following logic displays the initial value of
		// the variable safetyStockText which is set here:
		var safetyStockText = "";

		// Get selected Object in the master list
		var supDemTableBindingContext = supDemTable.getBindingContext();
		var selectedObjectS2 = (supDemTableBindingContext) ? supDemTableBindingContext.getObject() : null;
		if (selectedObjectS2) {
			// check if there is a safety stock transferred by back end
			if (selectedObjectS2.MaterialSafetyStockQty && Number(selectedObjectS2.MaterialSafetyStockQty) !== 0.0) {
				// format the quantity
				var safetyStockValue = sap.ca.ui.model.format.NumberFormat.getInstance({
					decimals : selectedObjectS2.TargetQuantityUnitDcmls
				}).format(selectedObjectS2.MaterialSafetyStockQty);
				// create the text to display
				safetyStockText = oBundleCommon.getText("SAFETY_STOCK", [safetyStockValue,
						selectedObjectS2.UnitOfMeasureTechnicalName]);
			} else {
				safetyStockText = oBundleCommon.getText("NO_SAFETY_STOCK");
			}
		}

		// loop over all items in the list in order to set the safety stock
		for ( var supDemItemsS3Index = 0 in supDemItemsS3) {
			supDemItemS3 = supDemItemsS3[supDemItemsS3Index];
			// read the corresponding business object
			supDemItemS3Object = supDemItemS3.getBindingContext().getObject();
			// check if current item is the stock
			if (supDemItemS3Object.MRPElementCategory === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK) {
				// read all cells of the current item
				var elementCells = supDemItemsS3[supDemItemsS3Index].getCells();
				// find the stock element cell and set the safety stock text
				this._writeSafetyStock(elementCells, safetyStockText, "stockElement");
				// we have found the stock row and do not need to loop over the whole table
				break;
			}
		}
	}
};

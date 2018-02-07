/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
// add required libs
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CalculationEngine");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Helper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CollaborationHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.QuickViewHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Wave3Helper");

sap.ca.scfld.md.controller.BaseDetailController.extend("i2d.pp.mrpcockpit.reuse.view.S3parent", {

	constructor : function() {

		sap.ca.scfld.md.controller.BaseDetailController.apply(this, arguments);

		// remember the base class onInit implementation to execute it later
		var onInit = this.onInit;

		this.onInit = function() {
			// Initialize the i18n model before the oData model is initialized by the base controller onInit
			// this is important to avoid "i18n model not initialized" errors in the formatters
			var oBundle = new sap.ui.model.resource.ResourceModel({
				bundleName : "i2d.pp.mrpcockpit.reuse.i18n.i18n"
			});
			// get the versions model (that was initialized in s2.parent controller) and bind it to the view
			var oVersion = this.oApplicationImplementation.getApplicationModel("ServiceVersions");
			this.getView().setModel(oVersion, "ServiceVersions");
			this.getView().setModel(oBundle, "Common_i18n");

			onInit.apply(this, arguments);
		};

	},

	/**
	 * This method is called by the framework when initializing the S3 view.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	onInit : function() {

		// do the Supply Demand Items Table binding dynamically (e.g. to {Material_To_SupplyDemandItems})
		var sdItemTable = this.getView().byId("SDItems");
		var oTemplate = sdItemTable.getItems()[0];
		sdItemTable.removeItem(oTemplate);

		// old solution
		/*
		 * sdItemTable.bindAggregation("items", { path : this.getDetailListNavProperty(), template : oTemplate });
		 */

		// reserved for a new button design
		// (factory pattern to add class to a table row during binding)
		sdItemTable.bindAggregation("items", this.getDetailListNavProperty(), function(sId, oCtx) {
			var oClone = oTemplate.clone(sId);

			var value = parseFloat(oCtx.getProperty("MRPAvailableQuantity"));
			// below critical quantity, the material is below safety stock
			var valueCritical = parseFloat(oCtx.getProperty("MaterialShortageCriticalQty"));
			// below threshold, the material is short
			var valueThreshold = parseFloat(oCtx.getProperty("MaterialShortageThresholdQty"));
			// Get the current object that is used
			var oObject = oCtx.getObject();
			
			// remove all style classes
			oClone.removeStyleClass("sapMRPShortage");
			oClone.removeStyleClass("sapMRPShortageSolved");
			oClone.removeStyleClass("sapMRPElementChanged");
			oClone.removeStyleClass("sapMRPShortageAccepted");
			oClone.removeStyleClass("sapMRPShortageSafetyStock");
			
			if (oObject.MRPAvailability === i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED) {
				// Shortage was accepted.
				oClone.addStyleClass("sapMRPShortageAccepted");

			} else {
				// Standard behavior we are either in the initial call or in the preview.
				if (oObject.ChangedMrpElement && oObject.ChangedMrpElement === true) {
					// This is the changed element in the preview. It will be highlighted separately.
					oClone.addStyleClass("sapMRPElementChanged");
				} else if ((value < valueThreshold)
						&& (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(oObject.MRPElementCategory) || (Number(oObject.MRPElementOpenQuantity) < 0))) {
					// material is short, below the threshold AND (is the stock item or item is a requirement)
					oClone.addStyleClass("sapMRPShortage");
				} else if ((value < valueCritical)
						&& (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(oObject.MRPElementCategory) || (Number(oObject.MRPElementOpenQuantity) < 0))) {
					// Value is below safety stock AND (is the stock item or item is a requirement)
					oClone.addStyleClass("sapMRPShortageSafetyStock");
				} else if ((value >= valueCritical) && (oObject.InitialShortage && oObject.InitialShortage === true)) {
					// This element was initially below safety stock but has been increased in the preview.
					oClone.addStyleClass("sapMRPShortageSolved");
				}
			}
			
			return oClone;
		});

		// set Navigation Button on page
		var oPage = this.getView().getContent()[0];
		oPage.setShowNavButton(jQuery.device.is.phone);
		// Register the handler for routing events
		this.oRouter.attachRoutePatternMatched(this._onRoutePatternMatched, this);
		// Initialize the chart
		this.initChart();
		this.resizeHandlerParent = [];
		this.resizeHandlerPage = [];
		this.resizeTimer = [];
		this.isChartVisible = false;
		// handle special logic of s3 for master list refresh
		this.oApplicationFacade.registerOnMasterListRefresh(this.onMasterRefresh, this);

		// if we are not on desktop we do not show the display fact sheet button
		if (!sap.ui.Device.system.desktop) {
			var factSheetButton = this.getView().byId("factSheetButton");
			if (factSheetButton !== undefined) {
				factSheetButton.setVisible(false);
			}
		}

		var changedItems = null;
		changedItems = this.oApplicationFacade.getApplicationModel("changedItems");
		if (!changedItems) {
			changedItems = new sap.ui.model.json.JSONModel();
			this.oApplicationFacade.setApplicationModel("changedItems", changedItems);
		}

	},

	/**
	 * Subscribe events that are used for the communication between this controller (S3) and the solution dialogs called
	 * via QuickView
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	_subscribeEvents : function() {
		var bus = sap.ui.getCore().getEventBus();
		// --------------------------------------
		// Subscribe events for the current view
		// --------------------------------------
		bus.subscribe(i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED,
				i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_OK, this._onDataChanged, this);

	},

	/**
	 * Unsubscribe events that have been registered before. Info: Required in context of Fiori Launchpad when single apps
	 * can be run several times. We run into major problems if events haven't been removed correctly!
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	_unsubscribeEvents : function() {
		var bus = sap.ui.getCore().getEventBus();
		// De-Register first
		bus.unsubscribe(i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED,
				i2d.pp.mrpcockpit.reuse.util.CommonConstants.EVENT_EVENTID_OK, this._onDataChanged, this);

	},

	/**
	 * Handles the OK-Event of the closing solution dialog
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	_onDataChanged : function(channelId, eventId, data) {
		if (data && data.model.cardModel) {
			var msg;
			if (data.model.cardModel.oData.msg) {
				msg = data.model.cardModel.oData.msg;
			} else {
				msg = "Data has been saved.";
			}
			// Show the message toast
			sap.ca.ui.message.showMessageToast(msg);
			// set the context and force a backend call to update the data
			this.refreshSDList();
		}
	},

	/**
	 * Handles the event MasterRefresh; This allows us to reload the master list only when the user has explicitly
	 * refreshed it or for a navigation
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 * @param oEvent
	 */
	onMasterRefresh : function(oEvt) {
		if (oEvt.getParameter("bManualRefresh") === true) {
			// a master List refresh was triggered by clicking the refresh button or doing a "pull to refresh"
			if (oEvt.getParameter("bAutoNavigation") === true) {
				// the master list refresh caused a navigation to the detail screen
			} else {
				// no navigation to the detail screen happened because the correct detail was already displayed
				// set the context and force a backend call
				this.refreshSDList();

				// change also the header of the detail view
				this._changeModel();
			}
		} else {
			// a master list refresh was done by the scaffolding e.g. during a back end search or after getting items
			// of a growing list
		}

		// highlight the currently selected master list record in the supply demand item list
		if (this.sdItemHighlightingNeeded) {
			this._highlightSdItemTableRecord.call(this);
		}

	},

	/**
	 * Highlights the currently active master list record in the supply demand items table in case the app was called by a
	 * deep link url, the detail and the master call are triggered in parallel and the detail call might be back earlier,
	 * therefore we potentially have to highlight the selection of the supply demand item list as soon as the master call
	 * is back
	 */
	_highlightSdItemTableRecord : function() {

		var sdItems = this.getView().byId("SDItems");
		var bindingContext = sdItems.getBindingContext();

		// object contains the data of entry that is currently
		// selected in the master list
		var object = bindingContext.getObject();

		// comparing the items only makes sense when there is a master list items
		// sometimes there is no master list item, e.g. we use a direct link to the app
		// which also contains the binding context of the detail view and the detail
		// view data is loaded before the master list is loaded. In this case no item is marked
		if (object !== undefined) {

			// coloring of the selected item
			var aItems = sdItems.getItems();

			var itemObject = null;
			var i;
			for (i = 0; i < aItems.length; i++) {

				itemObject = aItems[i].getBindingContext().getObject();

				// call app specific object compare functions (see app's S3 controller)
				if (this.compareKeys(itemObject, object)) {
					aItems[i].addStyleClass("sapMRPSDItemSelected");

					// future requirement
					// scroll to selected uncovered demand item in s3 table
					// var domref = aitems[i].getdomref();
					// if (!sap.ui.device.support.touch && domref !== null) {
					// domref.scrollintoview(true);
					// }
				} else {
					aItems[i].removeStyleClass("sapMRPSDItemSelected");
				}
			}
		}

	},

	/**
	 * Handles the event attachRoutePatternMatched; Sets BindingContext of the view to read/show the detail data belonging
	 * to the selected master list item by triggering an OData ("Detail")Call. Attention: This handler just ensures that
	 * the event belongs to ANY S3 detail view. But this handler cannot ensure that this event belongs to this particular
	 * S3 view. For this purpose, the sub-class controller has to take care for this condition and then just call this
	 * method if this check has been passed successfully. So normally this method in overwritten in the sub classes.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 * @param oEvent
	 */
	_onRoutePatternMatched : function(oEvent) {
		var oView = this.getView();
		// The name of the event is the indicator from where the event is triggered
		if (oEvent.getParameter("name") === i2d.pp.mrpcockpit.reuse.util.CommonConstants.ROUTING.DETAIL) {
			// Ensure that there is no handler registered for 'request completed'
			oView.getModel().detachRequestCompleted(this._onModelLoaded, this);
			// Register the handler for a OData data read
			oView.getModel().attachRequestCompleted(this._onModelLoaded, this);
			// De-Register first (just for safety reasons)
			this._unsubscribeEvents();
			// Register events
			this._subscribeEvents();
			// Set the context for the view
			var context = new sap.ui.model.Context(oView.getModel(), '/' + oEvent.getParameter("arguments").contextPath);
			oView.setBindingContext(context);
			// If the Material Info tab is available - read data
			var matInfoPage = this.getView().byId("infoTabContainer");
			if (matInfoPage !== undefined) {
				matInfoPage
						.bindElement('/' + oEvent.getParameter("arguments").contextPath + '/' + this.getInfoTabNavProperty());
			}

			// Save navParameters from configured "pattern" :
			this.navParameter = oEvent.getParameter("arguments");
			// decode attributes of navParameter
			for ( var index in this.navParameter) {
				this.navParameter[index] = decodeURIComponent(this.navParameter[index]);
			}

			// exchange the model JSON <--> ODATA depending on the availability
			this._changeModel();

		} else {
			// DE-Register the event handlers because we are leaving S3 now
			this._unsubscribeEvents();
			// Detach the handler if we leave the view...
			oView.getModel().detachRequestCompleted(this._onModelLoaded, this);
			// Destroy the Quick Views to avoid duplicate ID errors
			i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.destroyQuickViews(this);
		}
	},

	/**
	 * This method is used to navigate from S3 to S4
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 * @param oDate
	 */
	navToSolutionView : function(oDate) {
		// generically read the current binding context and create a navigation object based on the keys of the
		// masterlist
		var bindingContextObject = this.getView().getBindingContext().getObject();
		var navigationObject = {};
		var masterListKeys = this.oApplicationFacade.oApplicationImplementation.aMasterKeys;

		for ( var index in masterListKeys) {
			// because it is not allowed to have empty data we check this in and set a blank if there is no data for
			// an attribute
			if (bindingContextObject[masterListKeys[index]] !== "") {
				// only strings and not objects are allowed
				if (!(bindingContextObject[masterListKeys[index]] instanceof Date)) {
					navigationObject[masterListKeys[index]] = bindingContextObject[masterListKeys[index]];
				} else {
					// convert dates to string
					// remove the last 5 characters from the converted ISO string (2014-04-11T12:00:00.000Z)
					// we need to get rid of the Z as OData cannot handle that. Furthermore the milliseconds cannot
					// be handled by the Internet Explorer and are not necessary
					navigationObject[masterListKeys[index]] = bindingContextObject[masterListKeys[index]].toISOString().slice(0,
							-5);
				}
			} else {
				navigationObject[masterListKeys[index]] = " ";
			}
		}

		// add the attributes that are specific for s4
		var oChart = this.getView().byId("chart");
		navigationObject.ChartScrollPos = (oChart) ? oChart.getShiftLeft() : 0;
		// Set a navigation parameter that indicates whether S4 shall show the table or the chart after
		// initialization
		var oChartContainer = this.getView().byId("chartContainer");
		navigationObject.DisplayInChart = (oChartContainer.getVisible()) ? true : false;
		// Set the state parameter that contains the ID of the view state in the backend
		navigationObject.stateID = this.navParameter.stateID;
		// pass the detail list nav prob in order to read the data for the chart
		navigationObject.DetailListNavProperty = this.getDetailListNavProperty();

		// Pass the following values to the solution view:
		var routeName;

		var backendVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper
				.getServiceSchemaVersion(this.oApplicationFacade);

		if (backendVersion === 1) {

			// Wave 3
			routeName = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ROUTING.SUB_DETAIL_WAVE3;
			var oShortagePeriod = i2d.pp.mrpcockpit.reuse.util.Wave3Helper.calcShortagePeriod.call(this, oDate);
			// there is no shortage on the given date -> do nothing
			if (!oShortagePeriod.firstDate || !oShortagePeriod.lastDate || !oShortagePeriod.shortageItem) {
				return;
			}
			navigationObject.MaterialShortageStartDate = oShortagePeriod.firstDate.toISOString().slice(0, -5);
			navigationObject.MaterialShortageEndDate = oShortagePeriod.lastDate.toISOString().slice(0, -5);

		} else {
			// Wave 5 ...
			routeName = i2d.pp.mrpcockpit.reuse.util.CommonConstants.ROUTING.SUB_DETAIL;

			// The SelectedSupDemItemDate is the date of the supply demand item that was selected in order to
			// navigate to the solution view.
			// we remove the last 5 characters from the converted ISO string (2014-04-11T12:00:00.000Z)
			// we need to get rid of the Z as OData cannot handle that. Furthermore the milliseconds cannot
			// be handled by the Internet Explorer and are not necessary
			navigationObject.SelectedSupDemItemDate = oDate.toISOString().slice(0, -5);
		}

		// we have to encode the attributes of navigationObject
		for ( var attribute in navigationObject) {
			navigationObject[attribute] = encodeURIComponent(navigationObject[attribute]);
		}

		var bReplace = !jQuery.device.is.phone;
		this.oRouter.navTo(routeName, navigationObject, bReplace);

	},

	/**
	 * This method is the handler for the stock control click event. It extracts the Availability Date from the selected
	 * supply demand item and starts the navigation to the solution view
	 * 
	 * @param oEvent
	 * @memberOf i2d.pp.changerequest.details.view.S3parent
	 */
	selectShortage : function(oEvent) {
		var oTableItem = oEvent.getSource();
		var oContext = oTableItem.getBindingContext();
		var oSDItem = oContext.getObject();
		var oDate = oSDItem.MRPElementAvailyOrRqmtDate;
		if (oDate) {
			this.navToSolutionView(oDate);
		}
	},

	/**
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 * @param oEvent
	 */
	selectShortageInChart : function(oEvent) {
		var oEventDate = oEvent.getParameter("date");
		if (oEventDate) {
			this.navToSolutionView(oEventDate);
		}
	},

	/**
	 * Handles the event Model Loaded
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 * @param oEvent
	 */
	_onModelLoaded : function(oEvent) {
		// If the model for a Quick View has been loaded we have to open the Quick View popover here
		var sURL = oEvent.getParameter("url");
		var iIndex = sURL.indexOf("QuickViews");
		if (iIndex >= 0) {
			var oMrpElementData = this._oSelectedMRPElementItem.getBindingContext().getObject();
			var oError = oEvent.getParameter("errorobject");
			if (oError) {
				var oBundle = this.getView().getModel("Common_i18n").getResourceBundle();
				var sErrorText = i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromStream(oBundle, oError.responseText);
				// remove error code from error message and show the error message in a message box
				sErrorText = sErrorText.replace("@QuickView@", "");
				sap.ca.ui.message.showMessageBox({
					type : sap.ca.ui.message.Type.ERROR,
					message : sErrorText
				});
				return;
			} else {
				// Link the popover to the control which has been clicked
				var quickViewName = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper
						.getQuickViewFragment(oMrpElementData.MRPElementCategory);
				var quickView = this._oQuickViewContainer[quickViewName];
				// set the icon and the visibility for the quick edit button
				var quickViewObject = quickView.getBindingContext().getObject();
				var crExisting = i2d.pp.mrpcockpit.reuse.util.CommonFormatter
						.getChangeRequestVisibility(quickViewObject.SolutionRequestStatus);
				var editAllowed = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper
						.isEditAllowed(quickViewObject.QuickviewCategory);
				var editButton = quickView.getBeginButton();
				if (editButton) {
					if (crExisting) {
						if (this._isNavToCrAppAllowed()) {
							editButton.setProperty("icon", "sap-icon://request");
							editButton.setProperty("visible", editAllowed);
						} else {
							editButton.setProperty("visible", false);
						}
					} else {
						editButton.setProperty("icon", "sap-icon://edit");
						editButton.setProperty("visible", editAllowed);
					}
				}else{
				  //set "EditButton" of PurchaseOrderQuickView visible
					if(editAllowed && this.getView().sViewName !== "i2d.pp.changerequest.details.view.S4"){
					quickView.getFooter().getContent()[0].setVisible(true);
					}
				}
				quickView.openBy(this._oSelectedMRPElementItem);
				return;
			}
		}

		// ***************
		// * Set Safety Stock (wave 3 functionality, with wave 5 the safety stock is part of the details call)
		// ***************
		// get the service schema version to check if the following coding has to be executed to set the safety
		// stock (wave 3)
		// or not (wave 5)
		var iServiceSchemaVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper
				.getServiceSchemaVersion(this.oApplicationFacade);

		if (iServiceSchemaVersion === 1) { // wave 3
			i2d.pp.mrpcockpit.reuse.util.Wave3Helper.determineAndWriteSafetyStock(this.getView());
		}

		this.writeDetailListTitle();

		// ***************
		// * update chart
		// ***************
		// check if it shall be possible to navigate into the solution view
		var bDecisionSupport = false;
		var backendVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper
				.getServiceSchemaVersion(this.oApplicationFacade);
		var oSDItemTable = this.getView().byId("SDItems");
		if (oSDItemTable) {
			var oSdItems = oSDItemTable.getItems();
			for ( var iSdItemIndex = 0 in oSdItems) {
				var oSdItem = oSdItems[iSdItemIndex].getBindingContext().getObject();
				if (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.allowSolutionNavigation(oSdItem.MRPAvailability,
						oSdItem.MRPElementCategory, oSdItem.DecisionSupport, backendVersion) === true) {
					bDecisionSupport = true;
					break;
				}
			}
		}
		var oChart = this.getView().byId("chart");
		oChart.setProperty("allowNavigation", bDecisionSupport, true);

		this.setChartData();

		// highlight the currently selected master list record in the supply demand item list
		if (this.sdItemHighlightingNeeded) {
			this._highlightSdItemTableRecord.call(this);
		}
	},

	/**
	 * Write the detail list title <br>
	 * Since Wave 5 the backend provides the shortage count and the frontend appends this shortage count to the detail
	 * list title for all apps <br>
	 * Till Wave 4 setting the detail list title was app specific<br>
	 * 130: append material name/id to the title <br>
	 * 230: calculate the shortage count on the frontend and append it to the detail list title
	 */
	writeDetailListTitle : function() {

		var title;
		var backendVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper
				.getServiceSchemaVersion(this.oApplicationFacade);

		if (backendVersion === 1) {

			// Wave 3
			if (this.getDetailListTitle) {
				title = this.getDetailListTitle();
			} else {
				// Wave 5 App executed with wave 3 backend -> stop!
				return;
			}

		} else {

			// >= Wave 5
			var shortageCount = 0;
			var length = 0;
			var aItems = [];
			var oItem;

			// get items of detail list
			var oSDItemTable = this.getView().byId("SDItems");

			if (oSDItemTable) {
				aItems = oSDItemTable.getItems();
				if (aItems && aItems.length) {
					length = aItems.length;
				}
			}

			// determine number of shortages
			var i;
			for (i = 0; i < length; i++) {
				// get item from the model
				oItem = aItems[i].getBindingContext().getObject();

				if (oItem.ShortageCount > shortageCount) {
					shortageCount = oItem.ShortageCount;
				}
			}

			var oBundle = this.getView().getModel("Common_i18n").getResourceBundle();
			title = oBundle.getText("DETAIL_LIST_TITLE", [shortageCount]);
		}

		// update toolbar title with number of shortages
		var oToolbar = this.getView().byId("panel").getHeaderToolbar();
		if (oToolbar) {
			//oToolbar.mAggregations.content[0].setTitle(title);
		  oToolbar.getContent()[0].setTitle(title);
		}

	},

	/**
	 * This method is the handler to switch from table to the chart view
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	switchToChart : function() {
		// Set the member indicating that the chart is visible - used in the preview
		this.isChartVisible = true;
		// View/Hide the appropriate container for the current selection
		this.getView().byId("chartContainer").setVisible(true);
		this.getView().byId("SDItems").setVisible(false);
	},

	/**
	 * This method is the handler to switch from chart to the table view
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	switchToTable : function() {
		// Set the member indicating that the chart is NOT visible - used in the preview
		this.isChartVisible = false;
		// View/Hide the appropriate container for the current selection
		this.getView().byId("chartContainer").setVisible(false);
		this.getView().byId("SDItems").setVisible(true);
	},

	/**
	 * This method is the handler for the segmented button within the table toolbar that allows the user to switch between
	 * the table and the chart view
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	onToolbarIconSelect : function(oEvent) {
		var oSource = oEvent.getSource();
		var sButtonId = oSource.getSelectedButton();
		if (sButtonId.match("btnChart")) {
			// The chart button/icon has been pressed
			this.switchToChart();
		} else {
			// The table button/icon has been pressed
			this.switchToTable();
		}
	},

	/**
	 * This method initializes the chart
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	initChart : function() {
		// Add selection handlers to the chart control
		var oChart = this.getView().byId("chart");
		oChart.attachSelected(this.selectShortageInChart, this);
		// Set the model for the chart
		this.oChartModel = new sap.ui.model.json.JSONModel();
		// the model doesn't support passing the size limit directly with the constructor
		// (whyever), so we have to set it afterwards with a separate call
		this.oChartModel.setSizeLimit(10000);
		oChart.setModel(this.oChartModel);
		// Define the Template for the chart control
		var oChartValueTemplate = new i2d.pp.mrpcockpit.reuse.controls.ChartValue({
			date : "{date}",
			demand : "{demand}",
			supply : "{supply}",
			shortageAccepted : "{shortageAccepted}"
		});
		// oChart.setProperty("sizeDOMNodeId", this.getView().byId("pageChart").getId(), true);
		oChart.setProperty("height", "300px", true);
		oChart.setProperty("width", "100%", true);
		var noNavigationMessage = this.getView().getModel("Common_i18n").getResourceBundle().getText(
				"NO_NAVIGATION_TO_SOLUTION");
		oChart.setProperty("noNavigationText", noNavigationMessage, true);
		var balanceDotTooltip = this.getView().getModel("Common_i18n").getResourceBundle().getText("XTOL_BAL_DOT");
		oChart.setProperty("balanceDotTooltip", balanceDotTooltip);
		oChart.bindProperty("shiftLeft", "/shiftLeft");
		oChart.bindProperty("unitDecimals", "/decimals");
		oChart.bindProperty("startBalance", "/startBalance");
		oChart.bindProperty("minStock", "/minStock");
		oChart.bindProperty("safetyStock", "/safetyStock");
		oChart.bindValues("/chartData", oChartValueTemplate);
	},

	/**
	 * This method sets the initial chart data
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	setChartData : function() {
		// retrieve all relevant data from detail view
		var view = this.getView();
		var oData = view.getModel().oData;
		var oCalculationEngine = new i2d.pp.mrpcockpit.reuse.util.CalculationEngine(view.getModel("Common_i18n"));
		// retrieve all relevant data from detail view
		var aResult = [];
		var oTable = this.byId("SDItems");
		var aItems = (oTable) ? oTable.getItems() : [];
		var l = (aItems && aItems.length) ? aItems.length : 0;
		for ( var i = 0; i < l; i++) {
			var oItem = oData[aItems[i].getBindingContext().getPath().slice(1)];
			aResult.push(oItem);
		}
		// convert it into the model data for the chart model
		var oModelData = oCalculationEngine.initialChartData(aResult, this.dateStart, this.dateEnd, 0);
		this.oChartModel.setData(oModelData);
	},

	/**
	 * Navigate to the MM02 transaction
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 * @param oControlEvent
	 */
	navToMM02 : function(oControlEvent) {
		var materialID = this.getView().getBindingContext().getObject().MaterialID;
		var semanticObject = "MRPMaterial";
		var action = "changeMaterial";
		var params = {
			"Material" : materialID
		};
		i2d.pp.mrpcockpit.reuse.util.Helper.factsheetNavigate(semanticObject, action, params);
	},

	/**
	 * Navigate to the MD04 transaction
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 * @param oControlEvent
	 */
	navToMD04 : function(oControlEvent) {
		var material = this.getView().getBindingContext().getObject();
		var materialID = material.MaterialID;
		var mrpArea = material.MRPArea;
		var plant = material.MRPPlant;
		var semanticObject = "MRPMaterial";
		var action = "showStockRequirementsList";
		var params = {
			"Material" : materialID,
			"MRPPlant" : mrpArea,
			"MRPArea" : plant
		};
		i2d.pp.mrpcockpit.reuse.util.Helper.factsheetNavigate(semanticObject, action, params);
	},

	/**
	 * Navigate to the corresponding display transaction
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	navToTransaction : function(evt) {
		var oData = evt.getSource().getBindingContext().getObject();

		var semanticObject = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getSemanticObject(oData.QuickviewCategory);
		var action = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getTransactionAction(oData.QuickviewCategory);
		var params = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getNavigationParameter(oData.QuickviewCategory,
				oData.MRPElement, ' ', oData.PlannedOrder);

		i2d.pp.mrpcockpit.reuse.util.Helper.factsheetNavigate(semanticObject, action, params);
	},

	/**
	 * Navigate to the corresponding fact sheet
	 */
	navToFactsheet : function(evt) {
		var oData = evt.getSource().getBindingContext().getObject();

		var semanticObject = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getSemanticObject(oData.QuickviewCategory);
		var action = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getFactsheetAction(oData.QuickviewCategory);
		var params = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getNavigationParameter(oData.QuickviewCategory,
				oData.MRPElement, oData.MRPElementItem, oData.PlannedOrder);

		i2d.pp.mrpcockpit.reuse.util.Helper.factsheetNavigate(semanticObject, action, params);
	},
	
	/**
	 * Navigate to the corresponding PO App or transaction
	 */
	navToPODestination: function(evt) {
		
		var oPO = evt.getSource().getBindingContext().getObject();
		
		var iVersion = this.getView().getModel('ServiceVersions').getData().iServiceSchemaVersion;
		if(iVersion === i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S) {
		/** Navigate to App */
			i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.navToPOApp(oPO);
		} else {
		/** Navigate to transaction */
			this.navToTransaction(evt);			
		}	
	},	
	
	/**
	 * Navigate to the corresponding Sales order App or transaction
	 */
	navToSODestination: function(evt) {
		
		var oSO = evt.getSource().getBindingContext().getObject();
		
		var iVersion = this.getView().getModel('ServiceVersions').getData().iServiceSchemaVersion;
		if(iVersion === i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S) {
		/** Navigate to App */				
			i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.navToSOApp(oSO);			
		} else {
		/** Navigate to transaction */
			this.navToTransaction(evt);			
		}	
	},		

	/**
	 * This method opens a fact sheet.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	openFactSheetActionSheet : function(evt) {
		// create action sheet only once
		if (!this._actionSheet) {
			this._actionSheet = new sap.m.ActionSheet({
				title : "",
				showCancelButton : false,
				placement : sap.m.PlacementType.Top,
				buttons : [new sap.m.Button({
					icon : "sap-icon://popup-window",
					text : "{Common_i18n>MD04}",
					press : jQuery.proxy(this.navToMD04, this)
				}), new sap.m.Button({
					icon : "sap-icon://popup-window",
					text : "{Common_i18n>MM02}",
					press : jQuery.proxy(this.navToMM02, this)
				})]
			});
			// set i18n
			this._actionSheet.setModel(this.getView().getModel("Common_i18n"), "Common_i18n");
		}
		// open action sheet
		this._actionSheet.openBy(evt.getSource());
	},

	/**
	 * This method is called by the framework if the view is left.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	onExit : function() {
		// delete action sheet
		if (this._actionSheet) {
			this._actionSheet.destroy();
		}
		// Unsubscribe all events
		this._unsubscribeEvents();
		// Remove resizing handlers
		this.removeHandler();
		// deregister event
		this.oApplicationFacade.deRegisterOnMasterListRefresh(this.onMasterRefresh, this);
		// Ensure that there is no handler registered for 'request completed'
		this.getView().getModel().detachRequestCompleted(this._onModelLoaded, this);
		// Detach the handler for routing events
		this.oRouter.detachRoutePatternMatched(this._onRoutePatternMatched, this);
		// Destroy the Quick Views to avoid duplicate ID errors
		i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.destroyQuickViews(this);
	},

	/**
	 * remove all existing handler for size calculation
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	removeHandler : function() {
		// clear handler for size changes
		if (this.resizeHandlerParent.length >= 0) {
			for ( var i in this.resizeHandlerParent) {
				sap.ui.core.ResizeHandler.deregister(this.resizeHandlerParent[i]);
			}
			this.resizeHandlerParent = [];
		}
		if (jQuery.device.is.desktop) {
			if (this.resizeHandlerPage.length >= 0) {
				for ( var j in this.resizeHandlerPage) {
					sap.ui.core.ResizeHandler.deregister(this.resizeHandlerPage[j]);
				}
				this.resizeHandlerPage = [];
			}
		} else {
			sap.ui.Device.orientation.detachHandler(this.onResize, this);
			sap.ui.Device.resize.detachHandler(this.onResize, this);
		}
		// clear delayed calls for resizing
		if (this.resizeTimer.length >= 0) {
			for ( var k in this.resizeTimer) {
				jQuery.sap.clearDelayedCall(this.resizeTimer[k]);
			}
			this.resizeTimer = [];
		}
	},

	/**
	 * calculate the size for the chart
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	resize : function(resizeControlId) {
		i2d.pp.mrpcockpit.reuse.util.Helper.resizeUiControls(this, i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_S3);
	},

	/**
	 * Handle the resize event and trigger a delayed call to calculate the proper sizes
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	onResize : function(resizeControlId) {
		// don't trigger a resize calculation immediately (for performance reasons) but
		// create a delayed call instead
		// if there is already a delayed call, remove it and create a new one instead
		if (this.resizeTimer[resizeControlId]) {
			jQuery.sap.clearDelayedCall(this.resizeTimer[resizeControlId]);
		}
		// so now create the delayed call to handle the resize
		this.resizeTimer[resizeControlId] = jQuery.sap.delayedCall(200, this, jQuery.proxy(this.resize, this,
				resizeControlId));
	},

	/**
	 * This method is called by the framework before the UI has been rendered. It is used to remove handlers
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	onBeforeRendering : function() {
		// as DOM nodes will change, remove the resize handler
		this.removeHandler();
	},

	/**
	 * This method is called by the framework after the UI has been rendered. It is used to register handlers for resizing
	 * and press events
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	onAfterRendering : function() {
		this._registerResizeHandler("mainPage-cont");
		// After the screen has been rendered, we dynamically add the press event handler to the icons.
//		this._setCrIconClickStatus();
	},

	/**
	 * This method sets the default for the change request item press event This method that is intended to be overwritten
	 * by subclasses to change the behavior of the change request icons. (e.g. if the user should not be able to press on
	 * the icon). In S3 the trigger is onAfterRendering(), since the fragment SupDemItem was defined via XML
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
//	_setCrIconClickStatus : function() {
//		// The icons have been added within the XML with this particular ID
//		var oIcon = this.getView().byId("sapMrpCrIcon");
//		if (oIcon) {
//			// Attach the 'press' event to the change request icon
//			oIcon.attachPress(this.onClickChangeRequest, this);
//		}
//	},

	/**
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	selectIconTabBarSelect : function(oEvent) {
		// this id is set as attribute of the icon tab bar
		// we need to call the resize logic for the chart manually
		// when clicking on the Supply Demand Items as there we do have
		// panel to calculate the possible height.
		var resizeControlId = oEvent.getParameter("key");
		// resize only for "supDemItemsTab"
		if ("supDemItemsTab" == resizeControlId) {
			this.onResize();
		}
	},

	/**
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	_registerResizeHandler : function(resizeControlId) {
		var parent = null;
		var page = null;
		this.onResize();
		var $NavContent = jQuery("#" + this.getView().getId() + "--" + resizeControlId);
		if ($NavContent && $NavContent.length) {

			if (resizeControlId == 'mainPage-cont') {
				// NavContent is already the page
				parent = $NavContent;
			} else {
				// determine page and parent node
				parent = $NavContent.parent();
			}
			page = parent;

			// go to main page to get the possible size
			while ((page.length != 0) && !(page.attr('id') == this.getView().getId() + "--" + "mainPage-cont")) {
				page = page.parent();
			}

			if (parent) {
				this.resizeHandlerParent[resizeControlId] = sap.ui.core.ResizeHandler.register(parent[0], jQuery.proxy(
						this.onResize, this, resizeControlId));
			}

			if (jQuery.device.is.desktop) {
				if (page) {
					this.resizeHandlerPage[resizeControlId] = sap.ui.core.ResizeHandler.register(page[0], jQuery.proxy(
							this.onResize, this, resizeControlId));
				}
			} else {
				sap.ui.Device.orientation.attachHandler(this.onResize, this, resizeControlId);
				sap.ui.Device.resize.attachHandler(this.onResize, this, resizeControlId);
			}
		}
	},

	/**
	 * Updates the noDataText to "Loading..." <br>
	 * Method is called when data in table refreshed
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	onItemsUpdateStarted : function(oEvent) {
		var sdItemTable = this.getView().byId("SDItems");
		var i18nModel = this.getView().getModel("Common_i18n");
		if (i18nModel && sdItemTable) {
			sdItemTable.setNoDataText(i18nModel.getResourceBundle().getText("tableUpdateStarted"));
		}
	},

	/**
	 * Updates the noDataText of the supply demand item talbe to "No items are currently available", if Odata has returned
	 * no results.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	onItemsUpdateFinished : function(oEvent) {
		var oSource = oEvent.getSource();
		var aItems = oSource.getItems();
		if (!aItems || aItems.length === 0) {
			var sdItemTable = this.getView().byId("SDItems");
			var i18nModel = this.getView().getModel("Common_i18n");
			if (i18nModel && sdItemTable) {
				sdItemTable.setNoDataText(i18nModel.getResourceBundle().getText("tableUpdateFinished"));
			}
		}
	},

	/**
	 * On click on the change request icon within the supply demand item list we call the app for change request
	 * processing (540)
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	onClickChangeRequest : function(evt) {
		// Navigate to the Change Request App
		var sError = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.onCRPressed(evt);
		// Error handling for the navigation
		if (sError) {
			sap.ca.ui.message.showMessageBox({
				type : sap.ca.ui.message.Type.ERROR,
				message : sError
			});
		}
	},

	/**
	 * Opens the Quick View for the selected MRP element <br>
	 * A single quick view instance is stored in a container for each mrp element category and restored if needed. We do
	 * it this way to avoid 'duplicate id' errors when opening multiple quick views for the same mrp element category
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	handlePressDispoElementQuickView : function(evt) {
		i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.handlePressDispoElementQuickView(evt,this);	
	},

	/**
	 * Close the Quick View popover when the user click on the close button
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	handleCloseButton : function(oEvent) {
		var oMrpElementData = this._oSelectedMRPElementItem.getBindingContext().getObject();
		var quickViewFragment = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper
				.getQuickViewFragment(oMrpElementData.MRPElementCategory);
		var quickView = this._oQuickViewContainer[quickViewFragment];
		quickView.close();
	},

	/**
	 * Generally the navigation to CR app is allowed <br>
	 * If not desired, rewrite this method in the app controller
	 */
	_isNavToCrAppAllowed : function() {
		return true;
	},

	/**
	 * Opens the edit dialog for purchase order or purchase requisition
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	handleEditButton : function(oEvent) {

		var oQuickViewData = oEvent.getSource().getBindingContext().getObject();
		var oMrpElementData = this._oSelectedMRPElementItem.getBindingContext().getObject();

		var crExisting = i2d.pp.mrpcockpit.reuse.util.CommonFormatter
				.getChangeRequestVisibility(oQuickViewData.SolutionRequestStatus);

		if (this._isNavToCrAppAllowed() && crExisting) {
			// Navigate to the Change Request App
			var sError = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.navToCRApp(oQuickViewData, oMrpElementData);
			// Error handling for the navigation
			if (sError) {
				sap.ca.ui.message.showMessageBox({
					type : sap.ca.ui.message.Type.ERROR,
					message : sError
				});
			}
		} else {

			// open the corresponding solution dialog
			var sSolutionType = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper
					.getSolutionType(oQuickViewData.QuickviewCategory);
			var sViewName = i2d.pp.mrpcockpit.reuse.util.QuickViewHelper.getEditFragment(oQuickViewData.QuickviewCategory);

			var oQuickEditModel = new sap.ui.model.json.JSONModel({
				ContactPersonName : oQuickViewData.ContactPersonName,
				ContactPersonEmailAddress : oQuickViewData.ContactPersonEmailAddress,
				ContactPersonPhoneNumber : oQuickViewData.ContactPersonPhoneNumber,
				IntContactPersonName : oQuickViewData.IntContactPersonName,
				IntContactPersonEmailAddress : oQuickViewData.IntContactPersonEmailAddress,
				IntContactPersonTelephone : oQuickViewData.IntContactPersonTelephone,				
				MaterialShortageSolutionType : sSolutionType,

				MRPElementAvailyOrRqmtDate : oQuickViewData.MRPElementPlndDeliveryDate,
				MRPElementChgAvailyOrRqmtDate : oQuickViewData.MRPElementPlndDeliveryDate,
				MRPElementOpenQuantity : oMrpElementData.MRPElementOpenQuantity,
				MRPElementChangeOpenQuantity : oMrpElementData.MRPElementOpenQuantity,
				MaterialGoodsReceiptDuration : oQuickViewData.MaterialGoodsReceiptDuration,
				AvailabilityDate : oQuickViewData.MRPElementPlndDeliveryDate,
				ChangedAvailabilityDate : oQuickViewData.MRPElementPlndDeliveryDate,
				OrderFinishDate : oQuickViewData.OrderFinishDate,
				ChangedOrderFinishDate : oQuickViewData.OrderFinishDate,
				MRPElementOriginalTotalQty : oQuickViewData.TotalQuantity,
				MRPElementChangedTotalQuantity : oQuickViewData.TotalQuantity,
				OrderedQuantity : oQuickViewData.OrderedQuantity,
				OrderedChangedQuantity : oQuickViewData.OrderedQuantity,				

				SupplyingPlant : oQuickViewData.BusinessPartnerPlant,
				Vendor : oQuickViewData.Vendor,
				VendorName : oQuickViewData.VendorName,
				TargetQuantityUnitDcmls : oQuickViewData.TargetQuantityUnitDcmls,
				OrderUnitOfMeasureTechnicalName : oQuickViewData.UnitOfMeasureTechnicalName,

				MaterialID : oMrpElementData.MaterialID,
				MRPPlant : oQuickViewData.MRPPlant,
				MRPArea : oMrpElementData.MRPArea,
				MRPPlanningSegmentType : oMrpElementData.MRPPlanningSegmentType,
				MRPPlanningSegmentNumber : oMrpElementData.MRPPlanningSegmentNumber,
				MRPElement : oQuickViewData.MRPElement,
				MRPElementCategory : oQuickViewData.MRPElementCategory,
				MRPElementExternalID : oQuickViewData.MRPElementExternalID,
				MRPElementItem : oQuickViewData.MRPElementItem,
				MRPElementItemExternalID : oQuickViewData.MRPElementItemExternalID,
				MRPElementScheduleLine : oQuickViewData.MRPElementScheduleLine,
				MRPController : oQuickViewData.MRPController,
				MRPControllerName : oQuickViewData.MRPControllerName,

				SolutionRequestNote : oQuickViewData.SolutionRequestNote,
				SolutionRequestStatus : oQuickViewData.SolutionRequestStatus,
				VendorResponse : "",
				// split the material shortage definition id into profile (First 12 digits) and count (last 3 digits)
				// TODO: clarify if supplying profile + profileCount is needed at all
				MaterialShortageProfile : oMrpElementData.MaterialShortageDefinitionID.substring(0, 12),
				MaterialShortageProfileCount : oMrpElementData.MaterialShortageDefinitionID.substring(12, 15),
				MaterialShortageDefinitionID : oMrpElementData.MaterialShortageDefinitionID,

				// This ID is necessary to be able to change a purchase order.
				// The ID is used in the backend to check if the purchase order has changed in the meantime.
				ChangeStateID : oQuickViewData.ChangeStateID,
				QuickviewCategory : oQuickViewData.QuickviewCategory,
				PlannedOrder : oQuickViewData.PlannedOrder,
				ProductionSupervisor : oQuickViewData.ProductionSupervisor,
				ProductionSupervisorDesc : oQuickViewData.ProductionSupervisorDesc,
				BusinessPartnerPlant : oQuickViewData.BusinessPartnerPlant,
				BusinessPartnerPlantName : oQuickViewData.BusinessPartnerPlantName,
				VendorIsFixed : oQuickViewData.VendorIsFixed
			});

			var backendVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper
					.getServiceSchemaVersion(this.oApplicationFacade);
			i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.setODataModel(this.getView().getModel(), backendVersion);
			i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper.setODataModel(this.getView().getModel(), backendVersion);

			// Create the dialog fragment
			var ctrl = sap.ui.controller(sViewName);
			var oDialogFragment = sap.ui.xmlfragment(sViewName, ctrl);
			oDialogFragment.setModel(this.oApplicationImplementation.getApplicationModel("ServiceVersions"),"ServiceVersions");
			oDialogFragment.setModel(this.getView().getModel("Common_i18n"), "Common_i18n");
			// register the quick view as a separate model, this allows the xml views to pass the constants to
			// formatter methods
			var oQuickEditConstModel = new sap.ui.model.json.JSONModel(
					i2d.pp.mrpcockpit.reuse.util.CommonConstants.QUICKVIEW_CAT);
			oDialogFragment.setModel(oQuickEditConstModel, "QuickEditConstantsModel");
			// Pass the model to the dialog fragment
			oDialogFragment.setModel(oQuickEditModel);
			oDialogFragment.open();
		}
	},

	/**
	 * Reloads the supply/demand item table
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.view.S3parent
	 */
	refreshSDList : function() {
		// trigger refresh of the supply demand table
		var context = this.getView().getBindingContext();
		this.getView().setBindingContext(null);
		this.getView().setBindingContext(context);
	},

	/**
	 * Changes the models of the app specific UI Element to reflect the changes which are not part of the odata model.
	 * When there is an already changed Item available, oData model will be ignored.
	 */
	_changeModel : function() {

		var oView = this.getView();

		// get the json Model
		var changedItems = this.oApplicationFacade.getApplicationModel("changedItems");
		if (!changedItems) {
			return;
		}

		// get the relevant UI Elements
		var aUIElements = new Array();
		aUIElements = this._changeModelAppSpecific();
		for ( var i = 0; i < aUIElements.length; i++) {

			var oUIElement = oView.byId(aUIElements[i]);
			if (!oUIElement) {
				continue;
			}

			// change the model of the UI Element to a JSON Model if available. Otherwise set to the original ODATA
			// Model from the view
			var oContextPath = null;
			if (oView && oView.getBindingContext()) {
				oContextPath = oView.getBindingContext().getPath();
			}
			if (changedItems.getProperty(oContextPath)) {
				// By setting the new model the Binding Context of the parent is not valid for this element anymore. We
				// have to define the Binding Context for the element again
				oUIElement.setModel(changedItems);
				oUIElement.bindElement(oContextPath);
			} else {
				// If there is no changed model then set back to the original ODATA Model from the view
				oUIElement.setModel();
				// By resetting the oData model we have to remove the BindingContext so the parent BindingContext will
				// be inherited
				oUIElement.unbindElement();
			}
		}

	},

	/**
	 * This method is used to define the UI Elements which are neccessary to update without receiving the response from an
	 * ODAta Call It is intended to be overwritten in the sub classes. We need to provide an own json model as we are not
	 * allowed to update the OData values.
	 */
	_changeModelAppSpecific : function() {
		return ["objectHeader"];
	},

	/**
	 * This handler should start the MRP in backend - but only for ModelS function import RunMRP FunctionImports
	 * eMail: ChangeRequestGetEMailText -> ChangeRequestIDs FunctionImports RunMRP: RunMRP
	 */

	runMRP : function() {
		var oDataModel = this.getView().getModel();
		oDataModel.setUseBatch(true);
		oDataModel.clearBatch();

		var oModelI18N = this.getView().getModel("Common_i18n");
		var oBundle = oModelI18N.getResourceBundle();

		var oObjectHeader = this.getView().byId("objectHeader");
		var oBindingContext = oObjectHeader.getBindingContext();
		var oObjectHeader = oBindingContext.getObject();

		var url = "/RunMRP?MaterialID='";
		url += oObjectHeader.MaterialID;
		url += "'&MRPPlant='";
		url += oObjectHeader.MRPPlant;
		url += "'";

		oDataModel.addBatchChangeOperations([oDataModel.createBatchOperation(url, "POST")]);
		oDataModel.submitBatch(function(oResult, oResponse, aErrorResponses) {
			if (aErrorResponses.length > 0) {
				// Extract the error message out of the response object
				var sErrorText = i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromBatchResponse(oBundle,
						aErrorResponses);
				// Show the error message in a message box
				sap.ca.ui.message.showMessageBox({
					type : sap.ca.ui.message.Type.ERROR,
					message : oBundle.getText("MRP_RUN_ERRORS"),
					details : sErrorText
				});
			} else {
				oDataModel.refresh();
				sap.m.MessageToast.show(oBundle.getText("MRP_RUN_COMPLETED"));
			}
		},

		function(oError) {
			var sErrorText = "";
			// Check if/Ensure the response object contains a body
			if (oError && oError.response && oError.response.body) {
				// Extract the error message out of the response object
				sErrorText = i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromStream(oBundle,
						oError.response.body);
			} else {
				// Use a default for an unknown error
				sErrorText = "";
			}
			// Show the error message in a message box
			sap.ca.ui.message.showMessageBox({
				type : sap.ca.ui.message.Type.ERROR,
				message : oBundle.getText("MRP_RUN_ERRORS"),
				details : sErrorText
			});
		},

		false);
	}

});

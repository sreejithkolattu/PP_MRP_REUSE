/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.ScfldMasterController");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Helper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.AoRHandler");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.VariantHandler");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.ViewStateHandler");

sap.ca.scfld.md.controller.ScfldMasterController
		.extend(
				"i2d.pp.mrpcockpit.reuse.view.S2parent",
				{

					/**
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S2parent
					 */
					onInit : function() {

						/***********************************************************************************************************
						 * NOTICE! <br>
						 * i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getFilterFrontendVersion() delivers the current
						 * Frontend Version. The value in it has to be updated with each new wave to the current Frontend Version
						 * manually! <br>
						 * see _bindGeneralKeyFilters() and _getDirectCallFilters()
						 **********************************************************************************************************/

						sap.ca.scfld.md.controller.ScfldMasterController.prototype.onInit.call(this);

						// Initialize the service version and the service schema version (needed for interoperability)
						i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.initialize(this.getView().getModel(), this
								.getMasterServiceEntity(), this.oApplicationFacade);

						// Store the re-use constants as a member
						this.Constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;

						// add reference to reuse i18N model
						var effectiveUrl = jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse") + "/" + "i18n/i18n.properties";
						var oBundle = new sap.ui.model.resource.ResourceModel({
							bundleUrl : effectiveUrl
						});
						this.getView().setModel(oBundle, "Common_i18n");

						// Extract the list item template out of the list and clear all items
						var oList = this.getList();
						var oItem = oList.getItems()[0];
						oList.removeItem(oItem);
						this.oListItemTemplate = oItem;

						// initialize the view state
						this.oViewState = {
							// items shown in the master list
							// (will be filled when navigate from app to app)
							items : null,
							// variant id
							// (will be filled when navigate from tile to app navigation)
							variantID : null
						};

						// create stateID to identify session
						this.sStateID = jQuery.sap.uid();

						// check if an old stateID exist to restore the session
						var myPattern = /id-.*-.*/;
						var sStateID = myPattern.exec(sap.ui.core.routing.HashChanger.getInstance().getHash());
						if (sStateID) {
							// save the first entry and restore old session
							this.sStateID = sStateID[0];
							i2d.pp.mrpcockpit.reuse.view.ViewStateHandler.getViewStateFromContainer(jQuery.proxy(
									this._resetLastViewState, this), this.sStateID, this.Constants.VIEW_STATE_VALIDITY_TIME,
									this.oViewState);
						} else {

							// Determine navigation scenario
							var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
							var myComponent = sap.ui.component(sComponentId);
							var oComponentData = myComponent.getComponentData();

							// There are different possibilities to start the app
							if (oComponentData && oComponentData.startupParameters) {
								//TODO David
								if (oComponentData.startupParameters.OrderCategory) {
									if (oComponentData.startupParameters.OrderCategory[0] !== undefined) {
										this.sOrderCategory = oComponentData.startupParameters.OrderCategory[0];
										}			
									}
								//End TODO

								// Cross-app navigation
								// either from launchpad tile (as variant) or from 210
								this._bindFilters(oComponentData.startupParameters);
								// Save the variant ID (if there is one) so we could navigate to the
								// monitor app using this variant
								this.oViewState.variantID = oComponentData.startupParameters.VariantID;
								this.oStartParameters = oComponentData.startupParameters;
							} else {
								// If no startup parameters are provided, it is a direct call
								if (this._directCall) { // only implemented in 230
									this.getList().destroyItems(); // because counting in master title
									this._directCall();
								} else {
									jQuery.sap.log
											.error("Startup parameter missing. Only direct call use case of app 230 is allowed without startup parameter.");
									this.oApplicationFacade.oApplicationImplementation.oConnectionManager.showMessageBox({
										type : sap.ca.ui.message.Type.ERROR,
										message : this.getView().getModel('Common_i18n').getResourceBundle().getText("messURLIncorrect")
									});
								}
							}
						}

						var bus = sap.ui.getCore().getEventBus();
						// subscribe on event for a processed solution card on S4 in
						// order to update the status of the master list
						bus.subscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_OK,
								this._updateMasterListItem, this);

						// registering on the error handling of failed odata calls
						this.getView().getModel().attachRequestFailed(null, this.handleRequestFailed, this);

						var changedItems = null;
						changedItems = this.oApplicationFacade.getApplicationModel("changedItems");
						if (!changedItems) {
							changedItems = new sap.ui.model.json.JSONModel();
							this.oApplicationFacade.setApplicationModel("changedItems", changedItems);
						}

						// handle special logic of s2 for master list refresh, e.g. remove the cached items on the master list
						this.oApplicationFacade.registerOnMasterListRefresh(this.onMasterRefresh, this);

						this.oRouter.attachRoutePatternMatched(this._onRoutePatternMatched, this);

						// Save current view state if user leaves application
						// jQuery(window).bind("beforeunload", function(oEvent) {
						// this._storeViewState();
						// jQuery(window).unbind("beforeunload");
						// }.bind(this));

					},

					/**
					 * Overwritten from sap.ca.scfld.md.controller.ScfldMasterController: As the name of the route leading to the
					 * detail view differs from the default which is "detail"
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S2parent
					 * @returns {string} the name of the detail route
					 */
					getDetailRouteName : function() {
						if(this.oStartParameters){
							if(this.oStartParameters.navigationID){
								if(this.oStartParameters.navigationID[0] == i2d.pp.mrpcockpit.reuse.util.CommonConstants.NavToCR){
									return i2d.pp.mrpcockpit.reuse.util.CommonConstants.ROUTING.SUB_DETAIL;
								}
							}
						}
						return i2d.pp.mrpcockpit.reuse.util.CommonConstants.ROUTING.DETAIL;
					},

					/**
					 * Overwritten from sap.ca.scfld.md.controller.ScfldMasterController: Create the parameters necessary for
					 * injecting the stateID into the Detail route of the app.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S2parent
					 */
					getDetailNavigationParameters : function(oListItem) {
						return {
							contextPath : oListItem.getBindingContext(this.sModelName).getPath().substr(1),
							stateID : this.sStateID
						};
					},

					/**
					 * Handles the event attachRoutePatternMatched; Restores the stateID if parameter was provided
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S2parent
					 * @param {object}
					 *          oEvent: the route matched event
					 */
					_onRoutePatternMatched : function(oEvent) {
						var sRouteName = oEvent.getParameter("name");
						if (sRouteName === "master" || sRouteName === i2d.pp.mrpcockpit.reuse.util.CommonConstants.ROUTING.DETAIL) {
							var sArg = oEvent.getParameter("arguments");
							if (sArg.stateID && (sArg.stateID !== this.sStateID)) {
								// Regex for id-... (to avoid SQL Injection)
								var myPattern = /id-.*-.*/;
								var sStateID = myPattern.exec(sArg.stateID);
								if (sStateID) {
									// restore the old stateID
									this.sStateID = sStateID[0];
								}
							}
						}
					},

					/**
					 * Handles the error event of a oData Call. First triggers a special coding for the AOR case (if the user does
					 * not have an AOR) For all further the error is transferred to the general error handling in the
					 * connectionManager (Scfld) This is necessary because we detach the general error handling in the
					 * configuration.js (Parameter: fRequestFailed of each Service in Service List) in Order not to trigger it
					 * twice
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S2parent
					 * @param {object}
					 *          oEvent: the route matched event
					 */
					handleRequestFailed : function(oEvent) {

						// Predefine close function for error message dialog
						var sErrorText = null;
						var fnClose = function() {
							window.history.back();
						};

						// read error handling
						if (oEvent.getParameter("responseText").match('@AOR@')) {

							// delegate to AoR handling and reexecute onInit after AoR has been defined
							i2d.pp.mrpcockpit.reuse.view.AoRHandler.openFirstOnboardingDialog(this.getView().getModel(),
									this._aorChange.bind(this), this);

						} else if (oEvent.getParameter("responseText").match('@QuickView@')) {

							// error is handled by S3 controller, so ignore it
							// for sure, this is not the best solution, but there are no alternatives so far

						} else if (oEvent.getParameter("responseText").match('@NoAuthorization@')) {

							// no element is shown due to authorization issue
							// we want to inform the user and navigate back to the last page
							sErrorText = this.getView().getModel("Common_i18n").getResourceBundle().getText(
									"MISSING_AUTHORIZATIONS_ERROR");

							sap.ca.ui.message.showMessageBox({
								type : sap.ca.ui.message.Type.ERROR,
								message : sErrorText
							}, fnClose);

						} else if (oEvent.getParameter("responseText").match('@TOO_MANY_MATERIALS@')) {

							// material search ended up in too many results. User should limit the AoR to get less results
							sErrorText = this.getView().getModel("Common_i18n").getResourceBundle().getText(
									"TOO_MANY_MATERIALS_ERROR");

							var oBundle = this.getView().getModel("Common_i18n").getResourceBundle();
							var errorTextAndDetails = i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromStream(oBundle, oEvent
									.getParameter("responseText"));
							var aText = errorTextAndDetails.split("@TOO_MANY_MATERIALS@");
							// remove the leading dot and space from the error details and show the error in a message box
							aText[1].replace(". ", "");
							sap.ca.ui.message.showMessageBox({
								type : sap.ca.ui.message.Type.ERROR,
								message : aText[0],
								details : aText[1]
							});

						} else {
							// Set the noDataText of the table to "No items are currently available" and show an empty detail view
							var oTable = this.getList();
							if (oTable) {
								oTable.setBusy(false); // Remove the busy indicator
								oTable.setNoDataText(this.getView().getModel('Common_i18n').getResourceBundle().getText(
										"tableUpdateFinished"));
								this.navToEmptyView();
							}
							// triggering of general error handling
							this.oApplicationFacade.oApplicationImplementation.oConnectionManager.handleRequestFailed(oEvent);
						}

					},

					/**
					 * Handles the Event of using successfully a Solution Card
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S2parent
					 * @param {string}
					 *          channelId: The channel of the event
					 * @param {string}
					 *          eventId: The identifier of the event
					 * @param {object}
					 *          data: the parameter map
					 */
					_updateMasterListItem : function(channelId, eventId, data) {

						var changedItems = this.oApplicationFacade.getApplicationModel("changedItems");

						// get Binding Context of selected Item in List
						var oSelectedItem = null;
						if (this.getList()) {
							oSelectedItem = this.getList().getSelectedItem();
							if (oSelectedItem) {
								var oContext = oSelectedItem.getBindingContext();
								var oEntry = null;

								oEntry = changedItems.getProperty(oContext.getPath());
								if (!oEntry) {
									oEntry = {};
									jQuery.extend(oEntry, oContext.getObject());
								}

								// Set Status code in the current list item
								// update of the status needs to be done by every app itself
								oEntry = this._updateMasterListItemAppSpecific(oEntry, data);
								if (oEntry) {
									changedItems.setProperty(oContext.getPath(), oEntry);

									oSelectedItem.setModel(changedItems);
									this.oApplicationFacade.setApplicationModel("changedItems", changedItems);
								}
							} else {
								jQuery.sap.log.info("S2: Status Update not possible - No item selected");
							}

						} else {
							jQuery.sap.log.info("S2: Status Update not possible - No list available");
						}

					},

					/**
					 * This method is used to update the master list item after an user interaction. It is intended to be
					 * overwritten in the sub classes. We update specific status after user interaction. We need to provide an own
					 * json model as we are not allowed to update the OData values.
					 */
					_updateMasterListItemAppSpecific : function(oEntry, data) {

						oEntry.MaterialShortageStatus = i2d.pp.mrpcockpit.reuse.util.Helper.convertStatusToMasterListStatus(data);
						return oEntry;

					},

					/**
					 * Reads the arguments encapsualted by the (display) variant such as ShortageDefinitionID and horizon
					 */
					_readVariant : function(sVariantID, aFilters) {

						this.aFilters = aFilters;

						// get correct Variant Container Prefix for different Apps
						this.sVariantContainerPrefix = this._getVariantContainerPrefix();

						// get the correct variant ID and use callback method _setFilters
						i2d.pp.mrpcockpit.reuse.view.VariantHandler.getVariantByID(this._setFilters.bind(this),
								this.sVariantContainerPrefix, sVariantID);

					},

					/**
					 * callback variant setup the filters and do the view binding
					 */
					_setFilters : function(bResult, object) {
						var i;
						var j;
						// since wave 5 we have to pass the frontend version to the backend with each master call
						i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.addFilterFrontendVersion(this.aFilters, this.getView()
								.getModel(), this.getMasterServiceEntity());

						this.aSorter = [];
						if (object !== null) {

							if (object.MaterialShortageDefinitionID !== undefined) {
								this.aFilters.push(this._getSimpleFilter('MaterialShortageDefinitionID',
										object.MaterialShortageDefinitionID));
							}
							if (object.TimeHorizon !== undefined) {
								this.aFilters.push(this._getSimpleFilter('DynamicHorizonCode', object.TimeHorizon));
							}
							if (object.DemandType !== undefined) {
								this.aFilters.push(this._getSimpleFilter('DemandType', object.DemandType));
							}
							if (object.OrderCategory !== undefined) {
								this.aFilters.push(this._getSimpleFilter('MRPElementCategory', object.OrderCategory));
							}

							if (object.FacetFilterState !== undefined) {
								for (i = 0; i < object.FacetFilterState.length; i++) {
									for (j = 0; j < object.FacetFilterState[i].selectedItemKeys.length; j++) {

										this.aFilters.push(this._getSimpleFilter(object.FacetFilterState[i].listKey,
												object.FacetFilterState[i].selectedItemKeys[j][0]));
									}
								}
							}

							// read sorting out of variant
							if (object.SortKey && object.SortDescending !== undefined) {
								this.aSorter.push(new sap.ui.model.Sorter(object.SortKey, object.SortDescending));
							}
						}

						// allows to do app specific coding based on the variant
						this._handleVariantAppSpecific();

						this._setupViewBinding(this.aFilters, this.aSorter);
					},

					/**
					 * setup data binding for master list
					 */
					_setupViewBinding : function(aFilters, aSorter) {
						var masterList = this.getView().byId("list");

						var oModel = this.oApplicationFacade.getODataModel();

						// activate batch mode
						if (!this._isBatchModeActive()) {
							oModel.setUseBatch(false);
						} else {
							oModel.setUseBatch(true);
						}

						// activate paging
						// 50 records are requested by default with each call
						oModel.setSizeLimit(999);
						masterList.setGrowingThreshold(50);
						masterList.setGrowing(true);

						masterList.bindAggregation("items", {
							path : "/" + this.getMasterListEntity(),
							template : this.oListItemTemplate,
							sorter : aSorter,
							filters : aFilters,
							parameters : {
								select : this._getSelectFields()
							}
						});
						this.registerMasterListBind(masterList);
					},

					/**
					 * This method determines app specific filters and uses them to for the ODataCall that is done within
					 * "setupViewBinding". It is intended to be overwritten in the subclasses if the filter binding has to be
					 * adapted.
					 */
					_bindFilters : function(parameters) {

						var aFilters = [];

						var sNavigationID = null;
						if (parameters.navigationID) {
							sNavigationID = parameters.navigationID[0];
						}
						if (sNavigationID) {
							var oPersonalizationService = sap.ushell.Container.getService('Personalization');
							if (oPersonalizationService.getContainer) {
								oPersonalizationService.getContainer(sNavigationID, this.Constants.VIEW_STATE_VALIDITY_TIME).done(
										function(oContainer) {
											var items = oContainer.getItemValue("Navigation");
											if (items) {
												// Determine the filters for the app
												this._bindAppFilters(items, aFilters);
												// Pass the filters and do the OData-Call
												this._setupViewBinding(aFilters);
												// save the items in the view state object
												this.oViewState.items = items;
												// Store the view state to display the same items if user navigates back
												this._storeViewState();
											} else {
												// invalid parameters
												jQuery.sap.log.error("Invalid localBookmark");
											}
										}.bind(this));
							}

						}
						/*
						 * Old Navigation handling else if (parameters.localBookmark) { // App was called from a monitor app (110 or
						 * 210) var itemsJSON = sessionStorage.getItem(parameters.localBookmark); var items = JSON.parse(itemsJSON);
						 * if (items) { // Determine the filters for the app this._bindAppFilters(items, aFilters); // Pass the
						 * filters and do the OData-Call this._setupViewBinding(aFilters); } else { // invalid parameters
						 * jQuery.sap.log.error("Invalid localBookmark"); } }
						 */
						else if (parameters.VariantID) {
							// App has been started directly using a Launchpad tile having a specific Variant ID
							// (wrapper for Shortage Definition ID and Time Horizon)
							this._readVariant(parameters.VariantID, aFilters);
							this.oViewState.variantID = parameters.VariantID;

							// Store the view state to display the same variant if user navigates back
							this._storeViewState();
						} else {
							// invalid scenario
							jQuery.sap.log
									.error("Invalid scenario, either supply display variant or [material,plant,mrparea] combinations");
							this.oApplicationFacade.oApplicationImplementation.oConnectionManager.showMessageBox({
								type : sap.ca.ui.message.Type.ERROR,
								message : this.getView().getModel('Common_i18n').getResourceBundle().getText("messURLIncorrect")
							});
						}

					},

					/**
					 * This method is used to do App specific coding that is related to the variant e.g. changing the master list
					 * title in 332 app. It is intended to be overwritten in the sub classes.
					 */
					_handleVariantAppSpecific : function() {
					},

					/**
					 * Restores the view state to display the last view state if user navigates back
					 */
					_resetLastViewState : function(bResult, oViewState) {

						this.oViewState = oViewState;
						var aFilters = [];

						if (this.oViewState.items) {
							// Determine the filters for the app
							this._bindAppFilters(this.oViewState.items, aFilters);
							// Pass the filters and do the OData-Call
							this._setupViewBinding(aFilters);
						} else if (this.oViewState.variantID) {
							// App has been started directly using a Launchpad tile having a specific Variant ID
							// (wrapper for Shortage Definition ID and Time Horizon)
							this._readVariant(this.oViewState.variantID, aFilters);
						}

					},

					/**
					 * Stores the view state to display the last view state if user navigates back
					 */
					_storeViewState : function() {
						// store view state
						i2d.pp.mrpcockpit.reuse.view.ViewStateHandler.saveViewStateInContainer(null, this.oViewState,
								this.sStateID, this.Constants.VIEW_STATE_VALIDITY_TIME, null);
					},

					/**
					 * Returns the filters for standalone Scenario
					 */
					_getLocalFilters : function() {

						var aFilters = [];

						this._setTimeHorizonFilter(aFilters);
						this._setShortageFilter(aFilters);
						this._setControllerFilter(aFilters);
						this._setPlantFilter(aFilters);

						return aFilters;

					},

					/**
					 * Returns an 'EQ' filter for a singe value
					 * 
					 * @param filterName
					 * @param filterValue
					 * @returns {sap.ui.model.Filter}
					 */
					_getSimpleFilter : function(filterName, filterValue) {
						var filter = new sap.ui.model.Filter(filterName, sap.ui.model.FilterOperator.EQ, filterValue);
						return filter;
					},

					/**
					 * Adds the url parameter value for 'timeHorizon' to the oData filters
					 */
					_setTimeHorizonFilter : function(aFilters) {
						// var horizon = jQuery.sap.getUriParameters().get("timeHorizon");
						var horizon = "";
						if (horizon === "") {
							jQuery.sap.log.error("Mandatory url parameter 'timeHorizon' not set!");
						}
						aFilters.push(this._getSimpleFilter('DynamicHorizonCode', horizon));

					},

					/**
					 * Adds the url parameter value for 'shortageDef' to the oData filters
					 */
					_setShortageFilter : function(aFilters) {
						// var shortageDef = jQuery.sap.getUriParameters().get("shortageDef");
						var shortageDef = "";
						if (shortageDef === "") {
							jQuery.sap.log.error("Mandatory url parameter 'shortageDef' not set!");
						}
						aFilters.push(this._getSimpleFilter('MaterialShortageDefinitionID', shortageDef));

					},

					/**
					 * Adds the url parameter value for 'plant' to the oData filters
					 */
					_setPlantFilter : function(aFilters) {
						// var plant = jQuery.sap.getUriParameters().get("plant");
						var plant = "";
						if (plant !== null) {
							aFilters.push(this._getSimpleFilter('MRPPlant', plant));
						}
					},

					/**
					 * Adds the url parameter value for 'controller' to the oData filters
					 */
					_setControllerFilter : function(aFilters) {
						// var controller = jQuery.sap.getUriParameters().get("controller");
						var controller = "";
						if (controller !== null) {
							aFilters.push(this._getSimpleFilter('MRPController', controller));
						}
					},

					/**
					 * Checks if batch mode is still active
					 */
					_isBatchModeActive : function() {
						// var noBatch = jQuery.sap.getUriParameters().get("nobatch");
						// do not remove the local variable since it is needed to deactivate the batch mode in the debugger
						var noBatch = "";
						if (noBatch === "X") {
							return false;
						}
						return true;
					},

					/**
					 * Add general key filters for the master call
					 */
					_bindGeneralKeyFilters : function(parameters, aSimpleFilters, aANDFilters) {

						// check that mrpArea, materialID and plant have the same array-length
						if ((!parameters.DirectCall)
								&& (parameters.MRPArea.length !== parameters.MaterialID.length || parameters.MRPArea.length !== parameters.MRPPlant.length)) {

							jQuery.sap.log.error("Same number of entries for MRPArea, MaterialID and MRPPlant expected");

						} else {

							// Material Shortage Definition
							aSimpleFilters.push(this._getSimpleFilter('MaterialShortageDefinitionID',
									parameters.MaterialShortageDefinitionID));

							// in case we bind the filters from view state with Direct call
							// MRPArea will not be supported
							if (parameters.DirectCall) {
								aSimpleFilters.push(this._getSimpleFilter('DirectCall', parameters.DirectCall));
							} else {

								// Areas
								aANDFilters.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPArea', parameters.MRPArea));
							}

							// Material ID
							aANDFilters.push(i2d.pp.mrpcockpit.reuse.util.Helper
									.getORMultiFilter('MaterialID', parameters.MaterialID));

							// MRPPlant
							aANDFilters.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPPlant', parameters.MRPPlant));

							// since wave 5 we have to pass the frontend version to the backend with each master call
							i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.addFilterFrontendVersion(aSimpleFilters, this
									.getView().getModel(), this.getMasterServiceEntity());
						}

					},

					/**
					 * Method called by the framework as soon as the OData-Call (Master Call) is finished. Based on the result, we
					 * focus on the selected item, select the first item (if nothing was selected before) or we set the default
					 * text for "no data found".
					 */
					onItemsUpdateFinished : function(oEvent) {
						var sMasterList = this.getView().byId("list");
						// Check if the master list has items
						if (sMasterList.getItems().length) {
							// Try to get the selected item
							var oItem = sMasterList.getSelectedItem();
							if (oItem) {
								// If there is a selected item, ensure that the focus is put on the item
								var oRef = oItem.getDomRef();
//							if (oRef && oEvent.mParameters.reason !== "Growing") {
								if (oRef && oEvent.getParameter("reason") !== "Growing") {									
									oRef.focus();
								}
							} else {
								// If there is no selected item at all, select the first one in list
								this.selectFirstItem();
							}
						} else {
							// Set the noDataText of the table to "No items are currently available"
							sMasterList.setNoDataText(this.getView().getModel('Common_i18n').getResourceBundle().getText(
									"tableUpdateFinished"));
							// If we don't have any item in the master list, show an empty detail screen
							this.navToEmptyView();
							// needed in order to update the hash
//							this.oRouter.navTo("master", "", true);
						}
					},

					/**
					 * Returns the settings for the header and footer options
					 */
					getHeaderFooterOptions : function() {

						var headerFooterOptions = {
							// button for assignment of "Area of Responsibility"
							aAdditionalSettingButtons : [{
								sBtnTxt : "AOR",
								// sI18nBtnTxt : "AREA_OF_RESPONSIBILITY",
								sI18nBtnTxt : this.getView().getModel('Common_i18n').getResourceBundle().getText(
										"AREA_OF_RESPONSIBILITY"),
								onBtnPressed : function(evt) {
									i2d.pp.mrpcockpit.reuse.view.AoRHandler.openOnboardingDialog(evt, this.oApplicationFacade
											.getODataModel(), this._aorChange.bind(this), this);
								}.bind(this)
							}]
						};

						// If we have been called with a variant ID and we have a semantic object
						// we allow to navigate to the monitor app using the received variant
						// The semantic object has to be set in the app specific part of the S2 controller
						if (this.oViewState.variantID && this.semanticObject && this.semanticObjectAction) {

							// Create a button in the footer of the master list
							headerFooterOptions.buttonList = [{
								sBtnTxt : "MONITORAPP",
								sI18nBtnTxt : "NAV_TO_MONITOR_APP", // note: the actual UI text is read from the app specific
								// properties file

								onBtnPressed : function(evt) {
									var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
									this.oCrossAppNavigator = fgetService && fgetService("CrossApplicationNavigation");
									if (this.oCrossAppNavigator) {
										this.oCrossAppNavigator.toExternal({
											target : {
												semanticObject : this.semanticObject,
												action : this.semanticObjectAction
											},
											params : {
												"VariantID" : this.oViewState.variantID
											}
										});
									} else {
										var sMessage = this.oApplicationFacade.getResourceBundle().getText("messNoLaunchpad");
										sap.ca.ui.message.showMessageBox({
											type : sap.ca.ui.message.Type.ERROR,
											message : sMessage
										});
									}
								}.bind(this)

							}];
						}

						return headerFooterOptions;
					},

					/**
					 * Handles the Event of updating the Area of Responsibility
					 */
					_aorChange : function() {

						if ((arguments[0] == i2d.pp.mrpcockpit.reuse.util.CommonConstants.AOR_DEFINITION_CANCELED)
								|| (arguments[0] == i2d.pp.mrpcockpit.reuse.util.CommonConstants.AOR_DEFINITION_FAILED)) {
							// AoR has failed or has been aborted by the user, we don't have to update the app, just continue
						} else {
							// refresh is only necessary if the app is called via a variant (in this case the variable this.aFilters
							// is set, in any other case the filter variable is undefined)
							if (this.aFilters) {
								this._setupViewBinding(this.aFilters, this.aSorter);
							}
						}
					},

					/**
					 * Sets the filter variable aFilters back to undefined
					 */
					clearFilters : function() {
						this.aFilters = undefined;
					},

					/**
					 * Sets the filter variable aSorter back to undefined
					 */
					clearSorter : function() {
						this.aSorter = undefined;
					},

					onExit : function() {
						// De-Register the event!
						var bus = sap.ui.getCore().getEventBus();
						bus.unsubscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_OK,
								this._updateMasterListItem, this);
						this.oApplicationFacade.deRegisterOnMasterListRefresh(this.onMasterRefresh, this);

						// save viewstate and unbind beforeunload because S1parent uses beforeunload as well
						jQuery(window).unbind("beforeunload");
						this._storeViewState();
					},

					/**
					 * Handles the event MasterRefresh; This allows us to reload the master list only when the user has explicitly
					 * refreshed it or for a navigation as well as to remove the cached list items
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S2parent
					 * @param oEvent
					 */
					onMasterRefresh : function(oEvt) {
						if (oEvt.getParameter("bManualRefresh") === true) {
							// a master List refresh was triggered by clicking the refresh button or doing a "pull to refresh"
							var aListItems = this.getList().getItems();
							var i;
							for (i = 0; i < aListItems.length; i++) {
								// reset to original odata model of the view for all elements.
								aListItems[i].setModel();
							}
							// reset the JSon Model
							var changedItems = new sap.ui.model.json.JSONModel();
							this.oApplicationFacade.setApplicationModel("changedItems", changedItems);

						} else {
							// a master list refresh was done by the scaffolding e.g. during a back end search or after getting items
							// of a growing list
						}
					}

				});

/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.controls.SolutionCardContainer");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.controls.Chart");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.model.type.Date");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Helper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CalculationEngine");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CollaborationHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Wave3Helper");

sap.ca.scfld.md.controller.BaseDetailController
		.extend(
				"i2d.pp.mrpcockpit.reuse.view.S4parent",
				{

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
							this.getView().setModel(oBundle, "Common_i18n");

							// get the versions model (that was initialized in s2.parent controller) and bind it to the view
							var oVersion = this.oApplicationImplementation.getApplicationModel("ServiceVersions");
							this.getView().setModel(oVersion, "ServiceVersions");

							onInit.apply(this, arguments);
						};

					},

					/**
					 * Initialization of the controller
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					onInit : function() {

						sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);

						// Show the navigation button
						var oPage = this.getView().getContent()[0];
						oPage.setShowNavButton(true);
						// Initialize the chart control
						this.initChart();
						this.resizeHandler = null;
						this.resizeTimer = null;
						// info which element (Chart or Table) is visible
						this.isChartVisible = false;

						// not all UI Elements are rendered on the time when the chart is rendered. 67px are missing
						// after the first rendering the initialOffset needs to be set to 0 for correct sizing
						this._initialOffset = 67;

						// Store the view and the model as member variables
						this.view = this.getView();
						this.oModel = this.view.getModel();

						// store the CollaborationDialog as member variable to be able to close it
						this.oCollaborationDialog = null;

						// Deactivate the automatic binding refresh after data change, because the dialog
						// leads to data changes and it seems like the model automatically sends several
						// further OData calls after the batch call has been sent.
						this.oModel.setRefreshAfterChange(false);

						// Pass the global model to the collaboration helper in order to use the same
						// model for the OData batch calls
						var backendVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper
								.getServiceSchemaVersion(this.oApplicationFacade);
						i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.setODataModel(this.oModel, backendVersion);
						i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper.setODataModel(this.oModel, backendVersion);

						// Shortcut to the MRP constants
						this.Constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;

						// --------------------------------------------
						// Do the list binding with CSS for shortages
						// --------------------------------------------
						this._setCrIconClickStatus();
						var ctrlShort = this.getView().byId("shortages");
						var oBindingInfo = new Object();
						oBindingInfo.path = "SupDemItem";

						if (backendVersion === 1) {
							// Wave 3
							oBindingInfo.factory = i2d.pp.mrpcockpit.reuse.util.Wave3Helper._getListTemplate;
						} else {
							oBindingInfo.factory = this._getListTemplate;
						}
						ctrlShort.bindAggregation("items", oBindingInfo);

						// Set the (empty) JSON as model for the table control.
						this.oTableModel = new sap.ui.model.json.JSONModel();
						ctrlShort.setModel(this.oTableModel);

						// --------------------------------------------
						// Routing - Attach the handler for routing events
						// --------------------------------------------
						this.oRouter.attachRoutePatternMatched(this._onRoutePatternMatched, this);

						// The oDataBindingServant is used to trigger an Aggregation Call (ODATA:
						// getEntitySet) to the Backend
						// As result we get one entity, which is bound to the view.
						// This mechanism allows us to use filter within the call and to add
						// the result directly into the application oData model
						// It is not supposed to display the oDataBindingServant to the user
						var oListItem = this.getView().byId("oDataBindingServantItem");
						this.oTemplate = jQuery.extend({}, oListItem);

						this.oApplicationFacade.registerOnMasterListRefresh(this.onMasterRefresh, this);

						this.oNullModel = null;
					},

					/**
					 * This method sets the default for the change request icon behavior. It is intended to be overwritten by
					 * subclasses, if the icon shall not be clickable. In S4 the trigger is onInit(), since the fragment
					 * SupDemItem is built via factory method
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_setCrIconClickStatus : function() {
						this._bCrIconClickable = false;
					},

					/**
					 * Handles the event Model Loaded
					 * 
					 * @param oEvent
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_onModelLoaded : function(oEvent) {
						// only do something for solution call
						if (oEvent.getParameter("url").indexOf("PPMRPSolHeaders") === 0) {
							jQuery.sap.log.info("S4: Model loaded");
							var oView = this.getView();

							// bind the result of the oDataCall to the view
							// use the Binding Context of the aggregation Container
							// The aggregation container is an invisible ui element that we use to call oData as aggregation
							// (getEntitySet) in order to pass our own filter
							// We use the result (which is always one entity) and bind it against our view
							var oBindingContext = null;
							var oItem = oView.byId("oDataBindingServant").getItems()[0];
							if (oItem) {
								oBindingContext = oItem.getBindingContext();
							}
							if (oBindingContext) {
								oView.setBindingContext(oBindingContext);
								// save the startdate and enddate of the currently shown shortage
								// this will be used, when the supdemitems are re-read after solution execution
								// in order to show the same shortage again
								// remove the last 5 characters from the converted ISO string (2014-04-11T12:00:00.000Z)
								// we need to get rid of the Z as OData cannot handle that. Furthermore the milliseconds cannot
								// be handled by the Internet Explorer and are not necessary
								var boundObj = oBindingContext.getObject();
								this.dateStart = boundObj.MaterialShortageStartDate.toISOString().slice(0, -5);
								this.dateEnd = boundObj.MaterialShortageEndDate.toISOString().slice(0, -5);
							}

							// Update the control 'supply demand items' table only if table is visible
							if (this.isChartVisible) {
								this.switchToChart(false);
							} else {
								this.switchToTable(false);
							}
							
							// Display warning if change request exists
							this._displayChangeRequestWarning(boundObj.ChangeRequestExists);
							
							// Update the control 'solution cards'
							this._updateSolutionCards(oView);
						}
					},

					/**
					 * Subscribe events that are used for the communication between this controller (S4) and the custom controls
					 * (Solution Cards) and the solution dialogs.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_subscribeEvents : function() {
						var bus = sap.ui.getCore().getEventBus();
						// --------------------------------------
						// Subscribe events for the current view
						// --------------------------------------
						bus.subscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_OK,
								this.onDialogOk, this);

						// Cards (Preview)
						bus.subscribe(this.Constants.EVENT_CHANNELID_CARD_PREVIEW, this.Constants.EVENT_EVENTID_RUN,
								this._previewRun, this);
						bus.subscribe(this.Constants.EVENT_CHANNELID_CARD_PREVIEW, this.Constants.EVENT_EVENTID_CANCEL,
								this._previewCancel, this);
						bus.subscribe(this.Constants.EVENT_CHANNELID_SOLCARD, this.Constants.EVENT_EVENTID_EXECUTE,
								this.onSolutionCardExecute, this);
					},

					/**
					 * Unsubscribe events that have been registered before. Info: Required in context of Fiori Launchpad when
					 * single apps can be run several times. We run into major problems if events haven't been removed correctly!
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_unsubscribeEvents : function() {
						var bus = sap.ui.getCore().getEventBus();
						// De-Register first
						bus.unsubscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_OK,
								this.onDialogOk, this);

						// Cards (Preview)
						bus.unsubscribe(this.Constants.EVENT_CHANNELID_CARD_PREVIEW, this.Constants.EVENT_EVENTID_RUN,
								this._previewRun, this);
						bus.unsubscribe(this.Constants.EVENT_CHANNELID_CARD_PREVIEW, this.Constants.EVENT_EVENTID_CANCEL,
								this._previewCancel, this);
						bus.unsubscribe(this.Constants.EVENT_CHANNELID_SOLCARD, this.Constants.EVENT_EVENTID_EXECUTE,
								this.onSolutionCardExecute, this);

					},

					/**
					 * S4 Handler for routing events Attention: This handler is called for ANY routing event that takes place as
					 * soon as S4 has been once initialized. So we have to extract the event parameter in order to check if S3->S4
					 * happened.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_onRoutePatternMatched : function(oEvent) {
						// Check if navigation from S3-S4 was triggered

						if (oEvent.getParameter("name") === this.Constants.ROUTING.SUB_DETAIL
								|| oEvent.getParameter("name") === this.Constants.ROUTING.SUB_DETAIL_WAVE3) {

							// --------------------------------------------
							// Add a handler to react on ODATA Changes
							this.oModel.attachRequestCompleted(this._onModelLoaded, this);
							// De-Register first (just for safety reasons)
							this._unsubscribeEvents();
							// Register events
							this._subscribeEvents();

							// remove old supply demand items and solution cards
							var ctrlCards = this.getView().byId("cards");
							ctrlCards.setMaterialShortageHasNoSolution(false);
							ctrlCards.removeCards();
							var ctrlTable = this.getView().byId("shortages");
							var m = ctrlTable.getModel();
							m.setData(null);
							// Reset the current solution card
							this._oCard = null;

							// --------------------------------------------
							// Prepare the "Detail-Call"
							// --------------------------------------------
							// Read from configured "pattern" :
							// "subDetail/MaterialID/{materialid}/MRPPlant/{plant}/MRPArea/{area}/MRPPlanningSegmentType/{type}/MRPPlanningSegmentNumber/{number}/MaterialShortageDefinitionID/{definition}/MaterialShortageStartDate{date}"
							this.navParameter = oEvent.getParameter("arguments");
							// decode attributes of navParameter
							for ( var index in this.navParameter) {
								this.navParameter[index] = decodeURIComponent(this.navParameter[index]);
							}

							if (oEvent.getParameter("name") === this.Constants.ROUTING.SUB_DETAIL_WAVE3) {
								// we are in "Wave 3" mode
								this.dateStart = this.navParameter.MaterialShortageStartDate;
								this.dateEnd = this.navParameter.MaterialShortageEndDate;
							} else {
								// when we initially navigate into the s4, we only use the AvailyOrReqmDat of the
								// supply demand item that was selected in order to navigate to the solution view.
								// the backend will determine the shortage period
								this.dateStart = this.navParameter.SelectedSupDemItemDate;
								this.dateEnd = null;
							}

							// set scroll position for the chart
							this.chartScrollPos = parseInt(this.navParameter.ChartScrollPos);
							// read SolutionHeader SupplyDemandItems and SolutionCards
							this._readSolutionViewData(false, null);

							// --------------------------------------------
							// Run the "Solution-Call"
							// --------------------------------------------
							this.requestChartData();

							// Initialize the screen either with the table or with the chart dependent on the selection within S3
							// and also adjust the initial selection of the segmented button (Icon indicating table/chart)
							// Determine whether table or chart shall be displayed out of the navigation parameter
							var oSegmentedButton = this.getView().byId("sapMrpS4ToolbarIcons");
							var sDisplayInChart = this.navParameter.DisplayInChart;
							if (sDisplayInChart === "true") {
								this.isChartVisible = true;
								oSegmentedButton.setSelectedButton(this.getView().byId("btnChart"));
							} else {
								this.isChartVisible = false;
								oSegmentedButton.setSelectedButton(this.getView().byId("btnTable"));
							}

						} else {
							// DE-Register the event handlers because we are leaving S4 now
							this._unsubscribeEvents();
							// DE-Register the onModelLoaded() as soon as we are
							// not on S4 any more
							this.oModel.detachRequestCompleted(this._onModelLoaded, this);

							this._hideChartContainer();

							var oView = this.getView();
							oView.setBindingContext(this.oNullModel);
							var oInfoToolBarCR = this.getView().byId("infoToolBarCR");
							if (oInfoToolBarCR){
								oInfoToolBarCR.setVisible(false);				
							}
						}
					},

					/**
					 * Create path for detail view call The path of the detail view call (s3 call) is generically determined.
					 * Please make sure that: 1.All master key attributes have to be maintained in method getMasterKeyAttributes
					 * of Configuration.js in each app. 2.All master key attributes have to be part of the navigation path
					 * "subDetail" of "Component.js".
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_getPathDetailView : function() {

						// find entity which is shown in Masterlist
						var masterListEntity = "";
						var serviceUrl = "";
						var serviceList = this.oApplicationFacade.oApplicationImplementation.oConfiguration.getServiceList();
						for ( var index in serviceList) {
							if (serviceList[index].isDefault === true) {
								masterListEntity = serviceList[index].masterCollection;
								serviceUrl = serviceList[index].serviceUrl;
							}
						}

						// read masterList Key attributes
						var masterListKeys = this.oApplicationFacade.oApplicationImplementation.aMasterKeys;

						// find the right order of the attributes
						var schema = this.getView().getModel().getServiceMetadata().dataServices.schema;
						var sortedMasterEntityAttributes = new Array();
						// loop over all schemas
						for ( var schemaCount in schema) {
							// find the right service: Check if the namespace is part of the service URL
							// We cannot compare the namespace with the name of the service in erviceList[index].name
							// because when customers redefine the service only the URL changes, the service name remains the
							// original name.
							if (serviceUrl.indexOf(schema[schemaCount].namespace) >= 0) {
								var service = schema[schemaCount].entityType;
								for ( var serviceCount in service) {
									// find the masterlist entity (defined according to namingconvention "Materials"->"Material"
									if (service[serviceCount].name === masterListEntity.substring(0, masterListEntity.length - 1)) {
										// save the master list keys with the right order
										for ( var keyCount in service[serviceCount].property) {
											sortedMasterEntityAttributes.push(service[serviceCount].property[keyCount].name);
										}
									}
								}
							}
						}

						// use only those attributes in the masterlist but with the order of the entity set definition
						masterListKeys = sortedMasterEntityAttributes.filter(function(element) {
							var sortCount = 0;
							for (sortCount in masterListKeys) {
								var text = masterListKeys[sortCount];
								if (text === element) {
									return true;
								}
							}
							return false;
						});

						// build navigation string
						var path = "/" + masterListEntity + "(";
						for ( var index2 in masterListKeys) {
							if (this.navParameter[masterListKeys[index2]] !== " ") {
								// check for date format
								// all date attributes need a leading "datetime" for the OData call,
								// therefore we need to check every attribute via regEx

								// regexDate searches for dates like '2014-04-09T12:00:00'
								var regexDate = /^[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/;

								if (regexDate.test(this.navParameter[masterListKeys[index2]])) {
									path += masterListKeys[index2] + "=datetime'"
											+ encodeURIComponent(this.navParameter[masterListKeys[index2]]) + "',";
								} else {
									path += masterListKeys[index2] + "='" + encodeURIComponent(this.navParameter[masterListKeys[index2]])
											+ "',";
								}
							} else {
								path += masterListKeys[index2] + "='" + "" + "',";
							}
						}
						// cut the last "," and add a ")"
						path = path.substring(0, path.length - 1);
						path += ")";
						return path;
					},
					
					/**
					 * Display warning if change request exists
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					 _displayChangeRequestWarning : function(changeRequestExists) {					 						 
						 if (changeRequestExists){
							 this.getView().byId("infoToolBarCR").setVisible(true);
						 }
						 else {
							 this.getView().byId("infoToolBarCR").setVisible(false);
						 }
					 },	
					 
					/**
					 * Display change requests
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					 onDisplayChangeRequests : function(oEvent) {
						 
						 	//create change request fragment with list
						 	if (!this._oChangeRequestList){					 	
						 		this._oChangeRequestList = sap.ui.xmlfragment("i2d.pp.mrpcockpit.reuse.fragments.ChangeRequestList", this); 
						 		this.getView().addDependent(this._oChangeRequestList);
						 	}
							
							//get old material
							var oldMaterialId = this.dMaterialID;
							
						  //get current material
							var oContext = this.getView().getBindingContext();
							var oObject = oContext.getObject();
							this.dMaterialID = oObject.MaterialID;
							
							// if current material is a new one -> do aggregation binding for this material
							if (oldMaterialId !== this.dMaterialID){
							
								//add Filters
								var aORFilter = new Array();
								aORFilter.push(new sap.ui.model.Filter("SolutionRequestStatus", "EQ", this.Constants.REQUEST_STATUS_REQUESTED));
								aORFilter.push(new sap.ui.model.Filter("SolutionRequestStatus", "EQ", this.Constants.REQUEST_STATUS_ANSWERED));							
								aORFilter.push(new sap.ui.model.Filter("SolutionRequestStatus", "EQ", this.Constants.REQUEST_STATUS_COLLECTED));
								aORFilter.push(new sap.ui.model.Filter("SolutionRequestStatus", "NE", null));
								var oORFilter1 = new sap.ui.model.Filter(aORFilter, false); 
								
								var oORFilter2 = new sap.ui.model.Filter("MaterialID", "EQ", this.dMaterialID);
								
								var aANDFilters = new Array();
								aANDFilters.push(oORFilter1);
								aANDFilters.push(oORFilter2);
								
								var aFilter = new Array();
								aFilter.push(new sap.ui.model.Filter(aANDFilters, true));							
	
								
								// create list item template
								var oList = sap.ui.getCore().byId("idChangeRequestTable");
								var oListItemTemplate = oList.getItems()[0];
								oList.removeItem(oListItemTemplate);
								
								// set model
							 	this._oChangeRequestModel = this.oApplicationFacade.getODataModel();			      	
								oList.setModel(this._oChangeRequestModel, "ChangeRequests"); 	
								
								// bind aggregation
								var url = '/ChangeRequests';	
								oList.bindAggregation("items", {
									path : url,
								  filters: aFilter,
									template : oListItemTemplate														
								});
								
							}	
					    
							// open popover			      
					    var oInfoToolbar = oEvent.getSource();
					    jQuery.sap.delayedCall(0, this, function () {
					      this._oChangeRequestList.openBy(oInfoToolbar);
					    });

					 },				 
					 
					/**
					 * Update the data for the solution cards and rerender the control
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_updateSolutionCards : function(oView) {

						// Initialize/Rebuild the solution cards
						var ctrlCards = oView.byId("cards");
						var oContext = oView.getBindingContext();
						if (!oContext) {
							return;
						}
						var oSupDemHeader = oContext.getObject();
						var oSolCards = oSupDemHeader.SolCard;
						var oModel = oView.getModel();
						var aCards = new Array();
						for ( var i = 0; i < oSolCards.__list.length; i++) {
							var key = oSolCards.__list[i];
							var object = oModel.oData[key];
							aCards.push(object);
						}
						// Pass the data to the control
						var oModelI18N = oView.getModel("Common_i18n");
						ctrlCards.setModel(oModelI18N, "Common_i18n");
						ctrlCards.addSolutionCards(aCards, oSupDemHeader.MaterialShortageHasNoSolution);
						// Re-Render the control
						ctrlCards.rerender();

					},

					/**
					 * Update the control for the Supply Demand Items
					 * 
					 * @param bFade
					 *          boolean that indicates whether to use fade in the items or show them directly
					 * @param aItems
					 *          array of supply demand items that shall be shown in the table. They are provided in case of a
					 *          preview. if empty, the originals are shown
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_updateTableSupplyDemandItems : function(bFade, aItems) {
						var ctrlTable = this.getView().byId("shortages");
						var oContext = this.getView().getBindingContext();
						if (!oContext) {
							return;
						}
						// Get the supply demand header and the solution cards
						// of the current context
						var oSupDemHeader = oContext.getObject();

						if (!aItems) {
							// if this method is not called with items (in case of preview), we
							// have to use the original items
							aItems = this._readOriginSupDemItems();
						}

						// Get start and end date of the current shortage period via the header data
						var dShortageStartDate = oSupDemHeader.MaterialShortageStartDate;
						var dShortageEndDate = oSupDemHeader.MaterialShortageEndDate;

						// Add an additional attribute that indicates if the stock quantity shall be visible in the supply demand
						// items list or not. This additional attribute can be bound in the supply demand items list where we
						// don't have access to the header data which contains the shortage start and end date.
						// The stock quantity shall only be displayed if the date of the MRP element is within the shortage
						// period (shortage start and end date). Reason is, that outside the shortage period not all MRP elements
						// are shown and therefore the user would not understand the quantity.
						for ( var i = 0; i < aItems.length; i++) {
							if ((aItems[i].MRPElementAvailyOrRqmtDate >= dShortageStartDate)
									&& (aItems[i].MRPElementAvailyOrRqmtDate <= dShortageEndDate)) {
								aItems[i].StockQuantityVisible = true;
							} else {
								aItems[i].StockQuantityVisible = false;
							}
						}

						var sPath = oContext.getPath().substring(1);

						var oData = {};
						oData["" + sPath] = {
							SupDemItem : aItems
						};

						if (bFade) {
							$(ctrlTable.getDomRef()).fadeOut(
									function() {
										// exchange the data in the table model

										var m = ctrlTable.getModel();
										m.setData(oData);
										ctrlTable.bindElement(oContext.getPath());
										// re-rendering of the table to set the StyleClasses for coloring
										ctrlTable.updateAggregation("items");
										$(ctrlTable.getDomRef()).fadeIn();

										// we have to update the "no data" text for supDemItem table manually, since the
										// updateFinished event and its event handler of the table control can't be used
										// due to the way we initialize the table
										ctrlTable.setNoDataText(ctrlTable.getModel('Common_i18n').getResourceBundle().getText(
												"tableUpdateFinished"));

									});
						} else {
							var m = ctrlTable.getModel();
							m.setData(oData);
							ctrlTable.bindElement(oContext.getPath());
							// re-rendering of the table to set the StyleClasses for coloring
							ctrlTable.updateAggregation("items");

							// we have to update the "no data" text for supDemItem table manually, since the
							// updateFinished event and its event handler of the table control can't be used
							// due to the way we initialize the table
							ctrlTable.setNoDataText(ctrlTable.getModel('Common_i18n').getResourceBundle().getText(
									"tableUpdateFinished"));
						}
					},

					/**
					 * Reads those Supply Demand Items from the view that were transfered from Backend
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_readOriginSupDemItems : function() {
						// the Binding Context of the view contains a reference for currently shown Sup Dem Items
						var oContext = this.getView().getBindingContext();
						if (!oContext) {
							return;
						}

						// Get the reference for the Supply Demand Items
						// of the current context
						var oSupDemHeader = oContext.getObject();
						var oSupDemItems = oSupDemHeader.SupDemItem;

						// The application model contains all Supply Demand Items
						var oModel = this.getView().getModel();

						// Read all Supply Demand Items of the current context out of the application model
						var aItems = new Array();
						for ( var i = 0; i < oSupDemItems.__list.length; i++) {
							var key = oSupDemItems.__list[i];
							var object = oModel.oData[key];
							aItems.push(object);
						}

						return aItems;
					},

					/**
					 * Navigate back to S3
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_navBack : function(oEvent) {
						if (this._getPathDetailView !== undefined) {
							var sPath = this._getPathDetailView().substring(1);

							var bReplace = !jQuery.device.is.phone;
							this.oRouter.navTo(i2d.pp.mrpcockpit.reuse.util.CommonConstants.ROUTING.DETAIL, {
								contextPath : sPath,
								stateID : this.navParameter.stateID
							}, bReplace);
						}
					},

					/**
					 * Handles the OK-Event of the closing dialog Exchange the data of the global model by the changed data in the
					 * UI.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					onDialogOk : function(channelId, eventId, data) {

						if (data && data.model && data.model.cardModel) {
							// Reset the selected solution card (for preview)
							this._oCard = null;

							// Extract the message defined by the solution dialog and show it in the message toast
							var msg = "";
							if (data.model.cardModel.oData.msg) {
								// Standard behavior
								msg = data.model.cardModel.oData.msg;
							} else {
								// Fallback if the solution dialog has not provided any message
								var oModelI18N = this.getView().getModel("Common_i18n");
								var oBundle = oModelI18N.getResourceBundle();
								msg = oBundle.getText("SOLUTION_DIALOG_OK");
							}
							sap.ca.ui.message.showMessageToast(msg);

							// Trigger a new "Detail Call" required by the Chart Control
							this.requestChartData();

							// Trigger a new "Solution Call"
							// Read the newly created data
							var oCreatedSupDemItem = null;
							if (data.model.responseModel) {
								oCreatedSupDemItem = this._readCreatedSupDemItemKey(data.model.responseModel,
										data.model.cardModel.oData.MaterialShortageSolutionType);
							}
							// Read SolutionHeader SupplyDemandItems and SolutionCards
							this._readSolutionViewData(true, oCreatedSupDemItem);
						}

					},

					/**
					 * Determines the Key for the Supply Demand Item that have been created using a solution card ("Procure" ||
					 * "Transfer")
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_readCreatedSupDemItemKey : function(oData, solutionType) {

						var oDataResponse = null;
						var requisition = null;
						var order = null;

						try {
							oDataResponse = oData.__batchResponses[0].__changeResponses[0].data;
						} catch (e) {
							return null;
						}

						switch (solutionType) {

							// Category - Purchase Requisition
							case this.Constants.SOLUTIONTYPE_PR_CREATE :
								requisition = oDataResponse.MMPurchaseRequisitionItems.results[0];

								return {
									MRPElementCategory : this.Constants.MRP_ELEMENT_CATEGORY_PURRQS,
									MRPElement_Int : requisition.PurchaseRequisitionID,
									MRPElementItem_Int : requisition.ItemID,
									MRPElementScheduleLine_Int : ""
								};

								// Category - Release Order for a Stock Transfer Requisition
							case this.Constants.SOLUTIONTYPE_TOR_CREATE :
								requisition = oDataResponse.MMPurchaseRequisitionItems.results[0];

								return {
									MRPElementCategory : this.Constants.MRP_ELEMENT_CATEGORY_PRQREL,
									MRPElement_Int : requisition.PurchaseRequisitionID,
									MRPElementItem_Int : requisition.ItemID,
									MRPElementScheduleLine_Int : ""
								};

								// Category - Purchase Order Item
							case this.Constants.SOLUTIONTYPE_PO_CREATE :
								order = oDataResponse.MMPurchaseOrderItems.results[0].MMPurchaseOrderScheduleLines.results[0];
								return {
									MRPElementCategory : this.Constants.MRP_ELEMENT_CATEGORY_POITEM,
									MRPElement_Int : order.PurchaseOrderID,
									MRPElementItem_Int : order.ItemID,
									MRPElementScheduleLine_Int : order.ScheduleLineID
								};

								// Category - Stock Transfer Order
							case this.Constants.SOLUTIONTYPE_TO_CREATE :
								order = oDataResponse.MMPurchaseOrderItems.results[0].MMPurchaseOrderScheduleLines.results[0];
								return {
									MRPElementCategory : this.Constants.MRP_ELEMENT_CATEGORY_RELORD,
									MRPElement_Int : order.PurchaseOrderID,
									MRPElementItem_Int : order.ItemID,
									MRPElementScheduleLine_Int : order.ScheduleLineID
								};
							default :
								return null;
						}
					},

					/**
					 * Reads the Solution Header in Batch mode and passes all currently shown Supply Demand Items *
					 * 
					 * @param bWithSupDemItems
					 *          All Supply Demand Items which are currently shown are passed to the backend and will be shown
					 *          again
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_readSolutionViewData : function(bWithSupDemItems, newSupDemItem) {

						// --------------------------------------------
						// Prepare and run the "Solution-Call"
						// --------------------------------------------

						var backendVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper
								.getServiceSchemaVersion(this.oApplicationFacade);

						if (backendVersion === 1) {

							// Wave 3
							this.path = i2d.pp.mrpcockpit.reuse.util.Wave3Helper.getPathSolutionView.call(this);
							this.view.bindElement(this.path, {
								"expand" : 'SolCard,SupDemItem'
							});

						} else {

							// Wave 5 ...
							this.view.byId("oDataBindingServant").bindAggregation(
									"items",
									{
										path : "/PPMRPSolHeaders",
										filters : this._createSolHeaderFilter(bWithSupDemItems, newSupDemItem, this.navParameter,
												this.dateStart, this.dateEnd),
										parameters : {
											expand : 'SolCard,SupDemItem'
										},
										template : this.oTemplate
									});
						}
					},

					/**
					 * Creates the Soltuion Header Filters
					 * 
					 * @param bWithSupDemItems
					 *          The Filter also contains all Supply Demand Items of the list
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_createSolHeaderFilter : function(bWithSupDemItems, newSupDemItem, oNavParameter, dateStart, dateEnd) {
						// there are two parts of the filter, the solution header and the supply demand item keys

						var aFilter = new Array();
						// part 1: the key attributes of the solution header
						aFilter
								.push(new sap.ui.model.Filter('MaterialID', sap.ui.model.FilterOperator.EQ, oNavParameter.MaterialID));
						aFilter.push(new sap.ui.model.Filter('MRPPlant', sap.ui.model.FilterOperator.EQ, oNavParameter.MRPPlant));
						aFilter.push(new sap.ui.model.Filter('MRPArea', sap.ui.model.FilterOperator.EQ, oNavParameter.MRPArea));
						aFilter.push(new sap.ui.model.Filter('MRPPlanningSegmentType', sap.ui.model.FilterOperator.EQ,
								oNavParameter.MRPPlanningSegmentType));
						aFilter.push(new sap.ui.model.Filter('MRPPlanningSegmentNumber', sap.ui.model.FilterOperator.EQ,
								oNavParameter.MRPPlanningSegmentNumber));
						aFilter.push(new sap.ui.model.Filter('MaterialShortageDefinitionID', sap.ui.model.FilterOperator.EQ,
								oNavParameter.MaterialShortageDefinitionID));
						aFilter
								.push(new sap.ui.model.Filter('MaterialShortageStartDate', sap.ui.model.FilterOperator.EQ, dateStart));

						// if there is no end date maintained we are on the first call
						if (dateEnd !== null) {
							aFilter.push(new sap.ui.model.Filter('MaterialShortageEndDate', sap.ui.model.FilterOperator.EQ, dateEnd));
						} else {
							// because oData does not allow an empty date for a key attribute
							// we have to set 01.01.1753
							aFilter.push(new sap.ui.model.Filter('MaterialShortageEndDate', sap.ui.model.FilterOperator.EQ,
									"1753-01-01T12:00:00"));
						}

						// part 2: the key attributes of the currently shown Supply Demand Items

						if (bWithSupDemItems) {

							var aSupDemItems = this._readOriginSupDemItems();

							// add also the Supply Deman Item the user created via Solution Card
							if (newSupDemItem) {
								aSupDemItems.push(newSupDemItem);
							}

							var aFilterCategory = new Array();
							var aFilterElement = new Array();
							var aFilterElementItem = new Array();
							var aFilterScheduleLine = new Array();

							for ( var i in aSupDemItems) {
								aFilterCategory.push(aSupDemItems[i].MRPElementCategory);// MRPElementCategory
								aFilterElement.push(aSupDemItems[i].MRPElement_Int);// MRPElement
								aFilterElementItem.push(aSupDemItems[i].MRPElementItem_Int);// MRPElementItem
								aFilterScheduleLine.push(aSupDemItems[i].MRPElementScheduleLine_Int);// MRPElementScheduleLine
							}
							var aANDFilters = new Array();
							aANDFilters.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPElementCategory',
									aFilterCategory));
							aANDFilters.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPElement', aFilterElement));
							aANDFilters.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPElementItem',
									aFilterElementItem));
							aANDFilters.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPElementScheduleLine',
									aFilterScheduleLine));

							aFilter.push(new sap.ui.model.Filter(aANDFilters, true));
						}

						return aFilter;
					},

					/**
					 * Handles the "run preview" event. This method creates a preview for the selected solution card for the table
					 * control and the chart control. Both previews are created in order to keep them in sync and allow switching
					 * the view.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_previewRun : function(channelId, eventId, data, bFade) {

						// If the 'client' doesn't provide fading information,
						// we use true as default
						if (bFade === null || bFade === undefined) {
							bFade = true;
						}
						// ---------------------------------------------
						// Extract the data from the selected solution card
						// ---------------------------------------------
						if (data && data.model) {
							// Save the reference of the currently selected
							// solution card at the S4 controller
							this._oCard = data.model;
						}

						// ---------------------------------------------
						// Check preconditions for the preview
						// ---------------------------------------------
						// A solution card has to be selected
						if (!this._oCard) {
							return;
						}

						var oView = this.getView();
						var oModel = oView.getModel();
						var context = oView.getBindingContext();
						if (!context) {
							// If there is no context - there are no cards...
							return;
						}
						// Get the supply demand header and the solution cards
						// of the current context
						var oSupDemHeader = context.getObject();
						var oSupDemItems = oSupDemHeader.SupDemItem;
						if (oSupDemItems.__list.length === 0) {
							// If there are no supply demand items, there's no preview
							return;
						}

						// ---------------------------------------------
						// The preview must run on a copy of the supply demand items
						// that are stored in the OData model. Therefore do
						// a clone.
						// ---------------------------------------------
						var aModelClone = [];
						for ( var i = 0; i < oSupDemItems.__list.length; i++) {
							var key = oSupDemItems.__list[i];
							var oClone = jQuery.extend({}, oModel.oData[key]);
							aModelClone.push(oClone);
						}

						// ---------------------------------------------
						// Run the preview using the 'CalulationEngine'.
						// The engine works on the cloned data.
						// ---------------------------------------------
						var aCalcEngineResult = [];
						var aSupDemItems = [];
						var sErrorText = "";
						var oModelI18N = this.getView().getModel("Common_i18n");
						var oBundle = oModelI18N.getResourceBundle();
						var oCalculationEngine = new i2d.pp.mrpcockpit.reuse.util.CalculationEngine(oModelI18N);

						// check which calculation must be done (chart or table)
						if (!this.isChartVisible) {
							// Run the preview for the TABLE
							aCalcEngineResult = oCalculationEngine.previewTable(aModelClone, this._oCard,
									oSupDemHeader.MaterialShortageStartDate, oSupDemHeader.MaterialShortageEndDate, new Date());
							// Update table with results of preview
							switch (aCalcEngineResult[0]) {
								case 0 :
									// Preview was ok; Update the supply demand items
									aSupDemItems = aCalcEngineResult[1];
									sErrorText = "";
									break;
								case -1 :
									// Preview returned an error - no solution card provided
									aSupDemItems = [];
									sErrorText = oBundle.getText("PREVIEW_ERROR_NO_CARD");
									break;
								case -2 :
									// Preview returned an error - target date is in the past
									aSupDemItems = [];
									sErrorText = oBundle.getText("PREVIEW_ERROR_DATE_INVALID");
									break;
								default :
									aSupDemItems = [];
									sErrorText = oBundle.getText("PREVIEW_ERROR_UNKNOWN");
							}
							// Update the supply demand items table
							this._updateTableSupplyDemandItems(bFade, aSupDemItems);
							if (sErrorText) {
								// Show the error message in a message box
								sap.ca.ui.message.showMessageBox({
									type : sap.ca.ui.message.Type.ERROR,
									message : oBundle.getText("PREVIEW_ERROR_SHORT"),
									details : sErrorText
								});
							}

						} else {
							// Run the preview for the CHART
							if (this._oCard.MaterialShortageSolutionType !== this.Constants.SOLUTIONTYPE_ACCEPT) {
								this.addChartDelta(this._oCard);
							}
							var aResult = oCalculationEngine.previewChart(this._oCard);
						}
					},

					/**
					 * Handles the "cancel preview" event. It uses the objects within the oData models to create a local array of
					 * objects (SupDemItems). This data is directly set to the model of the table control.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_previewCancel : function(channelId, eventId, data) {

						// Remove the active card from the controller
						// that represents the current preview.
						if (!this._oCard) {
							return;
						}
						this._oCard = null;

						// Reset the supply demand items to the original state
						if (!this.isChartVisible) {
							// Update Table
							this._updateTableSupplyDemandItems(true);
						}
						// Update chart
						this.removeChartDelta();
					},

					/**
					 * Handles the "exit" event.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					onExit : function() {

						// Check if the Collaboration Dialog is still open and close it
						if (this.oCollaborationDialog && this.oCollaborationDialog.isOpen()) {
							this.oCollaborationDialog.close();
							this.oCollaborationDialog.destroy();
						}

						this._oCard = null;
						// Unsubscribe all events
						this._unsubscribeEvents();
						// remove resize handler
						this.removeHandler();

						this.oApplicationFacade.deRegisterOnMasterListRefresh(this.onMasterRefresh, this);
						// Detach the eventhandler for routing
						this.oRouter.detachRoutePatternMatched(this._onRoutePatternMatched, this);
						
						// destroy change request fragment
						if (this._oChangeRequestList){	
							
							var oListItem = sap.ui.getCore().byId("idChangeRequestlistItem");
							if (oListItem) { oListItem.destroy(); }
							
							var oList = sap.ui.getCore().byId("idChangeRequestTable");
							if (oList) { oList.destroy(); }
							
							var oPopover = sap.ui.getCore().byId("idChangeRequestPopover");
							if (oPopover) { oPopover.destroy(); }
							
							this._oChangeRequestList.removeAllContent();
							this._oChangeRequestList.destroy();

						}
					},

					/**
					 * Returns the template for the list (Supply Demand Items)
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
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
									src : "sap-icon://BusinessSuiteInAppSymbols/icon-change-request",
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
							} else if ((value < valueThreshold)
									&& (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(oObject.MRPElementCategory) || (Number(oObject.MRPElementOpenQuantity) < 0))) {
								// material is short, below the threshold AND (is the stock item or item is a requirement)
								oTemplate.addStyleClass("sapMRPShortage");
							} else if ((value < valueCritical)
									&& (i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(oObject.MRPElementCategory) || (Number(oObject.MRPElementOpenQuantity) < 0))) {
								// Value is below safety stock AND (is the stock item or item is a requirement)
								oTemplate.addStyleClass("sapMRPShortageSafetyStock");
							} else if ((value >= valueCritical) && (oObject.InitialShortage && oObject.InitialShortage === true)) {
								// This element was initially below safety stock but has been increased in the preview.
								oTemplate.addStyleClass("sapMRPShortageSolved");
							}
						}

						return oTemplate;

					},

					/**
					 * Switches between the Chart view and the Table view and vice versa.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					switchView : function() {
						// Trigger the preview
						this._previewRun(null, null, null, false);
					},

					/**
					 * switches to Chart view
					 * 
					 * @param bFade
					 *          boolean that indicates whether to use fade in the items or show them directly
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					switchToChart : function(bFade) {
						this.isChartVisible = true;
						var ctrlTable = this.getView().byId("shortages");
						var that = this;
						if (bFade) {
							// we do use fadeOut and not addContent or removing the visibility so we can
							// calculate the height of the chart
							$(ctrlTable.getDomRef()).fadeOut(function() {
								// exchange the data in the table model
								// ---------------------------------------------
								// Do Fade in only if no Solution Card is played
								// otherwise fade in will be done by previewRun
								// ---------------------------------------------
								var ctrlChart = that.getView().byId("solChartContainer");
								// get rid of initial flickering of the chart. We need it in the dom tree, however
								// it should not be displayed. So we set the witdth and the height to 0 px and
								// set it afterwards to 100%
								that._showChartContainer();

								$(ctrlChart.getDomRef()).fadeIn(function() {
									if (that._oCard) {
										// Update chart
										that._previewRun(null, null, null, bFade);
									} else {
										// Update chart
										that.removeChartDelta();
									}
								});
							});
						} else {

							// get rid of initial flickering of the chart. We need it in the dom tree, however
							// it should not be displayed. So we set the witdth and the height to 0 px and
							// set it afterwards to 100%
							that._showChartContainer();
							// Hide the table
							that._hideTable();
							// Set the chart to basic view to suppress the animation
							// when the chart becomes visible.
							this.removeChartDelta();
							// Update the chart without fading
							if (that._oCard) {
								// Update chart
								that._previewRun(null, null, null, bFade);
							}
						}
					},

					/**
					 * switches to Table view
					 * 
					 * @param bFade
					 *          boolean that indicates whether to use fade in the items or show them directly
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					switchToTable : function(bFade) {
						this.isChartVisible = false;
						var ctrlChart = this.getView().byId("solChartContainer");
						var that = this;
						if (bFade) {
							// we do use fadeOut and not addContent or removing the visibility so we can
							// calculate the height of the chart
							$(ctrlChart.getDomRef()).fadeOut(function() {
								// exchange the data in the table model
								if (that._oCard) {
									// Trigger the preview in case a solution card is played
									that._previewRun(null, null, null, bFade);
								} else {
									// if no solution card is played, we need to update the supply
									// demand items in order to receive the correct data
									that._updateTableSupplyDemandItems(bFade);
								}
							});
						} else {
							// Don't use any 'fading'. Just exchange the data
							// Hide the chart container
							this._hideChartContainer();
							// Ensure that the table is visible
							this._showTable();
							// Check if a card ('preview') is active
							if (that._oCard) {
								// Trigger the preview in case a solution card is played
								that._previewRun(null, null, null, bFade);
							} else {
								// if no solution card is played, we need to update the supply
								// demand items in order to receive the correct data
								that._updateTableSupplyDemandItems(bFade);
							}
						}
					},

					/**
					 * This method shows the table with supply demand items
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_showTable : function() {
						// Unhide the table control
						var oCtrlTable = this.byId('shortages');
						oCtrlTable.setVisible(true);
					},

					/**
					 * This method hides the table with supply demand items
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_hideTable : function() {
						// Hide the table control
						var oCtrlTable = this.byId('shortages');
						oCtrlTable.setVisible(false);
					},

					/**
					 * This method is the handler for the segmented button within the table toolbar that allows the user to switch
					 * between the table and the chart view
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					onToolbarIconSelect : function(oEvent) {
						var oSource = oEvent.getSource();
						var sButtonId = oSource.getSelectedButton();
						if (sButtonId.match("btnChart")) {
							// The chart button/icon has been pressed
							this.switchToChart(false);
						} else {
							// The table button/icon has been pressed
							this.switchToTable(false);
						}
					},

					/**
					 * Initialize the chart
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					initChart : function() {
						var oChart = this.getView().byId("chart");
						this.oChartModel = new sap.ui.model.json.JSONModel();
						// the model doesn't support passing the size limit directly with the constructor
						// (whyever), so we have to set it afterwards with a separate call
						this.oChartModel.setSizeLimit(10000);

						oChart.setModel(this.oChartModel);

						var oChartValueTemplate = new i2d.pp.mrpcockpit.reuse.controls.ChartValue({
							date : "{date}",
							demand : "{demand}",
							supply : "{supply}",
							shortageAccepted : "{shortageAccepted}"
						});
						// var oChartDeltaTemplate = new i2d.pp.mrpcockpit.reuse.controls.ChartValue({
						// date : "{date}",
						// demand : "{demand}",
						// supply : "{supply}"
						// });

						var balanceDotTooltip = this.getView().getModel("Common_i18n").getResourceBundle().getText("XTOL_BAL_DOT");

						oChart.setProperty("showOverview", true, true);
						oChart.setProperty("fixOverviewHeight", 16, true);
						oChart.setProperty("minOverviewBarSize", 0, true);
						oChart.setProperty("shiftLeft", -10, true);
						oChart.setProperty("height", "300px", true);
						oChart.setProperty("width", "100%", true);
						oChart.setProperty("minChartHeight", "180px", true);
						oChart.setProperty("allowNavigation", false, true);
						oChart.setProperty("balanceDotTooltip", balanceDotTooltip);
						// oChart.setProperty("sizeDOMNodeId", this.getView().byId("pageChart").getId(), true);
						oChart.bindProperty("shiftLeft", "/shiftLeft");
						oChart.bindProperty("unitDecimals", "/decimals");
						oChart.bindProperty("startBalance", "/startBalance");
						oChart.bindProperty("minStock", "/minStock");
						oChart.bindProperty("safetyStock", "/safetyStock");
						oChart.bindValues("/chartData", oChartValueTemplate);
					},

					/**
					 * Execute the detail call to retrieve the required data for the chart
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					requestChartData : function() {
						var path = this._getPathDetailView() + "/" + this.navParameter.DetailListNavProperty;
						// Detail Call
						this.getView().getModel().read(path, null, null, true, jQuery.proxy(this.processChartData, this),
								function(oError) {
									sap.ca.ui.message.showMessageBox({
										type : sap.ca.ui.message.Type.ERROR,
										// TODO: IMPROVEMENT replace by a translatable text
										message : "Chart cannot be displayed because the required data could not be retrieved",
										details : "Chart cannot be displayed because the required data could not be retrieved"
									});
								});
					},

					/**
					 * Gets the result of the detail call, converts them to the JSON model, and displays the data in the chart
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					processChartData : function(oData, oResponse) {
						var view = this.getView();
						var oCalculationEngine = new i2d.pp.mrpcockpit.reuse.util.CalculationEngine(view.getModel("Common_i18n"));
						// var oModelData = oCalculationEngine.initialChartData(oResponse.data.results, this.dateStart,
						// this.dateEnd,
						// this.chartScrollPos);
						var oModelData = oCalculationEngine.initialChartData(oResponse.data.__batchResponses[0].data.results,
								this.dateStart, this.dateEnd, this.chartScrollPos);
						// oModelData.shiftLeft = -30;
						this.oChartModel.setData(oModelData);
						// cleanup deltas from previus charts
						this.removeChartDelta(true);
					},

					/**
					 * Update the chart preview?
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					addChartDelta : function(oCard) {
						var oCalculationEngine = new i2d.pp.mrpcockpit.reuse.util.CalculationEngine(this.getView().getModel(
								"Common_i18n"));
						var oPreviewData = oCalculationEngine.previewChartData(oCard);
						var oChart = this.getView().byId("chart");
						oChart.setDeltas(oPreviewData.deltas);
					},

					/**
					 * Reset the chart, i.e. remove all deltas. This also triggers the redering of the chart.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					removeChartDelta : function(bNoAnimation) {

						var oChart = this.getView().byId("chart");
						oChart.setDeltas([], bNoAnimation);
					},

					/**
					 * This method revokes the acceptance of a former accepted shortage. It is called out of
					 * 'onSolutionCardExecute'.
					 * 
					 * @param oModelCard
					 *          The model of the selected solution card
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_revokeAcceptedShortage : function(oModelCard) {
						var oModelI18N = this.getView().getModel("Common_i18n");
						var oBundle = oModelI18N.getResourceBundle();
						// Define the handles for the asynchronous call
						var oHandlerOrder = {};
						oHandlerOrder.fnSuccess = function(oData, oResponse, aErrorResponses) {
							// We have to track the error responses!
							sap.ca.ui.utils.busydialog.releaseBusyDialog();
							// Check if errors have occurred within the batch update
							if (aErrorResponses.length > 0) {
								// Extract the error message out of the response object
								var sErrorText = i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromBatchResponse(oBundle,
										aErrorResponses);
								// Show the error message in a message box
								sap.ca.ui.message.showMessageBox({
									type : sap.ca.ui.message.Type.ERROR,
									message : oBundle.getText("CARD_CANCEL_ACCEPTED_FAIL"),
									details : sErrorText
								});
								var bus = sap.ui.getCore().getEventBus();
								bus.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_ERROR,
										null);
							} else {
								// Do the solution call
								this._readSolutionViewData(true, null);
								// Show the message toast
								var sMsg = oBundle.getText("CARD_CANCEL_ACCEPTED");
								sap.ca.ui.message.showMessageToast(sMsg);

								// Trigger a refresh of the master list, so the 'processed' state of the shortage
								// will get reset.
								var bus = sap.ui.getCore().getEventBus();
								bus.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_OK,
										null);
							}
						}.bind(this);
						oHandlerOrder.fnError = function(oError) {
							sap.ca.ui.utils.busydialog.releaseBusyDialog();
							var sErrorText = "";
							// Check if/Ensure the response object contains a body
							if (oError && oError.response && oError.response.body) {
								// Extract the error message out of the response object
								sErrorText = i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromStream(oBundle,
										oError.response.body);
							} else {
								// Use a default for an unknown error
								sErrorText = oBundle.getText("SOLUTION_DIALOG_ERROR_UNKNOWN");
							}
							// Show the error message in a message box
							sap.ca.ui.message.showMessageBox({
								type : sap.ca.ui.message.Type.ERROR,
								message : oBundle.getText("CARD_CANCEL_ACCEPTED_FAIL"),
								details : sErrorText
							});
							var bus = sap.ui.getCore().getEventBus();
							bus.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_ERROR,
									null);
						}.bind(this);

						// Show the busy dialog
						sap.ca.ui.utils.busydialog.requireBusyDialog({
							text : oBundle.getText("SOLUTION_DIALOG_MSG_SAVE_WAITING")
						});

						// Remove the Acceptance of the Shortage
						var sErrorText = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.deleteShortageAcceptBatch(oModelCard,
								oHandlerOrder);
						if (sErrorText) {
							sap.ca.ui.utils.busydialog.releaseBusyDialog();
							sap.ca.ui.message.showMessageBox({
								type : sap.ca.ui.message.Type.ERROR,
								message : oBundle.getText(sErrorText)
							});
						} else {
							var bus = sap.ui.getCore().getEventBus();
							bus.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_EXECUTE,
									null);
						}
					},

					/**
					 * This method opens the solution dialogs based on the selected solution card.
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					onSolutionCardExecute : function(channelId, eventId, data) {
						// Init the sViewName with an invalid value.
						var sViewName = "";
						var oOrgModel = data.model;
						// We have to work on a clone of the original model within the dialog
						var oModelCard = jQuery.extend({}, oOrgModel);

						var backendVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper
								.getServiceSchemaVersion(this.oApplicationFacade);
						if (backendVersion === 1) {
							// convert oData of Wave 3 to Wave 5 Interface
							i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper._mapOData3ToOdata5(oModelCard);
						}

						// The required view/fragment is related to the given solution type
						switch (oModelCard.MaterialShortageSolutionType) {

							case this.Constants.SOLUTIONTYPE_ACCEPT :
								// If the shortage has no realistic end date ("infinity" in year 9999)
								// we show an error message and don't show any dialog
								if (oModelCard.MaterialShortageEndDate.getTime() === new Date(9999, 11, 31, 13).getTime()) {
									var oModelI18N = this.getView().getModel("Common_i18n");
									var oBundle = oModelI18N.getResourceBundle();
									sap.ca.ui.message.showMessageBox({
										type : sap.ca.ui.message.Type.ERROR,
										message : oBundle.getText("CARD_ACCEPT_INFINITY")
									});
								} else {
									sViewName = "i2d.pp.mrpcockpit.reuse.fragments.DialogShortageAccept";
								}
								break;
							case this.Constants.SOLUTIONTYPE_ACCEPT_REMOVE :
								// Revoke the accepted shortage
								this._revokeAcceptedShortage(oModelCard);
								break;
							case this.Constants.SOLUTIONTYPE_PO_RESCHEDULE :
							case this.Constants.SOLUTIONTYPE_PO_INCREASE :
							case this.Constants.SOLUTIONTYPE_TO_RESCHEDULE :
							case this.Constants.SOLUTIONTYPE_TO_INCREASE :
							case this.Constants.SOLUTIONTYPE_PO_CHANGE :
							case this.Constants.SOLUTIONTYPE_TO_CHANGE :
								sViewName = "i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange";
								// reset Material ID so that CR list is updated
								this.dMaterialID = null;
								break;
							case this.Constants.SOLUTIONTYPE_PO_CREATE :
							case this.Constants.SOLUTIONTYPE_TO_CREATE :
							case this.Constants.SOLUTIONTYPE_PR_CREATE :
							case this.Constants.SOLUTIONTYPE_TOR_CREATE :
								sViewName = "i2d.pp.mrpcockpit.reuse.fragments.DialogOrderCreate";
								break;
							case this.Constants.SOLUTIONTYPE_PR_RESCHEDULE :
							case this.Constants.SOLUTIONTYPE_PR_INCREASE :
							case this.Constants.SOLUTIONTYPE_TOR_RESCHEDULE :
							case this.Constants.SOLUTIONTYPE_TOR_INCREASE :
							case this.Constants.SOLUTIONTYPE_PR_CHANGE :
							case this.Constants.SOLUTIONTYPE_TOR_CHANGE :
								sViewName = "i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange";
								break;
							case this.Constants.SOLUTIONTYPE_PA_STOCK_CHANGE :	
							case this.Constants.SOLUTIONTYPE_PA_VENDOR_CHANGE :
							case this.Constants.SOLUTIONTYPE_PA_UNSRC_CHANGE :
							case this.Constants.SOLUTIONTYPE_PA_PLANT_CHANGE :
							case this.Constants.SOLUTIONTYPE_PA_PROD_CHANGE :
							case this.Constants.SOLUTIONTYPE_PA_REPLANT_CHANGE :
								sViewName = "i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange";
								break;								
						}

						if (sViewName) {
							// Create the dialog controller, its fragment, pass the model and open the dialog
							var ctrl = sap.ui.controller(sViewName);
							this.oCollaborationDialog = sap.ui.xmlfragment(sViewName, ctrl);
							this.oCollaborationDialog.setModel(this.oApplicationImplementation.getApplicationModel("ServiceVersions"),"ServiceVersions");
							this.oCollaborationDialog.setModel(this.getView().getModel("Common_i18n"), "Common_i18n");
							this.oCollaborationDialog.setModel(new sap.ui.model.json.JSONModel(oModelCard));
							this.oCollaborationDialog.open();
						}

					},

					/**
					 * remove all existing handler for size calculation
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					removeHandler : function() {
						// clear handler for size changes
						if (jQuery.device.is.desktop) {
							if (this.resizeHandler) {
								sap.ui.core.ResizeHandler.deregister(this.resizeHandler);
								this.resizeHandler = null;
							}
						} else {
							sap.ui.Device.orientation.detachHandler(this.onResize, this);
							sap.ui.Device.resize.detachHandler(this.onResize, this);
						}

						// clear delayed calls for resizing
						if (this.resizeTimer) {
							jQuery.sap.clearDelayedCall(this.resizeTimer);
							this.resizeTimer = null;
						}

						// clear also any delayed call for size calculation fixing
						if (this.resizeFixHandler) {
							jQuery.sap.clearDelayedCall(this.resizeFixHandler);
							this.resizeFixHandler = null;
						}
					},

					/**
					 * calculate the size for the controls of the page like the scrollcontainer, the chart, ...
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					resize : function(initialOffset) {
						// Recalculate the sizes
						i2d.pp.mrpcockpit.reuse.util.Helper.resizeUiControls(this,
								i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_S4, initialOffset);
					},

					/**
					 * If the size calculation failed, this handler is called to recalculate the size again
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					resizeFix : function() {
						jQuery.sap.log.debug("resize chart to ensure proper sizing");
						this.resize();
						// remove the handler id only after the resize call to avoid a recursive call
						this.resizeFixHandler = null;
					},

					/**
					 * Handle the resize event and trigger a delayed call to calculate the proper sizes
					 * 
					 * @param oEvent
					 *          object containing the event data (e.g. the old and new size of the screen). Important: It's not
					 *          the size of the whole page but for the section where the header, supdemlist and the solution cards
					 *          are placed. It doesn't contain the size of the header bar at the top!
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					onResize : function(oEvent) {
						// don't trigger a resize calculation immediately (for performance reasons) but
						// create a delayed call instead
						// if there is already a delayed call, remove it and create a new one instead
						if (this.resizeTimer) {
							jQuery.sap.clearDelayedCall(this.resizeTimer);
						}

						// so now create the delayed call to handle the resize
						this.resizeTimer = jQuery.sap.delayedCall(200, this, jQuery.proxy(this.resize, this));

						// Width of solution card container has to be set/adapted
						var ctrlCards = this.getView().byId("cards");
						ctrlCards.updateSolutionCardContainerSize();

					},

					/**
					 * Handle
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					onBeforeRendering : function() {
						// as DOM nodes will change, remove the resize handler
						this.removeHandler();
					},

					/**
					 * onAfterRendering is called after all controls of the page have been rendered. We use that to manually
					 * resize the controls on S4. After 500ms the handler functions for 'resizing' events are registered. The
					 * delay is required because the manual resizing already triggers new resize events that MUST NOT be handled!
					 * Therefore we register with a delay...
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					onAfterRendering : function() {
						// as the Nav Container has a fixed height, we have to calculate the correct size now
						this.resize(this._initialOffset);

						// not all UI Elements are rendered on the time when the chart is rendered. 67px are missing
						// after the first rendering the initialOffset needs to be set to 0 for correct sizing
						this._initialOffset = 0;

						// to ensure proper resizing we have to get informed when the size of the
						// "relevant" DOM nodes changes. So we register for resize of the content-node
						// of the Page (if the page becomes scrollable it has to be at least the parent
						// node of the current used DOM node)
						jQuery.sap.delayedCall(500, this, jQuery.proxy(this._registerOnResize, this));

					},

					/**
					 * This method registers the 'resize' events. It is called onAfterRendering with a delay of 500ms
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_registerOnResize : function() {
						var page = null;
						if (jQuery.device.is.desktop) {
							var $NavContent = jQuery("#" + this.getView().getId() + "--" + "mainPage-cont");
							if ($NavContent && $NavContent.length) {
								// determine relevant page node
								page = $NavContent;
								if (page) {
									this.resizeHandler = sap.ui.core.ResizeHandler.register(page[0], jQuery.proxy(this.onResize, this));
								}
							}
						} else {
							// in case of a mobile device we just register on a change of the orientation
							// or a size change of the device
							sap.ui.Device.orientation.attachHandler(this.onResize, this);
							sap.ui.Device.resize.attachHandler(this.onResize, this);
						}
					},

					/**
					 * Updates the noDataText to "Loading..." <br>
					 * Method is called when data in table refreshed
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					onItemsUpdateStarted : function(oEvent) {
						var shortagesTable = this.getView().byId("shortages");
						shortagesTable.setNoDataText(this.getView().getModel("Common_i18n").getResourceBundle().getText(
								"tableUpdateStarted"));
					},

					/**
					 * hide the chart container
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_hideChartContainer : function() {
						// reset size of solChartContainer in order to suppress
						// the container net time when entering the view in table mode
						var oCtrlChart = this.byId('solChartContainer');
						oCtrlChart.setVisible(false);
					},

					/**
					 * show all content of the chart container
					 * 
					 * @memberOf i2d.pp.mrpcockpit.reuse.view.S4parent
					 */
					_showChartContainer : function() {
						// reset size of solChartContainer in order to suppress
						// the container net time when entering the view in table mode
						var oCtrlChart = this.byId('solChartContainer');
						oCtrlChart.setVisible(true);
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
							// navigate to solutiuon view in case the user pressed by purpose on the master refresh button
							this._navBack(oEvt);
						}

					}

				});

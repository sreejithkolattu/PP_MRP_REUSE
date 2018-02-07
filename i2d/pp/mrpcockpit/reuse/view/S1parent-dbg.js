/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("sap.m.TablePersoController");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.AoRHandler");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.VariantHandler");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.StateMachine");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.ViewStateHandler");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.DisplayVariant");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.FacetFilter");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.TableSorting");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");

/***********************************************************************************************************************
 * NOTICE! <br>
 * i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getFilterFrontendVersion() and
 * i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getFrontendVersion() deliver the current Frontend Version <br>
 * The value in it has to be updated to the current Frontend Version manually!
 **********************************************************************************************************************/

/**
 * Basic Controller for all x10 MRP apps (Monitor ...)
 */
sap.ca.scfld.md.controller.BaseFullscreenController.extend("i2d.pp.mrpcockpit.reuse.view.S1parent",
		{
	
			constructor : function() {
		
				sap.ca.scfld.md.controller.BaseFullscreenController.apply(this, arguments);
		
				// remember the base class onInit implementation to execute it later
				var onInit = this.onInit;
				
				this.onInit = function() {
					// Initialize the service version and the service schema version (needed for interoperability)
					i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.initialize(this.getView().getModel(), 
							this.getMasterServiceEntity(), this.oApplicationImplementation);
					// get the versions model and bind it to the view
					var oVersion = this.oApplicationImplementation.getApplicationModel("ServiceVersions");
					this.getView().setModel(oVersion, "ServiceVersions");

					// ONE CODE LINE >>>
					this.aDiffFieldText = [];
					if (i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
						// Differentiate field texts: SoH, ModelS / Pattern: [[<fieldname>, [<i18nIDSoH>, <i18nIDModS>]], ...]
						switch (oVersion) {
							case 1 : // Older Version: Not current Version.
								break;
								
							default : // For the current version. Add All Reuse Text that have differences between SoH and ModelS
								this.aDiffFieldText = [["xtolTimeHorizonSelect", ["xtolTimeHorizonSelectSoH", "xtolTimeHorizonSelectModS"]],
								                       ["xtolShortageDefinitionSelect", ["xtolShortageDefinitionSelectSoH", "xtolShortageDefinitionSelectModS"]]];
								break;
						}
					}
					// ONE CODE LINE <<<
					
					// Initialize the i18n model before the oData model is initialized by the base controller onInit
					// this is important to avoid "i18n model not initialized" errors in the formatters
					var oBundle = new sap.ui.model.resource.ResourceModel({
						bundleName : "i2d.pp.mrpcockpit.reuse.i18n.i18n"
					});
					this.getView().setModel(oBundle, "Common_i18n");
					
					onInit.apply(this, arguments);
				};
			},
	
			// -------------------------------------------------------
			// Table Personalization handler and configuration
			// Goal: The object stores the current state of the displayed table
			// Trigger: After the selection of a additional column or after the deletion of a column
			// Usage: Save Display Variant
			// -------------------------------------------------------
			oPersoService : {
				init : function(oPersId) {
					this._sPersistenceId = oPersId;
					this._oBundle = {};
				},

				getPersData : function() {
					var oDeferred = new jQuery.Deferred();
					var oBundle = this._oBundle;
					oDeferred.resolve(oBundle);
					return oDeferred.promise();
				},

				setPersData : function(oBundle) {
					var oDeferred = new jQuery.Deferred();
					this._oBundle = oBundle;
					oDeferred.resolve();
					return oDeferred.promise();
				},

				resetPersData : function(aColumnsInitial) {
					var oDeferred = new jQuery.Deferred();
					var oInitialData = {
						_persoSchemaVersion : "1.0",
						aColumns : aColumnsInitial
					};
					this._oBundle = oInitialData;
					oDeferred.resolve();
					return oDeferred.promise();
				}
			},

			/**
			 * @memberOf i2d.pp.mrpcockpit.reuse.view.S1parent
			 */

			// ---------------------------------------
			// Init function Start
			// ---------------------------------------
			onInit : function() {

				sap.ca.scfld.md.controller.BaseFullscreenController.prototype.onInit.call(this);

				//Set Header Footer Options
				
				this.oHeaderFooterOptions = {
						oEditBtn : {
							sId : "manageButton",
							sI18nBtnTxt : "btnManageShortages",
							bDisabled : false,
							onBtnPressed : jQuery.proxy(this.onNavigationButtonPressed, this)
						},
						bSuppressBookmarkButton : true,
						aAdditionalSettingButtons : [{
							sI18nBtnTxt : "AreaOfResponsibility",
							//sIcon : "sap-icon://BusinessSuiteInAppSymbols/icon-responsible-area",
							onBtnPressed : function(evt) {
								this.aStoredFacetFilterState = this.oViewState.FacetFilterState;
								this.runStateMachine(this, this.oEvent.aORButtonPressed);
							}.bind(this)
						}]
					};
				
				this.setHeaderFooterOptions(this.oHeaderFooterOptions);
				
				/*
				if (!sap.ui.core.routing.HashChanger.getInstance().getHash()) {
					that.oRouter.navTo("state", {
						"stateID" : that.sStateID
					}, true);
				}
				 */
				// onRouteMatched call back will be registered in onInit():
				this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

				// Logger, to display comments in the browser console
				this.logger = jQuery.sap.log.getLogger(this.getVariantContainerPrefix());
				this.logger.setLevel(jQuery.sap.log.Level.INFO);

				// I18N Model block
				// get App specific texts
				this.oResourceBundle = this.oApplicationFacade.getResourceBundle();

				// Control Block
				this.oObjectHeader = this.getView().byId("ObjectHeader");

				this.oShortageSelect = this.oView.byId("ShortageSelect");
				// Simply tries to initialize the shortage definition filter to a defined state.
				var sSelectedShortageKey = this.oShortageSelect.getSelectedKey();

				this.filterMaterialShortage = new sap.ui.model.Filter("MaterialShortageDefinitionID",
						sap.ui.model.FilterOperator.EQ, sSelectedShortageKey);

				this.oTimeHorizonSelect = this.getView().byId("TimeHorizonSelect");
				this.oFacetFilter = this.getView().byId("FacetFilter");

				this.aShortageDefinitionKeys = []; // TODO new!

				this.aFacetFilterFilters = [];

				this.oTable = this.getView().byId(this.getTableId());
				this.oView = this.getView();
				this.oTable.setEnableBusyIndicator(false);

				// Paging 100 records are requested by default with each call
				this.oTable.setGrowingThreshold(100);
				this.oTable.setGrowing(true);

				// Get the items that are already defined in XML.
				this.oTableItemTemplate = this.oTable.getItems()[0].clone();
				// Workaround to see the noDataText (JCA)
				this.oTable.removeAllItems();

				// Odata Model Block
				this.oDataModel = this.oApplicationFacade.getODataModel();
				this.oDataModel.setSizeLimit(999);

				if (this.getMasterServiceEntity) {
					// get Service/Schema Version for Interoperability
					this._iServiceSchemaVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper._getServiceSchemaVersion(
							this.oDataModel, this.getMasterServiceEntity());
					this._iServiceVersion = i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper._getServiceVersion(
							this.oDataModel, this.getMasterServiceEntity());

					/**
					 * If backend version is lower than frontend version it could be that entity properties does not match with
					 * view fields, especially the backend call). This method compares metadata properties with existing table
					 * columns and removes needless columns.
					 */
					i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.removeNeedlessColumnsFromTable(this.oDataModel, this
							.getMasterServiceEntity(), this.oTable, "mrpcoDataField");
				};

				// attach listeners to controls and calls
				this.oDataModel.attachRequestCompleted(this._onRequestComplete, this);

				this.oDataModel.attachRequestFailed(this.oDataModel, this._handleRequestFailed, this);

				// Initialize the local storage of the personalization data.
				this.oPersoService.init(this.getViewNumber() + "PersoService");

				// see comments on definition
				// those functions are part of the sequence diagram
				this._initShortageSelect();
				if (this.oTimeHorizonSelect) {
					this._initTimeHorizonSelect();
				}

				var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
				this.myComponent = sap.ui.component(sComponentId);
				var oComponentData = this.myComponent.getComponentData();

				this.sVariantID = "";
				this.sStateID = this.myComponent.sStateID;
				if (oComponentData && oComponentData.startupParameters && oComponentData.startupParameters.VariantID) {
					if (oComponentData.startupParameters.VariantID[0] !== undefined) {
						this.sVariantID = oComponentData.startupParameters.VariantID[0];
					}
				}
				
				if (oComponentData && oComponentData.startupParameters && oComponentData.startupParameters.OrderCategory) {
					if (oComponentData.startupParameters.OrderCategory[0] !== undefined) {
						this.sOrderCategory = oComponentData.startupParameters.OrderCategory[0];
					// change the title of the app, only need for 312er app
						if(this._changeAppName){
							this._changeAppName(this.sOrderCategory);
						}			
					}
				}
				
				// -----------------------------------
				// State of the view ??necessary in a further development step
				// -----------------------------------
				if (this.getDemandType) {
					this.demandType = this.getDemandType();
					this.oViewState = {
						MaterialShortageDefinitionID : "",
						TimeHorizon : "7",
						FacetFilterState : [],
						TableState : {},
						SortKey : "",
						SortDescending : false,
						DemandType : this.demandType,
						DefaultVariant : false,
						VariantName : "",
						ViewChanged : false,
						OrderCategory : this.sOrderCategory
					};
				} else {
					this.oViewState = {
						MaterialShortageDefinitionID : "",
						TimeHorizon : "7",
						FacetFilterState : [],
						TableState : {},
						SortKey : "",
						SortDescending : false,
						DefaultVariant : false,
						VariantName : "",
						ViewChanged : false,
						OrderCategory : this.sOrderCategory
					};
				};

				// ---------------------------------------
				// Table Settings
				// ---------------------------------------
				this.oVSDialog = {}; // Will be created in _initResultTable.
				this.bNewVSDialogRequiredAfterTablePers = true; // Set to cause the initial creation.

				// ---------------------------------------
				// Table Personalization Start
				// ---------------------------------------
				this.newVSDialog = true;
				this.oSorter = [];
				this.bSortPath = null;
				this.bsortDescending = null;
				this.aTableStateColumnsInitial = this._getInitialTableColumnsState();
				this.oTPC = new sap.m.TablePersoController({
					table : this.oTable,
					persoService : this.oPersoService,
					componentName : this.getComponentName()
				}).activate();

				this.oTPC.attachPersonalizationsDone(function(oData) {
					this._personalizationsDone(oData);
				}.bind(this));

				this.oView.byId(this.getViewNumber() + "TablePersoButton").attachPress(function() {
					this.oTPC.openDialog();
				}.bind(this));
				// ---------------------------------------
				// Table Personalization End
				// ---------------------------------------
				this._initResultTable();

				// --------------------------------------------
				// Display Variant functionalities
				// --------------------------------------------

				this.sDefaultVariantName = "";
				if (!this.oDefaultVariantData) {
					this.oDefaultVariantData = {
						MaterialShortageDefinitionID : "",
						TimeHorizon : "7",
						FacetFilterState : [],
						TableState : {},
						SortKey : "",
						SortDescending : false,
						DefaultVariant : true,
						VariantName : "",
						ViewChanged : false,
						OrderCategory : this.sOrderCategory
					};
				}

				var sDefaultLayoutName = this.getView().getModel("Common_i18n").getResourceBundle().getText("DefaultLayout");
				i2d.pp.mrpcockpit.reuse.view.VariantHandler.saveDefaultVariant(null, this.getVariantContainerPrefix(),
						sDefaultLayoutName, this.oDefaultVariantData);

				this.oFacetFilter.attachReset(function() {
					i2d.pp.mrpcockpit.reuse.view.FacetFilter._handleFacetFilterReset(this,
							this.oDefaultVariantData.FacetFilterState);
				}.bind(this));

				this.oVariantData = this.oDefaultVariantData;
				this.oVariantData.DefaultVariant = false;
				this.sCurrentVariantName = "";
				this.sVariantContainerPrefix = this.getVariantContainerPrefix();

				this.bViewHasBeenChanged = false;

				this.oDisplayVariantPopover = i2d.pp.mrpcockpit.reuse.view.DisplayVariant.getDisplayVariantPopover(this);

				// DOM manipulation for exact placement of Variant List PoPover
				this.oObjectHeaderIconDomRef = {};

				// ---------------------------------------
				// Initialize State Machine Start
				// ---------------------------------------
				this.oState = i2d.pp.mrpcockpit.reuse.util.StateMachine.oState;
				this.oEvent = i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent;
				this.oAction = i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction;
				this.runStateMachine = i2d.pp.mrpcockpit.reuse.util.StateMachine.runStateMachine;
				this.sState = this.oState.initial;

				this.runStateMachine(this, this.oEvent.start);

				// ---------------------------------------
				// Initialize State Machine End
				// ---------------------------------------

				//i2d.pp.mrpcockpit.reuse.view.ViewStateHandler.saveViewStateInContainer(null, this.oViewState, this.sStateID, 60);

			},

			// ---------------------------------------
			// Init function End
			// ---------------------------------------

			onRouteMatched : function(oEvent) {
				var sRouteName = oEvent.getParameter("name");
				if (sRouteName === "state") {
					var sArg = oEvent.getParameter("arguments");
					if ((sArg.stateID != "undefined") && (sArg.stateID != this.sStateID)) {
						var myPattern = /id-.*-.*/;
            var sStateID = myPattern.exec(sArg.stateID);
            if (sStateID) {
                  // restore the old stateID
                  this.sStateID = sStateID[0];
            }
						//i2d.pp.mrpcockpit.reuse.view.DisplayVariant.readTempViewSateFromContainer(sArg.stateID);
					}
				} else {
					return;
				}
			},

			// if one of the saved components of the variant is changed display an * next to the variant name
			registerViewChanged : function() {

				if (this.bViewHasBeenChanged == false) {
					this.bViewHasBeenChanged = true;
					if (this.sCurrentVariantName) {
						this.oObjectHeader.setTitle(this.sCurrentVariantName + " *");
						this.oViewState.VariantName = this.sCurrentVariantName;
					} else {
						this.oObjectHeader.setTitle(this.getObjectHeaderTitle() + " *");
					}
					this.oViewState.ViewChanged = true;
				}
				i2d.pp.mrpcockpit.reuse.view.ViewStateHandler.saveViewStateInContainer(null, this.oViewState,
						this.sStateID, i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_STATE_VALIDITY_TIME);
			},

			/**
			 * Method is called as soon as any oData request attached to our oData model has been completed (includes
			 * receiving a response), no matter whether the request succeeded or not.
			 */
			_onRequestComplete : function(oData) {

				// Check if it's a $batch = oData.oSource.bUseBatch
				var sURL = oData.getParameter("url");

				var sSortingEntitySetName = this.oDataModel.getServiceMetadata().dataServices.schema[0].namespace
						+ this.getMasterEntity();

				if (oData.getSource().bUseBatch) {
					// Do nothing because we don't use a $batch (Personalization use $batch)
				} else if (sURL.match(this.getShortageEntitySetName())) {
					this.filterMaterialShortage = new sap.ui.model.Filter("MaterialShortageDefinitionID",
							sap.ui.model.FilterOperator.EQ, this.oVariantData.MaterialShortageDefinitionID);

					// Save the received shortage definition ids so those in variants can be checked.
					var aItems = this.oShortageSelect.getItems();
					for ( var i = 0; i < aItems.length; i++) {
						var oItem = aItems[i];
						this.aShortageDefinitionKeys.push(oItem.getKey());
					};

					// If the desired shortage definition is not "" and shortage definitions have been received,
					// check if the desired one exists.
					if (this.oVariantData.MaterialShortageDefinitionID != "") {
						if (this.aShortageDefinitionKeys.length > 0) {
							var bShortageDefinitionIdExists = false;
							for ( var i = 0; i < this.aShortageDefinitionKeys.length; i++) {
								if (this.aShortageDefinitionKeys[i] == this.oVariantData.MaterialShortageDefinitionID) {
									bShortageDefinitionIdExists = true;
									this.oShortageSelect.setSelectedKey(this.oVariantData.MaterialShortageDefinitionID);
									break;
								};
							}
							if (bShortageDefinitionIdExists == false) {
								this.oShortageSelect.setSelectedItem(aItems[0]);
								var sSelectedShortageKey = this.oShortageSelect.getSelectedKey();
								this.filterMaterialShortage = new sap.ui.model.Filter("MaterialShortageDefinitionID",
										sap.ui.model.FilterOperator.EQ, sSelectedShortageKey);
								this.oViewState.MaterialShortageDefinitionID = sSelectedShortageKey;
								sap.m.MessageBox.alert(this.getView().getModel("Common_i18n").getResourceBundle().getText(
										"SHORTDEF_MISSING_MSG"));
							};
						} else {
							sap.m.MessageBox.alert(this.getView().getModel("Common_i18n").getResourceBundle().getText(
									"SHORTDEF_MISSING_MSG"));
						}
					} else {
						if (this.aShortageDefinitionKeys.length > 0) {
							this.oShortageSelect.setSelectedItem(aItems[0]);
							var sSelectedShortageKey = this.oShortageSelect.getSelectedKey();
							this.filterMaterialShortage = new sap.ui.model.Filter("MaterialShortageDefinitionID",
									sap.ui.model.FilterOperator.EQ, sSelectedShortageKey);
							this.oViewState.MaterialShortageDefinitionID = sSelectedShortageKey;
						}
					}
				}

				else if (sURL.match(sSortingEntitySetName)) {
					// Check if AoR errors was sent from back end. If not, consider the table
					// data have arrived - even if other errors have occurred.
					var oerrorobject = oData.getParameters("errorobject");
					var sresponseText = oerrorobject && oerrorobject.errorobject && oerrorobject.errorobject.responseText;
					if (sresponseText) {
						if (!sresponseText.match('@AOR@')) {
							this.oTable.setNoDataText(this.getView().getModel("Common_i18n").getResourceBundle().getText(
									"itemUpdateFinished"));
							this.runStateMachine(this, this.oEvent.tableDataReceived);
						}
					} else {
						this.runStateMachine(this, this.oEvent.tableDataReceived);
					}
				}
			},

			/**
			 * Handles the error event of a oData Call. First triggers a special coding for the AOR case (if the user does not
			 * have an AOR) For all further the error is transferred to the general error handling in the connectionManager
			 * (Scfld) This is necessary because we detach the general error handling in the configuration.js (Parameter:
			 * fRequestFailed of each Service in Service List) in Order not to trigger it twice
			 */

			_handleRequestFailed : function(oEvent) {
				// read error handling
				var sresponseText = oEvent.getParameter("responseText");
				if (sresponseText) {

					if (sresponseText.match('@AOR@')) {
						this.runStateMachine(this, this.oEvent.aORUndefined);
					}

					else if (sresponseText.match('@SHORTDEF@')) {
						sap.m.MessageBox.alert(this.getView().getModel("Common_i18n").getResourceBundle()
								.getText("NO_SHORTDEF_MSG"));
					}

					else {
						// triggering of general error handling
						this.oApplicationFacade.oApplicationImplementation.oConnectionManager.handleRequestFailed(oEvent);
					}

				} else {
					// triggering of general error handling
					this.oApplicationFacade.oApplicationImplementation.oConnectionManager.handleRequestFailed(oEvent);
				}
			},
			// End

			/*
			 * Retrieve the service version of the OData model/service. @return The service version as an integer or 1 as
			 * default for an initial version. @public
			 */
			getServiceVersion : function() {
				return this._iServiceVersion;
			},

			/*
			 * Retrieve the service schema version of the OData model/service. @return The service schema version as an
			 * integer or 1 as default for an initial version. @public
			 */
			getServiceSchemaVersion : function() {
				return this._iServiceSchemaVersion;
			},

			// necessary every time the user changed a filter the table has to be refreshed thus
			_rebindRefreshTable : function() {
				var aFilters = [];

				/**
				 * NOTICE! <br>
				 * i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getFilterFrontendVersion() delivers the current Frontend
				 * Version The value in it has to be updated to the current Frontend Version manually! aFilters hand over the
				 * value to backend
				 */
				if (this._iServiceSchemaVersion > 1) {
					// hand over Frontend Version into Backend
					aFilters.push(i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getFilterFrontendVersion());
				}
				
				if(this.sOrderCategory !== undefined){
					var sOrderCategoryFilter = new sap.ui.model.Filter("MRPElementCategory", sap.ui.model.FilterOperator.EQ, this.sOrderCategory);
					aFilters.push(sOrderCategoryFilter);
					
				}

				if (this.filterMaterialShortage.oValue1 != "") {
					aFilters.push(this.filterMaterialShortage);
				}

				if (this.oTimeHorizonSelect) {
				aFilters.push(this.filterTimeHorizon);
				}
				
				if (this.getSpecificAppFilter()) {
					aFilters.push(this.getSpecificAppFilter());
				}

				for ( var iFFFIndex = 0; iFFFIndex < this.aFacetFilterFilters.length; iFFFIndex++) {
					aFilters.push(this.aFacetFilterFilters[iFFFIndex]);
				}
				if (this.sDataFieldSelect) {
					this._setupMasterEntityCall(this.getMasterEntity(), this.oTableItemTemplate, this.oSorter,
							this.sDataFieldSelect, aFilters);
				} else {
					this._setupMasterEntityCall(this.getMasterEntity(), this.oTableItemTemplate, this.oSorter, this
							.getInitialSelectFields(), aFilters);
				}

				this.newVSDialog = true;
			},

			_handleShortageChange : function() {
				var sSelectedKey = this.oShortageSelect.getSelectedKey();
				this.oViewState.MaterialShortageDefinitionID = sSelectedKey;
				this.filterMaterialShortage = new sap.ui.model.Filter("MaterialShortageDefinitionID",
						sap.ui.model.FilterOperator.EQ, sSelectedKey);

				this.registerViewChanged(); // What if nothing was changed?
				this.runStateMachine(this, this.oEvent.filterChanged);

			},

			_handleTimeHorizonChange : function() {
				var sSelectedKey = this.oTimeHorizonSelect.getSelectedKey();
				this.oViewState.TimeHorizon = sSelectedKey;
				this.filterTimeHorizon = new sap.ui.model.Filter("DynamicHorizonCode", sap.ui.model.FilterOperator.EQ,
						sSelectedKey);

				this.registerViewChanged(); // What if nothing was changed?
				this.runStateMachine(this, this.oEvent.filterChanged);
			},

			_setFacetFilterState : function(aFacetFilterState) {
				i2d.pp.mrpcockpit.reuse.view.FacetFilter._setFacetFilterState(this, aFacetFilterState);
			},

			_recreateFacetFilterFiltersFromVariant : function(aFacetFilterState) {
				i2d.pp.mrpcockpit.reuse.view.FacetFilter._recreateFacetFilterFiltersFromVariant(this, aFacetFilterState);
			},

			_recreateFacetFilter : function(aFFItems) {
				i2d.pp.mrpcockpit.reuse.view.FacetFilter._recreateFacetFilter(this, aFFItems);
			},

			/**
			 * Inits the "Shortage Definition" Select control (the dropdown)
			 */
			_initShortageSelect : function() {

				var oShortageSelectItemTemplate = new sap.ui.core.Item({
					text : "{MaterialShortageDefinitionName}",
					key : "{MaterialShortageDefinitionID}"
				});

				var oShortageRequestFilters = [new sap.ui.model.Filter("MaterialShortageDefinitionType",
						sap.ui.model.FilterOperator.EQ, this.getShortageDefintionType())];

				this.oShortageSelect.bindItems({
					path : "/MaterialShortageDefinitions",
					template : oShortageSelectItemTemplate,
					filters : oShortageRequestFilters
				});

				this.oShortageSelect.attachChange(function() {
					this._handleShortageChange();
				}.bind(this));

			},

			/**
			 * Inits the "Time Horizon" Select control (the dropdown)
			 */
			_initTimeHorizonSelect : function() {

				this.oTimeHorizonSelect.setSelectedKey("7");

				var sSelectedTimeHorizonKey = this.oTimeHorizonSelect.getSelectedKey();
				this.filterTimeHorizon = new sap.ui.model.Filter("DynamicHorizonCode", sap.ui.model.FilterOperator.EQ,
						sSelectedTimeHorizonKey);
				this.oTimeHorizonSelect.attachChange(function() {
					this._handleTimeHorizonChange();
				}.bind(this));

			},

			/**
			 * Inits the Result Table
			 */
			_initResultTable : function() {

				// define the actions after table data has been updated
				this.oTable.attachUpdateFinished(function(oEvent) {
					// Recreate table sorting dialog if necessary.
					if (this.bNewVSDialogRequiredAfterTablePers == true) {
						this.bNewVSDialogRequiredAfterTablePers = false;
						this.newVSDialog = true;
						this.oVSDialog = i2d.pp.mrpcockpit.reuse.view.TableSorting._getVSDialogNEW(this);
						var aSortItems = this.oVSDialog.getSortItems();
						for ( var i = 0; i < aSortItems.length; i++) {
							var oSortItem = aSortItems[i];
							if (oSortItem.getKey() == this.oViewState.SortKey) {
								this.oVSDialog.setSelectedSortItem(oSortItem);
							}
						}
						this.oVSDialog.setSortDescending(this.oViewState.SortDescending);
					}

					// update the table's noDataText + result list counter
					this.oTable.setNoDataText(this.getView().getModel("Common_i18n").getResourceBundle().getText(
							"itemUpdateFinished"));
					var iNumber = oEvent.getParameter("total");
					jQuery.sap.delayedCall(0, this, function() {
						this.oObjectHeader.setNumber(iNumber);
					});
				}.bind(this));

				// initially set the table's noDataText to 'Loading'
				this.oTable.setNoDataText(this.getView().getModel("Common_i18n").getResourceBundle().getText(
						"itemUpdateStarted"));
			},

			/**
			 * Trigger Master Entity Call setup data binding of its result to the 'main table'
			 */

			// shall centralize the mastercall make interface shorter -long interface ??
			_setupMasterEntityCall : function(sMasterEntity, oTableItemTemplate, oSorter, aInitialSelectFields, aFilters) {

				this.oTable.bindItems({
					path : sMasterEntity,
					template : oTableItemTemplate,
					sorter : oSorter,
					parameters : {
						select : aInitialSelectFields
					},
					filters : aFilters
				});
			},

			/**
			 * Trigger Facet Filter oData Call
			 */
			_setupFacetFilterCall : function() {

				var aFacetFilterFields = this.getFacetFilterDefaults();

				if (this.getDemandType) {
					var sFilter = "$filter=((FacetFilterType eq '" + this.getFacetFilterType() + "')) and ((DemandType eq '"
							+ this.getDemandType() + "')) and (((FacetFilterField eq '" + aFacetFilterFields[0] + "'))";
				} else {
					var sFilter = "$filter=((FacetFilterType eq '" + this.getFacetFilterType()
							+ "')) and (((FacetFilterField eq '" + aFacetFilterFields[0] + "'))";
				}

				for ( var i = 1; i < aFacetFilterFields.length; i++) {
					sFilter = sFilter + " or ((FacetFilterField eq '" + aFacetFilterFields[i] + "'))";
				}
				sFilter = sFilter + ")";
				// Delivers Frontend Version into Backend
				if (this._iServiceSchemaVersion > 1) {
					sFilter = sFilter + " and ((Version eq '"
							+ i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getFrontendVersion() + "'))";
				}
				
				if(this.sOrderCategory !== undefined){
					sFilter = sFilter + " and ((MRPElementCategory eq '" + this.sOrderCategory + "'))";	
				}
				

				var sExpand = "$expand=To_FacetFilterValues";
				var sJSON = "$format=json";
				var aURLParams = [sFilter, sExpand, sJSON];
				this.oDataModel.read('/FacetFilters', null, aURLParams, true,
				// Success
				function(oData, oResponse) {
					this._recreateFacetFilter(oData.results);
					this.runStateMachine(this, this.oEvent.facetDataReceived);
				}.bind(this),
				// Failure
				function(oError) {
					// failure of facet call shall triger mastercall without filters??
					this.oFacetFilter.setShowPersonalization(false);
					var sBodyText = oError && oError.response && oError.response.body;
					if (sBodyText) {
						if (sBodyText.match('@AOR@')) {
							this.runStateMachine(this, this.oEvent.aORUndefined);
						} else {
							this.runStateMachine(this, this.oEvent.noFacetDataReceived);
						}
					} else {
						this.runStateMachine(this, this.oEvent.noFacetDataReceived);
					}
				}.bind(this));

			},

			/**
			 * React on Changed Area of Responsibility
			 */

			_firstAORDialogFinished : function() {
				this.runStateMachine(this, this.oEvent.firstAORDialogFinished);
			},

			_aORDialogFinished : function(bResult) {
				// AOR dialog was cancelled
				if (bResult == i2d.pp.mrpcockpit.reuse.util.CommonConstants.AOR_DEFINITION_CANCELED) {
					this.runStateMachine(this, this.oEvent.aORDialogCancelled);
				} else {
					// AOR dialog was saved
					this.runStateMachine(this, this.oEvent.aORDialogFinished);
				};
			},

			onItemsUpdateStarted : function(oEvent) {
				this.setBtnEnabled("manageButton", false);
				this.oTable.setNoDataText(this.getView().getModel("Common_i18n").getResourceBundle().getText(
						"itemUpdateStarted"));
			},

			onItemsUpdateFinished : function() {
				if (this.oTable.getSelectedItems().length > 0) { // upateStarted is fired if stock availability callout is
					// called, therefore we restore the manage button
					// status here
					this.setBtnEnabled("manageButton", true);
				}
				this.oTable.setNoDataText(this.getView().getModel("Common_i18n").getResourceBundle().getText(
						"itemUpdateFinished"));
			},

			/**
			 * Table Personalization Function: Initial Call
			 */
			_getInitialTableColumnsState : function() {
				var aColumnsNew = [];
				var aColumnsOld = this.oTable.getColumns();
				for ( var i = 0; i < aColumnsOld.length; i++) {
					var oColumnOld = aColumnsOld[i];
					var sId = oColumnOld.getId();
					var iOrder = i;
					var sText = oColumnOld.getHeader().getText();
					var bVisible = oColumnOld.getVisible();
					aColumnsNew.push({
						id : sId,
						order : iOrder,
						text : sText,
						visible : bVisible
					});
				}
				return aColumnsNew;
			},

			/**
			 * Table Personalization Function: Further Execution (Press Button 'OK')
			 */
			_personalizationsDone : function(oData) {
				this.bNewVSDialogRequiredAfterTablePers = true; // Is referenced in _onRequestComplete.
				var oMyPromise = this.oPersoService.getPersData();
				oMyPromise.done(this._refilloDataSelectFields.bind(this));
				oMyPromise.done(this._storeTableState.bind(this));
				oMyPromise.done(this._triggerStateMachineEventTableChanged.bind(this));
				this.registerViewChanged(); // What if nothing was changed?
			},

			_triggerStateMachineEventTableChanged : function() {
				this.runStateMachine(this, this.oEvent.tableChanged);
			},

			// changed function for determination of OData fields for personalization function
			_refilloDataSelectFields : function() {
				var aUniqueSelectFields = this._determineFieldsForVisibleColumns();
				this.sDataFieldSelect = "";
				this.sDataFieldSelect += this.getBaseSelectFields();
				for ( var i = 0; i < aUniqueSelectFields.length; i++) {
					this.sDataFieldSelect += "," + aUniqueSelectFields[i];
				}
			},

			// new function for determination of OData Fields

			_determineFieldsForVisibleColumns : function() {
				var aColumns = [];
				var oColumn = {};
				var sThisColumnFields = "";
				var sAllColumnFields = "";
				var aAllColumnFields = [];
				var aUniqueSelectFields = [];

				aColumns = this.oTable.getColumns();
				for ( var i = 0; i < aColumns.length; i++) {
					oColumn = aColumns[i];
					if (oColumn.getVisible() == true) {
						sThisColumnFields = oColumn.data("mrpcoDataField");
						if (sThisColumnFields) {
							if (sAllColumnFields == "") {
								sAllColumnFields = sThisColumnFields;
							} else {
								sAllColumnFields = sAllColumnFields + "," + sThisColumnFields;
							}
						}
					}
				};
				if (sAllColumnFields != "") {
					aAllColumnFields = sAllColumnFields.split(",");
					aUniqueSelectFields = jQuery.sap.unique(aAllColumnFields);
				}
				return aUniqueSelectFields;
			},

			_storeTableState : function(oTableState) {
				this.oViewState.TableState = oTableState;
			},

			_applyTableStateToTable : function(oTableState) {
				this.oPersoService.setPersData(oTableState);
				this.oTPC.applyPersonalizations();
			},

			_resetTableStateToTable : function(oTableState) {
				this.oPersoService.resetPersData(this.aTableStateColumnsInitial);

				if (this.oTPC.refresh) {
					this.oTPC.refresh();
				}
			},

			/**
			 * Table Sorting Function
			 */
			onViewSettingsDialogButtonPressed : function(oEvent) {
				this.oVSDialog.open();
			},

			// --------------------------------------------
			// Display Variant functionalities
			// --------------------------------------------

			onVariantSelectorPress : function(oEvent) {
				this.oObjectHeaderIconDomRef = oEvent.getParameters().domRef;
				i2d.pp.mrpcockpit.reuse.view.DisplayVariant.readVariantList(this);
			},

			_keyGen : function() {
				return jQuery.sap.uid();// (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
			},

			/**
			 * Cross Application Navigation
			 */
			onNavigationButtonPressed : function(oEvent) {
				var oList = this.getView().byId(this.getTableId());
				this.setBtnEnabled("manageButton", false);
				sap.ca.ui.utils.busydialog.requireBusyDialog();
				var aSelectedItems = oList.getSelectedItems();
				// collect parameters of the selected items
				if (aSelectedItems.length > 0) {
					// navigate to "manage" applications
					var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
					var oCrossAppNavigator = fgetService && fgetService("CrossApplicationNavigation");
					if (oCrossAppNavigator) {
						var bHash = "MRPCockpitNavigation." + this.sViewNumber;
						var oPersonalizationService = sap.ushell.Container.getService("Personalization");
						var sContainerName = bHash;// "MRPCockpitNavigation." + this.sViewNumber;
						if (oPersonalizationService.getContainer) {
							oPersonalizationService.getContainer(sContainerName, {
								validity : i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_STATE_VALIDITY_TIME
							}).fail(function() {
								sap.ca.ui.utils.busydialog.releaseBusyDialog();
								jQuery.sap.log.error("Loading personalization data failed.");
							}).done(function(oContainer) {
								oContainer.setItemValue("Navigation", this.getNavigationParams());
								oContainer.save().done(function() {
									sap.ca.ui.utils.busydialog.releaseBusyDialog();
									// trigger navigation
									//TODO David
//									oCrossAppNavigator.toExternal({
//										target : this.getNavigationTarget(),
//										params : {
//											// "localBookmark" : bHash,
//											"navigationID" : bHash
//										}
//									});
									
									var oParams = {"navigationID" : bHash};
									if (this.sOrderCategory != undefined) {
									oParams.OrderCategory = this.sOrderCategory;
									}

									oCrossAppNavigator.toExternal({
										target : this.getNavigationTarget(),
										params : oParams
									});
								// End TODO

								}.bind(this));
							}.bind(this));
						}

					} else {
						var sMessage = this.oResourceBundle.getText("messNoLaunchpad");
						sap.ca.ui.message.showMessageBox({
							type : sap.ca.ui.message.Type.ERROR,
							message : sMessage
						});
					}
				} else {
					var sMessage = this.oResourceBundle.getText("messNoItems");
					sap.ca.ui.message.showMessageBox({
						type : sap.ca.ui.message.Type.ERROR,
						message : sMessage
					});
				}
			},

			// toggle navigation button
			onItemSelection : function(oEvent) {
				var oList = this.oView.byId(this.getTableId());
				var aSelectedItems = [];
				aSelectedItems = oList.getSelectedItems();
				if (aSelectedItems.length === 0) {
					this.setBtnEnabled("manageButton", false);
				} else {
					this.setBtnEnabled("manageButton", true);
				}
			},
			// Reset navigation button after filter change and new load
			// of table
			onItemsLoaded : function(oEvent) {
				this.setBtnEnabled("manageButton", false);
			},

			/**
			 * Returns the context related buttons (e.g. navigation, AoR, ...)
			 */
			/*
			getHeaderFooterOptions : function() {
				return {
					oEditBtn : {
						sId : "manageButton",
						sI18nBtnTxt : "btnManageShortages",
						bDisabled : false,
						onBtnPressed : jQuery.proxy(this.onNavigationButtonPressed, this)
					},
					bSuppressBookmarkButton : true,
					aAdditionalSettingButtons : [{
						sI18nBtnTxt : "AreaOfResponsibility",
						sIcon : "sap-icon://BusinessSuiteInAppSymbols/icon-responsible-area",
						onBtnPressed : function(evt) {
							this.runStateMachine(this, this.oEvent.aORButtonPressed);
						}.bind(this)
					}]
				};
			},
			*/

			// POPOVER MaterialShortageQuickView
			handlePressMaterialShortageQuickView: function (oEvent) {
				if (! this._oShortageQuickView) {
					this._oShortageQuickView = sap.ui.xmlfragment("i2d.pp.mrpcockpit.reuse.fragments.MaterialShortageQuickView", this);
		    	this._oShortageQuickView.setModel(this.oApplicationImplementation.getApplicationModel("ServiceVersions"),"ServiceVersions");
		    	this._oShortageQuickView.setModel(this.getView().getModel("Common_i18n"), "Common_i18n");
		    	this._oShortageQuickView.setModel(this.getView().getModel());
		    }
				var oSelectedMRPElementItem = oEvent.getSource();
				var oData = oSelectedMRPElementItem.getBindingContext().getObject();
				var quickViewPath = "/Materials(";
						quickViewPath += "MaterialID='" + encodeURIComponent(oData.MaterialID) + "',";
						quickViewPath += "MaterialShortageDefinitionID='" + encodeURIComponent(oData.MaterialShortageDefinitionID) + "',";
						quickViewPath += "MRPArea='" + encodeURIComponent(oData.MRPArea) + "',";
					  quickViewPath += "MRPPlanningSegmentNumber='" + encodeURIComponent(oData.MRPPlanningSegmentNumber) + "',";
						quickViewPath += "MRPPlanningSegmentType='" + encodeURIComponent(oData.MRPPlanningSegmentType) + "',";
						quickViewPath += "MRPPlant='" + encodeURIComponent(oData.MRPPlant) + "'";
						quickViewPath += ")";
						quickViewPath += "?$select=";
						quickViewPath += "MaterialExternalID,MaterialName,AvailabilityChart,MaterialShortageStartDate,MaterialShortageEndDate,DaysOfSupplyDuration,"
								+ "MaterialShortageQuantity,MaterialABCClassification,MRPAvailableStockQuantity,MaterialSafetyStockQty,TargetQuantityUnitDcmls,"
								+ "ManualPlanningHorizonEndDate,TotalReplenishmentLeadDuration,VendorName,MaterialProcurementCategory,UnitOfMeasureTechnicalName,MRPPlant,MRPArea";
				// Service call
				this._oShortageQuickView.bindElement(quickViewPath);
				this._oShortageQuickView.getElementBinding().attachDataReceived(function(){
					this._oShortageQuickView.openBy(oSelectedMRPElementItem);	
				},this);
				
			},

			handleQuickViewCloseButton : function(oEvent) {
				this._oShortageQuickView.close();
			},

			
			
			onExit : function() {
				sap.ca.ui.utils.busydialog.releaseBusyDialog();
				this.oDataModel.detachRequestCompleted(this._onRequestComplete, this);

				this.oDataModel.detachRequestFailed(this.oDataModel, this._handleRequestFailed, this);
				this.oTPC.detachPersonalizationsDone();
				this.oRouter.detachRoutePatternMatched(this.onRouteMatched, this);
				this.oView.byId(this.getViewNumber() + "TablePersoButton").detachPress();
				this.oFacetFilter.detachReset();

				// save viewstate and unbind beforeunload because S2parent uses beforeunload as well
				//i2d.pp.mrpcockpit.reuse.view.ViewStateHandler
				//		.saveViewStateInContainer(null, this.oViewState, this.sStateID,i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_STATE_VALIDITY_TIME);
			}

		});

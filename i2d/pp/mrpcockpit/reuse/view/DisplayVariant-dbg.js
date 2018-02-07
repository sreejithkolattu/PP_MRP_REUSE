/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.view.DisplayVariant");

i2d.pp.mrpcockpit.reuse.view.DisplayVariant = {

	// create variant selection popover
	getDisplayVariantPopover : function(oController) {
		this.oController = oController;

		this.oDisplayVariantSaveAction = new sap.m.ActionListItem({
			text : oController.getView().getModel("Common_i18n").getResourceBundle().getText("ButtonSaveVariant"),
			press : function(oEvent) {
				this.openVariantDialog(this.oController);
				this.oDisplayVariantPopover.close();
			}.bind(this)
		});

		this.oDisplayVariantSaveAction.isSelectable = function() {
		};

		this.oDisplayVariantDeleteAction = new sap.m.ActionListItem({
			text : oController.getView().getModel("Common_i18n").getResourceBundle().getText("ButtonDeleteVariant"),
			visible : false,
			press : function(oEvent) {
				if (this.sCurrentDisplayVariant == "") {
					this.oDisplayVariantPopover.close();
				} else {
					this.openDeleteVariant(this.oController);
					this.oDisplayVariantPopover.close();
				}
			}.bind(this)
		});
		this.oDisplayVariantDeleteAction.isSelectable = function() {
		};

		this.oDisplayVariantChangePropertiesAction = new sap.m.ActionListItem({
			text : oController.getView().getModel("Common_i18n").getResourceBundle().getText("ButtonChangeProperties"),
			visible : false,
			press : function(oEvent) {
				var aCurrentDisplayVariant = this.oController.oObjectHeader.getTitle();
				if (aCurrentDisplayVariant == this.oController.getObjectHeaderTitle()) {
					this.oDisplayVariantPopover.close();
				} else {
					this.openVariantPropertiesDialog(this.oController);
					this.oDisplayVariantPopover.close();
				}
			}.bind(this)
		});
		this.oDisplayVariantChangePropertiesAction.isSelectable = function() {
		};

		this.oDisplayVariantList = new sap.m.List({
			mode : "SingleSelectMaster",
			includeItemInSelection : true,
			items : [this.oDisplayVariantSaveAction, this.oDisplayVariantDeleteAction,
					this.oDisplayVariantChangePropertiesAction],
			select : function(evt) {
				var sSelectedItem = evt.getParameter("listItem");

				if ((sSelectedItem != this.oDisplayVariantSaveAction)
						&& (sSelectedItem != this.oDisplayVariantDeleteAction)
						&& (sSelectedItem != this.oDisplayVariantChangePropertiesAction)) {
					this.oDisplayVariantDeleteAction.setVisible(true);
					this.oDisplayVariantChangePropertiesAction.setVisible(true);

					this.oController.sCurrentVariantName = sSelectedItem.getTitle();
					this.oController.runStateMachine(this.oController, this.oController.oEvent.variantSelected);
				};
				this.oDisplayVariantPopover.close();
			}.bind(this)
		});

		// Display Variant Menu
		this.oDisplayVariantPopover = new sap.m.Popover({
			placement : sap.m.PlacementType.Bottom,
			showHeader : false,
			content : this.oDisplayVariantList
		});
		return this.oDisplayVariantPopover;
	},

	unpackVariantData : function(bResult, oVariantData, sVariantName) {

		this.oController.oVariantData = oVariantData;
		if(sVariantName){
			this.oController.sCurrentVariantName = sVariantName;
		}
		
		
		if (this.oController.sCurrentVariantName) {
			if(oVariantData != null && oVariantData.ViewChanged){
				this.oController.oObjectHeader.setTitle(this.oController.sCurrentVariantName + " *");
				this.oController.oViewState.ViewChanged = true;
			} else {
				this.oController.oObjectHeader.setTitle(this.oController.sCurrentVariantName);
				this.oController.oViewState.ViewChanged = false;
			}
			this.oController.oViewState.VariantName = this.oController.sCurrentVariantName;
		} else {
			if(oVariantData != null && oVariantData.ViewChanged){
				this.oController.oObjectHeader.setTitle(this.oController.getObjectHeaderTitle() + " *");
				this.oController.oViewState.ViewChanged = true;
			} else {
				this.oController.oObjectHeader.setTitle(this.oController.getObjectHeaderTitle());
				this.oController.oViewState.ViewChanged = false;
			}
			this.oController.oViewState.VariantName = this.oController.getObjectHeaderTitle();
		}

		if (oVariantData != null) {
			
			//Set OrderCategory when it was saved in the variant Data
			if(oVariantData.OrderCategory){
				this.oController.sOrderCategory = oVariantData.OrderCategory;
				this.oController.oViewState.OrderCategory = oVariantData.OrderCategory;
				
			// change the title of the app, only need for 312er app
				if(this.oController._changeAppName){
					this.oController._changeAppName(oVariantData.OrderCategory);
				}			
			}	
			
			// Shortage Definition
			this.oController.oViewState.MaterialShortageDefinitionID = this.oController.oVariantData.MaterialShortageDefinitionID;
			this.oController.filterMaterialShortage = new sap.ui.model.Filter("MaterialShortageDefinitionID",
					sap.ui.model.FilterOperator.EQ, this.oController.oVariantData.MaterialShortageDefinitionID);

			// If the desired shortage definition is not "" and shortage definitions have been received,
			// check if the desired one exists.
			var aItems = this.oController.oShortageSelect.getItems();
			if (this.oController.oVariantData.MaterialShortageDefinitionID != "") {
				if (this.oController.aShortageDefinitionKeys.length > 0) {
					var bShortageDefinitionIdExists = false;
					for ( var i = 0; i < this.oController.aShortageDefinitionKeys.length; i++) {
						if (this.oController.aShortageDefinitionKeys[i] == this.oController.oVariantData.MaterialShortageDefinitionID) {
							bShortageDefinitionIdExists = true;
							this.oController.oShortageSelect
									.setSelectedKey(this.oController.oVariantData.MaterialShortageDefinitionID);
							break;
						};
					}
					if (bShortageDefinitionIdExists == false) {
						var sSelectedShortageKey = this.oController.oShortageSelect.getSelectedKey();
						this.oController.filterMaterialShortage = new sap.ui.model.Filter("MaterialShortageDefinitionID",
								sap.ui.model.FilterOperator.EQ, sSelectedShortageKey);
						this.oController.oViewState.MaterialShortageDefinitionID = sSelectedShortageKey;
						sap.m.MessageBox.alert(this.oController.getView().getModel("Common_i18n").getResourceBundle().getText(
								"SHORTDEF_MISSING_MSG"));
					};
				}
			} else {
				if (this.oController.aShortageDefinitionKeys.length > 0) {
					this.oController.oShortageSelect.setSelectedItem(aItems[0]);
					var sSelectedShortageKey = this.oController.oShortageSelect.getSelectedKey();
					this.oController.filterMaterialShortage = new sap.ui.model.Filter("MaterialShortageDefinitionID",
							sap.ui.model.FilterOperator.EQ, sSelectedShortageKey);
					this.oController.oViewState.MaterialShortageDefinitionID = sSelectedShortageKey;
				}
			}

			// Time Horizon
			this.oController.oViewState.TimeHorizon = this.oController.oVariantData.TimeHorizon;
			if (this.oController.oTimeHorizonSelect) {
				this.oController.oTimeHorizonSelect.setSelectedKey(this.oController.oVariantData.TimeHorizon);
			}

			this.oController.filterTimeHorizon = new sap.ui.model.Filter("DynamicHorizonCode",
					sap.ui.model.FilterOperator.EQ, this.oController.oVariantData.TimeHorizon);

			// Facet Filter
			i2d.pp.mrpcockpit.reuse.view.FacetFilter._resetFacetFilter(this.oController);
			this.oController.oViewState.FacetFilterState = this.oController.oVariantData.FacetFilterState;
			this.oController._setFacetFilterState(this.oController.oVariantData.FacetFilterState);
			this.oController._recreateFacetFilterFiltersFromVariant(this.oController.oVariantData.FacetFilterState);

			// Table
			if (this.oController.oVariantData.TableState.aColumns) {
				this.oController._applyTableStateToTable(this.oController.oVariantData.TableState);
				this.oController.oViewState.TableState = this.oController.oVariantData.TableState;
				this.oController._refilloDataSelectFields(this.oController.oVariantData.TableState);
			} else {
				// created variant without table personalization
				if (this.oController.oViewState.TableState.aColumns) {
					this.oController.oViewState.TableState = {};
					this.oController._resetTableStateToTable();
					this.oController.sDataFieldSelect = this.oController.getInitialSelectFields();
				}
			};

			// Sorting
			this.oController.oViewState.SortDescending = this.oController.oVariantData.SortDescending;
			this.oController.oViewState.SortKey = this.oController.oVariantData.SortKey;
			if (this.oController.oVariantData.SortKey == "") {
				this.oController.oSorter.length = 0;
			} else {
				var aSorters = [];
				aSorters.push(new sap.ui.model.Sorter(this.oController.oVariantData.SortKey,
						this.oController.oVariantData.SortDescending));
				this.oController.oSorter = aSorters;
			}

			// This the reson why we check the parameter (refer to comment in readVariantById)
			if (!sVariantName) {
				//this.oController.oObjectHeader.setTitle(this.oController.getObjectHeaderTitle());
			} else {
				this.oController.bNewVSDialogRequiredAfterTablePers = true;
				//Check if the Variant is the default Variant
				if(this.oController.oVariantData.DefaultVariant){
					this.oDisplayVariantDeleteAction.setVisible(false);
					this.oDisplayVariantChangePropertiesAction.setVisible(false);
				}else {
					this.oDisplayVariantDeleteAction.setVisible(true);
					this.oDisplayVariantChangePropertiesAction.setVisible(true);	
				}
				//this.oController.oObjectHeader.setTitle(this.oController.sCurrentVariantName);
			}
			this.oController.bViewHasBeenChanged = false;
		}
		i2d.pp.mrpcockpit.reuse.view.ViewStateHandler.saveViewStateInContainer(null, this.oController.oViewState,
				this.oController.sStateID, i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_STATE_VALIDITY_TIME);
		
		this.oController.runStateMachine(this.oController, this.oController.oEvent.varDataReceived);
	},

	// refresh list of variants
	recreateDisplayVariantList : function(bResult, aDisplayVariants) {
		this.oDisplayVariantList.removeAllItems();
		this.oController.aDisplayVariantNames = aDisplayVariants;
		if (aDisplayVariants != null) {
			for ( var i = 0; i < aDisplayVariants.length; i++) {
				var oNewItem = new sap.m.StandardListItem({
					title : aDisplayVariants[i],
					press : [function(oEvent) {
						var selectedItem = oEvent.getSource();

					this.oController.sCurrentVariantName = selectedItem.getTitle();
					this.oController.runStateMachine(this.oController, this.oController.oEvent.variantSelected);
					}, this]
				});
				this.oDisplayVariantList.addItem(oNewItem);
			}
		}
		// this.oDisplayVariantList.addItem(this.oDisplayVariantResetAction);
		this.oDisplayVariantList.addItem(this.oDisplayVariantSaveAction);
		this.oDisplayVariantList.addItem(this.oDisplayVariantDeleteAction);
		this.oDisplayVariantList.addItem(this.oDisplayVariantChangePropertiesAction);

		this.oDisplayVariantPopover.openBy(this.oController.oObjectHeaderIconDomRef);
	},

	// Read all variants
	readVariantList : function(oController) {
		this.oController = oController;
		i2d.pp.mrpcockpit.reuse.view.VariantHandler.getAllVariants(this.recreateDisplayVariantList.bind(this),
				this.oController.getVariantContainerPrefix());
	},

	readVariantByName : function(sVariantName) {
		i2d.pp.mrpcockpit.reuse.view.VariantHandler.getVariantByName(this.unpackVariantData.bind(this),
				this.oController.sVariantContainerPrefix, sVariantName);
	},

	readVariantById : function(sVariantID) {
		var myPattern = /id-.*-.*/;
    var sStateID = myPattern.exec(sap.ui.core.routing.HashChanger.getInstance().getHash());
    if (sStateID) {
    	sStateID = sStateID[0];
    } else {
    	sStateID = "";
    }
		i2d.pp.mrpcockpit.reuse.view.ViewStateHandler.getViewState(this.unpackVariantData.bind(this),
				this.oController.sVariantContainerPrefix, this.oController.oDefaultVariantData, sVariantID,
				this.oController.sCurrentVariantName, sStateID, i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_STATE_VALIDITY_TIME);
	},
	
	readTempViewSateFromContainer : function(sTempViewStateID) {
		i2d.pp.mrpcockpit.reuse.view.ViewStateHandler.getViewStateFromContainer(this.unpackVariantData.bind(this), sTempViewStateID,
				i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_STATE_VALIDITY_TIME, this.oController.oDefaultVariantData);
	},

	openVariantDialog : function(oController, evt) {
		var oVariantData = oController.oViewState;
		var sServiceUrl = oController.oDataModel.sServiceUrl + oController.getMasterEntity()
		+ "/$count?" + oController.byId(oController.getTableId()).getBindingInfo('items').binding.sFilterParams;			
		var sAppURL = "#" + oController.getVariantContainerPrefix();
		var aVariantNames = oController.aDisplayVariantNames;
		var sNumberUnit = oController.getNumberUnit();

		// Icons displayed in Tile
		var sLPIconMonitor = oController.getMonitorAppIcon();
		var sLPIconManage = oController.getManageAppIcon();

		i2d.pp.mrpcockpit.reuse.view.VariantHandler.openVariantSaveDialog(this.callbackFunctionVariantSave.bind(this),
				oController.getVariantContainerPrefix(), oVariantData, aVariantNames, sServiceUrl, sAppURL, sNumberUnit,
				sLPIconMonitor, sLPIconManage, oController.sCurrentVariantName, false, false, true, oController);

	},

	callbackFunctionVariantSave : function(bResult, oVariantName) {
		if (bResult) {
			this.oDisplayVariantDeleteAction.setVisible(true);
			this.oDisplayVariantChangePropertiesAction.setVisible(true);
			this.oController.oObjectHeader.setTitle(oVariantName);
			this.oController.sCurrentVariantName = oVariantName;
			this.oController.oViewState.VariantName = oVariantName;
			//Remove the ViewChanged flag
			this.oController.oViewState.ViewChanged = false;
			this.oController.bViewHasBeenChanged = false;
		}
	},

	// Delete Variant Dialog
	openDeleteVariant : function(oController, evt) {
		var sAppURL = "#" + oController.getVariantContainerPrefix();
		i2d.pp.mrpcockpit.reuse.view.VariantHandler.openVariantDeleteDialog(this.callbackFunctionVariantDelete.bind(this),
				oController.getVariantContainerPrefix(), oController.sCurrentVariantName, sAppURL, oController);
	},

	callbackFunctionVariantDelete : function(bResult, oVariantName) {
		if (bResult) {
			this.oController.sCurrentVariantName = "";
			this.oController.oObjectHeader.setTitle(this.oController.getObjectHeaderTitle());
			this.oController.oViewState.VariantName = this.oController.getObjectHeaderTitle();
			//Remove the ViewChanged flag
			this.oController.oViewState.ViewChanged = false;
			this.oDisplayVariantDeleteAction.setVisible(false);
			this.oDisplayVariantChangePropertiesAction.setVisible(false);
		}
	},

	// Change Variant Properties Dialog
	openVariantPropertiesDialog : function(oController, evt) {
		var sServiceUrl = oController.oDataModel.sServiceUrl + oController.getMasterEntity()
		+ "/$count?" + oController.byId(oController.getTableId()).getBindingInfo('items').binding.sFilterParams;	
		var sAppURL = "#" + oController.getVariantContainerPrefix();
		var sNumberUnit = oController.getNumberUnit();
		var sLPIconMonitor = oController.getMonitorAppIcon();
		var sLPIconManage = oController.getManageAppIcon();

		i2d.pp.mrpcockpit.reuse.view.VariantHandler.openVariantPropertiesDialog(this.callbackFunctionVariantProperties
				.bind(this), oController.getVariantContainerPrefix(), sServiceUrl, sAppURL, sNumberUnit, sLPIconMonitor,
				sLPIconManage, oController.sCurrentVariantName, oController);
	},

	callbackFunctionVariantProperties : function(bResult, oVariantName) {
		if (bResult) {
			this.oController.oObjectHeader.setTitle(oVariantName);
			this.oController.sCurrentVariantName = oVariantName;
			this.oController.oViewState.VariantName = oVariantName;
			//Remove the ViewChanged flag
			this.oController.oViewState.ViewChanged = false;
			this.oController.bViewHasBeenChanged = false;
		}
	}
};

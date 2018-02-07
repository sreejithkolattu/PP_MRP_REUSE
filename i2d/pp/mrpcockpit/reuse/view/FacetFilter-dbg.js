/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.view.FacetFilter");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Helper");

i2d.pp.mrpcockpit.reuse.view.FacetFilter = {

	// parameter oController comes from s1parent
	// Modularization: done
	_toObject : function(arr) {
		var rv = {};
		for ( var i = 0; i < arr.length; ++i) {
			rv[arr[i][0]] = arr[i][1];
		}
		return rv;
	},

	_setFacetFilterState : function(oController, aFacetFilterState) {
		this.oController = oController;
		if (aFacetFilterState.length == 0) {
			this._resetFacetFilter(oController);
		} else {
			var aLists = this.oController.oFacetFilter.getLists();
			for ( var iFilterStateIndex = 0; iFilterStateIndex < aFacetFilterState.length; iFilterStateIndex++) {
				var oFacetState = aFacetFilterState[iFilterStateIndex];
				for ( var iListIndex = 0; iListIndex < aLists.length; iListIndex++) {
					var oList = aLists[iListIndex];
					if (oList.getKey() !== oFacetState.listKey) {
						continue;
					} else {
						oList.setActive(oFacetState.active);
						var oSelectedKeys = this._toObject(oFacetState.selectedItemKeys);
						oList.setSelectedKeys(oSelectedKeys);
					}
				}
			}
		}
		this.oController.oFacetFilter.setVisible(false);
		this.oController.oFacetFilter.setVisible(true);
	},

	// Modularization: done
	_recreateFacetFilterFiltersFromVariant : function(oController, aFacetFilterState) {
		this.oController = oController;
		this.oController.aFacetFilterFilters.length = 0;
		for ( var iFacetIndex = 0; iFacetIndex < aFacetFilterState.length; iFacetIndex++) {
			var oFacet = aFacetFilterState[iFacetIndex];
			for ( var iItemIndex = 0; iItemIndex < oFacet.selectedItemKeys.length; iItemIndex++) {
				var oNewFilter = new sap.ui.model.Filter(oFacet.listKey, sap.ui.model.FilterOperator.EQ,
						oFacet.selectedItemKeys[iItemIndex][0]);
				this.oController.aFacetFilterFilters.push(oNewFilter);
			}
		}
	},

	_handleFacetFilterReset : function(oController, aFacetFilterState) {	
		this.oController = oController;
		if (aFacetFilterState.length == 0) {
			this._resetFacetFilter(oController);
		} else {
			this.oController.aFacetFilterFilters.length = 0;
			var aLists = this.oController.oFacetFilter.getLists();
		
			for ( var iListIndex = 0; iListIndex < aLists.length; iListIndex++) {
				var oList = aLists[iListIndex];
				for ( var iFilterStateIndex = 0; iFilterStateIndex < aFacetFilterState.length; iFilterStateIndex++) {
					var oFacetState = aFacetFilterState[iFilterStateIndex];
					if (oList.getKey() !== oFacetState.listKey) {
						oList.setActive(false);
						var oSelectedKeys = this._toObject([]);
						oList.setSelectedKeys(oSelectedKeys);
					} else {
						
						oList.setActive(true);			
						var oSelectedKeys = this._toObject([]);
						oList.setSelectedKeys(oSelectedKeys);
						break;
					}
				}
			}
		}
		this._recreateFacetFilterFilters(oController);
		this.oController.registerViewChanged();
		this.oController.runStateMachine(this.oController, this.oController.oEvent.filterChanged);
		this.oController.oViewState.FacetFilterState = this._getFacetFilterState(oController);
				
	},

	// Modularization: done
	_recreateFacetFilter : function(oController, aFFItems) {
		this.oController = oController;
		this.oController.oFacetFilter.destroyLists();
		for ( var i = 0; i < aFFItems.length; i++) {
			var aItems = [];
			for ( var j = 0; j < aFFItems[i].To_FacetFilterValues.results.length; j++) {
				var oNewItem = aFFItems[i].To_FacetFilterValues.results[j];
				if (oNewItem.FacetFilterValueID != "") {
					aItems.push(oNewItem);
				}
			}
			var sMultiSelect = "MultiSelect";
			if(oController.getSingleSelectFacetFilter){
			for(var k = 0; k < oController.getSingleSelectFacetFilter().length; k++){
				var aSingleSelectFilter = oController.getSingleSelectFacetFilter();
				if(aFFItems[i].FacetFilterField == aSingleSelectFilter[k] ){
					sMultiSelect = "SingleSelectMaster";
				  break;}			
			 }
			}
			var oItemsModel = new sap.ui.model.json.JSONModel({
				values : aItems
			});
			oItemsModel.setSizeLimit(aItems.length);
			var sFFTitel = "{i18n>FF" + aFFItems[i].FacetFilterField + "}";
			// ONE CODE LINE >>> 
			// First check if different field text are defined in App-controller at all 
			if (this.oController.aDiffFieldText){
				sFFTitel = "{i18n>" + i2d.pp.mrpcockpit.reuse.util.Helper.getSpecialTextForField("FF" + 
						aFFItems[i].FacetFilterField, oController) + "}";
			}
			// ONE CODE LINE <<<			
			var oNewFacet = new sap.m.FacetFilterList({
				key : aFFItems[i].FacetFilterField,
				title : sFFTitel,
				mode : sMultiSelect,
				active : false,
				selectedKeys : undefined,
				rememberSelections : false,
				items : {
					path : "/values",
					template : new sap.m.FacetFilterItem({
						text : "{FacetFilterValueText}",
						key : "{FacetFilterValueID}"
					})
				}
			});

			oNewFacet.addStyleClass("sapMRPFFList");
			
			oNewFacet.setModel(oItemsModel);
			this.oController.oFacetFilter.addList(oNewFacet);

			oNewFacet.attachListClose(function() {
				this._handleFacetFilterListClose(this.oController);
			}.bind(this));
		}
		this.oController.oFacetFilter.setShowPersonalization(true);
		this.oController.oViewState.FacetFilterState = this._getFacetFilterState(oController);

	},

	// necessary for a new facetfilter call in case user changed FF
	// Modularization: done
	_getFacetFilterState : function(oController) {
		this.oController = oController;
		var aFacetFilterState = [];
		var aLists = this.oController.oFacetFilter.getLists();
		for ( var iListIndex = 0; iListIndex < aLists.length; iListIndex++) {
			var oList = aLists[iListIndex];
			var oNewEntry = {
				listKey : oList.getKey(),
				active : oList.getActive(),
				selectedItemKeys : []
			};

			var oSelectedKeys = oList.getSelectedKeys();
			for ( var oSelectedKey in oSelectedKeys) {
				oNewEntry.selectedItemKeys.push([oSelectedKey, oSelectedKeys[oSelectedKey]]);
			}

			aFacetFilterState.push(oNewEntry);
		}
		return aFacetFilterState;
	},

	// Modularization: done
	_handleFacetFilterListClose : function(oController) {
		this.oController = oController;
		this.oController.oViewState.FacetFilterState = this._getFacetFilterState(oController);
		this.oController.aStoredFacetFilterState = this.oController.oViewState.FacetFilterState;

		// Check if anything got changed.
		var bFilterWasChanged = false;
		var aFacetFilterFiltersOld = [];
		for ( var i = 0; i < this.oController.aFacetFilterFilters.length; i++) {
			aFacetFilterFiltersOld.push(this.oController.aFacetFilterFilters[i]);
		}
		this._recreateFacetFilterFilters(oController);

		if (this.oController.aFacetFilterFilters.length != aFacetFilterFiltersOld.length) {
			bFilterWasChanged = true;
		} else {
			for ( var i = 0; i < this.oController.aFacetFilterFilters.length; i++) {
				var oFilterOld = aFacetFilterFiltersOld[i];
				var oFilterNew = this.oController.aFacetFilterFilters[i];
				if ((oFilterNew.oValue1 != oFilterOld.oValue1) || (oFilterNew.sOperator != oFilterOld.sOperator)
						|| (oFilterNew.sPath != oFilterOld.sPath)) {
					bFilterWasChanged = true;
				}
			}
		}

		if (bFilterWasChanged == true) {
			this.oController.registerViewChanged();
			this.oController.runStateMachine(this.oController, this.oController.oEvent.filterChanged);
		}
	},

	// Modularization: done
	_resetFacetFilter : function(oController) {
		this.oController = oController;
		var aLists = this.oController.oFacetFilter.getLists();
		// The following loop should no longer be necessary - the removeSelections
		// call below should suffice. But I had at one point errors with only the
		// removeSelections call so I left this loop in.
		for ( var iListIndex = 0; iListIndex < aLists.length; iListIndex++) {
			var oList = aLists[iListIndex];
			oList.setActive(false);
			var aItems = oList.getItems();
			for ( var iItemsIndex = 0; iItemsIndex < aItems.length; iItemsIndex++) {
				aItems[iItemsIndex].setSelected(false);
			}
			oList.removeSelections(true);  // For removing those items only visible after "more".	
		}
		this.oController.oViewState.FacetFilterState = this._getFacetFilterState(oController);
	},
	
	// Modularization:done
	_recreateFacetFilterFilters : function(oController) {
		this.oController = oController;
		this.oController.aFacetFilterFilters.length = 0;
		var aLists = this.oController.oFacetFilter.getLists();
		for ( var iListIndex = 0; iListIndex < aLists.length; iListIndex++) {
			var oList = aLists[iListIndex];
			if (oList.getActive() == true) {
				var sKeyValue = oList.getKey();
				var oSelectedKeys = oList.getSelectedKeys();
				for ( var oSelectedKey in oSelectedKeys) {
					var oNewFilter = new sap.ui.model.Filter(sKeyValue, sap.ui.model.FilterOperator.EQ, oSelectedKey);
					this.oController.aFacetFilterFilters.push(oNewFilter);
				}
			}
		}
	}
};

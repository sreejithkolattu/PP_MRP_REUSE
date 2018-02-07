/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.view.TableSorting");

/**
 * Table Sorting Function
 */
i2d.pp.mrpcockpit.reuse.view.TableSorting = {

	_getVSDialogNEW : function(oController) {
		this.oController = oController;

		if (this.oController.newVSDialog) {
			this.oController.oVSDialog = new sap.m.ViewSettingsDialog({
				sortItems : this._getSortFields(),
				groupItems : [],
				filterItems : [],
				confirm : function(evt) {
					var mParams = evt.getParameters();
					var aSorters = [];
					if (mParams.groupItem) {
						var sPath = mParams.groupItem.getKey();
						var bDescending = mParams.groupDescending;
						var vGroup = this.oController.oController.mGroupFunctions[sPath];
						aSorters.push(new sap.ui.model.Sorter(sPath, bDescending, vGroup));
					}
					var sPath = mParams.sortItem.getKey();
					var bDescending = mParams.sortDescending;
					if (!this.oController.bSortDescending) {
						this.oController.bsortDescending = bDescending;
					} else {
						bDescending = this.oController.bsortDescending;
					};
					this.oController.bSortPath = sPath;
					aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
					this.oController.oSorter = aSorters;
					// /oBinding.sort(aSorters);
					// Changed due to implementation of State Machine: Start
					this.oController.runStateMachine(this.oController, this.oController.oEvent.tableChanged);
					// this._rebindRefreshTable();
					// Changed due to implementation of State Machine: End
					this.oController.oViewState.SortKey = sPath;
					this.oController.oViewState.SortDescending = bDescending;
					this.oController.registerViewChanged(); // What if nothing was changed?
				}.bind(this)
			});
			this.oController.newVSDialog = false;
		}
		return this.oController.oVSDialog;
	},

	_getSortFields : function() {
		var seekIndexInDefSortArray = function(pArray, pValue) {
			// little helper function to check if a given value pValue is in a given array pArray like a this.aDefaultSorting
			var i, index = -1;
			for (i = 0; i < pArray.length; i++) {
				if (pArray[i][0] === pValue) {
					index = i;
					break;
				}
			}
			return index;
		};

		var bSelected = false; // contains true if cell is selected in sort popup
		var aSortFields = [];
		// ONE CODE LINE >>> : Check out if there are special textID for SoH and ModelS
		var sSortFieldText = "";
		// ONE CODE LINE <<<
		var sortFields = this._getCellsInOrder();

		if (sortFields.length !== 0) {
			for ( var i = 0; i < sortFields.length; i++) {
				// loop over cells
				var myIndex = seekIndexInDefSortArray(this.oController.aDefaultSorting, sortFields[i]);
				if (myIndex >= 0) { // cell is member of sortable cells
				// build the entries of the popup
					// ONE CODE LINE >>> : Check out if there are special textID for SoH and ModelS maintained in the aDiffFieldText-array
					if (this.oController.aDiffFieldText){
						sSortFieldText = this.oController.oResourceBundle.getText(i2d.pp.mrpcockpit.reuse.util.Helper.
								getSpecialTextForField(sortFields[i], this.oController));
					} else {
					// ONE CODE LINE <<<
						sSortFieldText = this.oController.oResourceBundle.getText(sortFields[i]);
					}
										
					// check if user set this cell as sort criteria in the popup or take the default cell (defined
					// in the default sort array)
					bSelected = ((this.oController.bSortPath && (this.oController.bSortPath === sortFields[i]))
								|| (!this.oController.bSortPath && (this.oController.aDefaultSorting[myIndex][1] === 1)));
					var oVSItem = new sap.m.ViewSettingsItem(
						{
							text : sSortFieldText, // w/o ONE CODELINE: this.oController.oResourceBundle.getText(sortFields[i]),
							key : sortFields[i],
							selected : bSelected
						});
					aSortFields.push(oVSItem);
				}
			}
		}
		return aSortFields;
	},

	_getCellsInOrder : function(pVisibleOnly) {
		var theCelsOrder = [];
		var theDataInColumnsOrder = [];

		this.oController.oTable.getColumns().forEach(
				function(column) {
					if ((column.getVisible() && pVisibleOnly) || !pVisibleOnly) {
						// push the column data to the position of the columns order in the array
						theDataInColumnsOrder[this.oController.oTable.getColumns(true).indexOf(column)] = column
								.data("mrpcoDataField");
					}
				}.bind(this));

		// check and process entries with more than one field in one column
		theDataInColumnsOrder.forEach(function(column) {
			var aColumnCels = [];
			aColumnCels = column.split(",");
			aColumnCels.forEach(function(columncels) {
				theCelsOrder.push(columncels);
			});
		});

		return theCelsOrder;
	}

}; // i2d.pp.mrpcockpit.reuse.view.TableSorting


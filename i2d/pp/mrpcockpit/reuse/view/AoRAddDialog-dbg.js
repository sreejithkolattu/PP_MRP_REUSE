/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */

sap.ui.controller("i2d.pp.mrpcockpit.reuse.view.AoRAddDialog", {

	_DIALOG_ID : "DLG_SELECT",
	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to
	 * modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * 
	 * @memberOf About
	 */
	onInit : function() {
		 var effectiveUrl = jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse") + "/" + "i18n/i18n.properties";
		 var oBundle = new sap.ui.model.resource.ResourceModel({
			 bundleUrl : effectiveUrl
		 });
		 
		 this.getView().setModel(oBundle, "commondialogs_i18n");
		 
		jQuery.sap.require("sap.m.MessageToast");

		var oDlg = this.getView().byId(this._DIALOG_ID);
		var oOkButton = ( oDlg._getOkButton ? oDlg._getOkButton() : oDlg.getOkButton());
		oOkButton.setEnabled(false);
		oDlg._list.attachSelectionChange(function(oEvent) {
			var list = oEvent.getSource();
			if (list.getSelectedItems().length > 0) {
				oOkButton.setEnabled(true);
			} else {
				oOkButton.setEnabled(false);
			}
		});
		
	//Workaround to show loading indicator (Fix is in UI5 1.20) 
		oDlg._list.attachUpdateStarted(function(){
			var localBusyIndicator = oDlg._busyIndicator || oDlg._oBusyIndicator;
			oDlg._listUpdateRequested += oDlg._ListUpdateRequested;
			if(oDlg._listUpdateRequested > 0) {
				oDlg._list.addStyleClass('sapMSelectDialogListHide');
		    localBusyIndicator.$().css('display', 'inline-block');
			}  
		}, this);
    
	//Workaround to show loading indicator (Fix is in UI5 1.20) 
		oDlg._list.attachUpdateFinished(function(){
			var localBusyIndicator = oDlg._busyIndicator || oDlg._oBusyIndicator;			
			oDlg._list.removeStyleClass('sapMSelectDialogListHide');
			localBusyIndicator.$().css('display', 'none');
			oDlg._listUpdateRequested = 0;
			oDlg._ListUpdateRequested = 0;
			oDlg._list.setShowNoData(true);
		}, this);

	},

	/**
	 * onConfirmDialog: function(oEvent) { var txfVariantName = this.getView().byId(this._VARIANT_NAME_ID); var oResult = {
	 * isConfirmed: true, sInput: txfVariantName.getValue() }; var oDlg = this.getView().byId(this._DIALOG_ID); if
	 * (txfVariantName.getValue() == "") { //
	 * sap.m.MessageToast.show(this.oResourceBundle.getText("VariantMessageEmptyName")); sap.m.MessageToast.show("Please
	 * insert a name for the variant"); } else { var fnSave = oDlg.getModel().getProperty("/saveFunction");
	 * fnSave(txfVariantName.getValue(), oDlg.getModel().getProperty("/data"),
	 * this.getView().byId("CHB_VARIANT_AS_TILE").getSelected()); txfVariantName.setValue(""); // empty the value for the
	 * next call. this.closeDialog(oResult); } }, checkVariantName: function(oData) { },
	 */

	/*
	 * onCancelDialog : function(oEvent) { var oResult = { isConfirmed : false }; this.closeDialog(oResult); },
	 */

	/*
	 * closeDialog : function(oResult) { var oDlg = this.getView().byId(this._DIALOG_ID); var fnClose =
	 * oDlg.getModel().getProperty("/closeFunction"); oDlg.close(); fnClose(oResult); },
	 */

	// Handling of both confirm and cancel; clear the filter
	handleClose : function(oEvent) {
		var oDlg = this.getView().byId(this._DIALOG_ID);
		var fnClose = oDlg.getModel().getProperty("/closeFunction");
		// oDlg.close();
		fnClose(oEvent);

		// oEvent.getSource().getBinding("items").filter([]);
	},
	
	handleConfirm : function(oEvent) {
		var oDlg = this.getView().byId(this._DIALOG_ID);
		var fnConfirm = oDlg.getModel().getProperty("/confirmFunction");
		// oDlg.close();
		fnConfirm(oEvent);

		// oEvent.getSource().getBinding("items").filter([]);
	},

	search : function(oEvt) {

		var sValue = oEvt.getParameter("value");
		var aFilter = [];
		var oFilter1 = new sap.ui.model.Filter("TextSearch", sap.ui.model.FilterOperator.Contains, sValue);
		aFilter.push(oFilter1);

		var oBinding = oEvt.getSource().getBinding("items");
		var oOrFilter = new sap.ui.model.Filter(aFilter, false);
		oBinding.filter(oOrFilter);

	},

/**
 * variantNameChanged: function(oControlEvent) { var oDlg = this.getView().byId(this._DIALOG_ID); var allVariantNames =
 * oDlg.getModel().getProperty("/variantList"); var variantExsits = false; if (allVariantNames != null) { for ( var i =
 * 0; i < allVariantNames.length; i++) { if (allVariantNames[i] == oControlEvent.getParameters.value) { variantExsits =
 * true; } } } if (variantExsits) { this.getView().byId("BTN_CONFIRM").setText("Rewrite"); } else {
 * this.getView().byId("BTN_CONFIRM").setText("Save"); } } /** Similar to onAfterRendering, but this hook is invoked
 * before the controller's View is re-rendered (NOT before the first rendering! onInit() is used for that one!).
 * 
 * @memberOf About
 */
// onBeforeRendering: function() {
//
// },
/**
 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the
 * HTML could be done here. This hook is the same one that SAPUI5 controls get after being rendered.
 * 
 * @memberOf About
 */
// onAfterRendering: function() {
//
// },
/**
 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
 * 
 * @memberOf About
 */
// onExit: function() {
//
// }
});

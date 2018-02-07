/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
//jQuery.sap.require("zokcv1.Configuration");
jQuery.sap.require("sap.ushell.services.CrossApplicationNavigation");

sap.ui.controller("i2d.pp.mrpcockpit.reuse.view.AoRWelcomeDialog", {

	_DIALOG_ID : "DLG_WLC",
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
	
	},
	// Navigate to Home
	onCancelDialog : function(oEvent) {
		var oResult = {
			isConfirmed : false
		};

		var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
		this.oCrossAppNav = fgetService && fgetService("CrossApplicationNavigation");

		var href2 = (this.oCrossAppNav && this.oCrossAppNav.toExternal({
			target : {
				shellHash : "#"
			}
		})) || "";

		var oDlg = this.getView().byId(this._DIALOG_ID);
		oDlg.close();

	},

	onConfirmDialog : function(oEvent) {
		var oView = this.byId("DLG_WLC");
		var oModel = oView.getModel();
		var fnOpenAoRAddDialog = oModel.getProperty("/fnOpenAoRAddDialog");
		fnOpenAoRAddDialog(oEvent);
		var oDlg = this.getView().byId(this._DIALOG_ID);
//		var fnClose = oDlg.getModel().getProperty("/closeFunction");
		oDlg.close();
//		fnClose;

	},

/**
 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered (NOT before the
 * first rendering! onInit() is used for that one!).
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

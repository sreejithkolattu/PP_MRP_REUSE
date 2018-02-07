/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */

sap.ui.controller("i2d.pp.mrpcockpit.reuse.view.AoRMainDialog", {

	_DIALOG_ID : "DLG_AOR_ID",
	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to
	 * modify the View before it is displayed, to bind event handlers and do other one-time initialization..
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

	},

	beforeOpen : function(oEvent) {
		var aFilter = [];
		var oFilter1 = new sap.ui.model.Filter("AreaOfResponsibility", sap.ui.model.FilterOperator.EQ, true);

		aFilter.push(oFilter1);
		var oBinding = oEvent.getSource().getBinding("items");
		var oOrFilter = new sap.ui.model.Filter(aFilter, false);
		oBinding.filter(oOrFilter);

	},

	openSelDialog : function(oEvent) {
		var oDlg = sap.ui.getCore().byId(this._DIALOG_ID);
		var fnOpenSelDialog = oDlg.getModel().getProperty("/addFunction");
		fnOpenSelDialog(oEvent);
		oDlg.close();
	},

	onConfirmDialog : function(oEvent) {
		var oDlg = this.getView().byId(this._DIALOG_ID);
		var fnConfirm = oDlg.getModel().getProperty("/confirmFunction");
		oDlg.close();
		fnConfirm(oEvent);

	},

	myDelete : function(evt) {
		var item = evt.getParameter("listItem");
		var model = item.getParent().getModel("items");
		var data = model.getData();
		jQuery.each(item.getParent().getItems(), function(index, myItem) {
			if (myItem == item) {
				data.data.splice(index, 1);
				return;
			}
		});

		model.setData(data);
	},

	checkNumberOfItems : function(oEvent) {

		var oDlg = sap.ui.getCore().byId(this._DIALOG_ID);
		if (oEvent.getParameters().actual > 0) {
			setTimeout(function() {
				oDlg.getBeginButton().setEnabled(true);
				}, 0);
		} else {
			setTimeout(function() {
				oDlg.getBeginButton().setEnabled(false);
			}, 0);
		}
	}

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

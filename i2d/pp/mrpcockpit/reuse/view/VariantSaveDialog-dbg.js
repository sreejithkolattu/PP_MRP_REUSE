/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ushell.services.CrossApplicationNavigation");

sap.ui.controller("i2d.pp.mrpcockpit.reuse.view.VariantSaveDialog", {
	_VARIANT_NAME_ID: "TXF_VARIANT_NAME",
	_DIALOG_ID: "DLG_VARIANT_SAVE",

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

		var txfVariantName = this.getView().byId(this._VARIANT_NAME_ID);
		txfVariantName.attachLiveChange(function() {

		});

	},

	beforeOpen : function(oEvent){
		var oDlg = this.getView().byId(this._DIALOG_ID);
		var txfVariantName = this.getView().byId(this._VARIANT_NAME_ID);
		txfVariantName.setValue(oDlg.getModel().getProperty("/oldVariantName"));	
		
		this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").setSelected(oDlg.getModel().getProperty("/b2MonitorTile"));
		this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").setSelected(oDlg.getModel().getProperty("/b2ManageTile"));
		
		//Only need for Manage Forecast Demand App
		if(oDlg.getModel().getProperty("/forcasteDemandApp") && oDlg.getModel().getProperty("/forcasteDemandApp")===true){
			this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").setVisible(false);
			this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").setText(this.getView().getModel('commondialogs_i18n').getResourceBundle().getText("VariantCheckBoxMonitor"));
		}
	},
	
	onConfirmDialog: function(oEvent) {
		var txfVariantName = this.getView().byId(this._VARIANT_NAME_ID).getValue();
		txfVariantName = txfVariantName.trim();
		var oResult = {
				isConfirmed: true,
				sInput: txfVariantName
		};
		var oDlg = this.getView().byId(this._DIALOG_ID);

		if (txfVariantName == "") {
			sap.m.MessageToast.show(this.getView().getModel('commondialogs_i18n').getResourceBundle().getText("VariantMessageEmptyName"));


		} else if(txfVariantName.toLowerCase() == oDlg.getModel().getProperty("/sDefaultLayoutName").toLowerCase() || txfVariantName.toLowerCase() == oDlg.getModel().getProperty("/sListName").toLowerCase()){
			sap.m.MessageToast.show(this.getView().getModel('commondialogs_i18n').getResourceBundle().getText("VariantMessageProtectedName", txfVariantName));
		} else {
			var allVariantNames = oDlg.getModel().getProperty("/variantList");
			var variantExsits = false;
			if (allVariantNames != null) {
				for ( var i = 0; i < allVariantNames.length; i++) {
					if (allVariantNames[i] == txfVariantName) {
						variantExsits = true;
					}
				}
			}

				
				
			
			
	 if (variantExsits) {

				var fnChangeVariant = oDlg.getModel().getProperty("/changeVariantFunction");
				var bCheckboxMonitor = this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").getSelected();
				var bCheckboxManage = this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").getSelected();
				fnChangeVariant(txfVariantName, bCheckboxMonitor, bCheckboxManage);
				this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").setSelected(false);
				this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").setSelected(false);
				this.getView().byId(this._VARIANT_NAME_ID).setValue("");	
				oDlg.close();

			} else {
				var fnSave = oDlg.getModel().getProperty("/saveFunction");
				var bCheckboxMonitor = this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").getSelected();
				var bCheckboxManage = this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").getSelected();
				fnSave(txfVariantName,  bCheckboxMonitor, bCheckboxManage);
				this.getView().byId(this._VARIANT_NAME_ID).setValue("");	 // empty the value for the next call.
				this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").setSelected(false);
				this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").setSelected(false);
				this.closeDialog(oResult);
			}
		}

	},
	checkVariantName: function(oData) {

	},

	onCancelDialog: function(oEvent) {
		var oResult = {
				isConfirmed: false
		};
		this.getView().byId(this._VARIANT_NAME_ID).setValue("");	
		this.closeDialog(oResult);
	},

	closeDialog: function(oResult) {
		var oDlg = this.getView().byId(this._DIALOG_ID);
		var fnClose = oDlg.getModel().getProperty("/closeFunction");
		oDlg.close();
		fnClose(oResult);
	},


	variantNameChanged: function(oControlEvent) {


	}

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered (NOT before the
	 * first rendering! onInit() is used for that one!).
	 * 
	 * @memberOf About
	 */
//	onBeforeRendering: function() {

//	},
	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the
	 * HTML could be done here. This hook is the same one that SAPUI5 controls get after being rendered.
	 * 
	 * @memberOf About
	 */
//	onAfterRendering: function() {

//	},
	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * 
	 * @memberOf About
	 */
//	onExit: function() {

//	}
});

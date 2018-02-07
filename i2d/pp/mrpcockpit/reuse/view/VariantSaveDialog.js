/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ushell.services.CrossApplicationNavigation");sap.ui.controller("i2d.pp.mrpcockpit.reuse.view.VariantSaveDialog",{_VARIANT_NAME_ID:"TXF_VARIANT_NAME",_DIALOG_ID:"DLG_VARIANT_SAVE",onInit:function(){var e=jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse")+"/"+"i18n/i18n.properties";var b=new sap.ui.model.resource.ResourceModel({bundleUrl:e});this.getView().setModel(b,"commondialogs_i18n");jQuery.sap.require("sap.m.MessageToast");var t=this.getView().byId(this._VARIANT_NAME_ID);t.attachLiveChange(function(){})},beforeOpen:function(e){var d=this.getView().byId(this._DIALOG_ID);var t=this.getView().byId(this._VARIANT_NAME_ID);t.setValue(d.getModel().getProperty("/oldVariantName"));this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").setSelected(d.getModel().getProperty("/b2MonitorTile"));this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").setSelected(d.getModel().getProperty("/b2ManageTile"));if(d.getModel().getProperty("/forcasteDemandApp")&&d.getModel().getProperty("/forcasteDemandApp")===true){this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").setVisible(false);this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").setText(this.getView().getModel('commondialogs_i18n').getResourceBundle().getText("VariantCheckBoxMonitor"))}},onConfirmDialog:function(e){var t=this.getView().byId(this._VARIANT_NAME_ID).getValue();t=t.trim();var r={isConfirmed:true,sInput:t};var d=this.getView().byId(this._DIALOG_ID);if(t==""){sap.m.MessageToast.show(this.getView().getModel('commondialogs_i18n').getResourceBundle().getText("VariantMessageEmptyName"))}else if(t.toLowerCase()==d.getModel().getProperty("/sDefaultLayoutName").toLowerCase()||t.toLowerCase()==d.getModel().getProperty("/sListName").toLowerCase()){sap.m.MessageToast.show(this.getView().getModel('commondialogs_i18n').getResourceBundle().getText("VariantMessageProtectedName",t))}else{var a=d.getModel().getProperty("/variantList");var v=false;if(a!=null){for(var i=0;i<a.length;i++){if(a[i]==t){v=true}}}if(v){var c=d.getModel().getProperty("/changeVariantFunction");var C=this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").getSelected();var b=this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").getSelected();c(t,C,b);this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").setSelected(false);this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").setSelected(false);this.getView().byId(this._VARIANT_NAME_ID).setValue("");d.close()}else{var s=d.getModel().getProperty("/saveFunction");var C=this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").getSelected();var b=this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").getSelected();s(t,C,b);this.getView().byId(this._VARIANT_NAME_ID).setValue("");this.getView().byId("CHB_VARIANT_AS_TILE_MONITOR").setSelected(false);this.getView().byId("CHB_VARIANT_AS_TILE_MANAGE").setSelected(false);this.closeDialog(r)}}},checkVariantName:function(d){},onCancelDialog:function(e){var r={isConfirmed:false};this.getView().byId(this._VARIANT_NAME_ID).setValue("");this.closeDialog(r)},closeDialog:function(r){var d=this.getView().byId(this._DIALOG_ID);var c=d.getModel().getProperty("/closeFunction");d.close();c(r)},variantNameChanged:function(c){}});
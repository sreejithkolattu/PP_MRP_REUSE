/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.controller("i2d.pp.mrpcockpit.reuse.view.VariantDeleteDialog",{_VARIANT_NAME_ID:"TXF_VARIANT_NAME",_DIALOG_ID:"DLG_VARIANT_DELETE",onInit:function(){var e=jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse")+"/"+"i18n/i18n.properties";var b=new sap.ui.model.resource.ResourceModel({bundleUrl:e});this.getView().setModel(b,"commondialogs_i18n")},onCancelDialog:function(e){var r={isConfirmed:false};this.closeDialog(r)},closeDialog:function(r){var d=this.getView().byId(this._DIALOG_ID);var c=d.getModel().getProperty("/closeFunction");d.close();c(r)},onConfirmDialog:function(e){var d=this.getView().byId(this._DIALOG_ID);var c=d.getModel().getProperty("/confirmFunction");d.close();c(e)}});

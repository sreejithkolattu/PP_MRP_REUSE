/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ushell.services.CrossApplicationNavigation");sap.ui.controller("i2d.pp.mrpcockpit.reuse.view.VariantChangeConfirmationDialog",{_DIALOG_ID:"DLG_CHANGE_VARIANT_CONFIRMATION",onInit:function(){var e=jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse")+"/"+"i18n/i18n.properties";var b=new sap.ui.model.resource.ResourceModel({bundleUrl:e});this.getView().setModel(b,"commondialogs_i18n")},onConfirmDialog:function(e){var d=this.getView().byId(this._DIALOG_ID);var s=d.getModel().getProperty("/saveFunction");s();this.closeDialog(e)},onCancelDialog:function(e){var r={isConfirmed:false};this.closeDialog(e)},closeDialog:function(r){var d=this.getView().byId(this._DIALOG_ID);var c=d.getModel().getProperty("/closeFunction");d.close();c(r)},});

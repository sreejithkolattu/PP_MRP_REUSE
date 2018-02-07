/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.controller("i2d.pp.mrpcockpit.reuse.view.AoRMainDialog",{_DIALOG_ID:"DLG_AOR_ID",onInit:function(){var e=jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse")+"/"+"i18n/i18n.properties";var b=new sap.ui.model.resource.ResourceModel({bundleUrl:e});this.getView().setModel(b,"commondialogs_i18n");jQuery.sap.require("sap.m.MessageToast")},beforeOpen:function(e){var f=[];var F=new sap.ui.model.Filter("AreaOfResponsibility",sap.ui.model.FilterOperator.EQ,true);f.push(F);var b=e.getSource().getBinding("items");var o=new sap.ui.model.Filter(f,false);b.filter(o)},openSelDialog:function(e){var d=sap.ui.getCore().byId(this._DIALOG_ID);var o=d.getModel().getProperty("/addFunction");o(e);d.close()},onConfirmDialog:function(e){var d=this.getView().byId(this._DIALOG_ID);var c=d.getModel().getProperty("/confirmFunction");d.close();c(e)},myDelete:function(e){var i=e.getParameter("listItem");var m=i.getParent().getModel("items");var d=m.getData();jQuery.each(i.getParent().getItems(),function(a,b){if(b==i){d.data.splice(a,1);return}});m.setData(d)},checkNumberOfItems:function(e){var d=sap.ui.getCore().byId(this._DIALOG_ID);if(e.getParameters().actual>0){setTimeout(function(){d.getBeginButton().setEnabled(true)},0)}else{setTimeout(function(){d.getBeginButton().setEnabled(false)},0)}}});

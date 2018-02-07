/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.view.AoRHandler");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.AoRAddDialog");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.AoRMainDialog");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.AoRWelcomeDialog");


i2d.pp.mrpcockpit.reuse.view.AoRHandler = {

		i18NCommonReuseModel : new sap.ui.model.resource.ResourceModel({
			bundleUrl : jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse") + "/" + "i18n/i18n.properties"
		}),	


		//Method called by the apps to start the AoRMainDialog
		openOnboardingDialog : function(evt, oSelModel, fCallBackFunction, oController) {
			this.openAoRMainDialog(evt, true, oSelModel, fCallBackFunction, null, false, oController);
		},

		//Method called by the apps to start the AoRWelcomeDialog for the first Onboarding
		openFirstOnboardingDialog : function(oSelModel, fCallBackFunction, oController) {
			this.openAoRWelcomeDialog(null, oSelModel, fCallBackFunction, oController);
		},



		// open AoRAddDialog (old name:Select Dialog)
		openAoRAddDialog : function(evt, oSelModel, fCallBackFunction, aAORData, bComesFromWelcome, oController) {

			var effectiveUrl = jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse") + "/" + "i18n/i18n.properties";
			var oBundle = new sap.ui.model.resource.ResourceModel({
				bundleUrl : effectiveUrl
			});
			
			// search function - called when the search button is pressed on the dialog 
			var fnSearch = function(oEvt) {
				var sValue = oEvt.getParameter("value");
				var oFilter = new sap.ui.model.Filter("MRPControllerName", sap.ui.model.FilterOperator.Contains, sValue);
				var oBinding = oEvt.getSource().getBinding("items");
				oBinding.filter([oFilter]);
			};

			var that = this;

			// open the AoRMainDialog after closing the AoRAddDialog
			var fnConfirm = function(oEvent) {
				if (oEvent) {
					this.openAoRMainDialog(oEvent, false, oSelModel, fCallBackFunction, aAORData, bComesFromWelcome, oController);
				}
			}.bind(this);

			// navigate to launchpad when the user cancel the welcome dialog (no AoR is set)
			var fnClose = function(oEvent) {
				if (oEvent) {
					if (bComesFromWelcome) {
						var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
						this.oCrossAppNav = fgetService && fgetService("CrossApplicationNavigation");

						var href2 = (this.oCrossAppNav && this.oCrossAppNav.toExternal({
							target : {
								shellHash : "#"
							}
						})) || "";
					} else {
						if(fCallBackFunction) {
							fCallBackFunction(i2d.pp.mrpcockpit.reuse.util.CommonConstants.AOR_DEFINITION_CANCELED);
						}
					} 
				}
			}.bind(this);

			//create the AoRAddDialog

				this.oMRPSDialogView = new sap.ui.view({
					viewName : "i2d.pp.mrpcockpit.reuse.view.AoRAddDialog",
					type : sap.ui.core.mvc.ViewType.XML
				});


			// get the dialog instance from the view
			var oDialog = this.oMRPSDialogView.byId("DLG_SELECT");

			// set model to dialog/view
			var oDialogModel = {
					closeFunction : fnClose,
					confirmFunction : fnConfirm
			};

			// Workaround to remove the "No Data" label in the first call (Fix is in UI5 1.20)
			oDialog._list.setShowNoData(false);

			oDialog._list.removeSelections(true);
			oController.getView().addDependent(oDialog);
			oDialog.open();
			var oModel = new sap.ui.model.json.JSONModel(oDialogModel);
			oDialog.setModel(oModel);	
			oDialog.setModel(oBundle, "commondialogs_i18n");
			oDialog.setTitle(oDialog.getModel('commondialogs_i18n').getResourceBundle().getText("DIALOG_SELECT"));

			// Set Model after Open to see the loading indicator (Can be changed after UI5 1.20)
			oDialog.setModel(oSelModel, "items");
			var itemsBinding = oDialog.getBinding("items");
			if(itemsBinding.aFilters.length != 0) {
				oDialog.getBinding("items").filter([]);
			}

		},

		// open AoRMainDialog (here you can see your selected AoRs and can add or delete AoRs)
		openAoRMainDialog : function(oEvent, readFromBackend, oSelModel, fCallBackFunction, aAORData, bComesFromWelcome, oController) {

			var effectiveUrl = jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse") + "/" + "i18n/i18n.properties";
			var oBundle = new sap.ui.model.resource.ResourceModel({
				bundleUrl : effectiveUrl
			});

			var that = this;

			if (!aAORData) {
				aAORData = [];
			}
			this.oSelModel = oSelModel;
			this.oSelectedItemsJSON = new sap.ui.model.json.JSONModel();
			jQuery.sap.require("sap.m.MessageToast");

			//Read AoR Data from the backend
			if (readFromBackend) {
				oSelModel.read("/MRPControllers", null, {
					"$filter" : "(AreaOfResponsibility eq true)"
				}, true, function(oData, oResponse) {
					that.oSelectedItemsJSON.setData({
						data : oData.results
					});
					aAORData = oData.results;
				});

			} else {

				this.oSelectedItems = [];
				this.oSelectedItems = oEvent.getParameter("selectedContexts");

				//Add all new selected Items to the AORData
				if (this.oSelectedItems) {
					for ( var i = 0; i < this.oSelectedItems.length; i++) {
						var bFound = false;
						for ( var j = 0; j < aAORData.length; j++) {
							var oTempObject = this.oSelectedItems[i].getObject();

							if(aAORData[j].MRPControllerID === oTempObject.MRPControllerID && 
									aAORData[j].MRPPlant === oTempObject.MRPPlant) {
								bFound = true;
								break;
							}

						}
						if(!bFound){
							aAORData.push(this.oSelectedItems[i].getObject());
						}

					}
					//Store AORData in JSON for binding to the list
					this.oSelectedItemsJSON.setData({
						data : aAORData
					});
				}

			}

			// navigate to launchpad when the user cancel the welcome dialog (no AoR is set)
			var fnClose = function(oResult) {
				if (bComesFromWelcome) {
					var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
					this.oCrossAppNav = fgetService && fgetService("CrossApplicationNavigation");

					var href2 = (this.oCrossAppNav && this.oCrossAppNav.toExternal({
						target : {
							shellHash : "#"
						}
					})) || "";
				} else {
					if(fCallBackFunction) {
						fCallBackFunction(i2d.pp.mrpcockpit.reuse.util.CommonConstants.AOR_DEFINITION_CANCELED);
					}
				}  
				fnCloseDialog();
			}.bind(this);

			//Open AoRAddDialog
			var fnOpenSelDialog = function(oEvent) {
				if (oEvent) {
					that.openAoRAddDialog(oEvent, that.oSelModel, fCallBackFunction, aAORData, bComesFromWelcome, oController);
				}
			};

			//Send AoRData to the backend and close the dialog
			var fnConfirmDialog = function(oEvent) {
				if (oEvent) {
					that.sendAoRtoBackend(oEvent, that.oSelectedItemsJSON, fCallBackFunction, that.sSuccessMessage, oSelModel);
					fnCloseDialog();
				}
			};

			//Create AoRMainDialog

				this.oMRPAORDialogView = new sap.ui.view({
					viewName : "i2d.pp.mrpcockpit.reuse.view.AoRMainDialog",
					type : sap.ui.core.mvc.ViewType.XML
				});

			// set model to dialog/view
			var oDialogModel = {
					closeFunction : fnClose,
					addFunction : fnOpenSelDialog,
					confirmFunction : fnConfirmDialog
			};

			//Create confirm button for the dialog
			var oConfirmBtn = new sap.m.Button({
				press : fnConfirmDialog,
				text : ""
			});

			//Create cancel button for the dialog
			var oCancelBtn = new sap.m.Button({
				press : fnClose,
				text : ""
			});

			//Create a dialog for the AoRMainDialog
			var oDialog = sap.ui.getCore().byId("DLG_AOR_ID");

			//Destroy dialog before creating a new one 
			if (oDialog !== undefined) {
				oDialog.removeAllContent();
				oDialog.destroy();

			}

			//Create the AoRMainDialog 
			oDialog = new sap.m.Dialog("DLG_AOR_ID", {
				content : [this.oMRPAORDialogView],
				title : "",
				beginButton : oConfirmBtn,
				endButton : oCancelBtn
			});

			var oModel = new sap.ui.model.json.JSONModel(oDialogModel);
			oDialog.setModel(oModel);
			oDialog.setModel(this.oSelectedItemsJSON, "items");
			oDialog.setModel(oBundle, "commondialogs_i18n");
			oDialog.getBeginButton().setText(oDialog.getModel('commondialogs_i18n').getResourceBundle().getText("BUTTON_OK"));
			oDialog.getEndButton().setText(oDialog.getModel('commondialogs_i18n').getResourceBundle().getText("BUTTON_CANCEL"));
			oDialog.setTitle(oDialog.getModel('commondialogs_i18n').getResourceBundle().getText("DIALOG_AOR"));


			var fnCloseDialog = function(oEvent) {
				oDialog.close();

			};

			this.sSuccessMessage = oDialog.getModel('commondialogs_i18n').getResourceBundle().getText("SEND_AOR_SUCCESS_MSG");

			oController.getView().addDependent(oDialog);
			oDialog.open();

		},

		// Welcome Dialog
		openAoRWelcomeDialog : function(evt, oSelModel, fCallBackFunction, oController) {

			var effectiveUrl = jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse") + "/" + "i18n/i18n.properties";
			var oBundle = new sap.ui.model.resource.ResourceModel({
				bundleUrl : effectiveUrl
			});
			
			// the dialog close callback function, send the dialog
			// results for further process
			var fnClose = function(oResult) {

			};

			var that = this;

			//Open AoRAddDialog
			var fnOpenAoRAddDialog = function(oEvent) {
				if (oEvent) {
					that.openAoRAddDialog(oEvent, oSelModel, fCallBackFunction, null,  true, oController);
				}
			};

			//Create AoRWelcomeDialog
				this.oMRPWLCDialogView = new sap.ui.view({
					viewName : "i2d.pp.mrpcockpit.reuse.view.AoRWelcomeDialog",
					type : sap.ui.core.mvc.ViewType.XML
				});


			// get the dialog instance from the view
			var oDialog = this.oMRPWLCDialogView.byId("DLG_WLC");

			// set model to dialog/view
			var oDialogModel = {
					title : oBundle.getResourceBundle().getText("DIALOG_WELCOME"),
					text : oBundle.getResourceBundle().getText("DIALOG_WELCOME_TEXT"),
					closeFunction : fnClose,
					fnOpenAoRAddDialog : fnOpenAoRAddDialog
			};

			var oModel = new sap.ui.model.json.JSONModel(oDialogModel);
			oDialog.setModel(oModel);
			oDialog.setModel(oBundle, "commondialogs_i18n");
			//oDialog.setText(oDialog.getModel('commondialogs_i18n').getResourceBundle().getText("DIALOG_WELCOME_TEXT"));
			//oDialog.setTitle(oDialog.getModel('commondialogs_i18n').getResourceBundle().getText("DIALOG_WELCOME"));

			oController.getView().addDependent(oDialog);
			oDialog.open();

		},

		sendAoRtoBackend : function(oEvent, oSelectedItemsJSON, fCallBackFunction, successMessage, oModel) {

			//var oModel = oSelModel;//new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/PP_MRP_COCKPIT_SRV");
			
			var oMRPControllers = [];

			// Create MRPController/Plant Items
			if (oSelectedItemsJSON) {
				for ( var i = 0; i < oSelectedItemsJSON.oData.data.length; i++) {
					var oMRPController = {};
					oMRPController.MRPPlant = oSelectedItemsJSON.oData.data[i].MRPPlant;
					oMRPController.MRPControllerID = oSelectedItemsJSON.oData.data[i].MRPControllerID;
					oMRPControllers.push(oMRPController);

				}
			}

			var oAreaOfResponsibility = {};
			oAreaOfResponsibility.AreaOfResponsibility_To_MRPControllers = oMRPControllers;

			// Send data to the backend
			oModel.create('/AreasOfResponsibility', oAreaOfResponsibility, null, function() {
				// Create successful;
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(successMessage);

				if(fCallBackFunction) {
					fCallBackFunction();
				}

			}, function() {
				//Create failed;
					if(fCallBackFunction) {
						fCallBackFunction(i2d.pp.mrpcockpit.reuse.util.CommonConstants.AOR_DEFINITION_FAILED);
					}
				
			});

		}


};

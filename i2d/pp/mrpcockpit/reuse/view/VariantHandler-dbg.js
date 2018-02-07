/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.view.VariantHandler");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.VariantSaveDialog");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.VariantDeleteDialog");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.view.VariantChangeConfirmationDialog");

i2d.pp.mrpcockpit.reuse.view.VariantHandler = {

		i18NCommonReuseModel : new sap.ui.model.resource.ResourceModel({
			bundleUrl : jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse") + "/" + "i18n/i18n.properties"
		}),	

		openVariantDialog : function(fCallbackFunction, sContainerPrefix, oVariantData, aVariantNames,  sServiceUrl, sAppURL, sNumberUnit, sLPIconMonitor, sLPIconManage, sOldVariantName, b2MonitorTile, b2ManageTile, bChangeVariant, oController) {

			
			this.sContainerPrefix = sContainerPrefix;
			this.oVariantData = oVariantData;
			this.sServiceUrl = sServiceUrl;
			this.sAppURL = sAppURL;
			this.fCallbackFunction = fCallbackFunction;
			this.aVariantNames = aVariantNames;
			this.sNumberUnit = sNumberUnit;
			this.sLPIconMonitor = sLPIconMonitor;
			this.sLPIconManage = sLPIconManage;
			this.sOldVariantName = sOldVariantName;
			this.b2MonitorTile = b2MonitorTile;
			this.b2ManageTile = b2ManageTile;
			this.bChangeVariant = bChangeVariant;
			var sDefaultLayoutName = oController.getView().getModel("Common_i18n").getResourceBundle().getText("DefaultLayout");
			var sListName = oController.getObjectHeaderTitle();
			
			if(this.b2MonitorTile === undefined) {
				this.b2MonitorTile = false;
			}

			if(this.b2ManageTile === undefined) {
				this.b2ManageTile = false;
			}
			if(this.bChangeVariant === undefined){
				this.bChangeVariant = false;
			}

			// the dialog close callback function, send the dialog
			// results for further process
			var fnClose = function(oResult) {

			};

			// save function called when press save on the VariantSaveDialog
			var save = function(sVariantName, bAddBookmarkMonitor, bAddBookmarkManage) {
				this.onVariantSave(this.fCallbackFunction, this.sContainerPrefix, sVariantName, this.oVariantData, bAddBookmarkMonitor, bAddBookmarkManage, this.sAppURL, this.sServiceUrl, this.sNumberUnit, this.sLPIconMonitor, this.sLPIconManage, this.sOldVariantName, bChangeVariant, oController);
			}.bind(this);

			// changeVariant function called when press save on the VariantSaveDialog and the name already exists
			var changeVariant = function(sVariantName, bAddBookmarkMonitor, bAddBookmarkManage) {
				this.openVariantChangeConfirmationDialog(this.fCallbackFunction, this.sContainerPrefix, sVariantName, this.oVariantData, bAddBookmarkMonitor, bAddBookmarkManage, this.sAppURL, this.sServiceUrl, this.sNumberUnit, this.sLPIconMonitor, this.sLPIconManage, oController);
			}.bind(this);

			//Create the VariantSaveDialog
	
				this.oMRPDialogView = new sap.ui.view({
					viewName : "i2d.pp.mrpcockpit.reuse.view.VariantSaveDialog",
					type : sap.ui.core.mvc.ViewType.XML
				});
				
			// get the dialog instance from the view
			var oDialog = this.oMRPDialogView.byId("DLG_VARIANT_SAVE");

			//Set Title for Create new variant and change variant
			var sTitle = i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("CreateVariant");
			if(bChangeVariant) {
				sTitle = i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("ChangeVariant");
			} 
			// set model to dialog/view
			var oDialogModel = {
					title : sTitle,
					closeFunction : fnClose,
					saveFunction : save,
					variantList : this.aVariantNames,
					changeVariantFunction : changeVariant,
					oldVariantName : this.sOldVariantName,
					b2MonitorTile : b2MonitorTile,
					b2ManageTile  :b2ManageTile,
					sDefaultLayoutName : sDefaultLayoutName,
					sListName : sListName,
					forcasteDemandApp : oController.ForecastDemandManageApp
					
			};
			var oModel = new sap.ui.model.json.JSONModel(oDialogModel);
			oDialog.setModel(oModel);
			oController.getView().addDependent(oDialog);

			oDialog.open();

		},
		
		openVariantSaveDialog : function(fCallbackFunction, sContainerPrefix, oVariantData, aVariantNames,  sServiceUrl, sAppURL, sNumberUnit, sLPIconMonitor, sLPIconManage, sOldVariantName, b2MonitorTile, b2ManageTile, bChangeVariant, oController) {


			var b2MonitorTile = false;
			var b2ManageTile = false;
			this.oPersonalizationService = {};
			var oPersonalizationContainerPromise = {};
			this.oPersonalizationContainer = {};
			this.oPersonalizationVariantSet = {};
			this.sVARIANTSET = "Variants";
			var sContainerName = "MRPCockpit." + sContainerPrefix;

			//Get the Personalization Service
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
			// Get the specific Container for the App-Pairs x10 and x30
			oPersonalizationContainerPromise = this.oPersonalizationService.getPersonalizationContainer(sContainerName);
			oPersonalizationContainerPromise.fail(function() {
				if (fCallbackFunction) {
					//If an error occurs call the callback function with parameter false 
					fCallbackFunction(false);
				}
			});

			oPersonalizationContainerPromise.done(function(oContainer) {
				this.oPersonalizationContainer = oContainer;
				//Get the Variant Set from the Container
				if (!(this.oPersonalizationContainer.containsVariantSet(this.sVARIANTSET))) {
					//Create VariantSet when it doesn't exists
					this.oPersonalizationContainer.addVariantSet(this.sVARIANTSET);
				};
				this.oPersonalizationVariantSet = this.oPersonalizationContainer.getVariantSet(this.sVARIANTSET);

				var oVariant = {};

				//Get the Variant Key for the Variant Name
				this.sVariantKey = this.oPersonalizationVariantSet.getVariantKeyByName(sOldVariantName);


				//Get the Bookmark Service
				var oService = sap.ushell.Container.getService("Bookmark");


				//Create the complete App URL which is saved in the Tile
				//var sComplteAppUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + this.sVariantKey;
				// TODO Test6
				// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
				if (oController.sOrderCategory === undefined){
					var sComplteAppUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + this.sVariantKey;
				} else {
					var sComplteAppUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + this.sVariantKey + "&OrderCategory=" + oController.sOrderCategory;
				}

				//Count Tiles with the same AppURL (need to check if the bookmark is new or exists and will be overwritten)
				oService.countBookmarks(sComplteAppUrlMonitor)
				.fail(function(){
					//Need for test in the sandbox
					this.openVariantDialog(fCallbackFunction, sContainerPrefix, oVariantData, aVariantNames,  sServiceUrl, sAppURL, sNumberUnit, sLPIconMonitor, sLPIconManage, sOldVariantName, b2MonitorTile, b2ManageTile, false, oController);
				}.bind(this))
				.done(function (iCount) {
					if (iCount > 0) {
						b2MonitorTile = true;
					}
					//Create the complete App URL which is saved in the Tile
					//var sComplteAppUrlManage = sAppURL + "-manage" + "?VariantID=" + this.sVariantKey;
					// TODO Test1
					// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
					if (oController.sOrderCategory === undefined){
						var sComplteAppUrlManage = sAppURL + "-manage" + "?VariantID=" + this.sVariantKey;
					} else {
						var sComplteAppUrlManage = sAppURL + "-manage" +  "?VariantID=" + this.sVariantKey + "&OrderCategory=" + oController.sOrderCategory;
					}

					//Count Tiles with the same AppURL (need to check if the bookmark is new or exists and will be overwritten)
					oService.countBookmarks(sComplteAppUrlManage)
					.fail()
					.done(function (iCount) {
						if (iCount > 0) {
							b2ManageTile = true;
						}
						this.openVariantDialog(fCallbackFunction, sContainerPrefix, oVariantData, aVariantNames,  sServiceUrl, sAppURL, sNumberUnit, sLPIconMonitor, sLPIconManage, sOldVariantName, b2MonitorTile, b2ManageTile, false, oController);

					}.bind(this));
				}.bind(this));

			}.bind(this));
			

		},

		openVariantChangeConfirmationDialog : function(fCallbackFunction, sContainerPrefix, sVariantName, oVariantData, bAddBookmarkMonitor, bAddBookmarkManage, sAppURL, sServiceUrl, sNumberUnit, sLPIconMonitor, sLPIconManage, oController) {

			this.sContainerPrefix = sContainerPrefix;
			this.oVariantData = oVariantData;
			this.sServiceUrl = sServiceUrl;
			this.sAppURL = sAppURL;
			this.fCallbackFunction = fCallbackFunction;
			this.sNumberUnit = sNumberUnit;
			this.sLPIconMonitor = sLPIconMonitor;
			this.sLPIconManage = sLPIconManage;
			this.sVariantName = sVariantName;
			this.bAddBookmarkMonitor = bAddBookmarkMonitor;
			this.bAddBookmarkManage = bAddBookmarkManage;

			// the dialog close callback function, send the dialog
			// results for further process
			var fnClose = function(oResult) {

			};

			// save function called when press save on the VariantChangeConfirmationDialog
			var save = function() {
				this.onVariantSave(this.fCallbackFunction, this.sContainerPrefix, this.sVariantName, this.oVariantData, this.bAddBookmarkMonitor, this.bAddBookmarkManage, this.sAppURL, this.sServiceUrl, this.sNumberUnit, this.sLPIconMonitor, this.sLPIconManage, this.sVariantName, true, oController);
			}.bind(this);

			//Create the VariantChangeConfirmationDialog

				this.oMRPChangeVariantDialogView = new sap.ui.view({
					viewName : "i2d.pp.mrpcockpit.reuse.view.VariantChangeConfirmationDialog",
					type : sap.ui.core.mvc.ViewType.XML
				});
			
			// get the dialog instance from the view
			var oDialog = this.oMRPChangeVariantDialogView.byId("DLG_CHANGE_VARIANT_CONFIRMATION");

			// set model to dialog/view
			var oDialogModel = {
					title : "{i18n>DIALOG_CHANGE_VARIANT_TITLE}",
					closeFunction : fnClose,
					saveFunction : save,
					text : i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("ChangeVariantConfirmationText", this.sVariantName),
			};
			var oModel = new sap.ui.model.json.JSONModel(oDialogModel);
			oDialog.setModel(oModel);
			oController.getView().addDependent(oDialog);
			
			oDialog.open();

		},

		// VariantDeleteDialog
		openVariantDeleteDialog : function(fCallBackFunction, sContainerPrefix, sVariantName, sAppURL, oController) {

			this.sContainerPrefix = sContainerPrefix;
			this.sVariantName = sVariantName;
			this.fCallbackFunction = fCallBackFunction;

			// Close function
			var fnClose = function(oResult) {

			};

			// Confirm function called when press ok on the VariantDeleteDialog
			var fnConfirm = function(oResult) {
				this.onVariantDelete(this.fCallbackFunction, this.sContainerPrefix, this.sVariantName, sAppURL, i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText(("DeleteVariantConfirmation", sVariantName)), oController);
			}.bind(this);

			// Create Dialog

				this.oMRPDELDialogView = new sap.ui.view({
					viewName : "i2d.pp.mrpcockpit.reuse.view.VariantDeleteDialog",
					type : sap.ui.core.mvc.ViewType.XML
				});
			
			// get the dialog instance from the view
			var oDialog = this.oMRPDELDialogView.byId("DLG_VARIANT_DELETE");
			oDialog.getBeginButton().setType(sap.m.ButtonType.Reject);

			// set model to dialog/view

			var oDialogModel = {
					title : i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("DeleteVariantTitle"),
					text : i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("DeleteVariant", sVariantName),
					closeFunction : fnClose,
					confirmFunction : fnConfirm
			};

			var oModel = new sap.ui.model.json.JSONModel(oDialogModel);
			oDialog.setModel(oModel);
			oController.getView().addDependent(oDialog);
			
			oDialog.open();

		},

		openVariantPropertiesDialog : function(fCallbackFunction, sContainerPrefix,  sServiceUrl, sAppURL, sNumberUnit, sLPIconMonitor, sLPIconManage, sOldVariantName, oController) {

			var b2MonitorTile = false;
			var b2ManageTile = false;
			this.oPersonalizationService = {};
			var oPersonalizationContainerPromise = {};
			this.oPersonalizationContainer = {};
			this.oPersonalizationVariantSet = {};
			this.sVARIANTSET = "Variants";
			var sContainerName = "MRPCockpit." + sContainerPrefix;

			//Get the Personalization Service
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
			// Get the specific Container for the App-Pairs x10 and x30
			oPersonalizationContainerPromise = this.oPersonalizationService.getPersonalizationContainer(sContainerName);
			oPersonalizationContainerPromise.fail(function() {
				if (fCallbackFunction) {
					//If an error occurs call the callback function with parameter false 
					fCallbackFunction(false);
				}
			});

			oPersonalizationContainerPromise.done(function(oContainer) {
				this.oPersonalizationContainer = oContainer;
				//Get the Variant Set from the Container
				if (!(this.oPersonalizationContainer.containsVariantSet(this.sVARIANTSET))) {
					//Create VariantSet when it doesn't exists
					this.oPersonalizationContainer.addVariantSet(this.sVARIANTSET);
				};
				this.oPersonalizationVariantSet = this.oPersonalizationContainer.getVariantSet(this.sVARIANTSET);

				var oVariant = {};

				//Get the Variant Key for the Variant Name
				this.sVariantKey = this.oPersonalizationVariantSet.getVariantKeyByName(sOldVariantName);


				//Get the Bookmark Service
				var oService = sap.ushell.Container.getService("Bookmark");


				//Create the complete App URL which is saved in the Tile
				//var sComplteAppUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + this.sVariantKey;
				// TODO Test7
				// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
				if (oController.sOrderCategory === undefined){
					var sComplteAppUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + this.sVariantKey;
				} else {
					var sComplteAppUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + this.sVariantKey + "&OrderCategory=" + oController.sOrderCategory;
				}

				//Count Tiles with the same AppURL (need to check if the bookmark is new or exists and will be overwritten)
				oService.countBookmarks(sComplteAppUrlMonitor)
				.fail(function(){
				}.bind(this))
				.done(function (iCount) {
					if (iCount > 0) {
						b2MonitorTile = true;
					}
					//Create the complete App URL which is saved in the Tile
					//var sComplteAppUrlManage = sAppURL + "-manage" + "?VariantID=" + this.sVariantKey;
					// TODO Test2
					// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
					if (oController.sOrderCategory === undefined){
						var sComplteAppUrlManage = sAppURL + "-manage" + "?VariantID=" + this.sVariantKey;
					} else {
						var sComplteAppUrlManage = sAppURL + "-manage" +  "?VariantID=" + this.sVariantKey + "&OrderCategory=" + oController.sOrderCategory;
					}

					//Count Tiles with the same AppURL (need to check if the bookmark is new or exists and will be overwritten)
					oService.countBookmarks(sComplteAppUrlManage)
					.fail()
					.done(function (iCount) {
						if (iCount > 0) {
							b2ManageTile = true;
						}
						this.openVariantDialog(fCallbackFunction, sContainerPrefix, null, null,  sServiceUrl, sAppURL, sNumberUnit, sLPIconMonitor, sLPIconManage, sOldVariantName, b2MonitorTile, b2ManageTile, true, oController);

					}.bind(this));
				}.bind(this));

			}.bind(this));


		},



//		Save function for the VariantSaveDialog
		onVariantSave : function(fCallbackFunction, sContainerPrefix, sVariantName, oVariantData, bAddBookmarkMonitor, bAddBookmarkManage, sAppURL, sServiceURL, sNumberUnit, sLPIconMonitor, sLPIconManage, sOldVariantName, bChangeVariant, oController) {

			this.oPersonalizationService = {};
			var oPersonalizationContainerPromise = {};
			this.oPersonalizationContainer = {};
			this.oPersonalizationVariantSet = {};
			this.sVARIANTSET = "Variants";
			var sContainerName = "MRPCockpit." + sContainerPrefix;
			var oNewVariantData = JSON.parse(JSON.stringify(oVariantData));


			//Get the Personalization Service
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
			// Get the specific Container for the App-Pairs x10 and x30
			oPersonalizationContainerPromise = this.oPersonalizationService.getPersonalizationContainer(sContainerName);
			oPersonalizationContainerPromise.fail(function() {
				if (fCallbackFunction) {
					//If an error occurs call the callback function with parameter false 
					fCallbackFunction(false);
				}
			});

			oPersonalizationContainerPromise.done(function(oContainer) {
				this.oPersonalizationContainer = oContainer;
				//Get the Variant Set from the Container
				if (!(this.oPersonalizationContainer.containsVariantSet(this.sVARIANTSET))) {
					//Create VariantSet when it doesn't exists
					this.oPersonalizationContainer.addVariantSet(this.sVARIANTSET);
				};
				this.oPersonalizationVariantSet = this.oPersonalizationContainer.getVariantSet(this.sVARIANTSET);

				var oVariant = {};
				var sVariantKeyOld = this.oPersonalizationVariantSet.getVariantKeyByName(sOldVariantName);
				
				//If the name of a variant is change or variant settings, then the old variant must be deleted
				if(((sOldVariantName !== sVariantName && sOldVariantName !== "") && bChangeVariant)){

					if(sVariantKeyOld) {
						oNewVariantData = JSON.parse(JSON.stringify(this.oPersonalizationVariantSet.getVariant(sVariantKeyOld).getItemValue("Filter")));
						//Delete the Variant from the Variant Set
						this.oPersonalizationVariantSet.delVariant(sVariantKeyOld);
					
					}
				}
				
				//Get the Variant Key for the Variant Name
				this.sVariantKey = this.oPersonalizationVariantSet.getVariantKeyByName(sVariantName);
				//If the Variant Key already exists get the Variant by key otherwise create a new Variant and add the Variant to the Variant Set
				if(this.sVariantKey){
					oVariant = this.oPersonalizationVariantSet.getVariant(this.sVariantKey);
				} else {
					oVariant = this.oPersonalizationVariantSet.addVariant(sVariantName);
				}

				if(oNewVariantData){
					//Save all Variant Data in the Item "Filter"
					oVariant.setItemValue("Filter", oNewVariantData);
					if(oNewVariantData.ViewChanged){
						//Remove the ViewChanged flag
						oNewVariantData.ViewChanged = false;
					}
				}

				//Save all changes in the PersonalizationContainer
				this.oPersonalizationContainer.save().fail(function() {
					if (fCallbackFunction) {
						fCallbackFunction(false);
					}
				}).done(function() {
					
					this.sVariantKey = this.oPersonalizationVariantSet.getVariantKeyByName(sVariantName);
					
				//Delete old bookmarks when a variant change
					if(bChangeVariant){
					//Get the Bookmark Service
						var oBookmarkService = sap.ushell.Container.getService("Bookmark");
						if(sVariantKeyOld) {
						if(oBookmarkService){
							//Create the App URL 
							//this.sTargetUrlMonitor = sAppURL + "-monitor" + "?VariantID=" + sVariantKeyOld;
							// TODO Test8
							// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
							if (oController.sOrderCategory === undefined){
							this.sTargetUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + sVariantKeyOld;
							} else {
								this.sTargetUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + sVariantKeyOld + "&OrderCategory=" + oController.sOrderCategory;
							}

							//Check if a Tile with the same App URL Exits - Monitor
							oBookmarkService.countBookmarks(this.sTargetUrlMonitor)
							.fail()
							.done(function (iCount) {
								//Delete Tile when it exists
								if (iCount > 0) {
									oBookmarkService.deleteBookmarks(this.sTargetUrlMonitor)
									.fail()
									.done(function(){
										//Create the App URL 
										//this.sTargetUrlManage = sAppURL + "-manage" + "?VariantID=" + sVariantKeyOld;
										// TODO Test3
										// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
										if (oController.sOrderCategory === undefined){
											this.sTargetUrlManage = sAppURL + "-manage" + "?VariantID=" + sVariantKeyOld;
										} else {
											this.sTargetUrlManage = sAppURL + "-manage" +  "?VariantID=" + sVariantKeyOld + "&OrderCategory=" + oController.sOrderCategory;
										}

										//Check if a Tile with the same App URL Exits - Manage
										oBookmarkService.countBookmarks(this.sTargetUrlManage)
										.fail()
										.done(function (iCount) {
											//Delete Tile when it exists
											if (iCount > 0) {
												oBookmarkService.deleteBookmarks(this.sTargetUrlManage)
												.fail()
												.done(function(){
													this.createBookmarks(sVariantName, this.sVariantKey, sAppURL, bAddBookmarkMonitor, bAddBookmarkManage, sLPIconMonitor, sLPIconManage, sNumberUnit, sServiceURL, fCallbackFunction, oController);
												}.bind(this)); 
											} else {
												this.createBookmarks(sVariantName, this.sVariantKey, sAppURL, bAddBookmarkMonitor, bAddBookmarkManage, sLPIconMonitor, sLPIconManage, sNumberUnit, sServiceURL, fCallbackFunction, oController);
											}
										}.bind(this));

									}.bind(this)); 
								} else {
									//Create the App URL 
									//this.sTargetUrlManage = sAppURL + "-manage" + "?VariantID=" + sVariantKeyOld;
									// TODO Test4
									// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
									if (oController.sOrderCategory === undefined){
										this.sTargetUrlManage = sAppURL + "-manage" + "?VariantID=" + sVariantKeyOld;
									} else {
										this.sTargetUrlManage = sAppURL + "-manage" +  "?VariantID=" + sVariantKeyOld + "&OrderCategory=" + oController.sOrderCategory;
									}
									//Check if a Tile with the same App URL Exits - Manage
									oBookmarkService.countBookmarks(this.sTargetUrlManage)
									.fail()
									.done(function (iCount) {
										//Delete Tile when it exists
								
										if (iCount > 0) {
											oBookmarkService.deleteBookmarks(this.sTargetUrlManage)
											.fail()
											.done(function(){
												this.createBookmarks(sVariantName, this.sVariantKey, sAppURL, bAddBookmarkMonitor, bAddBookmarkManage, sLPIconMonitor, sLPIconManage, sNumberUnit, sServiceURL, fCallbackFunction, oController);
											}.bind(this)); 
										} else {
											this.createBookmarks(sVariantName, this.sVariantKey, sAppURL, bAddBookmarkMonitor, bAddBookmarkManage, sLPIconMonitor, sLPIconManage, sNumberUnit, sServiceURL, fCallbackFunction, oController);
										}
									}.bind(this));

								}
							}.bind(this));

						}
						}
					} else {
						this.createBookmarks(sVariantName, this.sVariantKey, sAppURL, bAddBookmarkMonitor, bAddBookmarkManage, sLPIconMonitor, sLPIconManage, sNumberUnit, sServiceURL, fCallbackFunction, oController);
					}
					
				}.bind(this));

			}.bind(this));

		},
		
		createBookmarks : function(sVariantName, sVariantKey, sAppURL, bAddBookmarkMonitor, bAddBookmarkManage, sLPIconMonitor, sLPIconManage, sNumberUnit, sServiceURL, fCallbackFunction, oController){
			
			this.sVariantKey = sVariantKey;
			var bBookmarkSaved = false;

			this.sVariantKey = this.oPersonalizationVariantSet.getVariantKeyByName(sVariantName);
			//Get the Bookmark Service
			var oService = sap.ushell.Container.getService("Bookmark");

			// Append a filter for the order category, if the app requires the order category.
			//this.sComplteAppUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + this.sVariantKey;
			// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
			if (oController.sOrderCategory === undefined){
			this.sComplteAppUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + this.sVariantKey;
			} else {
				this.sComplteAppUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + this.sVariantKey + "&OrderCategory=" + oController.sOrderCategory;
			}

			//Count Tiles with the same AppURL (need to check if the bookmark is new or exists and will be overwritten)
			oService.countBookmarks(this.sComplteAppUrlMonitor)
			.fail()
			.done(function (iCount) {
				if(bAddBookmarkMonitor){
					if (iCount === 0) {
						bBookmarkSaved = true;
						// no bookmark present, add a new one
						oService.addBookmark({
							title : sVariantName,
							subtitle : i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("MONITOR"),
							url : this.sComplteAppUrlMonitor,
							icon : sLPIconMonitor,
							numberUnit : sNumberUnit,
							serviceRefreshInterval : 10,
							serviceUrl : sServiceURL
						})
						.fail()
						.done(function () {
							sap.m.MessageToast.show(i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("VariantMessageBookmark", sVariantName));
						});
					}} else {
						//Delete Tile when it exists
						if (iCount > 0) {
							oService.deleteBookmarks(this.sComplteAppUrlMonitor)
							.fail()
							.done(function () {
								sap.m.MessageToast.show(i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText(("DeleteVariantConfirmation", sVariantName)));
							}); 
						}
					}
			}.bind(this));

			//Create the complete App URL which is saved in the Tile
			// Append a filter for the order category, if the app requires the order category.
			//this.sComplteAppUrlManage = sAppURL + "-manage" + "?VariantID=" + this.sVariantKey;
			// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
			if (oController.sOrderCategory === undefined){
				this.sComplteAppUrlManage = sAppURL + "-manage" + "?VariantID=" + this.sVariantKey;
			} else {
				this.sComplteAppUrlManage = sAppURL + "-manage" +  "?VariantID=" + this.sVariantKey + "&OrderCategory=" + oController.sOrderCategory;
			}

			//Count Tiles with the same AppURL (need to check if the bookmark is new or exists and will be overwritten)
			oService.countBookmarks(this.sComplteAppUrlManage)
			.fail()
			.done(function (iCount) {
				if(bAddBookmarkManage){
					if (iCount === 0) {
						bBookmarkSaved = true;
						var subtitle = i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("MANAGE");
							if(oController.ForecastDemandManageApp){
								subtitle = oController.ForecastDemandManageAppSubtitle;
							}
						// no bookmark present, add a new one
						oService.addBookmark({
							title : sVariantName,
							subtitle : subtitle,
							url : this.sComplteAppUrlManage,
							icon : sLPIconManage,
							numberUnit : sNumberUnit,
							serviceRefreshInterval : 10,
							serviceUrl : sServiceURL
						})
						.fail()
						.done(function () {
							sap.m.MessageToast.show(i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("VariantMessageBookmark", sVariantName));
						});
					}} else {
						//Delete Tile when it exists
						if (iCount > 0) {
							oService.deleteBookmarks(this.sComplteAppUrlManage)
							.fail()
							.done(function () {
								sap.m.MessageToast.show(i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("DeleteTeilConfirmation", sVariantName));
							}); 
						}
					}
			}.bind(this));
			
			if(!bBookmarkSaved){
				// Success Message for Save Variants
				sap.m.MessageToast.show(i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("VariantMessage", sVariantName));	
			}

			//Call the callback function
			if (fCallbackFunction) {
				fCallbackFunction(true, sVariantName);
			}
			
		},


		getVariantByName : function(fCallbackFunction, sContainerPrefix, sVariantName) {

			this.oPersonalizationService = {};
			var oPersonalizationContainerPromise = {};
			this.oPersonalizationContainer = {};
			this.oPersonalizationVariantSet = {};
			this.sVARIANTSET = "Variants";
			var sVariantSetDefaultVariant = "DefaultVariant";
			var sContainerName = "MRPCockpit." + sContainerPrefix;

			//Get the Personalization Service
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");

			// Get the specific Container for the App-Pairs x10 and x30
			oPersonalizationContainerPromise = this.oPersonalizationService.getPersonalizationContainer(sContainerName);
			oPersonalizationContainerPromise.fail(function() {
				//If an error occurs call the callback function with parameter false
				if (fCallbackFunction) {
					fCallbackFunction(false);
				}
			});

			oPersonalizationContainerPromise.done(function(oContainer) {
				this.oPersonalizationContainer = oContainer;
				//Get the Variant Set from the Container
				if (!(this.oPersonalizationContainer.containsVariantSet(this.sVARIANTSET))) {
					//Create VariantSet when it doesn't exists
					this.oPersonalizationContainer.addVariantSet(this.sVARIANTSET);
				};

				this.oPersonalizationVariantSet = this.oPersonalizationContainer.getVariantSet(this.sVARIANTSET);

				var oVariant = {};

				//Get the Variant Key for the Variant Name
				var sVariantKey = this.oPersonalizationVariantSet.getVariantKeyByName(sVariantName);
				if(sVariantKey){
					//Get the Variant Data from the Variant Set
					oVariant = this.oPersonalizationVariantSet.getVariant(sVariantKey);
					if (fCallbackFunction && oVariant) {
						//Get the saved VariantData for the item "Filter" (we saved all our Variant Data in this item)
						if(oVariant.getItemValue("Filter")){
							fCallbackFunction(true, JSON.parse(JSON.stringify(oVariant.getItemValue("Filter"))), oVariant.getVariantName(), sVariantName);
						} else {
							fCallbackFunction(false);
						}
						
					}
				} else {
					
					if(this.oPersonalizationContainer.containsVariantSet(sVariantSetDefaultVariant)){
						var oPersonalizationDefaultVariantSet = this.oPersonalizationContainer.getVariantSet(sVariantSetDefaultVariant);
						sVariantKey = oPersonalizationDefaultVariantSet.getVariantKeyByName(sVariantName);
						oVariant = oPersonalizationDefaultVariantSet.getVariant(sVariantKey);
						if (fCallbackFunction && oVariant) {
							//Get the saved VariantData for the item "Filter" (we saved all our Variant Data in this item)
							if(oVariant.getItemValue("Filter")){
								fCallbackFunction(true, JSON.parse(JSON.stringify(oVariant.getItemValue("Filter"))), oVariant.getVariantName(), sVariantName);
							} else {
								fCallbackFunction(false);
							}
							
					}else {
					
					if (fCallbackFunction) {
						fCallbackFunction(false);
					}
					}
				}
				}
			}.bind(this));
		},

		getVariantByID : function(fCallbackFunction, sContainerPrefix, sVariantID) {

			this.oPersonalizationService = {};
			var oPersonalizationContainerPromise = {};
			this.oPersonalizationContainer = {};
			this.oPersonalizationVariantSet = {};
			this.sVARIANTSET = "Variants";
			var sContainerName = "MRPCockpit." + sContainerPrefix;

			//Get the Personalization Service
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
			// Get the specific Container for the App-Pairs x10 and x30
			oPersonalizationContainerPromise = this.oPersonalizationService.getPersonalizationContainer(sContainerName);
			oPersonalizationContainerPromise.fail(function() {
				if (fCallbackFunction) {
					//If an error occurs call the callback function with parameter false
					fCallbackFunction(false);
				}
			});
			oPersonalizationContainerPromise.done(function(oContainer) {
				this.oPersonalizationContainer = oContainer;
				//Get the Variant Set from the Container
				if (!(this.oPersonalizationContainer.containsVariantSet(this.sVARIANTSET))) {
					//Create VariantSet when it doesn't exists
					this.oPersonalizationContainer.addVariantSet(this.sVARIANTSET);
				};
				this.oPersonalizationVariantSet = this.oPersonalizationContainer.getVariantSet(this.sVARIANTSET);
				// fill select control for variants

				var oVariant = {};


				var sVariantKey = sVariantID.toString();
				if(sVariantKey){
					//Get the Variant Data from the Variant Set
					oVariant = this.oPersonalizationVariantSet.getVariant(sVariantKey);
					if (fCallbackFunction && oVariant) {
						if(oVariant.getItemValue("Filter")){
							//Get the saved VariantData for the item "Filter" (we saved all our Variant Data in this item)
							fCallbackFunction(true, JSON.parse(JSON.stringify(oVariant.getItemValue("Filter"))), oVariant.getVariantName());
						}else {
							fCallbackFunction(false);
						}
					} else {
						fCallbackFunction(false);
					}
				} else {
					if (fCallbackFunction) {
						fCallbackFunction(false);
					}
				}
			}.bind(this));
		},


		getAllVariants : function(fCallbackFunction, sContainerPrefix) {

			this.oPersonalizationService = {};
			var oPersonalizationContainerPromise = {};
			this.oPersonalizationContainer = {};
			this.oPersonalizationVariantSet = {};
			this.sVARIANTSET = "Variants";
			var sVariantSetDefaultVariant = "DefaultVariant";
			var sContainerName = "MRPCockpit." + sContainerPrefix;

			//Get the Personalization Service
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
			// Get the specific Container for the App-Pairs x10 and x30
			oPersonalizationContainerPromise = this.oPersonalizationService.getPersonalizationContainer(sContainerName);
			oPersonalizationContainerPromise.fail(function() {
				if (fCallbackFunction) {
					//If an error occurs call the callback function with parameter false 
					fCallbackFunction(false);
				}
			});
			oPersonalizationContainerPromise.done(function(oContainer) {
				this.oPersonalizationContainer = oContainer;
				//Get the Variant Set from the Container
				if (!(this.oPersonalizationContainer.containsVariantSet(this.sVARIANTSET))) {
					//Create VariantSet when it doesn't exists
					this.oPersonalizationContainer.addVariantSet(this.sVARIANTSET);
				};
				this.oPersonalizationVariantSet = this.oPersonalizationContainer.getVariantSet(this.sVARIANTSET);

				//Get all Variant Names and Keys
				var sVariantNamesAndKey = this.oPersonalizationVariantSet.getVariantNamesAndKeys();
				if(sVariantNamesAndKey){

					//Store all Variant Names in an array
					var aVariantNames = [];
					for (var key in sVariantNamesAndKey) {
						if (sVariantNamesAndKey.hasOwnProperty(key)) {
							aVariantNames.push(key);
						}
					}
					if (fCallbackFunction) {
						
						var oPersonalizationDefaultVariantSet = this.oPersonalizationContainer.getVariantSet(sVariantSetDefaultVariant);

						//Get all Variant Names and Keys
						var sDefaultVariantNamesAndKey = oPersonalizationDefaultVariantSet.getVariantNamesAndKeys();
						if(sDefaultVariantNamesAndKey){

							//Call the callback function with the array of Variant Names
							var aSortedVariantNames = aVariantNames.sort(function(a,b) {
						    a = a.toLowerCase();
						    b = b.toLowerCase();
						    if( a == b) return 0;
						    if( a > b) return 1;
						    return -1;
						});
							for (var key in sDefaultVariantNamesAndKey) {
								if (sDefaultVariantNamesAndKey.hasOwnProperty(key)) {
									aSortedVariantNames.push(key);
								}
							}
							fCallbackFunction(true, aSortedVariantNames);
						}
						
					
					}
				} else {
					if (fCallbackFunction) {
						fCallbackFunction(false);
					}
				}

			}.bind(this));

		},

		onVariantDelete : function(fCallbackFunction, sContainerPrefix, sVariantName, sAppURL, sSuccessMessage, oController) {
			this.oPersonalizationService = {};
			var oPersonalizationContainerPromise = {};
			this.oPersonalizationContainer = {};
			this.oPersonalizationVariantSet = {};
			this.sVARIANTSET = "Variants";
			var sContainerName = "MRPCockpit." + sContainerPrefix;

			//Get the Personalization Service
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
			// Get the specific Container for the App-Pairs x10 and x30
			oPersonalizationContainerPromise = this.oPersonalizationService.getPersonalizationContainer(sContainerName);
			oPersonalizationContainerPromise.fail(function() {
				if (fCallbackFunction) {
					//If an error occurs call the callback function with parameter false 
					fCallbackFunction(false);
				}
			});
			oPersonalizationContainerPromise.done(function(oContainer) {
				this.oPersonalizationContainer = oContainer;

				if (!(this.oPersonalizationContainer.containsVariantSet(this.sVARIANTSET))) {
					//Create VariantSet when it doesn't exists
					this.oPersonalizationContainer.addVariantSet(this.sVARIANTSET);
				};
				//Get the Variant Set from the Container
				this.oPersonalizationVariantSet = this.oPersonalizationContainer.getVariantSet(this.sVARIANTSET);

				//Get the Variant Key for the Variant Name
				var sVariantKey = this.oPersonalizationVariantSet.getVariantKeyByName(sVariantName);
				if(sVariantKey) {
					//Delete the Variant from the Variant Set
					this.oPersonalizationVariantSet.delVariant(sVariantKey);

					//Save all changes in the PersonalizationContainer
					this.oPersonalizationContainer.save().fail(function() {
						if (fCallbackFunction) {
							fCallbackFunction(false);
						}
					}).done(function() {
						var bBookmarkDeleted = false;
						jQuery.sap.require("sap.m.MessageToast");

						//Get the Bookmark Service
						var oBookmarkService = sap.ushell.Container.getService("Bookmark");



						if(oBookmarkService){
							//Create the App URL 
							// TODO Test9
							//this.sTargetUrlMonitor = sAppURL + "-monitor" + "?VariantID=" + sVariantKey;
							// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
							if (oController.sOrderCategory === undefined){
							this.sTargetUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + sVariantKey;
							} else {
								this.sTargetUrlMonitor = sAppURL + "-monitor" +  "?VariantID=" + sVariantKey + "&OrderCategory=" + oController.sOrderCategory;
							}

							//Check if a Tile with the same App URL Exits - Monitor
							oBookmarkService.countBookmarks(this.sTargetUrlMonitor)
							.fail()
							.done(function (iCount) {
								//Delete Tile when it exists
								if (iCount > 0) {
									bBookmarkDeleted = true;
									oBookmarkService.deleteBookmarks(this.sTargetUrlMonitor)
									.fail()
									.done(function () {
										sap.m.MessageToast.show(i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("DeleteTeilConfirmation", sSuccessMessage));
									}); 
								}
							}.bind(this));

							//Create the App URL 
							//this.sTargetUrlManage = sAppURL + "-manage" + "?VariantID=" + sVariantKey;
							// TODO Test5
							// Currently two apps require this: Monitor Production Orders and Monitor Process Orders.
							if (oController.sOrderCategory === undefined){
								this.sTargetUrlManage = sAppURL + "-manage" + "?VariantID=" + sVariantKey;
							} else {
								this.sTargetUrlManage = sAppURL + "-manage" +  "?VariantID=" + sVariantKey + "&OrderCategory=" + oController.sOrderCategory;
							}

							//Check if a Tile with the same App URL Exits - Manage
							oBookmarkService.countBookmarks(this.sTargetUrlManage)
							.fail()
							.done(function (iCount) {
								//Delete Tile when it exists
								if (iCount > 0) {
									bBookmarkDeleted = true;
									oBookmarkService.deleteBookmarks(this.sTargetUrlManage)
									.fail()
									.done(function () {
										sap.m.MessageToast.show(i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("DeleteTeilConfirmation", sSuccessMessage));
									}); 
								}
							}.bind(this));

						}

						if(!bBookmarkDeleted){
							sap.m.MessageToast.show(i2d.pp.mrpcockpit.reuse.view.VariantHandler.i18NCommonReuseModel.getResourceBundle().getText("DeleteVariantConfirmation", sSuccessMessage));
						}

						if (fCallbackFunction) {
							fCallbackFunction(true);
						}

					}.bind(this));
				} else {
					if (fCallbackFunction) {
						fCallbackFunction(false);
					}
				}
			}.bind(this));
		},
		
		saveDefaultVariant : function(fCallbackFunction, sContainerPrefix, sVariantName, oVariantData) {

			this.oPersonalizationService = {};
			var oPersonalizationContainerPromise = {};
			this.oPersonalizationContainer = {};
			var oPersonalizationDefaultVariantSet = {};
			var sDefaultVariantSet = "DefaultVariant";
			var sContainerName = "MRPCockpit." + sContainerPrefix;
			var oNewVariantData = JSON.parse(JSON.stringify(oVariantData));

			//Get the Personalization Service
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
			// Get the specific Container for the App-Pairs x10 and x30
			oPersonalizationContainerPromise = this.oPersonalizationService.getPersonalizationContainer(sContainerName);
			oPersonalizationContainerPromise.fail(function() {
				if (fCallbackFunction) {
					//If an error occurs call the callback function with parameter false 
					fCallbackFunction(false);
				}
			});

			oPersonalizationContainerPromise.done(function(oContainer) {
				this.oPersonalizationContainer = oContainer;
				//Get the Variant Set from the Container
				if (this.oPersonalizationContainer.containsVariantSet(sDefaultVariantSet)) {
					//Delete VariantSet when it exists
					this.oPersonalizationContainer.delVariantSet(sDefaultVariantSet);
				};
				
				this.oPersonalizationContainer.addVariantSet(sDefaultVariantSet);
				
				oPersonalizationDefaultVariantSet = this.oPersonalizationContainer.getVariantSet(sDefaultVariantSet);
				var oVariant = {};
				
				//Get the Variant Key for the Variant Name
				var sDefaultVariantKey = oPersonalizationDefaultVariantSet.getVariantKeyByName(sVariantName);
				//If the Variant Key already exists get the Variant by key otherwise create a new Variant and add the Variant to the Variant Set
				if(sDefaultVariantKey){
					oVariant = oPersonalizationDefaultVariantSet.getVariant(sDefaultVariantKey);
				} else {
					oVariant = oPersonalizationDefaultVariantSet.addVariant(sVariantName);
				}

				if(oNewVariantData){
					//Save all Variant Data in the Item "Filter"
					oVariant.setItemValue("Filter", oNewVariantData);
				}

				//Save all changes in the PersonalizationContainer
				this.oPersonalizationContainer.save().fail(function() {
					if (fCallbackFunction) {
						fCallbackFunction(false);
					}
				}).done(function() {
					if (fCallbackFunction) {
					fCallbackFunction(true, sVariantName);
					}
					
				}.bind(this));

			}.bind(this));

		},

};

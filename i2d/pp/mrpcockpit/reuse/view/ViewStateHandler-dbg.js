/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.view.ViewStateHandler");

i2d.pp.mrpcockpit.reuse.view.ViewStateHandler = {

	i18NCommonReuseModel : new sap.ui.model.resource.ResourceModel({
		bundleUrl : jQuery.sap.getModulePath("i2d.pp.mrpcockpit.reuse") + "/" + "i18n/i18n.properties"
	}),

	// Method called by the apps to receive the View State
	getViewState : function(fCallbackFunction, sVariantContainerPrefix, oDefaultViewState, sVariantID, sVariantName,
			sTempViewStateID, nTimeViewState) {

		/*
		 * if(sVariantID !== "" && sVariantName == ""){
		 * i2d.pp.mrpcockpit.reuse.view.VariantHandler.getVariantByID(fCallbackFunction.bind(this), sVariantContainerPrefix,
		 * sVariantID); } else if(sVariantName !== "" && sVariantID == ""){
		 * i2d.pp.mrpcockpit.reuse.view.VariantHandler.getVariantByName(fCallbackFunction.bind(this),
		 * sVariantContainerPrefix, sVariantName); } else { fCallbackFunction(true, oDefaultViewState, ""); }
		 * 
		 */
		if (sVariantID !== "" && (sVariantName == "")) {
			this.getViewStateFromContainer(fCallbackFunction, sTempViewStateID, nTimeViewState, oDefaultViewState,
					sVariantContainerPrefix, sVariantID);
		} else if (sVariantName !== "" && (sVariantID == "")) {
			i2d.pp.mrpcockpit.reuse.view.VariantHandler.getVariantByName(fCallbackFunction.bind(this),
					sVariantContainerPrefix, sVariantName);
		} else {
			this.getViewStateFromContainer(fCallbackFunction, sTempViewStateID, nTimeViewState, oDefaultViewState);
		}

	},

	// Save the temp. View State in a Container 
	saveViewStateInContainer : function(fCallbackFunction, oViewState, sTempViewStateID, nTimeViewState, sVariantName) {
		if (!this.oPersonalizationService) {
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
		}
		if (this.oPersonalizationService.getContainer) {

			//Save the View State first temporary in the launchpad window page (automaticlly deleted after reload the launchpad, e.g. F5)
			this.oPersonalizationService.getContainer(sTempViewStateID, {
				validity : 0
			}).fail(function() {
				jQuery.sap.log.error("Loading personalization data failed.");
			}).done(function(oContainer) {
				oContainer.setItemValue("ViewState", oViewState);
				oContainer.save().done(function() {
					jQuery.sap.log.info("saveViewStateInContainer: oContainer.save");
					//If the time is > then 0 (0 is a fixed value for local saving) then save the data in the backend
					//nTimeViewState is the time in min the data should stored in the backend
					if (nTimeViewState > 0) {
						this.oPersonalizationService.getContainer(sTempViewStateID, {
							validity : nTimeViewState
						}).fail(function() {
							jQuery.sap.log.error("Loading personalization data failed.");
						}).done(function(oContainer) {
							jQuery.sap.log.info("saveViewStateInContainer: this.oPersonalizationService.getContainer");
							oContainer.setItemValue("ViewState", oViewState);
							oContainer.save().done(function() {
								jQuery.sap.log.info("saveViewStateInContainer: oContainer.save");
								if (fCallbackFunction) {
									fCallbackFunction(true);
								}
							});
						}.bind(this));
					} else {
						if (fCallbackFunction) {
							fCallbackFunction(true);
						}
					}
				}.bind(this));
			}.bind(this));

		}
	},
	
	//Delete a ViewState
	deleteViewStateInContainer : function(fCallbackFunction, sTempViewStateID, nTimeViewState) {
		if (!this.oPersonalizationService) {
			this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
		}
		if (this.oPersonalizationService.getContainer) {

			//First delete the ViewState on the local launchpad window page
			this.oPersonalizationService.getContainer(sTempViewStateID, {
				validity : 0
			}).fail(function() {
				jQuery.sap.log.error("Loading personalization data failed.");
			}).done(function(oContainer) {
				oContainer.delItem("ViewState");
				oContainer.save().done(function() {
					//Delete the ViewState on the backend if the time is > 0
					if (nTimeViewState > 0) {
						this.oPersonalizationService.getContainer(sTempViewStateID, {
							validity : nTimeViewState
						}).fail(function() {
							jQuery.sap.log.error("Loading personalization data failed.");
						}).done(function(oContainer) {
							oContainer.delItem("ViewState");
							oContainer.save().done(function() {
								if (fCallbackFunction) {
									fCallbackFunction(true);
								}
							});
						}.bind(this));
					} else {
						if (fCallbackFunction) {
							fCallbackFunction(true);
						}
					}
				}.bind(this));
			}.bind(this));
		}
	},

	//Read the ViewState locally or from the backend
	getViewStateFromContainer : function(fCallbackFunction, sTempViewStateID, nTimeViewState, oDefaultViewState,
			sVariantContainerPrefix, sVariantID) {
		if (!this.oPersonalizationService) {
			this.oPersonalizationService = sap.ushell.Container.getService('Personalization');
		}
		if (this.oPersonalizationService.getContainer) {
			//First try to read the ViewState local from the launchpad window page
			this.oPersonalizationService.getContainer(sTempViewStateID, {
				validity : 0
			}).done(
					function(oContainer) {
						var oState = oContainer.getItemValue("ViewState");
						var sVariantName = "";
						if (fCallbackFunction) {
							//Call the callback function if we found a local ViewState
							if (oState) {
								if (oState.VariantName) {
									sVariantName = oState.VariantName;
								}
								// oContainer.delItem("ViewState");
								// oContainer.save();
								fCallbackFunction(true, oState, sVariantName);
							} else {
								//Read the ViewState from the backend if we doesn't found it locally
								this.oPersonalizationService.getContainer(sTempViewStateID, {
									validity : nTimeViewState
								}).done(
										function(oContainer) {
											var oState = oContainer.getItemValue("ViewState");
											var sVariantName = "";
											if (fCallbackFunction) {
												if (oState) {
													if (oState.VariantName) {
														sVariantName = oState.VariantName;
													}
													// oContainer.delItem("ViewState");
													// oContainer.save();
													fCallbackFunction(true, oState, sVariantName);
												} else {
													if (sVariantID) {
														//If we found no ViewState and we have a variantID then get the ViewState from the variant
														i2d.pp.mrpcockpit.reuse.view.VariantHandler.getVariantByID(fCallbackFunction.bind(this),
																sVariantContainerPrefix, sVariantID);
													} else {
														//If we haven't found a ViewState then we give the default ViewState back
														fCallbackFunction(true, oDefaultViewState, "");
													}
												}
											}
										}.bind(this)).fail(function() {
									if (fCallbackFunction) {
										fCallbackFunction(true, oDefaultViewState, "");
									}
								}.bind(this));
							}
						}

					}.bind(this)).fail(function() {
				if (fCallbackFunction) {
				//If we haven't found a ViewState then we give the default ViewState back
					fCallbackFunction(true, oDefaultViewState, "");
				}
			}.bind(this));
		} else {
			if (sVariantID) {
				i2d.pp.mrpcockpit.reuse.view.VariantHandler.getVariantByID(fCallbackFunction.bind(this),
						sVariantContainerPrefix, sVariantID);
			} else {
			//If we haven't found a ViewState then we give the default ViewState back
				fCallbackFunction(true, oDefaultViewState, "");
			}
		}

	}

};

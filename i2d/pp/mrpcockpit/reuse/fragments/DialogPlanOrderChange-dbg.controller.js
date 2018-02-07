/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CollaborationHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.fragments.DialogRoot");
jQuery.sap.require("sap.ca.ui.utils.busydialog");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.model.type.Number");
jQuery.sap.require("sap.ca.ui.model.format.QuantityFormat");

i2d.pp.mrpcockpit.reuse.fragments.DialogRoot.extend("i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange", {

	/**
	 * This method overwrites the base class implementation. It initializes the texts and labels for the dialog. At the
	 * end the binding is updated.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange
	 */
	_initializeDialog : function() {
		// The radio buttons are bound to following variables. Default is: Change Requisition
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogActivity", this.Constants.SolutionDialogActivity_EXECUTE);
		oModel.setProperty("/DialogConfigSourceDefined", true);
		oModel.setProperty("/DialogConfigCtrlOptionConvToProdOrd", true);
		oModel.setProperty("/DialogConfigCtrlOptionConvToProcOrd", true);	
		oModel.setProperty("/DialogConfigCtrlOptionConvToReq", true);	
		
		// Set the title based on the given 'Solution Type'
		switch (oModel.getProperty("/MaterialShortageSolutionType")) {
			case this.Constants.SOLUTIONTYPE_PA_STOCK_CHANGE :	
			case this.Constants.SOLUTIONTYPE_PA_VENDOR_CHANGE :
			case this.Constants.SOLUTIONTYPE_PA_UNSRC_CHANGE :
			case this.Constants.SOLUTIONTYPE_PA_PLANT_CHANGE :
			case this.Constants.SOLUTIONTYPE_PA_REPLANT_CHANGE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_PA_CHANGE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_PA_CHANGE;
				break;				
			case this.Constants.SOLUTIONTYPE_PA_PROD_CHANGE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_PA_CHANGE_TITLE", [			                                                                                   
				    oModel.getProperty("/PlannedOrder"), oModel.getProperty("/PlannedOrder")]));
				this.dialogAction = this.Constants.SolutionDialogAction_PA_CHANGE;
				break;						
		}
	},

	/**
	 * This method overwrites the base class implementation. This method is the handler for the button "OK"
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange
	 */
	onOk : function(evt) {
		var oData = this.oDialog.getModel().getData();
		// Check if the screen data is valid (may be changed by the user)
		if (!this._isScreenDataValid()) {
			if (!this.bDateValid) {
				// if date format is not valid
				if(this.bInvalidDateFormat){
					return;
				}
				sap.ca.ui.message.showMessageBox({
					type : sap.ca.ui.message.Type.ERROR,
					message : this.Common_i18n.getText("SOLUTION_DIALOG_MSG_WRONG_DATE")
				});
			} else {
				sap.ca.ui.message.showMessageBox({
					type : sap.ca.ui.message.Type.ERROR,
					message : this.Common_i18n.getText("SOLUTION_DIALOG_MSG_WRONG_QUANTITY_NUMBER")
				});
			}
			// Stay on the dialog and abort processing
			return;
		}
		// Close the dialog
		this.oDialog.close();
		// Show the busy dialog with 'saving...'
		sap.ca.ui.utils.busydialog.requireBusyDialog({
			text : this.Common_i18n.getText("SOLUTION_DIALOG_MSG_SAVE_WAITING")
		});

				// The user has selected an 'activity' using the radio buttons.
				// Based on this selection we trigger the change of the PA and/or the
				// conversion to a different order type
				var sErrorDetails = "";
				switch (oData.DialogActivity) {
					case this.Constants.SolutionDialogActivity_EXECUTE :
						if ((oData.OrderFinishDate === oData.ChangedOrderFinishDate) && 
								(oData.MRPElementOriginalTotalQty === oData.MRPElementChangedTotalQuantity)) {
							// message "No changes made - no update"
							 sErrorDetails = this.Common_i18n.getText("SOLUTION_NO_CHANGES_MADE");
						} else {
							// Change the PA in batch processing and trigger the conversion if necessary
							sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.updatePlannedOrderBatch(oData,
									this._oHandlerOrder);					
						}
						break;						
					case this.Constants.SolutionDialogActivity_PROC_CONVERT :
					case this.Constants.SolutionDialogActivity_PROD_CONVERT :
					case this.Constants.SolutionDialogActivity_REQ_CONVERT :
					// Change the PA in batch processing and trigger the conversion if necessary
						sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.updatePlannedOrderBatch(oData,
								this._oHandlerOrder);					
						break;
			default :
				jQuery.sap.log.error("Dialog action " + this.dialogAction + " is unknown.");
		}

		// Error handling in case the batch has not been submitted at all.
		// Could happen if a precondition was not fulfilled.
		if (sErrorDetails) {
			sap.ca.ui.utils.busydialog.releaseBusyDialog();
			sap.ca.ui.message.showMessageBox({
				type : sap.ca.ui.message.Type.ERROR,
				message : this.Common_i18n.getText("SOLUTION_DIALOG_" + this.dialogAction + "_MSG_ERROR"),
				details : this.Common_i18n.getText(sErrorDetails)
			});
		} else {
			// Inform the listeners that the OData Request has been sent successfully
			this._fireEventODataSent();
		}

		// Destroy the dialog
		this.oDialog.destroy();
	},

	/**
	 * Event handler is called if the user select the first radio button "Change Order Now". It sets the activity internally and
	 * updates the UI.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange
	 */
	_onSelectRadioButton1 : function(oEvent) {
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogActivity", this.Constants.SolutionDialogActivity_EXECUTE);
	},

	/**
	 * Event handler is called if the user select the second radio button "Convert to Production Order". It sets the activity internally
	 * and updates the UI.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange
	 */
	_onSelectRadioButton2 : function(oEvent) {
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogActivity", this.Constants.SolutionDialogActivity_PROD_CONVERT);
	},

	/**
	 * Event handler is called if the user select the third radio button "Convert to Process Order". It sets the activity
	 * internally and updates the UI.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange
	 */
	_onSelectRadioButton3 : function(oEvent) {
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogActivity", this.Constants.SolutionDialogActivity_PROC_CONVERT);
	},

	/**
	 * Event handler is called if the user select the third radio button "Convert to Requisition". It sets the activity
	 * internally and updates the UI.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange
	 */
	_onSelectRadioButton4 : function(oEvent) {
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogActivity", this.Constants.SolutionDialogActivity_REQ_CONVERT);
	}

});

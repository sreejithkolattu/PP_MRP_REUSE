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

i2d.pp.mrpcockpit.reuse.fragments.DialogRoot.extend("i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange", {

	/**
	 * This method overwrites the base class implementation. It initializes the texts and labels for the dialog. At the
	 * end the binding is updated.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange
	 */
	_initializeDialog : function() {
		// Initialize the Radio buttons with "Pending"
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogActivity", this.Constants.SolutionDialogActivity_EXECUTE);
		oModel.setProperty("/DialogRequestActive", this.Constants.REQUEST_ACTIVE);
		if (this.oDialog.getModel('ServiceVersions').getData().iServiceSchemaVersion < 3) {
			oModel.setProperty("/DialogRequestActive", this.Constants.REQUEST_INACTIVE);
		}

		// Set the title based on the given 'Solution Type'
		switch (oModel.getProperty("/MaterialShortageSolutionType")) {
			case this.Constants.SOLUTIONTYPE_PO_RESCHEDULE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_PO_RESCHEDULE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_PO_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_PO_INCREASE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_PO_INCREASE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_PO_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_PO_CHANGE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_PO_CHANGE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_PO_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_TO_RESCHEDULE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_TO_RESCHEDULE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_TO_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_TO_INCREASE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_TO_INCREASE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_TO_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_TO_CHANGE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_TO_CHANGE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_TO_CHANGE;
				break;
		}
	},

	/**
	 * This method overwrites the base class implementation. This method is the handler for the button "OK"
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange
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
		// Show the busy dialog
		sap.ca.ui.utils.busydialog.requireBusyDialog({
			text : this.Common_i18n.getText("SOLUTION_DIALOG_MSG_SAVE_WAITING")
		});

		// Check if the given PO already has an active, existing CR
		var bChangeRequestExists = false;
		switch (oData.SolutionRequestStatus) {
			case this.Constants.REQUEST_STATUS_REQUESTED :
			case this.Constants.REQUEST_STATUS_ANSWERED :
				bChangeRequestExists = true; // Don't create but update the existing request
				break;
			default :
				bChangeRequestExists = false; // Create a change request
		}

		// The user has selected an 'activity' using the radio buttons.
		// Based on this selection we trigger the change of the PO/TO and/or the
		// creation of the change request
		var sErrorDetails = "";
		switch (oData.DialogActivity) {
			case this.Constants.SolutionDialogActivity_EXECUTE :
				// Change the PO/TO directly. Don't create any CR.
				// Decide whether to update a (possibly existing) Change Request or not.
				oData.SolutionRequestStatus = this.Constants.REQUEST_STATUS_APPLIED;
				sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.updatePurchaseOrderBatch(oData,
						this._oHandlerOrder, bChangeRequestExists, "x30");
				break;
			case this.Constants.SolutionDialogActivity_CR_REQUEST :
				// Create/Update a CR in status 'Requested'
				oData.SolutionRequestStatus = this.Constants.REQUEST_STATUS_REQUESTED;
				if (bChangeRequestExists === false) {
					sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.createRequestBatch(oData, this._oHandlerCR);
				} else {
					sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.updateRequestBatch(oData, this._oHandlerCR,
							"x30");
				}
				break;
			case this.Constants.SolutionDialogActivity_CR_COLLECT :
				// Create/Update a CR in status 'Collected'
				oData.SolutionRequestStatus = this.Constants.REQUEST_STATUS_COLLECTED;
				if (bChangeRequestExists === false) {
					sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.createRequestBatch(oData, this._oHandlerCR);
				} else {
					sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.updateRequestBatch(oData, this._oHandlerCR,
							"x30");
				}
				break;
			default :
				jQuery.sap.log.error("Dialog activity " + oData.DialogActivity + " is unknown.");
		}

		// Error handling in case the batch has not been submitted at all.
		// Could happen if a precondition was not fulfilled.
		if (sErrorDetails) {
			var sMsg = "";
			sap.ca.ui.utils.busydialog.releaseBusyDialog();
			if (oData.DialogActivity === this.Constants.SolutionDialogActivity_EXECUTE) {
				// Direct update/execution has failed
				sMsg = this.Common_i18n.getText("SOLUTION_DIALOG_" + this.dialogAction + "_MSG_ERROR");
			} else {
				// Creation of change request has failed
				sMsg = this.Common_i18n.getText("SOLUTION_DIALOG_MSG_REQUEST_SAVE_FAILED", [oData.MRPElementExternalID,
						oData.MRPElementItemExternalID]);
			}
			sap.ca.ui.message.showMessageBox({
				type : sap.ca.ui.message.Type.ERROR,
				message : sMsg,
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
	 * Event handler is called if the user select the first radio button "Change Now". It sets the activity internally and
	 * updates the UI.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange
	 */
	_onSelectRadioButton1 : function(oEvent) {
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogActivity", this.Constants.SolutionDialogActivity_EXECUTE);
	},

	/**
	 * Event handler is called if the user select the second radio button "Request Later". It sets the activity internally
	 * and updates the UI.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange
	 */
	_onSelectRadioButton2 : function(oEvent) {
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogActivity", this.Constants.SolutionDialogActivity_CR_COLLECT);
	},

	/**
	 * Event handler is called if the user select the third radio button "Log Requested Change". It sets the activity
	 * internally and updates the UI.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange
	 */
	_onSelectRadioButton3 : function(oEvent) {
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogActivity", this.Constants.SolutionDialogActivity_CR_REQUEST);
	}

});

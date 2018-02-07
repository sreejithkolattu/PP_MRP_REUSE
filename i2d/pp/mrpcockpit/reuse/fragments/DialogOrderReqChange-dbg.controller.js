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

i2d.pp.mrpcockpit.reuse.fragments.DialogRoot.extend("i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange", {

	/**
	 * This method overwrites the base class implementation. It initializes the texts and labels for the dialog. At the
	 * end the binding is updated.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange
	 */
	_initializeDialog : function() {
		// The radio buttons are bound to following variables. Default is: Change Requisition
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/DialogConfigSourceDefined", true);
		oModel.setProperty("/DialogConfigCtrlOptionConvToOrd", false);
		oModel.setProperty("/DialogConfigCtrlOptionChangeReq", true);

		// Set the title based on the given 'Solution Type'
		switch (oModel.getProperty("/MaterialShortageSolutionType")) {
			case this.Constants.SOLUTIONTYPE_PR_RESCHEDULE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_PR_RESCHEDULE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_PR_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_PR_INCREASE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_PR_INCREASE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_PR_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_PR_CHANGE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_PR_CHANGE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_PR_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_TOR_RESCHEDULE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_TOR_RESCHEDULE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_TOR_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_TOR_INCREASE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_TOR_INCREASE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_TOR_CHANGE;
				break;
			case this.Constants.SOLUTIONTYPE_TOR_CHANGE :
				this.oDialog.setTitle(this.Common_i18n.getText("SOLUTION_DIALOG_TOR_CHANGE_TITLE", [
						oModel.getProperty("/MRPElementExternalID"), oModel.getProperty("/MRPElementItemExternalID")]));
				this.dialogAction = this.Constants.SolutionDialogAction_TOR_CHANGE;
				break;
		}

		// Disable "convert to order" action if no source is defined
		if (this.dialogAction === this.Constants.SolutionDialogAction_PR_CHANGE && !oModel.getProperty("/Vendor")) {
			// Disable "convert to order"
			oModel.setProperty("/DialogConfigSourceDefined", false);

		} else if (this.dialogAction === this.Constants.SolutionDialogAction_TOR_CHANGE
				&& !oModel.getProperty("/SupplyingPlant")) {
			// Disable "convert to order"
			oModel.setProperty("/DialogConfigSourceDefined", false);
		}
	},

	/**
	 * This method overwrites the base class implementation. This method is the handler for the button "OK"
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange
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

		// The user has selected an 'option' using the radio button.
		// Based on this selection we either trigger the update of the element or trigger
		// its conversion from a requisition to an order.
		var sErrorDetails = "";
		switch (this.dialogAction) {
			case this.Constants.SolutionDialogAction_PR_CHANGE :
			case this.Constants.SolutionDialogAction_TOR_CHANGE :
				// Create the PO/TO and the CR in batch processing
				sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.updatePurchaseRequisitionBatch(oData,
						this._oHandlerOrder);
				break;
			case this.Constants.SolutionDialogAction_PR_CONVERT :
				// Convert the Purchase Requisition and the CR in batch processing
				sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.convertPurchaseRequisitionBatch(oData,
						this._oHandlerOrder);
				// new purchase order created due to change requisition to order
				oData.MaterialShortageSolutionType = this.Constants.SOLUTIONTYPE_PO_CREATE;
				break;
			case this.Constants.SolutionDialogAction_TOR_CONVERT :
				// Convert the Transfer Requisition and the CR in batch processing
				sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.convertPurchaseRequisitionBatch(oData,
						this._oHandlerOrder);
				// new transfer order created due to change requisition to order
				oData.MaterialShortageSolutionType = this.Constants.SOLUTIONTYPE_TO_CREATE;
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
	 * This method is the handler for the radio button. It sets new dialogAction for the correct message text
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange
	 */
	onSelectOptionChangeReq : function(evt) {
		var oModel = evt.getSource().getParent().getModel();
		// Get the solution type
		var sMaterialShortageSolutionType = oModel.getProperty("/MaterialShortageSolutionType");
		// Set the dialog action based on the given solution type
		switch (sMaterialShortageSolutionType) {
			case this.Constants.SOLUTIONTYPE_PR_RESCHEDULE :
			case this.Constants.SOLUTIONTYPE_PR_INCREASE :
			case this.Constants.SOLUTIONTYPE_PR_CHANGE :
				if (evt.getParameter("selected")) {
					this.dialogAction = this.Constants.SolutionDialogAction_PR_CHANGE;
				} else {
					this.dialogAction = this.Constants.SolutionDialogAction_PR_CONVERT;
				}
				break;
			case this.Constants.SOLUTIONTYPE_TOR_RESCHEDULE :
			case this.Constants.SOLUTIONTYPE_TOR_INCREASE :
			case this.Constants.SOLUTIONTYPE_TOR_CHANGE :
				if (evt.getParameter("selected")) {
					this.dialogAction = this.Constants.SolutionDialogAction_TOR_CHANGE;
				} else {
					this.dialogAction = this.Constants.SolutionDialogAction_TOR_CONVERT;
				}
				break;
		}
	}

});

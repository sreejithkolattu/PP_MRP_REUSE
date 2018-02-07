/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CollaborationHelper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.fragments.DialogRoot");
jQuery.sap.require("sap.ca.ui.utils.busydialog");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.model.format.QuantityFormat");

i2d.pp.mrpcockpit.reuse.fragments.DialogRoot.extend("i2d.pp.mrpcockpit.reuse.fragments.DialogShortageAccept", {

	/**
	 * This method overwrites the base class implementation. It initializes the texts and labels for the dialog. At the
	 * end the binding is updated.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange
	 */
	_initializeDialog : function() {
		// Set the dialog action for 'accept shortage'
		this.dialogAction = this.Constants.SolutionDialogAction_ACCEPT;
	},

	/**
	 * This method overwrites the base class implementation. This method is the handler for the button "OK"
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.fragments.DialogShortageAccept
	 */
	onOk : function(evt) {
		var oData = this.oDialog.getModel().getData();
		// Close the dialog
		this.oDialog.close();
		// Show the busy dialog with 'saving...'
		sap.ca.ui.utils.busydialog.requireBusyDialog({
			text : this.Common_i18n.getText("SOLUTION_DIALOG_MSG_SAVE_WAITING")
		});

		// Write Shortage Accept
		var sErrorDetails = "";
		sErrorDetails = i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.createShortageAcceptBatch(oData,
				this._oHandlerOrder);

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
	}

});

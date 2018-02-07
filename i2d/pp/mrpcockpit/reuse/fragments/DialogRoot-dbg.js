/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Helper");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");
jQuery.sap.require("sap.ca.ui.utils.busydialog");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.model.type.Number");
jQuery.sap.require("sap.ca.ui.model.format.QuantityFormat");
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
// new
jQuery.sap.require("sap.ui.core.format.NumberFormat");
jQuery.sap.require("sap.ui.core.Configuration");

sap.ca.scfld.md.controller.BaseDetailController.extend("i2d.pp.mrpcockpit.reuse.fragments.DialogRoot", {

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to
	 * modify the View before it is displayed, to bind event handlers and do other one-time initialization
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	beforeOpen : function(oControlEvent) {
		// 'Dialog Action' is used as a variable for messages because the dialog is used in various contexts
		this.dialogAction = "";
		// Extract the dialog out of the event
		this.oDialog = oControlEvent.getSource();
		// Shortcut to the MRP constants
		this.Common_i18n = this.oDialog.getModel('Common_i18n').getResourceBundle();
		this.Constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;

		// We assume that the pre-calculated values (from the backend) are correct
		this.bDateValid = true;
		this.bAmountValid = true;

		// The control <Input> uses numbers - so convert the string
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/MRPElementOriginalTotalQty", Number(oModel.getProperty("/MRPElementOriginalTotalQty")));
		oModel.setProperty("/MRPElementChangedTotalQuantity", Number(oModel.getProperty("/MRPElementChangedTotalQuantity")));
		oModel.setProperty("/OrderedChangedQuantity", Number(oModel.getProperty("/OrderedChangedQuantity")));

		// Initialize the handlers for OData Calls and store them as members
		var oHandlerOrder = {};
		oHandlerOrder.fnSuccess = function(oData, oResponse, aErrorResponses) {
			this._onOdataOrderSuccess(oData, oResponse, aErrorResponses);
		}.bind(this);
		oHandlerOrder.fnError = function(oError) {
			this._onOdataOrderError(oError);
		}.bind(this);

		var oHandlerCR = {};
		oHandlerCR.fnSuccess = function(oData, oResponse, aErrorResponses) {
			this._onOdataCRSuccess(oData, oResponse, aErrorResponses);
		}.bind(this);
		oHandlerCR.fnError = function(oError) {
			this._onOdataCRError(oError);
		}.bind(this);

		this._oHandlerOrder = oHandlerOrder;
		this._oHandlerCR = oHandlerCR;

		// Initialize the dialog - implemented in the subclasses
		this._initializeDialog();
	},

	/**
	 * This method is used to initialize the dialogs to the specific needs. It is intended to be overwritten in the sub
	 * classes.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_initializeDialog : function() {

	},

	/**
	 * This method is the handler for a successful OData Write. It determines the view model and adds a success message.
	 * Then it throws an event for the solution view in order to update all clients.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_fireEventODataSuccess : function(messageText, responseModel) {
		// Put the message to the model
		var oModel = this.oDialog.getModel();
		oModel.setProperty("/msg", messageText);
		// Fire Event to inform the controller(s) about the
		// successful ODataCall with the new data
		var bus = sap.ui.getCore().getEventBus();
		bus.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_OK, {
			model : {
				cardModel : oModel,
				responseModel : responseModel
			}
		});
	},

	/**
	 * This method is the handler that is executed if the OData-Call (Change the PO/TO) has been successful. A positive
	 * response may also contain error messages - therefore this is checked as well. If everything worked fine, an event
	 * is triggered in order to inform S4 about the changes.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_onOdataOrderSuccess : function(oData, oResponse, aErrorResponses) {
		// We have to track the error responses!
		sap.ca.ui.utils.busydialog.releaseBusyDialog();
		// Check if errors have occurred within the batch update
		if (aErrorResponses.length > 0) {
			// Extract the error message out of the response object
			var sErrorText = i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromBatchResponse(this.Common_i18n,
					aErrorResponses);
			// Show the error message in a message box
			sap.ca.ui.message.showMessageBox({
				type : sap.ca.ui.message.Type.ERROR,
				message : this.Common_i18n.getText("SOLUTION_DIALOG_" + this.dialogAction + "_MSG_ERROR"),
				details : sErrorText
			});
			// Inform the listeners that OData returned an error
			this._fireEventODataError();
		} else {
			// The response object indicates a success status. So publish a success event to the listeners
			this._fireEventODataSuccess(this.Common_i18n.getText("SOLUTION_DIALOG_" + this.dialogAction + "_MSG_SUCCESS"),
					oData);
		}
	},

	/**
	 * This method is the handler that is executed if the OData-Call (Change the PO/TO) has failed. The error is extracted
	 * and displayed in a error message. This message contains a static header text. The details of the message contain
	 * the text retrieved from the backend.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_onOdataOrderError : function(oError) {
		var sErrorText = "";
		sap.ca.ui.utils.busydialog.releaseBusyDialog();
		// Check if/Ensure the response object contains a body
		if (oError && oError.response && oError.response.body) {
			// Extract the error message out of the response object
			sErrorText = i2d.pp.mrpcockpit.reuse.util.Helper
					.extractErrorMsgFromStream(this.Common_i18n, oError.response.body);
		} else {
			// Use a default for an unknown error
			sErrorText = this.Common_i18n.getText("SOLUTION_DIALOG_ERROR_UNKNOWN");
		}
		// Show the error message in a message box
		sap.ca.ui.message.showMessageBox({
			type : sap.ca.ui.message.Type.ERROR,
			message : this.Common_i18n.getText("SOLUTION_DIALOG_" + this.dialogAction + "_MSG_ERROR"),
			details : sErrorText
		});
		// Inform the listeners that OData returned an error
		this._fireEventODataError();
	},

	/**
	 * This method is the handler that is executed if the OData-Call (Create Change Request) has been successful. A
	 * positive response may also contain error messages - therefore this is checked as well. If everything worked fine,
	 * an event is triggered in order to inform S4 about the changes.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_onOdataCRSuccess : function(oData, oResponse, aErrorResponses) {
		// We have to track the error responses!
		sap.ca.ui.utils.busydialog.releaseBusyDialog();
		// Get the model of the Dialog
		var oDialogModel = this.oDialog.getModel().getData();
		// Check if errors have occurred within the batch update
		if (aErrorResponses.length > 0) {
			// Extract the error message out of the response object
			var sErrorText = i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromBatchResponse(this.Common_i18n,
					aErrorResponses);
			// Show the error message in a message box
			sap.ca.ui.message.showMessageBox({
				type : sap.ca.ui.message.Type.ERROR,
				message : this.Common_i18n.getText("SOLUTION_DIALOG_MSG_REQUEST_SAVE_FAILED", [
						oDialogModel.MRPElementExternalID, oDialogModel.MRPElementItemExternalID]),
				details : sErrorText
			});
			// Inform the listeners that OData returned an error
			this._fireEventODataError();
		} else {
			// The response object indicates a success status. So publish a success event to the listeners
			var sRequestSavedText = this.Common_i18n.getText("SOLUTION_DIALOG_MSG_REQUEST_SAVED", [
					oDialogModel.MRPElementExternalID, oDialogModel.MRPElementItemExternalID]);
			this._fireEventODataSuccess(sRequestSavedText, oData);
		}
	},

	/**
	 * This method is the handler that is executed if the OData-Call (Create Change Request) has failed. The error is
	 * extracted and displayed in a error message. This message contains a static header text. The details of the message
	 * contain the text retrieved from the backend.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_onOdataCRError : function(oError) {
		var sErrorText = "";
		sap.ca.ui.utils.busydialog.releaseBusyDialog();
		// Get the model of the Dialog
		var oDialogModel = this.oDialog.getModel().getData();
		// Check if/Ensure the response object contains a body
		if (oError && oError.response && oError.response.body) {
			// Extract the error message out of the response object
			sErrorText = i2d.pp.mrpcockpit.reuse.util.Helper
					.extractErrorMsgFromStream(this.Common_i18n, oError.response.body);
		} else {
			// Use a default for an unknown error
			sErrorText = this.Common_i18n.getText("SOLUTION_DIALOG_ERROR_UNKNOWN");
		}
		// Show the error message in a message box
		sap.ca.ui.message.showMessageBox({
			type : sap.ca.ui.message.Type.ERROR,
			message : this.Common_i18n.getText("SOLUTION_DIALOG_MSG_REQUEST_SAVE_FAILED", [oDialogModel.MRPElementExternalID,
					oDialogModel.MRPElementItemExternalID]),
			details : sErrorText
		});
		// Inform the listeners that OData returned an error
		this._fireEventODataError();
	},

	/**
	 * This method is the handler for the button "OK". It is intended to be overwritten in the sub classes.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	onOk : function(evt) {

	},

	/**
	 * This method is the handler for the button "Cancel" Just closes and destroys the dialog.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	onCancel : function(evt) {
		evt.getSource().getParent().close();
		this.oDialog.close();
		this.oDialog.destroy();
		this._fireEventDialogCancel();
	},

	/**
	 * Event handler for the Date Picker control that is called as soon as the user leaves the date picker control. The
	 * event itself has a parameter 'invalidValue' that indicates whether the control has a valid value.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_onChangeDatePicker : function(oEvent) {
	// check valid input format
		if(!oEvent.getParameter("valid")){
			this._setStatusDate(false, oEvent.getSource(), true);
			return;
		}
		// Get the date of the date picker control
		var dPicker = oEvent.getSource().getDateValue();
		// Get the current date and initialize with 00:00 in order to be comparable with the picker value
		var dToday = new Date();
		dToday.setHours(0, 0, 0, 0);
		if (dPicker < dToday) {
			// Date in the past is not valid
			this._setStatusDate(false, oEvent.getSource());
		} else {
			// Date is valid
			this._setStatusDate(true, oEvent.getSource());
		}
	},

	/**
	 * "Live" Eventhandler for the Amount Input control that is called after each character/number the user types into the
	 * control. The event itself just has the parameter 'newValue'. So we have to check its value within that handler and
	 * set the correct UI status.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_onLiveChangeInput : function(oEvent) {
		var sQuantity = oEvent.getParameter("newValue");
		var oCurrentLocale = sap.ui.getCore().getConfiguration().getLocale();
		var oNrFormatter = sap.ui.core.format.NumberFormat.getInstance({
			style : "full"
		}, oCurrentLocale);

		// get the current separators dependent on the current language
		var decimalSeparator = oNrFormatter.oFormatOptions.decimalSeparator;
		var groupingSeparator = oNrFormatter.oFormatOptions.groupingSeparator;

		// get the positions of the separators
		var positionGroupingSeparator = sQuantity.indexOf(groupingSeparator);
		var positionDecimalSeparator = sQuantity.indexOf(decimalSeparator);
		var mDecimalSeparatorBrackets = "[" + decimalSeparator + "]";
		var regularExpressionDecSep = new RegExp(mDecimalSeparatorBrackets, 'g');

		var oModel = this.oDialog.getModel();

		// Check 1: Is decimal separator the last value
		// Check 2: Locate the position of grouping separator and decimal separator
		// Check 3: How often the decimal separator exist
		if ((sQuantity.charAt(sQuantity.length - 1) == decimalSeparator)
				&& (positionGroupingSeparator < positionDecimalSeparator)
				&& (sQuantity.charAt(sQuantity.match(regularExpressionDecSep).length) == 1)) {
			// Success
			this._setStatusAmount(true, oEvent.getSource());
		}

		else {
			// Check using internal function
			var iQuantity = oNrFormatter.parse(sQuantity);
			if (isNaN(iQuantity) || (iQuantity <= 0)) {
				// Error
				this._setStatusAmount(false, oEvent.getSource());
				oEvent.getSource().setValue(oEvent.getParameter("newValue"));
			}

			else {
				// Additional checks on values located after the decimal separator
				var indexOfDecSeparator = sQuantity.lastIndexOf(decimalSeparator);

				if (indexOfDecSeparator > 0) {
					var sliceData = sQuantity.slice(indexOfDecSeparator + 1);
					var lenghtOfSlicedData = sliceData.length;

					// before push reactivate the coding
					// compare current value with the allowed decimal places
					if (lenghtOfSlicedData <= oModel.getProperty("/TargetQuantityUnitDcmls")) {
						// Success
						this._setStatusAmount(true, oEvent.getSource());
					} else {
						// Error
						this._setStatusAmount(false, oEvent.getSource());
						oEvent.getSource().setValue(oEvent.getParameter("newValue"));
					}
				} else {
					// Success
					this._setStatusAmount(true, oEvent.getSource());
				}
			}
		}
	},

	/**
	 * This method sets the 'value state' (red box vs. info box around the input field) for the amount control and stores
	 * the information whether the date value is valid
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_setStatusAmount : function(bValid, oControl) {
		// Store the information 'valid' vs. 'not valid' at the controller
		this.bAmountValid = bValid;
		// Set the style of the control. Red box with message vs. green box
		if (bValid) {
			oControl.setValueState(sap.ui.core.ValueState.Info);
		} else {
			oControl.setValueState(sap.ui.core.ValueState.Error);
		}
	},

	/**
	 * This method sets the 'value state' (red box vs. info box around the input field) for the date control and stores
	 * the information whether the date value is valid
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_setStatusDate : function(bValid, oControl, bInvalidDateFormat) {
		// Store the information 'valid' vs. 'not valid' at the controller
		this.bDateValid = bValid;
		this.bInvalidDateFormat = bInvalidDateFormat;
		// Set the style of the control. Red box vs. green box
		if (bValid) {
			oControl.setValueState(sap.ui.core.ValueState.Info);
		} else {
			oControl.setValueState(sap.ui.core.ValueState.Error);
		}
	},

	/**
	 * This method checks if the screen data is valid
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_isScreenDataValid : function() {
		return (this.bDateValid && this.bAmountValid);
	},

	/**
	 * This method fires an event using the eventbus. This event indicates that the OData-Call has been sent and that the
	 * dialog is going to be closed. The UI (especially S4) has to react on this in order to prevent that the user clicks
	 * on other solution cards in the meantime.
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_fireEventODataSent : function() {
		// Get the event bus from the framework
		var bus = sap.ui.getCore().getEventBus();
		// Fire the event indicating that the OData Request has been sent
		bus.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_EXECUTE, null);
	},

	/**
	 * This method fires an event using the eventbus. This event indicates that the OData response has been received and
	 * that this response contains error messages. That means that the call in the backend raised an error. On the UI,
	 * especially S4 has to react on this. The solution cards have to become active again
	 * 
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
	 */
	_fireEventODataError : function() {
		// Get the event bus from the framework
		var bus = sap.ui.getCore().getEventBus();
		// Fire the event indicating that the OData Request has been sent
		bus.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_ERROR, null);
	},

 /**
  * This method fires an event using the eventbus. This event indicates that the dialog has been cancelled. 
  * The solution cards have to become active again
  * 
  * @memberOf i2d.pp.mrpcockpit.reuse.util.DialogRoot
  */
 _fireEventDialogCancel : function() {
 	 // Get the event bus from the framework
	 var bus = sap.ui.getCore().getEventBus();
	 // Fire the event indicating that the OData Request has been sent
	 bus.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_DIALOG_CANCEL, null);
 }
});

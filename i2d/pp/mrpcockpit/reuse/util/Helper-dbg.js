/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.Helper");
jQuery.sap.require("sap.ca.ui.utils.Lessifier");

i2d.pp.mrpcockpit.reuse.util.Helper = {

	/**
	 * Checks if batch mode is still active
	 * 
	 * @memberOf: Helper
	 */
	isBatchModeActive : function() {
		// var noBatch = jQuery.sap.getUriParameters().get("nobatch");
		var noBatch;
		if (noBatch == "X") {
			return false;
		}
		return true;
	},

	factsheetNavigate : function(semanticObject, action, params) {
		// init CrossApplicationNavigation object
		var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
		this.oCrossAppNavigator = fgetService && fgetService("CrossApplicationNavigation");
		
		if (this.oCrossAppNavigator) {
			this.oCrossAppNavigator.toExternal({ 
				target : { 
					semanticObject : semanticObject, action : action
					}, 
					params : params });
				}
	},

	/**
	 * Creates and returns a multi-value OR filter
	 * 
	 * @returns {sap.ui.model.Filter}
	 */
	getORMultiFilter : function(filterKey, aValues) {

		var aORFilter = new Array();
		for ( var i = 0; i < aValues.length; i++) {
			aORFilter.push(new sap.ui.model.Filter(filterKey, sap.ui.model.FilterOperator.EQ, aValues[i]));
		}
		var oORFilter = new sap.ui.model.Filter(aORFilter, false); // OR
		return oORFilter;

	},

	/**
	 * This method extracts an error message out of a given stream. The method can handle XML and JSON but both have to
	 * follow a special format.
	 * 
	 * @param oBundle
	 *          object representing the i18n resource bundle to read general error texts
	 * @param sXml
	 *          string containing an XML (document) that contains an XML node 'message' containing the error message
	 *          defined at the backend.
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.Helper
	 */
	extractErrorMsgFromStream : function(oBundle, sXml) {
		var sText = "";
		// First we assume that the string/"stream" contains an XML - so we try to extract the xml node 'message'
		try {
			var oParser = new DOMParser();
			var xmlDoc = oParser.parseFromString(sXml, "text/xml");
			var aMsg = [];
			if (xmlDoc) {
				aMsg = xmlDoc.getElementsByTagName("message");
			}
			// Check if the required node has been found in the xml
			if (aMsg.length > 0) {
				// Success: It is an XML and the message can be extracted out of the node
				// Ensure that the node has the required format
				if (aMsg[0] && aMsg[0].childNodes[0] && aMsg[0].childNodes[0].nodeValue) {
					sText = aMsg[0].childNodes[0].nodeValue;
				} else {
					sText = oBundle.getText("SOLUTION_DIALOG_ERROR_UNKNOWN");
				}
			} else {
				// Failure: It is probably an JSON
				var oModelJSON = new sap.ui.model.json.JSONModel();
				oModelJSON.setJSON(sXml);
				// Ensure that the JSON has the required format
				if (oModelJSON.oData && oModelJSON.oData.error && oModelJSON.oData.error.message
						&& oModelJSON.oData.error.message.value) {
					sText = oModelJSON.oData.error.message.value;
				} else {
					// The stream contains data whose format is unknown for us. So we add an appropriate (default) error message.
					sText = oBundle.getText("SOLUTION_DIALOG_ERROR_UNKNOWN");
				}
			}
		} catch (e) {
			// If an exception occurred (could be with IE9), we try to extract the message out of JSON.
			// If that fails, we use the whole response within the details.
			var oModelJSON = new sap.ui.model.json.JSONModel();
			oModelJSON.setJSON(sXml);
			// Ensure that the JSON has the required format
			if (oModelJSON.oData && oModelJSON.oData.error && oModelJSON.oData.error.message
					&& oModelJSON.oData.error.message.value) {
				sText += oModelJSON.oData.error.message.value;
			} else {
				sText = sXml;
			}
		}
		return sText;
	},

	/**
	 * This method extracts an error message out of a given array of HTTP response objects which contain a XML or JSON
	 * which has the error message within the section <message>
	 * 
	 * @param oBundle
	 *          object representing the i18n resource bundle to read general error texts
	 * @param aErrorResponses
	 *          array of HTTP response objects containing error messages in XML or JSON format
	 * @memberOf i2d.pp.mrpcockpit.reuse.util.Helper
	 */
	extractErrorMsgFromBatchResponse : function(oBundle, aErrorResponses) {
		var sErrorText = "";
		var sText = "";
		// Extract the error message out of each item in the array and concatenate it with ';'
		for ( var i = 0; i < aErrorResponses.length; i++) {
			if (i > 0) {
				sErrorText += "; ";
			}
			// Ensure that the response object has the required structure
			if (aErrorResponses[i].response && aErrorResponses[i].response.body) {
				sText = i2d.pp.mrpcockpit.reuse.util.Helper
						.extractErrorMsgFromStream(oBundle, aErrorResponses[i].response.body);
			} else {
				sText = oBundle.getText("SOLUTION_DIALOG_ERROR_UNKNOWN");
			}
			sErrorText += sText;
		}
		return sErrorText;
	},

	/**
	 * Resizing of the UI controls for the S3 and S4 view
	 * <p>
	 * Prerequisites for calculation is to set on the page the following ID's:
	 * <ul>
	 * <li> - mainPage , for the page (S3, S4)
	 * <li> - panel , for the panel where the chart is inside
	 * <li> - panelToolbar , for the toolbar in the mentioned panel
	 * <li> - supDemItemsTab, in case a icon tab bar is used, the resizing has to be done as well in case the user clicks
	 * <li> - oScrollContainer, for the page S4 on the tab where the chart is in. We check on the key="supDemItemsTab" of
	 * the icon tab bar
	 * </ul>
	 * You can use the offset in px to reduce the height of the chart
	 */
	resizeUiControls : function(context, sSourceView, offsetChart) {
		// The chart is embedded within a panel
		var $PanelContent = jQuery("#" + context.getView().getId() + "--" + 'panel');

		// get the size of the solution cards (fixed size on the screen)
		var iSolCardHeight = $('.sapMRPSolutions').height();
		if (iSolCardHeight === null || iSolCardHeight === undefined) {
			// they don't exist for S3
			iSolCardHeight = 0;
		}

		// calculate the space that is available for the Chart
		if ($PanelContent && $PanelContent.length) {
		
			// ------------------------------------------
			// Set the size of the chart
			// ------------------------------------------		
			var oChart = context.getView().byId("chart");
			var parent;
			var width = 0;
			var offsetTop = 0;
			var pageHeight = 0;
			var chartHeight = 0;
			var parentBottom = "";
			var offsetBottom = 0;

			offsetTop = $PanelContent[0].offsetTop;
			width = $PanelContent.width();
			parent = $PanelContent.parent();

			// consider the padding of the parent node (in principle the bottom-padding,
			// bottom-margin and bottom-border of all nodes to the page node should be
			// considered, but right now only the parent node has a padding)
			parentBottom = parent.css("padding-bottom");
			offsetBottom = (parentBottom) ? parseInt(parentBottom) : 0;

			// collect all offsets at the top
			while ((parent.length != 0) && !(parent.attr('id') == context.getView().getId() + "--" + "mainPage-cont")) {
				offsetTop += parent[0].offsetTop;
				parent = parent.parent();
			}

			// determine the available height for the page
			pageHeight = (parent) ? parent.height() : 0;
			// On mobile devices the page has a border at the bottom. We also use this
			// space for the Nav Container and the chart (otherwise we would loose that
			// space)
			parentBottom = (parent) ? parent.css("border-bottom") : "";
			pageHeight += (parentBottom) ? parseInt(parentBottom) : 0;

			// calculate the available space for the chart
			// It depends on the screen (S3||S4) if the height of the solution cards has to be considered
			if (sSourceView === i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_S3) {
				chartHeight = pageHeight - offsetTop - offsetBottom;
			} else if (sSourceView === i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_S4) {
				chartHeight = pageHeight - offsetTop - offsetBottom - iSolCardHeight;
			} else {
				// fallback
				chartHeight = pageHeight - offsetTop - offsetBottom;
			}

			// if space is not sufficient, stop the calculation here
			if ((width < 64) && (chartHeight < 10)) {
				return;
			}
			if (width < 64) {
				oChart.setHeight((chartHeight - 2) + "px");
				return;
			}
			if (chartHeight < 10) {
				oChart.setWidth((width - 64) + "px", true);
				return;
			}

			// chart height must be reduced by the chartOffset, if provided
			if (offsetChart > 0) {
				chartHeight = chartHeight - offsetChart;
			}

			// available space for chart must be reduced by the height of the panel toolbar
			var $PanelToolbar = jQuery("#" + context.getView().getId() + "--" + 'panelToolbar');
			chartHeight = chartHeight - $PanelToolbar[0].offsetHeight;

			jQuery.sap.log.debug("set chart size of S3 chart: " + (width - 64) + "x" + (chartHeight - 10));
			// Set the width but don't let the chart render itself because we have to set the height as well
			oChart.setWidth((width - 64) + "px", true);
			// Set the height and let the chart render itself
			oChart.setHeight((chartHeight - 2) + "px");
			
			// ------------------------------------------
			// Set the size of the overall Scroll container of S4
			// ------------------------------------------			
			// set the size of the outer scroll container of the page if available
			var iScrollContainerHeight = pageHeight - iSolCardHeight;
			var sScrollContainerHeight = iScrollContainerHeight + "px";
			var oScrollContainer = context.getView().byId("oScrollContainer");
			if (oScrollContainer) {
				oScrollContainer.setHeight(sScrollContainerHeight);
			}

		}
	},

	/**
	 * Convert the status of the Master List item in case the user uses a solution card.
	 */
	convertStatusToMasterListStatus : function(data) {

		var constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;

		// as fallback the shortage is shown
		var statusCode = constants.MASTER_LIST_STATUS_SHORTAGE;

		if (data && data.model && data.model.cardModel && data.model.cardModel.getData()) {

			// we first test if change requests are involved
			switch (data.model.cardModel.getData().SolutionRequestStatus) {

				case constants.REQUEST_STATUS_REQUESTED :
					// follow up request was created => this is processed for us
					statusCode = constants.MASTER_LIST_STATUS_PROCESSED;
					break;
				case constants.REQUEST_STATUS_APPLIED :
					// solution was executed directly => this is processed for us
					statusCode = constants.MASTER_LIST_STATUS_PROCESSED;
					break;
				case constants.REQUEST_STATUS_DISCARDED :
					// the solution was discarded. although this technically this creates a change request
					// the shortage is not processed for us. therefore we still show "shortage"
					statusCode = constants.MASTER_LIST_STATUS_SHORTAGE;
					break;
				case constants.REQUEST_STATUS_ANSWERED :
					// follow up request was created, already answered => this is processed for us
					// this should not occur in reality
					statusCode = constants.MASTER_LIST_STATUS_PROCESSED;
					break;
				case constants.REQUEST_STATUS_COLLECTED :
					// a collected change request was sent
					// => this is processed for us
					statusCode = constants.MASTER_LIST_STATUS_PROCESSED;
					break;
				default :
					// if no solution request status is set,
					// no change requests are involved
					// this means the user has done an action that processed this entry
					statusCode = constants.MASTER_LIST_STATUS_PROCESSED;
					break;
			}
		}
		return statusCode;

	},

	/**
	 * Lessify CSS for x30 Apps
	 */
	lessifyCSSx30 : function() {

		// add less processor for custom CSS
		if (sap.ca.ui.utils.Lessifier) {

			// This code is a temporary solution for wave2 to get things clean, it will be removed in wave3
			// the if condition is here to avoid failure at that point

			// general x30 styles
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "styles/sapMRPx30.css", true);

			// Solution Cards
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "controls/SolutionCards.css", true);

			// Chart
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "controls/Chart.css", true);

			// Stock Button
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "controls/Stock.css", true);

			// Scrollbar (Chrome)
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "styles/sapMRPScrollbar.css", true);
		}

	},

	/**
	 * Lessify CSS for x10 Apps
	 */
	lessifyCSSx10 : function() {

		// add less processor for custom CSS
		if (sap.ca.ui.utils.Lessifier) {

			// This code is a temporary solution for wave2 to get things clean, it will be removed in wave3
			// the if condition is here to avoid failure at that point
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "styles/sapMRPx10.css", true);

			// refactor: move in app neutral reuse part
			// Scrollbar (Chrome)
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "styles/sapMRPScrollbar.css", true);

		}

	},

	/**
	 * Returns Entity Text -> Different Texts for Suite on HANA and ModelS
	 */
	getSpecialTextForField : function(pField, oController, aDiffFieldText) {
		// returns a SoH or ModelS specific field text if maintained in the array aDiffFieldText
		//Paramerter: 
		//oController: from App to check SchemaVersion
		//pField: UI-FieldID in i18n.properties
		//aDiffFieldText: Array with special text-IDs for ModelS and SoH (if not given oController.aDiffFieldText is used)
    // Schema-Pattern for aDiffFieldText: [[<fieldname>, [<i18nIDSoH>, <i18nIDModS>]], ...]
		// --> should be declared in INIT of App-Controller (see material.shortge S1.controller.js for example)
		// search in aDiffFieldText[n][0] for import parameter pField, if found, check what text for SoH or ModS exist
		// return aDiffFieldText[n][1][0] for SoH Text!
		// return aDiffFieldText[n][1][1] for ModelS Text!
		var seekIndexInArray = function(pArray, pValue) {
			// little helper function to check if a given value pValue is in a given array pArray like a aDefaultSorting
			var i, index = -1;
			for (i = 0; i < pArray.length; i++) {
				if (pArray[i][0] === pValue) {
					index = i;
					break;
				}
			}
			return index;
		};
		
		//BASIC Check : Is One Codeline NOT active?
		if (!i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
			return pField;
		}
		// check if aDiffFieldText array is given as a parameter / exists in oController
		if (!aDiffFieldText) {
			if (!oController) {
				// return pField
				return pField;
			} else if (oController.aDiffFieldText){
				aDiffFieldText = oController.aDiffFieldText;
			}
		}

		if (aDiffFieldText) {
			var myIndex = seekIndexInArray(aDiffFieldText, pField);
			if (myIndex >= 0) {
				if (aDiffFieldText[myIndex][1]) {
					if (oController.getServiceSchemaVersion() === i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S) {
						return aDiffFieldText[myIndex][1][1];
					} else {
						return aDiffFieldText[myIndex][1][0];
					}
				} else { // no entry for aDiffFieldText["pField"][2] maintained -> no differences in SoH and ModelS Text ->
					// return pField
					return pField;
				}
			} else { // no entry for aDiffFieldText["pField"] maintained -> no differences in SoH and ModelS Text -> return
				// pField
				return pField;
			}
		} else { // no array to look in -> no differences in SoH and ModelS Texts at all in the App -> return pField
			return pField;
		}
	},

	/**
	 * Returns Entity Text -> Different Texts for Suite on HANA and ModelS
	 */
	getSpecialTextForFieldInt : function(options) {
		// returns a SoH or ModelS specific i18n ID or field text
		// Possible options: 
		//sI18nID : the Default field name (i18n.properties) w/o SoH or ModS 
		//oController : controller context from the App (with a textmodel, aDiffFieldText, getServiceSchemaVersion, ... in it  
		//aDiffFieldText : array with special text IDs for ModelS and SoH (if not want to use the one from controller)
    // Schema-Pattern for aDiffFieldText: [[<fieldname>, [<i18nIDSoH>, <i18nIDModS>]], ...]
			// --> should be declared in INIT of App-Controller (see material.shortge S1.controller.js for example)
			// search in aDiffFieldText[n][0] for import parameter pField, if found, check what text for SoH or ModS exist
			// return aDiffFieldText[n][1][0] for SoH Text!
			// return aDiffFieldText[n][1][1] for ModelS Text!
		//iServiceVersion : ServiceVersion (e.g. 99 for ModelS) if not want to use the getServiceSchemaVersion from the controller
		//sSoHI18nID : given i18n-ID for the SoH (Suite on Hana) Text
		//sModSI18nID : given i18n-ID for the ModS (ModelS) Text
		
		var defaultOptions = {
			bGetText				: false, //get the ID not the Text	
			sI18nID 				: null, 
			oController 		: null, 
			aDiffFieldText 	: null, 
			iServiceVersion : null, 
			sSoHI18nID			: null,  
			sModSI18nID			: null
		};
		options = $.extend({}, defaultOptions, options);

		var myIndex = null;
		var seekIndexInArray = function(pArray, pValue) {
			// little helper function to check if a given value pValue is in a given array pArray like a aDefaultSorting
			var i, index = -1;
			for (i = 0; i < pArray.length; i++) {
				if (pArray[i][0] === pValue) {
					index = i;
					break;
				}
			}
			return index;
		};
		var getResult = function(iSerVer, sDefID, sSoHID, sModSID){
			var sID = sDefID; //Init the default with default i18n ID
			if (iSerVer) {
				switch (iSerVer) {
					case i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S : // Model S
						if (sModSID) { sID = sModSID;	}
						break;
					default : // For the current version.
						if (sSoHID) { sID = sSoHID; }
					  break;
				}		
			}
			if (options.bGetText && options.oController.oResourceBundle.getText){
					return options.oController.oResourceBundle.getText(sID);
			}
			// default: return the i18n ID
			return sID;
		};

		//BASIC Check : Is One Codeline NOT active?
		if (!i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT) {
			return getResult(options.iServiceVersion, options.sI18nID, options.sI18nID, options.sI18nID);
		}

		// check if minimum is given or short call
		if (!options.sI18nID) {
			if (!(options.iServiceVersion && options.sSoHI18nID && options.sModSI18nID)) {
				if (options.sSoHI18nID) {	
					return options.sSoHI18nID; 
				} 
				else if (options.sModSI18nID) { 
					return options.sModSI18nID; 
				} else { 
					return null; 
				}
			}
		}
		
		// 1st : check if options.iServiceVersion, sSohText, sModSText is given -> if yes, use it preferred
		if (options.iServiceVersion && options.sSoHI18nID && options.sModSI18nID) {
			// Choose ID or Text and return
			return getResult(options.iServiceVersion, options.sI18nID, options.sSoHI18nID, options.sModSI18nID);
		}
		
		// 2nd : check if options.oController is given -> if yes, use it preferred
		if (options.oController){
			//check if options.iServiceVersion is given -> if yes use it preferred otherwise use the one in options.oController
			if (!options.iServiceVersion){
				if (options.oController.getServiceSchemaVersion) {
					options.iServiceVersion = options.oController.getServiceSchemaVersion();
				} else {
					options.iServiceVersion = 2;
				}
			}
			//check if options.aDiffFieldText is given -> if yes use it preferred otherwise use the one in options.oController
			if (!options.aDiffFieldText) {
				if (options.oController.aDiffFieldText){
					options.aDiffFieldText = options.oController.aDiffFieldText;
				} else { // no aDiffFieldText available -> choose the sSoHI18nID, sModSI18nID if given
					return getResult(options.iServiceVersion, options.sI18nID, options.sSoHI18nID, options.sModSI18nID);				
				}
			} 
			
			//get the right id from options.aDiffFieldText
			if (options.aDiffFieldText) {
				myIndex = seekIndexInArray(options.aDiffFieldText, options.sI18nID);
				if (myIndex >= 0) {
					if (options.aDiffFieldText[myIndex][1]) {
						options.sSoHI18nID = options.aDiffFieldText[myIndex][1][0];
						options.sModSI18nID = options.aDiffFieldText[myIndex][1][1];
						return getResult(options.iServiceVersion, options.sI18nID, options.sSoHI18nID, options.sModSI18nID);
					}
				}
			}
		} else {
			// no options.oController -> last chance with options.aDiffFieldText & options.iServiceVersion
			if (options.aDiffFieldText && options.iServiceVersion) {
				myIndex = seekIndexInArray(options.aDiffFieldText, options.sI18nID);
				if (myIndex >= 0) {
					if (options.aDiffFieldText[myIndex][1]) {
						return getResult(options.iServiceVersion, options.sI18nID, options.aDiffFieldText[myIndex][1][0], options.aDiffFieldText[myIndex][1][1]);
					}
				}
			}
		}
		return options.sI18nID;
	}
	
	
};

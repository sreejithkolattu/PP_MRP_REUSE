/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.ui.model.format.NumberFormat");

sap.ui.core.Control.extend("i2d.pp.mrpcockpit.reuse.controls.Stock", {
	metadata : {
		properties : {
			"name" : "string",
			"number" : "string",
			"numberUnit" : "string",
			"mrpavailability" : "string",
			"mergingKey" : "string",
			"renderAsButton" : "boolean", // true = render a button, false = render a label
			"tooltip" : "string"
		},
		events : {
			"press" : {}
		}
	},

	renderer : function(oRm, oControl) { // the part creating the HTML

		if (oControl.getRenderAsButton()) {

			// construct button
			var oButton = new sap.m.Button({
				text : oControl.getNumber() + " " + oControl.getNumberUnit(),
				icon : "sap-icon://navigation-right-arrow",
				tooltip : oControl.getTooltip(),
				press : function() {
					oControl.firePress();
				}
			});

			// Switch Button Coloring
			switch (oControl.getMrpavailability()) {
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE : // black
					// no Button!
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_SAFETYSTOCK : // yellow
					oButton.addStyleClass("sapMRPStockSafetyStockBtn");
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_BELOWZERO : // red
					oButton.addStyleClass("sapMRPStockShortageBtn");
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED : // grey
					oButton.addStyleClass("sapMRPStockAcceptedBtn");
					break;
				default :
					break;
			}

			// icon to the right
			oButton.setIconFirst(false);
			// generic CSS class
			oButton.addStyleClass("sapMRPStockBtn");

			// render the control
			oRm.renderControl(oButton);

		} else { // button not required

			// construct object number
			var oObjectNumber = new sap.m.ObjectNumber({
				number : oControl.getNumber(),
				numberUnit : oControl.getNumberUnit()
			});

			// Switch Label Coloring
			switch (oControl.getMrpavailability()) {
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE : // black
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_SAFETYSTOCK : // yellow
					oObjectNumber.addStyleClass("sapMRPStockSafetyStockNumber");
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_BELOWZERO : // red
					oObjectNumber.addStyleClass("sapMRPStockShortageNumber");
					break;
				case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED : // grey
					oObjectNumber.addStyleClass("sapMRPStockAcceptedNumber");
					break;
				default :
					break;
			}

			// render the control
			oRm.renderControl(oObjectNumber);
		}

	}

});

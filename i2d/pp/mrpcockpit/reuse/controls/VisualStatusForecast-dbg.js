/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
"use strict";
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.controls.VisualStatusForecast");

sap.ui.core.Control.extend("i2d.pp.mrpcockpit.reuse.controls.VisualStatusForecast", {
	/**
	 * @memberOf i2d.pp.mrpcockpit.reuse.controls.VisualStatusForecast
	 */

	sControlName : "STOCKAVAILABILITYCHART",

	metadata : {
		properties : {
			"internStatus" : "string",
			"daysNo" : "int",
			"tooltip" : "string"
		},

		aggregations : {
			content : {
				type : "i2d.pp.mrpcockpit.reuse.controls.VisualStatus",
				multiple : true,
				singularName : "content"
			}
		}
	},

	setInternStatus : function(sAvailabilityChart) {
		this.removeAllContent();
		// cut days number to maximal string lenght from backend : 0 ..31, daysNo[0] means yesterday, daysNo[1]
		// means today,
		var iDaysNo = this.getDaysNo() > 31 ? 31 : this.getDaysNo();
		if (sAvailabilityChart) {
			for ( var i = 1; i <= iDaysNo; i++) { // starting with second value, meaning today
				this.addContent(new i2d.pp.mrpcockpit.reuse.controls.VisualStatus({
					status : sAvailabilityChart.slice(i, i + 1)
				}).setTooltip(this.getTooltip_AsString()));
			}
			this.setProperty("internStatus", sAvailabilityChart, true);
		}
	},

	getControlName : function() {
		return this.sControlName;
	},

	renderer : function(oRm, oControl) {

		// read Materials-attribute "AvailabilityChart" = string[32]{0/1/2/3/4/5}
		// dissolve the string, build 32-array status variable Header
		oRm.write("<div");

		oRm.addClass("sapUiVisualStatusForecast");
		oRm.writeControlData(oControl);
		oRm.writeClasses();
		if (null !== oControl.getTooltip()) {
			oRm.write(" title=\"");
			oRm.writeEscaped(oControl.getTooltip());
			oRm.write("\"");
		}
		oRm.write(">");

		var aChildren = oControl.getContent();
		for ( var i = 0; i < aChildren.length; i++) {
			// loop over all child Controls,
			// render the colored box around them

			oRm.renderControl(aChildren[i]); // render the child Control
		}

		// close element
		oRm.write("</div>");

	},

	init : function(evt) {
	},

}); // end control

sap.ui.core.Control.extend("i2d.pp.mrpcockpit.reuse.controls.VisualStatus", {

	metadata : {
		properties : {
			status : "string", // color code: from service we get "0/1/2/3/4/5"
			text : "string", // possible text value
			tooltip : "string" // possible tooltip value (@TODO)
		}
	},

	/**
	 * Renderer
	 * 
	 * @param oRm
	 * @param oControl
	 */
	renderer : function(oRm, oControl) {
		// evaluate status. From service we get 0/1/2/3/4/5.
		// Map to positive/warning/negative
		var status = "negative";
		switch (oControl.getStatus()) {
			case "0" :
				status = "positive";
				break;
			case "1" :
				status = "warning";
				break;
			case "2" :
				status = "negative";
				break;
			case "3" :
				status = "positive_we";
				break;
			case "4" :
				status = "warning_we";
				break;
			case "5" :
				status = "negative_we";
				break;
			case "6" :
				status = "negative_acc";
				break;
			case "7" :
				status = "negative_we_acc";
				break;
			default :
				status = "negative";
				break;
		}

		oRm.write("<span");
		oRm.addClass(status);
		oRm.writeControlData(oControl);
		oRm.writeClasses();
		oRm.write(">");

		oRm.write("</span>"); // end of the box around the
		// respective child

	},

});

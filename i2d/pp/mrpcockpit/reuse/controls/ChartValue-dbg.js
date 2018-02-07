/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.controls.ChartValue");

sap.ui.core.Element.extend("i2d.pp.mrpcockpit.reuse.controls.ChartValue", {
	metadata : {
		properties : {
			date : "string",
			demand : {
				type : "float",
				defaultValue : 0
			},
			supply : {
				type : "float",
				defaultValue : 0
			},
			shortageAccepted : {
				type : "boolean",
				defaultValue : false
			}
		}
	}
});

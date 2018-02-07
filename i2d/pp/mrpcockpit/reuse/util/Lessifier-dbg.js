/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.Lessifier");
jQuery.sap.require("sap.ca.ui.utils.Lessifier");

i2d.pp.mrpcockpit.reuse.util.Lessifier = {

	lessifyCSSx10 : function(){
		if (sap.ca.ui.utils.Lessifier) {
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "styles/sapMRP.css", true);
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "styles/sapMRPx10.css", true);
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "controls/VisualStatusForecast.css", true);
			}
	},
	lessifyCSSx30 : function(){
		if (sap.ca.ui.utils.Lessifier) {
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "styles/sapMRP.css", true);
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "styles/sapMRPx30.css", true);
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "controls/SolutionCards.css", true);
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "controls/Chart.css", true);
			sap.ca.ui.utils.Lessifier.lessifyCSS("i2d.pp.mrpcockpit.reuse", "controls/Stock.css", true);
			}
	}
};

/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.QUnitHelper");

// Helper method for QUnit
i2d.pp.mrpcockpit.reuse.util.QUnitHelper = {

	/**
	 * @memberOf: Helper Creates a mock infrastructure for controller checks
	 * 
	 */
	mockInfrastructure : function() {
		var oImpl = {};

		oImpl.getImpl = function() {
			var oApplicationImplementation = {};
			var oConfig = {};
			var oApplicationFacade = {};
			oApplicationFacade.getResourceBundle = function() {
				var oBundle = {};
				oBundle.getText = function() {
					var sText = 'Text';
					return sText;
				};
				return oBundle;
			};

			oConfig.oApplicationFacade = oApplicationFacade;
			oApplicationImplementation.oConfiguration = oConfig;

			var oHelper = {};
			oHelper.defineMasterHeaderFooter = function() {
			};
			oApplicationImplementation.oMHFHelper = oHelper;
			return oApplicationImplementation;
		};
		sap.ca.scfld.md.app.Application = oImpl;
	}

};

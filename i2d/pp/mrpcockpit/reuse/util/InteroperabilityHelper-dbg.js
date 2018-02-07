/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper");

i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper = {

	/**
	 * Determine and store the OData model's service version and service schema version (backend)
	 */
	initialize : function(oModel, sEntityName, oApplicationFacade) {
		var theModel = oModel;

		if (oModel === undefined || oModel === null) {
			theModel = sap.ca.scfld.md.app.Application.getImpl().getODataModel();
		}

		var iServiceSchemaVersion = this._getServiceSchemaVersion(theModel, sEntityName);
		var iServiceVersion = this._getServiceVersion(theModel, sEntityName);

		// store versions in a global hashmap for the application
		var oVersions = {
			iServiceSchemaVersion : iServiceSchemaVersion,
			iServiceVersion : iServiceVersion
		};
		oApplicationFacade.setApplicationModel("ServiceVersions", new sap.ui.model.json.JSONModel(oVersions));
	},

	/**
	 * Returns the Interoperability model <br>
	 * This model contains all information regarding interoperability
	 * 
	 * @param {object}
	 *          oModel - the global data model
	 * @param {String}
	 *          sEntityName - the master entity name
	 * @returns {sap.ui.model.json.JSONModel}
	 */
	getInteroperabilityModel : function(oModel, sEntityName) {

		return new sap.ui.model.json.JSONModel({
			backendVersion : i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper
					._getServiceSchemaVersion(oModel, sEntityName),
			frontendVersion : i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getFrontendVersion()
		});

	},

	/**
	 * Returns the current Frontend Version <br>
	 * It has to be updated to the current Frontend Version! <br>
	 * Return space for Version 1 = SP03/SP04 Backend
	 */
	getFilterFrontendVersion : function() {
		// Version 3 corresponds to SP07
		return new sap.ui.model.Filter("Version", sap.ui.model.FilterOperator.EQ, "3"); // Version 3
	},

	getFrontendVersion : function() {
		// Version 3 corresponds to SP07
		return "3"; // Version 3
	},

	/**
	 * Adds a filter representing the "current Frontend Version" to the list of oData filters
	 * 
	 * @param {array}
	 *          [aFilters] filters array used for oData call
	 * @param {object}
	 *          [oModel] The OData model object.
	 * @param {string}
	 *          [sEntityName] The name of the entity that is annotated (optional)
	 */
	addFilterFrontendVersion : function(aFilters, oModel, sEntityName) {
		// since wave 5 the backend supports a new filter named 'Version'. This filter shall be set to the current ui
		// version
		if (i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper._getServiceSchemaVersion(oModel, sEntityName) > 1) {
			aFilters.push(i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getFilterFrontendVersion());
		}
	},

	/**
	 * Returns the current service version of the OData model/service.
	 */
	getServiceVersion : function(oApplicationFacade) {
		if (oApplicationFacade.getApplicationModel("ServiceVersions")) {
			return oApplicationFacade.getApplicationModel("ServiceVersions").getData().iServiceVersion;
		} else {
			return undefined;
		}
	},

	/**
	 * Returns the current service schema version of the OData model/service.
	 */
	getServiceSchemaVersion : function(oApplicationFacade) {
		if (oApplicationFacade.getApplicationModel("ServiceVersions")) {
			return oApplicationFacade.getApplicationModel("ServiceVersions").getData().iServiceSchemaVersion;
		} else {
			return undefined;
		}
	},

	/**
	 * Determine an entity's annotation of the OData model/service.
	 * 
	 * @param {object}
	 *          [oModel] The OData model object.
	 * @param {string}
	 *          sAnnotationName The name/key of the annotation
	 * @param {string}
	 *          [sEntityName] The name of the entity that is annotated (optional)
	 * @return The annotation value as string.
	 * @private
	 */
	_getEntityAnnotation : function(oModel, sAnnotationName, sEntityName) {
		// retrieve the metadata of the passed OData model
		var oModelMetadata = oModel.getServiceMetadata();
		// check for proper metadata structure
		if ((oModelMetadata != null) && (oModelMetadata.dataServices != null)
				&& (oModelMetadata.dataServices.schema != null) && (oModelMetadata.dataServices.schema.length > 0)
				&& (oModelMetadata.dataServices.schema[0].entityType != null)) {
			// determine the annotation by name using the first annotated entity
			var aEntityTypes = oModelMetadata.dataServices.schema[0].entityType;
			// loop the entities
			for ( var i = 0; i < aEntityTypes.length; i++) {
				if (aEntityTypes[i].extensions != null) {
					// loop the annotations of the the entity
					for ( var j = 0; j < aEntityTypes[i].extensions.length; j++) {
						if (((sEntityName === undefined) || (sEntityName === aEntityTypes[i].name))
								&& (aEntityTypes[i].extensions[j].name === sAnnotationName)) {
							return aEntityTypes[i].extensions[j].value;
						}
					}
				}
			}
		}
		return null;
	},

	getEntityPropertyNames : function(oModel, sEntityName) {
		var oModelMetadata = oModel.getServiceMetadata();
		// check for proper metadata structure
		if ((oModelMetadata != null) && (oModelMetadata.dataServices != null)
				&& (oModelMetadata.dataServices.schema != null) && (oModelMetadata.dataServices.schema.length > 0)
				&& (oModelMetadata.dataServices.schema[0].entityType != null)) {
			// determine the annotation by name using the first annotated entity
			var aEntityTypes = oModelMetadata.dataServices.schema[0].entityType;
			var aEntityPropertyNames = [];
			// loop the entities
			for ( var i = 0; i < aEntityTypes.length; i++) {
				if (sEntityName === aEntityTypes[i].name) {
					for ( var j = 0; j < aEntityTypes[i].property.length; j++) {
						aEntityPropertyNames.push(aEntityTypes[i].property[j].name);
					}
					return aEntityPropertyNames;
				}
			}
		}
		return null;
	},

	/**
	 * Retrieve the service schema version of the OData model/service. As an intermediate solution the service schema
	 * version is an annotation to one (arbitrary) entity.
	 * 
	 * @param {object}
	 *          [oModel] The OData model object.
	 * @param {string}
	 *          [sEntityName] The name of the entity that is annotated (optional)
	 * @return The service schema version as an integer or 1 as default for an initial version.
	 * @private
	 */
	_getServiceSchemaVersion : function(oModel, sEntityName) {
		var version = this._getEntityAnnotation(oModel, "service-schema-version", sEntityName);
		// defaults to initial service schema version (1)
		return (version != null) ? parseInt(version) : 1;
	},

	/**
	 * Retrieve the service version of the OData model/service. As an intermediate solution the service version is an
	 * annotation to one (arbitrary) entity.
	 * 
	 * @param {object}
	 *          [oModel] The OData model object.
	 * @param {string}
	 *          [sEntityName] The name of the entity that is annotated (optional)
	 * @return The service version as an integer or 1 as default for an initial version.
	 * @private
	 */
	_getServiceVersion : function(oModel, sEntityName) {
		var version = this._getEntityAnnotation(oModel, "service-version", sEntityName);
		// defaults to initial service version (1)
		return (version != null) ? parseInt(version) : 1;
	},

	// compares metadata properties with table columns and removes needless columns
	removeNeedlessColumnsFromTable : function(oModel, sEntityName, oTable, sDataFieldId) {
		var aEntityPropertyNames = this.getEntityPropertyNames(oModel, sEntityName);
		if ((aEntityPropertyNames != null) && (aEntityPropertyNames != undefined)) {
			var aColumns = oTable.getColumns();
			for ( var i = 0; i < aColumns.length; i++) {
				var aThisColumnFields = [];
				var sThisColumnFields = "";
				sThisColumnFields = aColumns[i].data(sDataFieldId);// get real column names
				if (sThisColumnFields != "") {
					aThisColumnFields = sThisColumnFields.split(","); // if more than one backend field
					var bEntityPropertyExists = false; // initialize
					for ( var j = 0; j < aThisColumnFields.length; j++) {
						if ((j > 0) && (bEntityPropertyExists == false)) {
							break; // run before ended with FALSE, no additional loop needed
						} // minimum one backend field does not exist
						bEntityPropertyExists = false; // initialize with false for next check
						for ( var k = 0; k < aEntityPropertyNames.length; k++) {
							if (aThisColumnFields[j] == aEntityPropertyNames[k]) {
								bEntityPropertyExists = true;
								break;
							}
						}
					}
					if (!bEntityPropertyExists) {
						oTable.removeColumn(aColumns[i].sId);
					}
				}
			}
		}
	}

};

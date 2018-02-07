/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.StateMachine");

i2d.pp.mrpcockpit.reuse.util.StateMachine = {
	// States in which the application will find itself
	oState : {
		initial : "initial",
		waitVariantData : "waitVariantData",
		waitFacetOrTableData : "waitFacetOrTableData",
		started : "started",
		waitFirstAORDialogFinished : "waitFirstAORDialogFinished",
		waitAORDialogFinished : "waitAORDialogFinished",
		waitFacetDataForNewAOR : "waitFacetFilterDataForNewAOR",
		waitSelectedVariantData : "waitSelectedVariantData"
	},

	// Events
	oEvent : {
		start : "start",
		varDataReceived : "varDataReceived",
		facetDataReceived : "facetDataReceived",
		noFacetDataReceived : "noFacetDataReceived",
		tableDataReceived : "tableDataReceived",
		aORUndefined : "aORUndefined",
		firstAORDialogFinished : "aORFirstDialogFinished",
		aORDialogFinished : "aORDialogFinished",
		aORDialogCancelled : "aORDialogCancelled",
		filterChanged : "filterChanged",
		tableChanged : "tableChanged",
		aORButtonPressed : "aORButtonPressed",
		variantSelected : "variantSelected"
	},

	// Actions which are executed during the transition to the next state
	oAction : {
		getVariantDataByName : function(oController) {
			i2d.pp.mrpcockpit.reuse.view.DisplayVariant.readVariantByName(oController.sCurrentVariantName);
		},

		getVariantDataById : function(oController) {
			i2d.pp.mrpcockpit.reuse.view.DisplayVariant.readVariantById(oController.sVariantID);
		},

		getTableData : function(oController) {
			oController._rebindRefreshTable();
		},

		getFacetAndTableData : function(oController) {
			oController._setupFacetFilterCall();
			oController._rebindRefreshTable();
		},

		startFirstAORDialog : function(oController) {
			i2d.pp.mrpcockpit.reuse.view.AoRHandler.openFirstOnboardingDialog(oController.oDataModel,
					oController._firstAORDialogFinished.bind(oController), oController);
		},

		setFacetFilterVariant : function(oController) {
			oController.oViewState.FacetFilterState = oController.oVariantData.FacetFilterState;
			oController._setFacetFilterState(oController.oVariantData.FacetFilterState);
			i2d.pp.mrpcockpit.reuse.view.FacetFilter._recreateFacetFilterFilters(oController);
		},

		startAORDialog : function(oController) {
			// oController.aStoredFacetFilterState =
			// i2d.pp.mrpcockpit.reuse.view.FacetFilter._getFacetFilterState(oController);
			i2d.pp.mrpcockpit.reuse.view.AoRHandler.openOnboardingDialog(null, oController.oDataModel,
					oController._aORDialogFinished.bind(oController), oController);
		},

		restoreFacetFilterState : function(oController) {
			if (oController.aStoredFacetFilterState != undefined) {
				oController.oViewState.FacetFilterState = oController.aStoredFacetFilterState;
				oController._setFacetFilterState(oController.oViewState.FacetFilterState);
			}
		},

		doNothing : function() {
		}
	}
};

// Transition Table
i2d.pp.mrpcockpit.reuse.util.StateMachine.aStateTable = [{
	transition : "1",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.initial,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.start,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getVariantDataById,
	actionName : "getVariantDataById",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitVariantData
},

{
	transition : "2",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitVariantData,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.varDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getFacetAndTableData,
	actionName : "getFacetAndTableData",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData
}, {
	transition : "3",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.facetDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.setFacetFilterVariant,
	actionName : "setFacetFilterVariant",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started
}, {
	transition : "4",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.tableDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,
	actionName : "doNothing",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started
}, {
	transition : "5",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.aORButtonPressed,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.startAORDialog,
	actionName : "startAORDialog",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitAORDialogFinished
}, {
	transition : "6",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitAORDialogFinished,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.aORDialogFinished,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getFacetAndTableData,
	actionName : "getFacetAndTableData",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR
}, {
	transition : "7",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.facetDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.restoreFacetFilterState,
	actionName : "restoreFacetFilterState",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started
}, {
	transition : "8",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.variantSelected,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getVariantDataByName,
	actionName : "getVariantDataByName",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitSelectedVariantData
}, {
	transition : "9",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.filterChanged,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getTableData,
	actionName : "getTableData",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData
}, {
	transition : "10",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFirstAORDialogFinished,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.firstAORDialogFinished,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getFacetAndTableData,
	actionName : "getFacetAndTableData",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData
}, {
	transition : "11",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.aORUndefined,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.startFirstAORDialog,
	actionName : "startFirstAORDialog",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFirstAORDialogFinished
}, {
	transition : "12",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.facetDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.setFacetFilterVariant,
	actionName : "setFacetFilterVariant",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started
}, {
	transition : "13",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.tableDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,
	actionName : "doNothing",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started
}, {
	transition : "14",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.tableDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,
	actionName : "doNothing",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR
}, {
	transition : "15",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.tableChanged,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getTableData,
	actionName : "getTableData",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData
}, {
	transition : "16",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.noFacetDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,
	actionName : "doNothing",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started
}, {
	transition : "17",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitSelectedVariantData,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.varDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getTableData,
	actionName : "getTableData",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData
}, {
	transition : "18",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.varDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getTableData,
	actionName : "getTableData",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData
}, {
	transition : "19",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitAORDialogFinished,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.aORDialogCancelled,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,
	actionName : "doNothing",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started
}, {
	transition : "20",
	currentState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR,
	event : i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.noFacetDataReceived,
	action : i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,
	actionName : "doNothing",
	newState : i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started
}];

// Execute state machine
i2d.pp.mrpcockpit.reuse.util.StateMachine.runStateMachine = function(oController, sEvent) {
	oController.logger.info("-----------------------------------------------------------------");
	oController.logger.info("Current State: " + oController.sState);
	oController.logger.info("Event:         " + sEvent);
	for ( var i = 0; i < i2d.pp.mrpcockpit.reuse.util.StateMachine.aStateTable.length; i++) {
		var aEntry = i2d.pp.mrpcockpit.reuse.util.StateMachine.aStateTable[i];
		if ((aEntry.currentState == oController.sState) && (aEntry.event == sEvent)) {
			oController.logger.info("Transition:    " + aEntry.transition);
			oController.logger.info("Action:        " + aEntry.actionName);
			oController.logger.info("-->            " + aEntry.newState);
			oController.sState = aEntry.newState;
			aEntry.action(oController);
			break;
		}
	}
};

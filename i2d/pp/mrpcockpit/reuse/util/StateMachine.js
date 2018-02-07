/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.StateMachine");i2d.pp.mrpcockpit.reuse.util.StateMachine={oState:{initial:"initial",waitVariantData:"waitVariantData",waitFacetOrTableData:"waitFacetOrTableData",started:"started",waitFirstAORDialogFinished:"waitFirstAORDialogFinished",waitAORDialogFinished:"waitAORDialogFinished",waitFacetDataForNewAOR:"waitFacetFilterDataForNewAOR",waitSelectedVariantData:"waitSelectedVariantData"},oEvent:{start:"start",varDataReceived:"varDataReceived",facetDataReceived:"facetDataReceived",noFacetDataReceived:"noFacetDataReceived",tableDataReceived:"tableDataReceived",aORUndefined:"aORUndefined",firstAORDialogFinished:"aORFirstDialogFinished",aORDialogFinished:"aORDialogFinished",aORDialogCancelled:"aORDialogCancelled",filterChanged:"filterChanged",tableChanged:"tableChanged",aORButtonPressed:"aORButtonPressed",variantSelected:"variantSelected"},oAction:{getVariantDataByName:function(c){i2d.pp.mrpcockpit.reuse.view.DisplayVariant.readVariantByName(c.sCurrentVariantName)},getVariantDataById:function(c){i2d.pp.mrpcockpit.reuse.view.DisplayVariant.readVariantById(c.sVariantID)},getTableData:function(c){c._rebindRefreshTable()},getFacetAndTableData:function(c){c._setupFacetFilterCall();c._rebindRefreshTable()},startFirstAORDialog:function(c){i2d.pp.mrpcockpit.reuse.view.AoRHandler.openFirstOnboardingDialog(c.oDataModel,c._firstAORDialogFinished.bind(c),c)},setFacetFilterVariant:function(c){c.oViewState.FacetFilterState=c.oVariantData.FacetFilterState;c._setFacetFilterState(c.oVariantData.FacetFilterState);i2d.pp.mrpcockpit.reuse.view.FacetFilter._recreateFacetFilterFilters(c)},startAORDialog:function(c){i2d.pp.mrpcockpit.reuse.view.AoRHandler.openOnboardingDialog(null,c.oDataModel,c._aORDialogFinished.bind(c),c)},restoreFacetFilterState:function(c){if(c.aStoredFacetFilterState!=undefined){c.oViewState.FacetFilterState=c.aStoredFacetFilterState;c._setFacetFilterState(c.oViewState.FacetFilterState)}},doNothing:function(){}}};i2d.pp.mrpcockpit.reuse.util.StateMachine.aStateTable=[{transition:"1",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.initial,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.start,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getVariantDataById,actionName:"getVariantDataById",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitVariantData},{transition:"2",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitVariantData,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.varDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getFacetAndTableData,actionName:"getFacetAndTableData",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData},{transition:"3",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.facetDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.setFacetFilterVariant,actionName:"setFacetFilterVariant",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started},{transition:"4",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.tableDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,actionName:"doNothing",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started},{transition:"5",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.aORButtonPressed,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.startAORDialog,actionName:"startAORDialog",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitAORDialogFinished},{transition:"6",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitAORDialogFinished,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.aORDialogFinished,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getFacetAndTableData,actionName:"getFacetAndTableData",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR},{transition:"7",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.facetDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.restoreFacetFilterState,actionName:"restoreFacetFilterState",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started},{transition:"8",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.variantSelected,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getVariantDataByName,actionName:"getVariantDataByName",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitSelectedVariantData},{transition:"9",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.filterChanged,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getTableData,actionName:"getTableData",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData},{transition:"10",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFirstAORDialogFinished,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.firstAORDialogFinished,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getFacetAndTableData,actionName:"getFacetAndTableData",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData},{transition:"11",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.aORUndefined,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.startFirstAORDialog,actionName:"startFirstAORDialog",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFirstAORDialogFinished},{transition:"12",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.facetDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.setFacetFilterVariant,actionName:"setFacetFilterVariant",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started},{transition:"13",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.tableDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,actionName:"doNothing",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started},{transition:"14",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.tableDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,actionName:"doNothing",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR},{transition:"15",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.tableChanged,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getTableData,actionName:"getTableData",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData},{transition:"16",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.noFacetDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,actionName:"doNothing",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started},{transition:"17",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitSelectedVariantData,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.varDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getTableData,actionName:"getTableData",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData},{transition:"18",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.varDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.getTableData,actionName:"getTableData",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetOrTableData},{transition:"19",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitAORDialogFinished,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.aORDialogCancelled,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,actionName:"doNothing",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started},{transition:"20",currentState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.waitFacetDataForNewAOR,event:i2d.pp.mrpcockpit.reuse.util.StateMachine.oEvent.noFacetDataReceived,action:i2d.pp.mrpcockpit.reuse.util.StateMachine.oAction.doNothing,actionName:"doNothing",newState:i2d.pp.mrpcockpit.reuse.util.StateMachine.oState.started}];
i2d.pp.mrpcockpit.reuse.util.StateMachine.runStateMachine=function(c,e){c.logger.info("-----------------------------------------------------------------");c.logger.info("Current State: "+c.sState);c.logger.info("Event:         "+e);for(var i=0;i<i2d.pp.mrpcockpit.reuse.util.StateMachine.aStateTable.length;i++){var E=i2d.pp.mrpcockpit.reuse.util.StateMachine.aStateTable[i];if((E.currentState==c.sState)&&(E.event==e)){c.logger.info("Transition:    "+E.transition);c.logger.info("Action:        "+E.actionName);c.logger.info("-->            "+E.newState);c.sState=E.newState;E.action(c);break}}};
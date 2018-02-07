/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");jQuery.sap.require("i2d.pp.mrpcockpit.reuse.controls.SolutionCardContainer");jQuery.sap.require("i2d.pp.mrpcockpit.reuse.controls.Chart");jQuery.sap.require("sap.ca.ui.message.message");jQuery.sap.require("sap.ca.ui.model.type.Date");jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Helper");jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CalculationEngine");jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CollaborationHelper");jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper");jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.Wave3Helper");sap.ca.scfld.md.controller.BaseDetailController.extend("i2d.pp.mrpcockpit.reuse.view.S4parent",{constructor:function(){sap.ca.scfld.md.controller.BaseDetailController.apply(this,arguments);var o=this.onInit;this.onInit=function(){var b=new sap.ui.model.resource.ResourceModel({bundleName:"i2d.pp.mrpcockpit.reuse.i18n.i18n"});this.getView().setModel(b,"Common_i18n");var v=this.oApplicationImplementation.getApplicationModel("ServiceVersions");this.getView().setModel(v,"ServiceVersions");o.apply(this,arguments)}},onInit:function(){sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);var p=this.getView().getContent()[0];p.setShowNavButton(true);this.initChart();this.resizeHandler=null;this.resizeTimer=null;this.isChartVisible=false;this._initialOffset=67;this.view=this.getView();this.oModel=this.view.getModel();this.oCollaborationDialog=null;this.oModel.setRefreshAfterChange(false);var b=i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getServiceSchemaVersion(this.oApplicationFacade);i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.setODataModel(this.oModel,b);i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper.setODataModel(this.oModel,b);this.Constants=i2d.pp.mrpcockpit.reuse.util.CommonConstants;this._setCrIconClickStatus();var c=this.getView().byId("shortages");var B=new Object();B.path="SupDemItem";if(b===1){B.factory=i2d.pp.mrpcockpit.reuse.util.Wave3Helper._getListTemplate}else{B.factory=this._getListTemplate}c.bindAggregation("items",B);this.oTableModel=new sap.ui.model.json.JSONModel();c.setModel(this.oTableModel);this.oRouter.attachRoutePatternMatched(this._onRoutePatternMatched,this);var l=this.getView().byId("oDataBindingServantItem");this.oTemplate=jQuery.extend({},l);this.oApplicationFacade.registerOnMasterListRefresh(this.onMasterRefresh,this);this.oNullModel=null},_setCrIconClickStatus:function(){this._bCrIconClickable=false},_onModelLoaded:function(e){if(e.getParameter("url").indexOf("PPMRPSolHeaders")===0){jQuery.sap.log.info("S4: Model loaded");var v=this.getView();var b=null;var i=v.byId("oDataBindingServant").getItems()[0];if(i){b=i.getBindingContext()}if(b){v.setBindingContext(b);var a=b.getObject();this.dateStart=a.MaterialShortageStartDate.toISOString().slice(0,-5);this.dateEnd=a.MaterialShortageEndDate.toISOString().slice(0,-5)}if(this.isChartVisible){this.switchToChart(false)}else{this.switchToTable(false)}this._displayChangeRequestWarning(a.ChangeRequestExists);this._updateSolutionCards(v)}},_subscribeEvents:function(){var b=sap.ui.getCore().getEventBus();b.subscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED,this.Constants.EVENT_EVENTID_OK,this.onDialogOk,this);b.subscribe(this.Constants.EVENT_CHANNELID_CARD_PREVIEW,this.Constants.EVENT_EVENTID_RUN,this._previewRun,this);b.subscribe(this.Constants.EVENT_CHANNELID_CARD_PREVIEW,this.Constants.EVENT_EVENTID_CANCEL,this._previewCancel,this);b.subscribe(this.Constants.EVENT_CHANNELID_SOLCARD,this.Constants.EVENT_EVENTID_EXECUTE,this.onSolutionCardExecute,this)},_unsubscribeEvents:function(){var b=sap.ui.getCore().getEventBus();b.unsubscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED,this.Constants.EVENT_EVENTID_OK,this.onDialogOk,this);b.unsubscribe(this.Constants.EVENT_CHANNELID_CARD_PREVIEW,this.Constants.EVENT_EVENTID_RUN,this._previewRun,this);b.unsubscribe(this.Constants.EVENT_CHANNELID_CARD_PREVIEW,this.Constants.EVENT_EVENTID_CANCEL,this._previewCancel,this);b.unsubscribe(this.Constants.EVENT_CHANNELID_SOLCARD,this.Constants.EVENT_EVENTID_EXECUTE,this.onSolutionCardExecute,this)},_onRoutePatternMatched:function(e){if(e.getParameter("name")===this.Constants.ROUTING.SUB_DETAIL||e.getParameter("name")===this.Constants.ROUTING.SUB_DETAIL_WAVE3){this.oModel.attachRequestCompleted(this._onModelLoaded,this);this._unsubscribeEvents();this._subscribeEvents();var c=this.getView().byId("cards");c.setMaterialShortageHasNoSolution(false);c.removeCards();var a=this.getView().byId("shortages");var m=a.getModel();m.setData(null);this._oCard=null;this.navParameter=e.getParameter("arguments");for(var i in this.navParameter){this.navParameter[i]=decodeURIComponent(this.navParameter[i])}if(e.getParameter("name")===this.Constants.ROUTING.SUB_DETAIL_WAVE3){this.dateStart=this.navParameter.MaterialShortageStartDate;this.dateEnd=this.navParameter.MaterialShortageEndDate}else{this.dateStart=this.navParameter.SelectedSupDemItemDate;this.dateEnd=null}this.chartScrollPos=parseInt(this.navParameter.ChartScrollPos);this._readSolutionViewData(false,null);this.requestChartData();var s=this.getView().byId("sapMrpS4ToolbarIcons");var d=this.navParameter.DisplayInChart;if(d==="true"){this.isChartVisible=true;s.setSelectedButton(this.getView().byId("btnChart"))}else{this.isChartVisible=false;s.setSelectedButton(this.getView().byId("btnTable"))}}else{this._unsubscribeEvents();this.oModel.detachRequestCompleted(this._onModelLoaded,this);this._hideChartContainer();var v=this.getView();v.setBindingContext(this.oNullModel);var I=this.getView().byId("infoToolBarCR");if(I){I.setVisible(false)}}},_getPathDetailView:function(){var m="";var s="";var a=this.oApplicationFacade.oApplicationImplementation.oConfiguration.getServiceList();for(var i in a){if(a[i].isDefault===true){m=a[i].masterCollection;s=a[i].serviceUrl}}var b=this.oApplicationFacade.oApplicationImplementation.aMasterKeys;var c=this.getView().getModel().getServiceMetadata().dataServices.schema;var d=new Array();for(var e in c){if(s.indexOf(c[e].namespace)>=0){var f=c[e].entityType;for(var g in f){if(f[g].name===m.substring(0,m.length-1)){for(var k in f[g].property){d.push(f[g].property[k].name)}}}}}b=d.filter(function(j){var l=0;for(l in b){var t=b[l];if(t===j){return true}}return false});var p="/"+m+"(";for(var h in b){if(this.navParameter[b[h]]!==" "){var r=/^[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/;if(r.test(this.navParameter[b[h]])){p+=b[h]+"=datetime'"+encodeURIComponent(this.navParameter[b[h]])+"',"}else{p+=b[h]+"='"+encodeURIComponent(this.navParameter[b[h]])+"',"}}else{p+=b[h]+"='"+""+"',"}}p=p.substring(0,p.length-1);p+=")";return p},_displayChangeRequestWarning:function(c){if(c){this.getView().byId("infoToolBarCR").setVisible(true)}else{this.getView().byId("infoToolBarCR").setVisible(false)}},onDisplayChangeRequests:function(e){if(!this._oChangeRequestList){this._oChangeRequestList=sap.ui.xmlfragment("i2d.pp.mrpcockpit.reuse.fragments.ChangeRequestList",this);this.getView().addDependent(this._oChangeRequestList)}var o=this.dMaterialID;var c=this.getView().getBindingContext();var O=c.getObject();this.dMaterialID=O.MaterialID;if(o!==this.dMaterialID){var a=new Array();a.push(new sap.ui.model.Filter("SolutionRequestStatus","EQ",this.Constants.REQUEST_STATUS_REQUESTED));a.push(new sap.ui.model.Filter("SolutionRequestStatus","EQ",this.Constants.REQUEST_STATUS_ANSWERED));a.push(new sap.ui.model.Filter("SolutionRequestStatus","EQ",this.Constants.REQUEST_STATUS_COLLECTED));a.push(new sap.ui.model.Filter("SolutionRequestStatus","NE",null));var b=new sap.ui.model.Filter(a,false);var d=new sap.ui.model.Filter("MaterialID","EQ",this.dMaterialID);var A=new Array();A.push(b);A.push(d);var f=new Array();f.push(new sap.ui.model.Filter(A,true));var l=sap.ui.getCore().byId("idChangeRequestTable");var L=l.getItems()[0];l.removeItem(L);this._oChangeRequestModel=this.oApplicationFacade.getODataModel();l.setModel(this._oChangeRequestModel,"ChangeRequests");var u='/ChangeRequests';l.bindAggregation("items",{path:u,filters:f,template:L})}var i=e.getSource();jQuery.sap.delayedCall(0,this,function(){this._oChangeRequestList.openBy(i)})},_updateSolutionCards:function(v){var c=v.byId("cards");var C=v.getBindingContext();if(!C){return}var s=C.getObject();var S=s.SolCard;var m=v.getModel();var a=new Array();for(var i=0;i<S.__list.length;i++){var k=S.__list[i];var o=m.oData[k];a.push(o)}var M=v.getModel("Common_i18n");c.setModel(M,"Common_i18n");c.addSolutionCards(a,s.MaterialShortageHasNoSolution);c.rerender()},_updateTableSupplyDemandItems:function(f,I){var c=this.getView().byId("shortages");var C=this.getView().getBindingContext();if(!C){return}var s=C.getObject();if(!I){I=this._readOriginSupDemItems()}var S=s.MaterialShortageStartDate;var d=s.MaterialShortageEndDate;for(var i=0;i<I.length;i++){if((I[i].MRPElementAvailyOrRqmtDate>=S)&&(I[i].MRPElementAvailyOrRqmtDate<=d)){I[i].StockQuantityVisible=true}else{I[i].StockQuantityVisible=false}}var p=C.getPath().substring(1);var D={};D[""+p]={SupDemItem:I};if(f){$(c.getDomRef()).fadeOut(function(){var m=c.getModel();m.setData(D);c.bindElement(C.getPath());c.updateAggregation("items");$(c.getDomRef()).fadeIn();c.setNoDataText(c.getModel('Common_i18n').getResourceBundle().getText("tableUpdateFinished"))})}else{var m=c.getModel();m.setData(D);c.bindElement(C.getPath());c.updateAggregation("items");c.setNoDataText(c.getModel('Common_i18n').getResourceBundle().getText("tableUpdateFinished"))}},_readOriginSupDemItems:function(){var c=this.getView().getBindingContext();if(!c){return}var s=c.getObject();var S=s.SupDemItem;var m=this.getView().getModel();var I=new Array();for(var i=0;i<S.__list.length;i++){var k=S.__list[i];var o=m.oData[k];I.push(o)}return I},_navBack:function(e){if(this._getPathDetailView!==undefined){var p=this._getPathDetailView().substring(1);var r=!jQuery.device.is.phone;this.oRouter.navTo(i2d.pp.mrpcockpit.reuse.util.CommonConstants.ROUTING.DETAIL,{contextPath:p,stateID:this.navParameter.stateID},r)}},onDialogOk:function(c,e,d){if(d&&d.model&&d.model.cardModel){this._oCard=null;var m="";if(d.model.cardModel.oData.msg){m=d.model.cardModel.oData.msg}else{var M=this.getView().getModel("Common_i18n");var b=M.getResourceBundle();m=b.getText("SOLUTION_DIALOG_OK")}sap.ca.ui.message.showMessageToast(m);this.requestChartData();var C=null;if(d.model.responseModel){C=this._readCreatedSupDemItemKey(d.model.responseModel,d.model.cardModel.oData.MaterialShortageSolutionType)}this._readSolutionViewData(true,C)}},_readCreatedSupDemItemKey:function(d,s){var D=null;var r=null;var o=null;try{D=d.__batchResponses[0].__changeResponses[0].data}catch(e){return null}switch(s){case this.Constants.SOLUTIONTYPE_PR_CREATE:r=D.MMPurchaseRequisitionItems.results[0];return{MRPElementCategory:this.Constants.MRP_ELEMENT_CATEGORY_PURRQS,MRPElement_Int:r.PurchaseRequisitionID,MRPElementItem_Int:r.ItemID,MRPElementScheduleLine_Int:""};case this.Constants.SOLUTIONTYPE_TOR_CREATE:r=D.MMPurchaseRequisitionItems.results[0];return{MRPElementCategory:this.Constants.MRP_ELEMENT_CATEGORY_PRQREL,MRPElement_Int:r.PurchaseRequisitionID,MRPElementItem_Int:r.ItemID,MRPElementScheduleLine_Int:""};case this.Constants.SOLUTIONTYPE_PO_CREATE:o=D.MMPurchaseOrderItems.results[0].MMPurchaseOrderScheduleLines.results[0];return{MRPElementCategory:this.Constants.MRP_ELEMENT_CATEGORY_POITEM,MRPElement_Int:o.PurchaseOrderID,MRPElementItem_Int:o.ItemID,MRPElementScheduleLine_Int:o.ScheduleLineID};case this.Constants.SOLUTIONTYPE_TO_CREATE:o=D.MMPurchaseOrderItems.results[0].MMPurchaseOrderScheduleLines.results[0];return{MRPElementCategory:this.Constants.MRP_ELEMENT_CATEGORY_RELORD,MRPElement_Int:o.PurchaseOrderID,MRPElementItem_Int:o.ItemID,MRPElementScheduleLine_Int:o.ScheduleLineID};default:return null}},_readSolutionViewData:function(w,n){var b=i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getServiceSchemaVersion(this.oApplicationFacade);if(b===1){this.path=i2d.pp.mrpcockpit.reuse.util.Wave3Helper.getPathSolutionView.call(this);this.view.bindElement(this.path,{"expand":'SolCard,SupDemItem'})}else{this.view.byId("oDataBindingServant").bindAggregation("items",{path:"/PPMRPSolHeaders",filters:this._createSolHeaderFilter(w,n,this.navParameter,this.dateStart,this.dateEnd),parameters:{expand:'SolCard,SupDemItem'},template:this.oTemplate})}},_createSolHeaderFilter:function(w,n,N,d,a){var f=new Array();f.push(new sap.ui.model.Filter('MaterialID',sap.ui.model.FilterOperator.EQ,N.MaterialID));f.push(new sap.ui.model.Filter('MRPPlant',sap.ui.model.FilterOperator.EQ,N.MRPPlant));f.push(new sap.ui.model.Filter('MRPArea',sap.ui.model.FilterOperator.EQ,N.MRPArea));f.push(new sap.ui.model.Filter('MRPPlanningSegmentType',sap.ui.model.FilterOperator.EQ,N.MRPPlanningSegmentType));f.push(new sap.ui.model.Filter('MRPPlanningSegmentNumber',sap.ui.model.FilterOperator.EQ,N.MRPPlanningSegmentNumber));f.push(new sap.ui.model.Filter('MaterialShortageDefinitionID',sap.ui.model.FilterOperator.EQ,N.MaterialShortageDefinitionID));f.push(new sap.ui.model.Filter('MaterialShortageStartDate',sap.ui.model.FilterOperator.EQ,d));if(a!==null){f.push(new sap.ui.model.Filter('MaterialShortageEndDate',sap.ui.model.FilterOperator.EQ,a))}else{f.push(new sap.ui.model.Filter('MaterialShortageEndDate',sap.ui.model.FilterOperator.EQ,"1753-01-01T12:00:00"))}if(w){var s=this._readOriginSupDemItems();if(n){s.push(n)}var F=new Array();var b=new Array();var c=new Array();var e=new Array();for(var i in s){F.push(s[i].MRPElementCategory);b.push(s[i].MRPElement_Int);c.push(s[i].MRPElementItem_Int);e.push(s[i].MRPElementScheduleLine_Int)}var A=new Array();A.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPElementCategory',F));A.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPElement',b));A.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPElementItem',c));A.push(i2d.pp.mrpcockpit.reuse.util.Helper.getORMultiFilter('MRPElementScheduleLine',e));f.push(new sap.ui.model.Filter(A,true))}return f},_previewRun:function(c,e,d,f){if(f===null||f===undefined){f=true}if(d&&d.model){this._oCard=d.model}if(!this._oCard){return}var v=this.getView();var m=v.getModel();var a=v.getBindingContext();if(!a){return}var s=a.getObject();var S=s.SupDemItem;if(S.__list.length===0){return}var M=[];for(var i=0;i<S.__list.length;i++){var k=S.__list[i];var C=jQuery.extend({},m.oData[k]);M.push(C)}var b=[];var g=[];var E="";var o=this.getView().getModel("Common_i18n");var B=o.getResourceBundle();var h=new i2d.pp.mrpcockpit.reuse.util.CalculationEngine(o);if(!this.isChartVisible){b=h.previewTable(M,this._oCard,s.MaterialShortageStartDate,s.MaterialShortageEndDate,new Date());switch(b[0]){case 0:g=b[1];E="";break;case-1:g=[];E=B.getText("PREVIEW_ERROR_NO_CARD");break;case-2:g=[];E=B.getText("PREVIEW_ERROR_DATE_INVALID");break;default:g=[];E=B.getText("PREVIEW_ERROR_UNKNOWN")}this._updateTableSupplyDemandItems(f,g);if(E){sap.ca.ui.message.showMessageBox({type:sap.ca.ui.message.Type.ERROR,message:B.getText("PREVIEW_ERROR_SHORT"),details:E})}}else{if(this._oCard.MaterialShortageSolutionType!==this.Constants.SOLUTIONTYPE_ACCEPT){this.addChartDelta(this._oCard)}var r=h.previewChart(this._oCard)}},_previewCancel:function(c,e,d){if(!this._oCard){return}this._oCard=null;if(!this.isChartVisible){this._updateTableSupplyDemandItems(true)}this.removeChartDelta()},onExit:function(){if(this.oCollaborationDialog&&this.oCollaborationDialog.isOpen()){this.oCollaborationDialog.close();this.oCollaborationDialog.destroy()}this._oCard=null;this._unsubscribeEvents();this.removeHandler();this.oApplicationFacade.deRegisterOnMasterListRefresh(this.onMasterRefresh,this);this.oRouter.detachRoutePatternMatched(this._onRoutePatternMatched,this);if(this._oChangeRequestList){var l=sap.ui.getCore().byId("idChangeRequestlistItem");if(l){l.destroy()}var L=sap.ui.getCore().byId("idChangeRequestTable");if(L){L.destroy()}var p=sap.ui.getCore().byId("idChangeRequestPopover");if(p){p.destroy()}this._oChangeRequestList.removeAllContent();this._oChangeRequestList.destroy()}},_getListTemplate:function(i,c){var C=true;var o=sap.ui.getCore();var a=i.split("--")[0];var v=o.getElementById(a);if(v){C=v.getController()._bCrIconClickable}var I=new sap.ui.core.Icon({visible:"{parts: [{path:'SolutionRequestStatus'}, {path:'MRPElementCategory'}, {path:'MRPElementOpenQuantity'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getChangeRequestVisibility'}",src:"sap-icon://BusinessSuiteInAppSymbols/icon-change-request",tooltip:"{parts: [{path:'SolutionRequestStatus'}, {path:'VendorResponse'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getChangeRequestTooltip'}"});if(C===true){I.attachPress(function(g){var E=i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.onCRPressed(g);if(E){sap.ca.ui.message.showMessageBox({type:sap.ca.ui.message.Type.ERROR,message:E})}})}var b=new sap.ui.core.Icon({visible:"{parts: [{path:'MRPElementQuantityIsFirm'}, {path:'MRPElementIsReleased'}, {path:'MRPElementIsPartiallyDelivered'}, {path:'MRPElementCategory'}, {path:'MRPElementOpenQuantity'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconSolViewVisible'}",tooltip:"{parts: [{path:'MRPElementQuantityIsFirm'}, {path:'MRPElementIsReleased'}, {path:'MRPElementIsPartiallyDelivered'}, {path:'MRPElementCategory'}, {path:'MRPElementOpenQuantity'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconSolViewTooltip'}",src:"{parts: [{path:'MRPElementQuantityIsFirm'}, {path:'MRPElementIsReleased'}, {path:'MRPElementIsPartiallyDelivered'}, {path:'MRPElementCategory'}, {path:'MRPElementOpenQuantity'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconSolView'}"});var t=new sap.m.ColumnListItem({unread:false,cells:[new sap.m.Label({text:"{path: 'MRPElementAvailyOrRqmtDate', type:'sap.ca.ui.model.type.Date', formatOptions: {style:'short'}}",visible:"{path:'MRPElementCategory', formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isSupplyDemandItem'}",customData:[new sap.ui.core.CustomData({key:"hideStockDate",value:"{parts: [{path:'MRPElementCategory'},{path:'MRPElementAvailyOrRqmtDate'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hideStockDate'}"})]}),new sap.ui.layout.HorizontalLayout({content:[b,I]}),new sap.m.ObjectIdentifier({title:"{parts:[{path: 'NumberOfRequirements'}, {path: 'MRPElementCategory'}, {path: 'MRPElementCategoryShortName'}, {path: 'MRPElement'}, {path: 'MRPElementItem'}, {path: 'MRPElementDocumentType'}, {path: 'SourceMRPElementCategory'}, {path: 'SourceMRPElement'}, {path: 'SourceMRPElementItem'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getRequirements'}",text:"{parts:[{path: 'NumberOfRequirements'}, {path: 'MRPElementCategory'}, {path: 'MRPElementBusinessPartnerName'}, {path: 'MRPElementBusinessPartnerType'}, {path: 'MRPElementBusinessPartnerID'}, {path: 'MRPElementDocumentType'}, {path: 'Assembly'}, {path: 'MaterialSafetyStockQty'}, {path: 'TargetQuantityUnitDcmls'}, {path: 'UnitOfMeasureTechnicalName'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.vendorOrReq'}"}),new sap.ui.layout.HorizontalLayout({content:[new sap.m.ObjectStatus({icon:"{parts:[{path: 'MRPElementOpenQuantity'}, {path: 'MRPElementCategory'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.sditemicon'}",state:"{parts:[{path: 'MRPElementOpenQuantity'}, {path: 'MRPElementCategory'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.sdIconState'}",tooltip:"{parts:[{path: 'MRPElementOpenQuantity'}, {path: 'MRPElementCategory'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.sditemtooltip'}"}),new sap.m.Text({width:"0.5rem"}),new sap.m.ObjectNumber({number:"{parts:[ {path: 'MRPElementOpenQuantity'}, {path: 'TargetQuantityUnitDcmls'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.quantity'}",numberUnit:"{UnitOfMeasureTechnicalName}",emphasized:false})]}).addStyleClass("sapMRPStockQty"),new sap.m.ObjectNumber({number:"{parts:[{path: 'MRPAvailableQuantity'}, {path: 'TargetQuantityUnitDcmls'}], formatter:'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.numberFormat'}",numberUnit:"{UnitOfMeasureTechnicalName}",visible:"{path: 'StockQuantityVisible'}",customData:{Type:"sap.ui.core.CustomData",key:"getMergingKey",value:"{parts:[{path:'MRPElementCategory'}, {path: 'MRPElementAvailyOrRqmtDate'}, {path: 'MRPAvailableQuantity'}], formatter: 'i2d.pp.mrpcockpit.reuse.util.CommonFormatter.availableQuantityMergingKey'}"}}).addStyleClass("sapMRPAvailableQuantity")]});var d=parseFloat(c.getProperty("MRPAvailableQuantity"));var e=parseFloat(c.getProperty("MaterialShortageCriticalQty"));var f=parseFloat(c.getProperty("MaterialShortageThresholdQty"));var O=c.getObject();t.removeStyleClass("sapMRPShortage");t.removeStyleClass("sapMRPShortageSolved");t.removeStyleClass("sapMRPElementChanged");t.removeStyleClass("sapMRPShortageAccepted");t.removeStyleClass("sapMRPShortageSafetyStock");if(O.MRPAvailability===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED){t.addStyleClass("sapMRPShortageAccepted")}else{if(O.ChangedMrpElement&&O.ChangedMrpElement===true){t.addStyleClass("sapMRPElementChanged")}else if((d<f)&&(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(O.MRPElementCategory)||(Number(O.MRPElementOpenQuantity)<0))){t.addStyleClass("sapMRPShortage")}else if((d<e)&&(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(O.MRPElementCategory)||(Number(O.MRPElementOpenQuantity)<0))){t.addStyleClass("sapMRPShortageSafetyStock")}else if((d>=e)&&(O.InitialShortage&&O.InitialShortage===true)){t.addStyleClass("sapMRPShortageSolved")}}return t},switchView:function(){this._previewRun(null,null,null,false)},switchToChart:function(f){this.isChartVisible=true;var c=this.getView().byId("shortages");var t=this;if(f){$(c.getDomRef()).fadeOut(function(){var a=t.getView().byId("solChartContainer");t._showChartContainer();$(a.getDomRef()).fadeIn(function(){if(t._oCard){t._previewRun(null,null,null,f)}else{t.removeChartDelta()}})})}else{t._showChartContainer();t._hideTable();this.removeChartDelta();if(t._oCard){t._previewRun(null,null,null,f)}}},switchToTable:function(f){this.isChartVisible=false;var c=this.getView().byId("solChartContainer");var t=this;if(f){$(c.getDomRef()).fadeOut(function(){if(t._oCard){t._previewRun(null,null,null,f)}else{t._updateTableSupplyDemandItems(f)}})}else{this._hideChartContainer();this._showTable();if(t._oCard){t._previewRun(null,null,null,f)}else{t._updateTableSupplyDemandItems(f)}}},_showTable:function(){var c=this.byId('shortages');c.setVisible(true)},_hideTable:function(){var c=this.byId('shortages');c.setVisible(false)},onToolbarIconSelect:function(e){var s=e.getSource();var b=s.getSelectedButton();if(b.match("btnChart")){this.switchToChart(false)}else{this.switchToTable(false)}},initChart:function(){var c=this.getView().byId("chart");this.oChartModel=new sap.ui.model.json.JSONModel();this.oChartModel.setSizeLimit(10000);c.setModel(this.oChartModel);var C=new i2d.pp.mrpcockpit.reuse.controls.ChartValue({date:"{date}",demand:"{demand}",supply:"{supply}",shortageAccepted:"{shortageAccepted}"});var b=this.getView().getModel("Common_i18n").getResourceBundle().getText("XTOL_BAL_DOT");c.setProperty("showOverview",true,true);c.setProperty("fixOverviewHeight",16,true);c.setProperty("minOverviewBarSize",0,true);c.setProperty("shiftLeft",-10,true);c.setProperty("height","300px",true);c.setProperty("width","100%",true);c.setProperty("minChartHeight","180px",true);c.setProperty("allowNavigation",false,true);c.setProperty("balanceDotTooltip",b);c.bindProperty("shiftLeft","/shiftLeft");c.bindProperty("unitDecimals","/decimals");c.bindProperty("startBalance","/startBalance");c.bindProperty("minStock","/minStock");c.bindProperty("safetyStock","/safetyStock");c.bindValues("/chartData",C)},requestChartData:function(){var p=this._getPathDetailView()+"/"+this.navParameter.DetailListNavProperty;this.getView().getModel().read(p,null,null,true,jQuery.proxy(this.processChartData,this),function(e){sap.ca.ui.message.showMessageBox({type:sap.ca.ui.message.Type.ERROR,message:"Chart cannot be displayed because the required data could not be retrieved",details:"Chart cannot be displayed because the required data could not be retrieved"})})},processChartData:function(d,r){var v=this.getView();var c=new i2d.pp.mrpcockpit.reuse.util.CalculationEngine(v.getModel("Common_i18n"));var m=c.initialChartData(r.data.__batchResponses[0].data.results,this.dateStart,this.dateEnd,this.chartScrollPos);this.oChartModel.setData(m);this.removeChartDelta(true)},addChartDelta:function(c){var C=new i2d.pp.mrpcockpit.reuse.util.CalculationEngine(this.getView().getModel("Common_i18n"));var p=C.previewChartData(c);var o=this.getView().byId("chart");o.setDeltas(p.deltas)},removeChartDelta:function(n){var c=this.getView().byId("chart");c.setDeltas([],n)},_revokeAcceptedShortage:function(m){var M=this.getView().getModel("Common_i18n");var b=M.getResourceBundle();var h={};h.fnSuccess=function(d,r,E){sap.ca.ui.utils.busydialog.releaseBusyDialog();if(E.length>0){var e=i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromBatchResponse(b,E);sap.ca.ui.message.showMessageBox({type:sap.ca.ui.message.Type.ERROR,message:b.getText("CARD_CANCEL_ACCEPTED_FAIL"),details:e});var a=sap.ui.getCore().getEventBus();a.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED,this.Constants.EVENT_EVENTID_ERROR,null)}else{this._readSolutionViewData(true,null);var s=b.getText("CARD_CANCEL_ACCEPTED");sap.ca.ui.message.showMessageToast(s);var a=sap.ui.getCore().getEventBus();a.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED,this.Constants.EVENT_EVENTID_OK,null)}}.bind(this);h.fnError=function(E){sap.ca.ui.utils.busydialog.releaseBusyDialog();var e="";if(E&&E.response&&E.response.body){e=i2d.pp.mrpcockpit.reuse.util.Helper.extractErrorMsgFromStream(b,E.response.body)}else{e=b.getText("SOLUTION_DIALOG_ERROR_UNKNOWN")}sap.ca.ui.message.showMessageBox({type:sap.ca.ui.message.Type.ERROR,message:b.getText("CARD_CANCEL_ACCEPTED_FAIL"),details:e});var a=sap.ui.getCore().getEventBus();a.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED,this.Constants.EVENT_EVENTID_ERROR,null)}.bind(this);sap.ca.ui.utils.busydialog.requireBusyDialog({text:b.getText("SOLUTION_DIALOG_MSG_SAVE_WAITING")});var e=i2d.pp.mrpcockpit.reuse.util.CollaborationHelper.deleteShortageAcceptBatch(m,h);if(e){sap.ca.ui.utils.busydialog.releaseBusyDialog();sap.ca.ui.message.showMessageBox({type:sap.ca.ui.message.Type.ERROR,message:b.getText(e)})}else{var a=sap.ui.getCore().getEventBus();a.publish(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED,this.Constants.EVENT_EVENTID_EXECUTE,null)}},onSolutionCardExecute:function(c,e,d){var v="";var o=d.model;var m=jQuery.extend({},o);var b=i2d.pp.mrpcockpit.reuse.util.InteroperabilityHelper.getServiceSchemaVersion(this.oApplicationFacade);if(b===1){i2d.pp.mrpcockpit.reuse.util.Wave3CollaborationHelper._mapOData3ToOdata5(m)}switch(m.MaterialShortageSolutionType){case this.Constants.SOLUTIONTYPE_ACCEPT:if(m.MaterialShortageEndDate.getTime()===new Date(9999,11,31,13).getTime()){var M=this.getView().getModel("Common_i18n");var B=M.getResourceBundle();sap.ca.ui.message.showMessageBox({type:sap.ca.ui.message.Type.ERROR,message:B.getText("CARD_ACCEPT_INFINITY")})}else{v="i2d.pp.mrpcockpit.reuse.fragments.DialogShortageAccept"}break;case this.Constants.SOLUTIONTYPE_ACCEPT_REMOVE:this._revokeAcceptedShortage(m);break;case this.Constants.SOLUTIONTYPE_PO_RESCHEDULE:case this.Constants.SOLUTIONTYPE_PO_INCREASE:case this.Constants.SOLUTIONTYPE_TO_RESCHEDULE:case this.Constants.SOLUTIONTYPE_TO_INCREASE:case this.Constants.SOLUTIONTYPE_PO_CHANGE:case this.Constants.SOLUTIONTYPE_TO_CHANGE:v="i2d.pp.mrpcockpit.reuse.fragments.DialogOrderChange";this.dMaterialID=null;break;case this.Constants.SOLUTIONTYPE_PO_CREATE:case this.Constants.SOLUTIONTYPE_TO_CREATE:case this.Constants.SOLUTIONTYPE_PR_CREATE:case this.Constants.SOLUTIONTYPE_TOR_CREATE:v="i2d.pp.mrpcockpit.reuse.fragments.DialogOrderCreate";break;case this.Constants.SOLUTIONTYPE_PR_RESCHEDULE:case this.Constants.SOLUTIONTYPE_PR_INCREASE:case this.Constants.SOLUTIONTYPE_TOR_RESCHEDULE:case this.Constants.SOLUTIONTYPE_TOR_INCREASE:case this.Constants.SOLUTIONTYPE_PR_CHANGE:case this.Constants.SOLUTIONTYPE_TOR_CHANGE:v="i2d.pp.mrpcockpit.reuse.fragments.DialogOrderReqChange";break;case this.Constants.SOLUTIONTYPE_PA_STOCK_CHANGE:case this.Constants.SOLUTIONTYPE_PA_VENDOR_CHANGE:case this.Constants.SOLUTIONTYPE_PA_UNSRC_CHANGE:case this.Constants.SOLUTIONTYPE_PA_PLANT_CHANGE:case this.Constants.SOLUTIONTYPE_PA_PROD_CHANGE:case this.Constants.SOLUTIONTYPE_PA_REPLANT_CHANGE:v="i2d.pp.mrpcockpit.reuse.fragments.DialogPlanOrderChange";break}if(v){var a=sap.ui.controller(v);this.oCollaborationDialog=sap.ui.xmlfragment(v,a);this.oCollaborationDialog.setModel(this.oApplicationImplementation.getApplicationModel("ServiceVersions"),"ServiceVersions");this.oCollaborationDialog.setModel(this.getView().getModel("Common_i18n"),"Common_i18n");this.oCollaborationDialog.setModel(new sap.ui.model.json.JSONModel(m));this.oCollaborationDialog.open()}},removeHandler:function(){if(jQuery.device.is.desktop){if(this.resizeHandler){sap.ui.core.ResizeHandler.deregister(this.resizeHandler);this.resizeHandler=null}}else{sap.ui.Device.orientation.detachHandler(this.onResize,this);sap.ui.Device.resize.detachHandler(this.onResize,this)}if(this.resizeTimer){jQuery.sap.clearDelayedCall(this.resizeTimer);this.resizeTimer=null}if(this.resizeFixHandler){jQuery.sap.clearDelayedCall(this.resizeFixHandler);this.resizeFixHandler=null}},resize:function(i){i2d.pp.mrpcockpit.reuse.util.Helper.resizeUiControls(this,i2d.pp.mrpcockpit.reuse.util.CommonConstants.VIEW_S4,i)},resizeFix:function(){jQuery.sap.log.debug("resize chart to ensure proper sizing");this.resize();this.resizeFixHandler=null},onResize:function(e){if(this.resizeTimer){jQuery.sap.clearDelayedCall(this.resizeTimer)}this.resizeTimer=jQuery.sap.delayedCall(200,this,jQuery.proxy(this.resize,this));var c=this.getView().byId("cards");c.updateSolutionCardContainerSize()},onBeforeRendering:function(){this.removeHandler()},onAfterRendering:function(){this.resize(this._initialOffset);this._initialOffset=0;jQuery.sap.delayedCall(500,this,jQuery.proxy(this._registerOnResize,this))},_registerOnResize:function(){var p=null;if(jQuery.device.is.desktop){var n=jQuery("#"+this.getView().getId()+"--"+"mainPage-cont");if(n&&n.length){p=n;if(p){this.resizeHandler=sap.ui.core.ResizeHandler.register(p[0],jQuery.proxy(this.onResize,this))}}}else{sap.ui.Device.orientation.attachHandler(this.onResize,this);sap.ui.Device.resize.attachHandler(this.onResize,this)}},onItemsUpdateStarted:function(e){var s=this.getView().byId("shortages");s.setNoDataText(this.getView().getModel("Common_i18n").getResourceBundle().getText("tableUpdateStarted"))},_hideChartContainer:function(){var c=this.byId('solChartContainer');c.setVisible(false)},_showChartContainer:function(){var c=this.byId('solChartContainer');c.setVisible(true)},onMasterRefresh:function(e){if(e.getParameter("bManualRefresh")===true){this._navBack(e)}}});
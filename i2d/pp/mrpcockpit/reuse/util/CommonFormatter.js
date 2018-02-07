/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.CommonFormatter");jQuery.sap.require("sap.ca.ui.model.format.DateFormat");jQuery.sap.require("sap.ca.ui.model.format.NumberFormat");jQuery.sap.require("sap.ca.ui.model.format.QuantityFormat");i2d.pp.mrpcockpit.reuse.util.CommonFormatter={hideQuantityBasedOnStatus:function(v,p,s){switch(Number(s)){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_ACCEPTED:return"";case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PENDING:if(v){return sap.ca.ui.model.format.NumberFormat.getInstance({decimals:p}).format(v)}return"";case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PROCESSED:return"";default:if(v===0.000){return""}else if(v){return sap.ca.ui.model.format.NumberFormat.getInstance({decimals:p}).format(v)}}},colorFormatObjectStatus:function(s,a,b){if((s=="")&&(a==0)&&(b==0)){return sap.ui.core.ValueState.Success}switch(Number(s)){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_SHORTAGE:return sap.ui.core.ValueState.None;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_ACCEPTED:return sap.ui.core.ValueState.Success;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PENDING:return sap.ui.core.ValueState.None;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_PROCESSED:return sap.ui.core.ValueState.Success;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MASTER_LIST_STATUS_NO_SHORTAGE:return sap.ui.core.ValueState.Success;default:return sap.ui.core.ValueState.None}},requestStatusIcon:function(r){if(r===i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_PENDING){return"sap-icon://pending"}else{return""}},requestStatusIconSolView:function(r,c,q){if(c===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK||(q<0)){return""}else{return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.requestStatusIcon(r)}},getSolutionDialogNotesVisible:function(d){if(d===i2d.pp.mrpcockpit.reuse.util.CommonConstants.SolutionDialogActivity_EXECUTE){return false}else{return true}},getChangeRequestVisibility:function(r,c,q){if(r===i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_REQUESTED||r===i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_ANSWERED||r===i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_COLLECTED){return true}else{return false}},getChangeRequestTooltip:function(r,v){if(r===i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_REQUESTED){this.addStyleClass("sapMRPIconNormal");return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_CREATED")}else if(r===i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_COLLECTED){this.addStyleClass("sapMRPIconNormal");return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_COLLECTED")}else if(r===i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_ANSWERED){switch(v){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_ACCEPTED:this.addStyleClass("sapMRPIconGreen");return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_ACCEPTED");case i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_REJECTED:this.addStyleClass("sapMRPIconRed");return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_REJECTED");case i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_PROPOSED:this.addStyleClass("sapMRPIconOrange");if(i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT){if(this.getModel('ServiceVersions')){var i=i2d.pp.mrpcockpit.reuse.util.Helper.getSpecialTextForFieldInt({sI18nID:"REQUEST_STATUS_TOOLTIP_PROPOSED",sSoHI18nID:"REQUEST_STATUS_TOOLTIP_PROPOSEDSoH",sModSI18nID:"REQUEST_STATUS_TOOLTIP_PROPOSEDModS",iServiceVersion:this.getModel('ServiceVersions').getData().iServiceSchemaVersion});return this.getModel('Common_i18n').getResourceBundle().getText(i)}}return this.getModel('Common_i18n').getResourceBundle().getText("REQUEST_STATUS_TOOLTIP_PROPOSED");default:this.addStyleClass("sapMRPIconNormal");return this.getModel('Common_i18n').getResourceBundle().getText("CARD_TIT_UNKNOWN")}}else{this.addStyleClass("sapMRPIconNormal");return""}},flagIconSrc:function(i,a,b){if(i){return"sap-icon://locked"}else if(b){return"sap-icon://BusinessSuiteInAppSymbols/icon-partially-delivered"}else if(a){return"sap-icon://BusinessSuiteInAppSymbols/icon-approved"}else{return""}},flagIconVisible:function(i,a,b){if(i){return true}else if(b){return true}else if(a){return true}else{return false}},flagIconTooltip:function(i,a,b,c){if(!c){c=this}if(i){return c.getModel('Common_i18n').getResourceBundle().getText("IS_FIRM")}else if(b){return c.getModel('Common_i18n').getResourceBundle().getText("IS_PARTIALLY_DELIVERED")}else if(a){return c.getModel('Common_i18n').getResourceBundle().getText("IS_RELEASED")}else{return""}},flagIconSolView:function(i,a,b,c,q){if(c===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK||(q<0)){return""}else{return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconSrc(i,a,b)}},flagIconSolViewVisible:function(i,a,b,c,q){if(c===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK||(q<0)){return false}else{return true}},flagIconSolViewTooltip:function(i,a,b,c,q){if(c===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK||(q<0)){return""}else{return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.flagIconTooltip(i,a,b,this)}},sditemicon:function(q,c){if((Number(q)==0)||i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(c)){return"sap-icon://BusinessSuiteInAppSymbols/icon-current-stock"}if(Number(q)<0){return"sap-icon://down"}else{return"sap-icon://up"}},sditemtooltip:function(q,c){if((Number(q)==0)||i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(c)){return this.getModel('Common_i18n').getResourceBundle().getText("XTOL_CURRENT_STOCK")}if(Number(q)<0){return this.getModel('Common_i18n').getResourceBundle().getText("XTOL_REQIREMENT_QTY")}else{return this.getModel('Common_i18n').getResourceBundle().getText("XTOL_RECEIPT_QTY")}},isShortage:function(v){if(v<0){return true}else{return false}},categoryLongName:function(c,a,n,i,d,s,b,e){switch(c){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_INDREQ:return a+" "+d;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SUBREQ:if(!e){return a+" "+b+" ("+s+")"}else{return a+" "+b+"-"+e+" ("+s+")"}break;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_ORDRES:return a+" "+b;default:if(!i){return a+" "+n}else{return a+" "+n+"-"+i}}},sdIconState:function(v,c){if((Number(v)==0)||i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(c)){return sap.ui.core.ValueState.None}if(Number(v)>0){return sap.ui.core.ValueState.Success}else{return sap.ui.core.ValueState.Error}},email:function(v){return"mailto:"+v},tel:function(v){if(v){v=v.replace(/[\s\-\[\]\/\{\}\(\)\*\?\.\\\^\$\|]/g,"");return"tel:"+v}return v},getVendorOrPlantLabel:function(s){switch(s){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_CREATE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_INCREASE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_RESCHEDULE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_CREATE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_INCREASE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_RESCHEDULE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PO_CHANGE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PR_CHANGE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_VENDOR_CHANGE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_UNSRC_CHANGE:return this.getModel('Common_i18n').getResourceBundle().getText("VENDOR");case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_CREATE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_INCREASE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_RESCHEDULE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_CREATE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_INCREASE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_RESCHEDULE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TO_CHANGE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_TOR_CHANGE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_PLANT_CHANGE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_REPLANT_CHANGE:return this.getModel('Common_i18n').getResourceBundle().getText("PLANT");case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_STOCK_CHANGE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.SOLUTIONTYPE_PA_PROD_CHANGE:return this.getModel('Common_i18n').getResourceBundle().getText("PRODUCTION_SUPERVISOR")}},getVendorOrPlantName:function(p,n){if(p){if(n){return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_PARENTHESIS",[p,n])}else{return p}}else if(n){return n}else{return this.getModel('Common_i18n').getResourceBundle().getText("NOT_YET_DETERMINED")}},quantity:function(q,p){var v=Math.abs(q);return sap.ca.ui.model.format.NumberFormat.getInstance({decimals:p}).format(v)},stockQuantity:function(q,p){var a=Number(q);return sap.ca.ui.model.format.NumberFormat.getInstance({decimals:p}).format(a)},stockQuantitySolView:function(q,p,u){var a=i2d.pp.mrpcockpit.reuse.util.CommonFormatter.stockQuantity(q,p);return a+" "+u},isRequisition:function(c){if((c==i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS)||(c==i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRQREL)){return true}return false},isNoRequisition:function(c){return!i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isRequisition(c)},isSupplyDemandItem:function(c){return!i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(c)},isStockItem:function(c){return(c===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK)},hideStockDate:function(c,d){if(d&&!i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isStockItem(c)){return d.toLocaleDateString()}else{return""}},availableQuantityMergingKey:function(c,d,q){if(c===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK){return c+d+q}return d+q},dateTo:function(d,a){var b=(new sap.ca.ui.model.type.Date()).oOutputFormat.format(d,{style:'medium'});var c=(new sap.ca.ui.model.type.Date()).oOutputFormat.format(a,{style:'medium'});return this.getModel('Common_i18n').getResourceBundle().getText("DATE_TO",[b,c])},vendorOrReq:function(r,c,n,t,b,d,a,s,p,u){if(Number(r)>0){return""}else{return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getBusinessPartnerName(c,n,t,b,d,a,s,p,u,this)}},formatDayValue:function(d){if(d&&(d==1)){return this.getModel('Common_i18n').getResourceBundle().getText("ONE_DAY")}else if(d&&(d>1)){return this.getModel('Common_i18n').getResourceBundle().getText("DAYS",[d])}else{return""}},formatBooleanValue:function(b,c){if(!c){c=this}if(b){return c.getModel('Common_i18n').getResourceBundle().getText("YES_TEXT")}else{return c.getModel('Common_i18n').getResourceBundle().getText("NO_TEXT")}},getRequirements:function(r,c,a,n,i,d,s,b,e){if(Number(r)>0){return this.getModel('Common_i18n').getResourceBundle().getText("REQUIREMENT_COUNT",[r])}return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.categoryLongName(c,a,n,i,d,s,b,e)},getBusinessPartnerName:function(c,n,t,b,d,a,s,p,u,e){if(!e){e=this}var f=e.getModel('Common_i18n').getResourceBundle().getText("UNSOURCED");var g=e.getModel('Common_i18n').getResourceBundle().getText("PLANT_LONG",[b,n]);var h=0;switch(c){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK:if(Number(s)>0){h=i2d.pp.mrpcockpit.reuse.util.CommonFormatter.stockQuantity(s,p);return e.getModel('Common_i18n').getResourceBundle().getText("SAFETY_STOCK",[h,u])}else{return e.getModel('Common_i18n').getResourceBundle().getText("NO_SAFETY_STOCK")}case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_POITEM:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SHPGNT:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SCHLNE:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_RETURN:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STTRES:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_TRNRES:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_RELORD:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRQREL:if(t===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_SUPPLIER||t===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_CUSTOMER){return n}else if(t===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_ISSUINGLOC||t===i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_BUSINESSPARTNERTYPE_RECEIVLOC){return g}else{return f}break;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_CUSORD:if(!n){return f}else{return n}break;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRCORD:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PRDORD:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PMORDR:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_NTWORD:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PLDORD:return d;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_SUBREQ:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_DEPREQ:case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_ORDRES:return a;default:return""}},hasValue:function(){for(var i in arguments){if(arguments[i]&&!(/^\s*$/.test(arguments[i]))&&(Number(arguments[i])!==0)){return true}}return false},hasValueAll:function(v,a){if((!v||/^\s*$/.test(v)||(Number(v)==0))||(!a||/^\s*$/.test(a)||(Number(a)==0))){return false}return true},hasFirstValueOnly:function(v,a){if(((v&&!/^\s*$/.test(v))||(Number(v)!=0))&&(!a||/^\s*$/.test(a)||(Number(a)==0))){return true}return false},colorFormatStockStatus:function(s){switch(s){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE:return sap.ui.core.ValueState.None;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_SAFETYSTOCK:return sap.ui.core.ValueState.Warning;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_BELOWZERO:return sap.ui.core.ValueState.Error;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED:return sap.ui.core.ValueState.None;default:return sap.ui.core.ValueState.None}},formatLineBreak:function(t){if(t){var a=t.split(" ");var s=a[0]+"\n"+a.slice(1).join(" ");return s}else{return""}},numberFormat:function(n,d){return sap.ca.ui.model.format.NumberFormat.getInstance({decimals:d}).format(n)},numberWithNoLeadingZeros:function(n){if(n&&typeof(n)==="string"){return n.replace(/^0*((?:[1-9]\d*)|0)$/,"$1")}else{return n}},formatDateShort:function(d){if(d){return sap.ca.ui.model.format.DateFormat.getDateInstance({style:"short"}).format(d)};return""},formatQuantity:function(v,p,u){if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(v)){if(u){var f=sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(v,u,p);return f+" "+u};return v};return""},formatQuantityMultiplyMinusOne:function(v,p,u){if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(v)){if(u){var f=sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(v,u,p);var m=f*(-1);return m+" "+u};var m=f*(-1);return m};return false},formatQuantityWithSign:function(v,p,u){if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(v)){if(u){var f=sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(v,u,p);if(v>0){return"+"+f+" "+u}else{return f+" "+u}};if(v>0){return"+"+v}else{return v}};return""},formatMinMaxQuantity:function(m,a,p,u){var b=i2d.pp.mrpcockpit.reuse.util.CommonFormatter.formatQuantity(m,p,u);var c=i2d.pp.mrpcockpit.reuse.util.CommonFormatter.formatQuantity(a,p,u);if(((m==0)||(m==null))&&((a==0)||(a==null))){return""}else if((((m==0)||(m==null))&&((a>0)||(a>null)))||(((m>0)||(m>null))&&((a==0)||(a=null)))){return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_BLANK",[b,c])}else{return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_SLASH",[b,c])}},formatRatioInPct:function(v,p){if((v!=null)&&(p!=null)){var f=sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(v,p);return f+" "+"%"};return v+" "+"%"},formatTitle:function(t,a){if((t===null)||(t==="")){return a}else{return t}},formatText:function(t,a){if((t===null)||(t==="")){return null}else{return a}},visibleOnlyOnDesktop:function(){if(sap.ui.Device.system.desktop){return true}else{return false}},getPartialDelivery:function(p,n){if(p&&n){return this.getModel('Common_i18n').getResourceBundle().getText("PARTIAL_DELIVERY",[p,n])}else if(p&&!n){return p}else{return""}},getTextPairWithParenthesis:function(m,a,c){if(!c){c=this}if(m&&a){return c.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_PARENTHESIS",[m,a])}else if(m&&!a){return m}else if(!m&&a){return a}else{return""}},getTextPairWithDash:function(m,a){if(m&&a){return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_DASH",[m,a])}else if(m){return m}else if(a){return a}else{return""}},getTextPairWithSlash:function(f,s){if(f&&s){return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_SLASH",[f,s])}else if(f){return f}else if(s){return s}else{return""}},getBooleanPairWithSlash:function(f,s){f=i2d.pp.mrpcockpit.reuse.util.CommonFormatter.formatBooleanValue(f,this);s=i2d.pp.mrpcockpit.reuse.util.CommonFormatter.formatBooleanValue(s,this);return this.getModel('Common_i18n').getResourceBundle().getText("TUPEL_WITH_SLASH",[f,s])},getAlternativeText:function(s,t,T,a,b,c,d){if(i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT){var i,I,e;if(s){i=t;I=(a)?a:i;e=(c)?c:i}else{i=T;I=(b)?b:i;e=(d)?d:i}if(!this.getModel('ServiceVersions')){return i}else if(this.getModel('ServiceVersions').getData().iServiceSchemaVersion===i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S){return e}else{return I}}return(s)?t:T},getTextOutOf3Alternatives:function(s,S,t,T,a,b,c){if(s){return t}else if(S){if(i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT){if(!this.getModel('ServiceVersions')){return T}else if(this.getModel('ServiceVersions').getData().iServiceSchemaVersion===i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S){return c}else{return b}}return T}else{return a}},getPurchaseDocumentText:function(c,p,a){if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.isRequisition(c)){return p}else{return a}},getMRPAreaOrPlant:function(m,p,c){if(!c){c=this}if(p&&(!m||m===p)){return c.getModel('Common_i18n').getResourceBundle().getText("PLANT_WITH_ID",[p])}else if(m){return c.getModel('Common_i18n').getResourceBundle().getText("MRPAREA_WITH_ID",[m])}else{return""}},getMRPAreaOrPlantLabel:function(m,p,c){if(!c){c=this}if(p&&(!m||m===p)){return c.getModel('Common_i18n').getResourceBundle().getText("PLANT")}else if(m){return c.getModel('Common_i18n').getResourceBundle().getText("MRPAREA")}else{return""}},getMaterialWithPlant:function(m,a,p){var b=i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getMRPAreaOrPlant(a,p,this);return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getTextPairWithParenthesis(m,b,this)},getMaterialWithPlantTooltip:function(m,p){var a=i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getMRPAreaOrPlantLabel(m,p,this);return this.getModel('Common_i18n').getResourceBundle().getText("MATERIAL_NUMBER_PLANT_TOOLTIP",[a])},formatPlantController:function(n,i){if(n&&i){return n+" ("+i+")"}else if(n){return n}else if(i){return i}else{return null}},allowSolutionNavigation:function(m,a,d,b){if(b===1){if(m!==i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE&&a!==i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_STOCK){return true}else{return false}}else{return d}},showStockNavigation:function(m,a,d,b){return i2d.pp.mrpcockpit.reuse.util.CommonFormatter.allowSolutionNavigation(m,a,d,b)},stockCSSClass:function(m){switch(m){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_NOSHORTAGE:return"sapMRPStockNoShortage";case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_SAFETYSTOCK:return"sapMRPShortageSafetyStock";case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_BELOWZERO:return"sapMRPShortage";case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_AVAILABILITY_ACCEPTED:return"sapMRPShortageAccepted";default:return"sapMRPStockNoShortage"}},formatDateLong:function(d){if(d){return sap.ca.ui.model.format.DateFormat.getDateInstance({style:"long"}).format(d)}},textStockAvailability:function(a){return this.getModel('Common_i18n').getResourceBundle().getText("VisualStatusForecast",['21'])},lapseOfStockAvailability:function(T){return this.getModel('Common_i18n').getResourceBundle().getText(T,['21'])},deleteFirstLeadingZeros:function(n){if(n){if(n==0){return"0"}}else{return""}},formatDelay:function(n){if(n){if(n==0){return this.getModel('Common_i18n').getResourceBundle().getText("DAYS",[0])}else if((n==1)||(n==-1)){return this.getModel('Common_i18n').getResourceBundle().getText("DAY",[n.replace(/^(0+)/g,'')])}else if(n>0){return this.getModel('Common_i18n').getResourceBundle().getText("DAYS",[n.replace(/^(0+)/g,'')])}else{return this.getModel('Common_i18n').getResourceBundle().getText("DAYS",[n])}}else{return""}},formatDelayInt:function(n){if(n==0){return this.getModel('Common_i18n').getResourceBundle().getText("DAYS",[0])}else if((n==1)||(n==-1)){return this.getModel('Common_i18n').getResourceBundle().getText("DAY",[n])}else{return this.getModel('Common_i18n').getResourceBundle().getText("DAYS",[n])}},formatTimeShort:function(d){if(d){return sap.ca.ui.model.format.DateFormat.getTimeInstance({style:"short"}).format(d)}return""},getQVEditButtonText:function(c,C){switch(c){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_PURRQS:return this.getModel('Common_i18n').getResourceBundle().getText("QV_PR_EditButton");case i2d.pp.mrpcockpit.reuse.util.CommonConstants.MRP_ELEMENT_CATEGORY_POITEM:if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.getChangeRequestVisibility(C)){return this.getModel('Common_i18n').getResourceBundle().getText("QV_CR_EditButton")}else{return this.getModel('Common_i18n').getResourceBundle().getText("QV_PO_EditButton")}break;default:return""}},joinedByHyphen:function(v,a){return v+"-"+a},isValueGreaterEqualZero:function(v){var l=Math.round(v);if(l>=0){return true}else{return false}},formatQuantityAlways:function(v,p,u){if(u){var f=sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(v,u,p);return f+" "+u};return v},formatDayValueAlways:function(d){if(d&&(d==1)){return this.getModel('Common_i18n').getResourceBundle().getText("ONE_DAY")}else if(d&&(d>1)){return this.getModel('Common_i18n').getResourceBundle().getText("DAYS",[d])}else{return this.getModel('Common_i18n').getResourceBundle().getText("DAYS",[d])}},formatMinMaxQuantityText:function(m,a){if((m>0)&&(a>0)){return this.getModel('Common_i18n').getResourceBundle().getText("MIN_MAX_LOT_SIZE")}else if((m>0)&&(a<1)){return this.getModel('Common_i18n').getResourceBundle().getText("xfldMaterialMinLotSizeQty")}else if((m<1)&&(a>0)){return this.getModel('Common_i18n').getResourceBundle().getText("xfldMaterialMaxLotSizeQty")}else{return this.getModel('Common_i18n').getResourceBundle().getText("MIN_MAX_LOT_SIZE")}},releaseVisibleCheck:function(v,t){if(!t){t=this}var V=t.getModel('ServiceVersions').getData().iServiceSchemaVersion;if(V===i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S){return false}else{return true}},visibleForModelS:function(v,t){if(!t){t=this}var V=t.getModel('ServiceVersions').getData().iServiceSchemaVersion;if(V===i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S){return true}else{return false}},visibleCheck:function(){if((i2d.pp.mrpcockpit.reuse.util.CommonFormatter.visibleOnlyOnDesktop()===false)||(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.releaseVisibleCheck(null,this)===false)){return false}else{return true}},VisibleCheckPONavigation:function(){if((i2d.pp.mrpcockpit.reuse.util.CommonFormatter.visibleOnlyOnDesktop()===false)&&(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.releaseVisibleCheck(null,this)===true)){return false}else{return true}},formatVersionTextSoHVsSLog:function(t,a,b){if(i2d.pp.mrpcockpit.reuse.util.CommonConstants.ONE_CODELINE_TEXT){if(!this.getModel('ServiceVersions')){return a}else if(this.getModel('ServiceVersions').getData().iServiceSchemaVersion===i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S){return b}else{return a}}else{return t}},formatTextSoHVsSLog:function(t,a){if(!this.getModel('ServiceVersions')){return t}else if(this.getModel('ServiceVersions').getData().iServiceSchemaVersion===i2d.pp.mrpcockpit.reuse.util.CommonConstants.BACKEND_MODEL_S){return a}else{return t}},formatLAMA:function(m){if(m!==null){var t="OxOxOxOxOxOxOxOxO-";return m+"-"+t.slice(m.length-1)+"TestLongMaterialNumber"}},formatDateDaysAgo:function(d){if(d){return sap.ca.ui.model.format.DateFormat.getDateInstance({style:"daysAgo"}).format(d)};return""},formatStatusState:function(s,v){var V="None";switch(s){case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_REQUESTED:V="Error";break;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_APPLIED:V="Success";break;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_DISCARDED:V="Error";break;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_ANSWERED:if(v===i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_ACCEPTED){V="Success"}else if(v===i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_REJECTED){V="Error"}else if(v===i2d.pp.mrpcockpit.reuse.util.CommonConstants.VENDOR_RESPONSE_PROPOSED){V="Warning"}break;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_COLLECTED:V="None";break;case i2d.pp.mrpcockpit.reuse.util.CommonConstants.REQUEST_STATUS_CLOSED:V="None";break;default:V="None"}return V},getIsEditButtonVisible:function(M){if(M==='X'){return true}else{return false}},noMatchedValue:function(v,n){if(v&&n){if(v===n){return false}return true}},catNotAllowedAndHasValue:function(v,c,n){if(c&&n){if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.noMatchedValue(c,n)){if(i2d.pp.mrpcockpit.reuse.util.CommonFormatter.hasValue(v)){return true}return false}return false}}};

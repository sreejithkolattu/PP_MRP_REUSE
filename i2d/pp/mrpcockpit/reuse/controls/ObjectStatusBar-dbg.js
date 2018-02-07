/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
/* ==|==  Object Status Bar (JS) ==========================================================
 *
 *  Custom Control to extend functionality of the current sap.m.ObjectStatus
 *  Designed to create several icon statuses in a line (bar)
 *  @see sap.m.ObjectStatus
 *  @see ObjectStatus.css
 * author: SAP AG
 * version: 26.05.2014
 * ============================================================
 */

//"use strict";
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.controls.ObjectStatusBar");

sap.m.ObjectStatus
		.extend(
				"i2d.pp.mrpcockpit.reuse.controls.ObjectStatusBar",
				{
							/**
							 * @memberOf i2d.pp.mrpcockpit.reuse.controls.ObjectStatusBar
							 */
							metadata : {												
								aggregations: {
									layout: {type: "sap.ui.layout.HorizontalLayout", hidden: true, multiple: false},
									content : {type : "sap.m.ObjectStatus",	multiple : true},				
								},
							},
							
							
							init : function() {
								this.setAggregation("layout", new sap.ui.layout.HorizontalLayout());
							},
							
							addContent : function(oStatus) {
								return this.getAggregation("layout").addContent(oStatus);
							},
							
							removeContent : function(oStatus) {
								return this.getAggregation("layout").removeContent(oStatus);
							},
							
							destroyContent : function(oStatus) {
								return this.getAggregation("layout").destroyContent(oStatus);
							},

							indexOfContent : function(oStatus) {
								return this.getAggregation("layout").indexOfContent(oStatus);
							},

							removeAllContent : function() {
								return this.getAggregation("layout").removeAllContent();
							},
							
							
							/**
							 * renders layout aggregation inside html container
							 */
							renderer : function(r, o) {
								r.write("<div"); r.writeControlData(o);	r.addClass("sapMRPObjStatusBar"); r.writeClasses(); r.write(">");
								r.renderControl(o.getAggregation("layout"));
								r.write("</div>");
							},
						}); // end control


/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
/* ==|==  Object Identifier (JS) ==========================================================
 *
 *  Custom Control to extend functionality of the current sap.m.ObjectIdentifier
 *  @see sap.m.ObjectIdentifier
 *
 * author: SAP AG
 * version: 05.05.2014
 * ============================================================
 */

//"use strict";
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.controls.ObjectIdentifier");

sap.m.ObjectIdentifier
		.extend(
				"i2d.pp.mrpcockpit.reuse.controls.ObjectIdentifier",
				{
					/**
					 * @memberOf i2d.pp.mrpcockpit.reuse.controls.ObjectIdentifier
					 */
					
					metadata : {
						aggregations : {
							"link"	:  {type : "sap.m.Link", multiple : false, singularName: "link"}
						},
						defaultAggregation: "link"
					},
					
					/**
					 * if supplied link is enabled - uses the modified ObjectIdentifierRenderer (version 1.19.1)
					 * if supplied link is not enabled - uses the parent renderer
					 */
					renderer : function(r, o) {						
						var oLink = o.getAggregation("link");						
						if (oLink && oLink.getEnabled()) {
							// use parent renderer from 1.19 with Link instead of Title
							r.write("<div");
							r.writeControlData(o);
							r.addClass("sapMObjectIdentifier sapMRPObjectIdentifier");
							r.writeClasses();
							r.write(">");
							r.write("<div");
							r.addClass("sapMObjectIdentifierTopRow");
							r.writeClasses();
							r.write(">");
							r.write("<div");
							r.addClass("sapMObjectIdentifierIcons");
							r.writeClasses();
							r.write(">");
							if(o.getBadgeAttachments()){
								r.write("<span");
						  	r.addClass("sapMObjectIdentifierIconSpan");
						  	r.writeClasses();
							  r.write(">");
						  	r.renderControl(o._getAttachmentsIcon());
						  	r.write("</span>");
						  }
							if(o.getBadgeNotes()){
								r.write("<span");
						  	r.addClass("sapMObjectIdentifierIconSpan");
						  	r.writeClasses();
						  	r.write(">");
						  	r.renderControl(o._getNotesIcon());
					  		r.write("</span>");
					  	}
							if(o.getBadgePeople()){
								r.write("<span");
							  r.addClass("sapMObjectIdentifierIconSpan");
						  	r.writeClasses();
						  	r.write(">");
						  	r.renderControl(o._getPeopleIcon());
						  	r.write("</span>");
						  }
							r.write("</div>");
							r.write("<div");
							r.addClass("sapMObjectIdentifierTitle");
							r.writeClasses();
							r.write(">"); 
							r.renderControl(oLink);  
							/*r.writeEscaped(o.getTitle());*/ 
							r.write("</div>");
							r.write("</div>");
							r.write("<div");
							r.addClass("sapMObjectIdentifierText");
							r.writeClasses();
							r.write(">");
							r.writeEscaped(o.getText());
							r.write("</div>");
							r.write("</div>");						
						} else {
							// use parent renderer
							sap.m.ObjectIdentifierRenderer.render(r, o);							
						}
					},
				}); // end control




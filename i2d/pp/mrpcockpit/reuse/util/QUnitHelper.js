/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.util.QUnitHelper");i2d.pp.mrpcockpit.reuse.util.QUnitHelper={mockInfrastructure:function(){var i={};i.getImpl=function(){var a={};var c={};var A={};A.getResourceBundle=function(){var b={};b.getText=function(){var t='Text';return t};return b};c.oApplicationFacade=A;a.oConfiguration=c;var h={};h.defineMasterHeaderFooter=function(){};a.oMHFHelper=h;return a};sap.ca.scfld.md.app.Application=i}};

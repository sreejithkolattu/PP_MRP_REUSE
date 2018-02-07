/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("i2d.pp.mrpcockpit.reuse.controls.Chart");
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.controls.ChartValue");
jQuery.sap.require("sap.ui.thirdparty.d3");
jQuery.sap.require("sap.m.MessageToast");

sap.ui.core.Control
		.extend(
				"i2d.pp.mrpcockpit.reuse.controls.Chart",
				{
					metadata : {
						properties : {
							minBarSize : {
								type : "int",
								defaultValue : 19
							},
							minOverviewBarSize : {
								type : "float",
								defaultValue : 2
							},
							height : {
								type : "sap.ui.core.CSSSize",
								defaultValue : "240px"
							},
							width : {
								type : "sap.ui.core.CSSSize",
								defaultValue : "240px"
							},
							minChartHeight : {
								type : "sap.ui.core.CSSSize",
								defaultValue : "240px"
							},
							fixOverviewHeight : {
								type : "int",
								defaultValue : 0
							},
							showOverview : {
								type : "boolean",
								defaultValue : true
							},
							shiftLeft : {
								type : "float",
								defaultValue : 0
							},
							allowNavigation : {
								type : "boolean",
								defaultValue : false
							},
							// noNavigationText will be provided as Message Toast when the
							// user tries to navigate with the chart
							// leave the text empty(default) if no Message Toast shall be provided
							noNavigationText : {
								type : "string",
								defaultValue : ""
							},
							unitDecimals : {
								type : "int",
								defaultValue : 0
							},
							startBalance : {
								type : "float",
								defaultValue : 0
							},
							minStock : {
								type : "float",
								defaultValue : 0
							},
							safetyStock : {
								type : "float",
								defaultValue : 0
							},
							minDate : "string",
							maxDate : "string",
							balanceDotTooltip : {
								type : "string",
								defaultValue : ""
							}
						},
						aggregations : {
							values : {
								type : "i2d.pp.mrpcockpit.reuse.controls.ChartValue",
								multiple : true,
								singularName : "value",
								bindable : "bindable"
							},
							deltas : {
								type : "i2d.pp.mrpcockpit.reuse.controls.ChartValue",
								multiple : true,
								singularName : "delta",
								bindable : "bindable"
							}
						},
						events : {
							"selected" : {}
						},
						defaultAggregation : "values"
					},

					/**
					 * Init the chart control
					 * 
					 * @memberOf Chart
					 */
					init : function() {

						jQuery.sap.require("sap.ca.ui.model.format.DateFormat");
						jQuery.sap.require("sap.ca.ui.model.format.QuantityFormat");

						// Date format used in the chart
						this._oChartFormatter = sap.ca.ui.model.format.DateFormat.getDateInstance({
							style : 'short'
						});

						// The attribute this._dataset contains the information what type of chart is currently being displayed,
						// either "basic" for the standard chart or "preview" for the preview chart
						this._dataset = "basic";

						// Duration of an animation between basic view and preview (see also this.setDeltas())
						this._duration = 2000;

						// Chart settings used to create the SVG, calculated in this.calcChartSettings() and
						// this.calcOverviewSettings()
						this._oChartSettings = {};
						this._oOverviewSettings = {};

						// Scroll-buttons in chart overview
						this._ovrBtnLeft = new sap.ui.core.Icon({
							id : this.getId() + "-ovrBtnLeft",
							src : "sap-icon://navigation-left-arrow"
						});
						this._ovrBtnRight = new sap.ui.core.Icon({
							id : this.getId() + "-ovrBtnRight",
							src : "sap-icon://navigation-right-arrow"
						});
					},

					exit : function() {

						// remove delayed call if applicable
						this.removeHandler();
					},

					removeHandler : function() {

						if (this._triggerDeltaDisplay) {
							jQuery.sap.clearDelayedCall(this._triggerDeltaDisplay);
							this._triggerDeltaDisplay = null;
						}
					},

					/**
					 * If deltas are supplied this function adds these data to the chart and displays the preview. If no deltas
					 * are supplied this function removes the delta data from the chart and displays the basic view of the chart.
					 * 
					 * @param aDeltas
					 * @param bNoAnimation
					 */
					setDeltas : function(aDeltas, bNoAnimation) {

						var handleDelayedDeltas = function() {
							this.setDeltas(aDeltas);
						};

						var overview = d3.select("#" + this.getId() + "-overview-chartArea svg").remove();
						var chart = d3.select("#" + this.getId() + "-chartArea svg").remove();
						var axis = d3.select("#" + this.getId() + "-backgroundArea svg").remove();

						var l = (aDeltas && aDeltas.length) ? aDeltas.length : 0;
						var currDeltaLen = this.getDeltas().length;
						var bPreviewShown = (currDeltaLen > 0) && (this._dataset === "preview");

						// ensure that no old delayed call remains
						this.removeHandler();

						// if deltas are set but no ones already exist
						if ((l > 0) && !bPreviewShown) {

							this.removeAllAggregation("deltas", true);

							for ( var i = 0; i < l; i++) {
								this.addAggregation("deltas", new i2d.pp.mrpcockpit.reuse.controls.ChartValue({
									date : aDeltas[i].date,
									demand : aDeltas[i].demand,
									supply : aDeltas[i].supply
								}), true);
							}

							// first render the chart in basic view and then animate the change
							this.calcChartSettings("basic");
							this.calcChartSettings("preview");
							this.calcOverviewSettings("basic");
							this.calcOverviewSettings("preview");

							if (!bNoAnimation) {
								this.renderChart();
								this.updateChart();
							} else {
								this.renderChart("preview");
							}
							this._dataset = "preview";

						} else {
							var originalDuration = this._duration;

							// otherwise we remove the deltas and display the basic view
							if (bPreviewShown && !bNoAnimation) {
								// in case we have to switch between one preview to the next one
								// we have to speed up a little bit
								this._duration /= 2;
							}

							// So first render the chart in the preview view and then animate the change
							// back to the basic view
							this.calcChartSettings("basic");
							this.calcChartSettings("preview");
							this.calcOverviewSettings("basic");
							this.calcOverviewSettings("preview");

							if (!bNoAnimation) {
								this.renderChart("preview");
								this.updateChart("basic");
							} else {
								this.renderChart("basic");
							}
							this._dataset = "basic";

							this.removeAllAggregation("deltas", true);

							// in case new deltas are to displayed we have to set those deltas now.
							// But to ensure a proper animation we need to do this with a delay
							if ((l > 0) && bPreviewShown && !bNoAnimation) {
								this.removeHandler();
								// this call will animate from basic chart to the new preview chart with a delay,
								// i.e. after the animation from current preview to basic chart has finished
								this._triggerDeltaDisplay = jQuery.sap.delayedCall(this._duration, this, jQuery.proxy(
										handleDelayedDeltas, this));
							}
							this._duration = originalDuration;
						}
					},

					setHeight : function(height, bSuppressInvalidate) {

						this.setProperty("height", height, true);
						if (!bSuppressInvalidate) {
							this.resizeChart();
						}
					},

					setWidth : function(width, bSuppressInvalidate) {

						this.setProperty("width", width, true);
						if (!bSuppressInvalidate) {
							this.resizeChart();
						}
					},

					/**
					 * @param iDay -
					 *          index in the array of values
					 * @returns the date corresponding to iDay
					 */
					getDate : function(iDay) {

						var aValues = this.getValues();
						var oDate = "";

						// get the date on the requested day
						if (aValues && (aValues.length > iDay) && (iDay >= 0) && (iDay === parseInt(iDay))) {
							oDate = new Date(aValues[iDay].getDate());
						}

						return oDate;
					},

					/**
					 * @param iDay -
					 *          index in the array of values
					 * @returns the formatted date corresponding to iDay
					 */
					getDateFormatted : function(iDay) {

						return this.formatDate(this.getDate(iDay));
					},

					/**
					 * @param oDate -
					 *          the date to format
					 * @returns the formatted date
					 */
					formatDate : function(oDate) {

						if (oDate) {
							return this._oChartFormatter.format(oDate);
						}
						return "";
					},

					/**
					 * This function is used to format all numbers in the chart
					 * 
					 * @param fNumber -
					 *          the number to format
					 * @returns the number formatted depending on its value
					 */
					formatNumber : function(fNumber) {

						var iUnitDecimals = this.getUnitDecimals();
						var bBigNumber = (fNumber >= 10000) || (fNumber <= -10000);
						var bSmallNumber = (fNumber < 100) && (fNumber > -100);

						if (bBigNumber) {
							return sap.ca.ui.model.format.QuantityFormat.FormatQuantityShort(fNumber, null, iUnitDecimals);
						} else if (bSmallNumber) {
							return sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(fNumber, null, iUnitDecimals);
						} else {
							// we have to round the number by ourselves as passing 0 as decimals is the same
							// as not passing decimals at all (which results in a default of 3 decimals)
							return sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(Math.round(fNumber));
						}
					},

					roundNumber : function(fNumber) {

						// due to rounding issues in javascript we have to ensure correct
						// rounding (15 -
						return Math.round(fNumber * 1000000) / 1000000;
					},

					/**
					 * 
					 * @param iDay -
					 *          the index within the array of values for which the demand should be returned
					 * @param bWithoutDelta -
					 *          flag to indicate if the deltas should be ignored
					 * @returns the demand of the (via index) specified day, optionally modified by the deltas on this day
					 */
					getDemand : function(iDay, bWithoutDelta) {

						var aValues = this.getValues();
						var aDeltas = this.getDeltas();
						var fDemand = 0;

						// get the demand on the requested date
						if (aValues && (aValues.length > iDay) && (iDay >= 0)) {
							fDemand = aValues[iDay].getDemand();

							if (!bWithoutDelta) {
								// update the demand with the delta on the same day
								// (might be a different index!)
								var l = (aDeltas && aDeltas.length) ? aDeltas.length : 0;

								for ( var i = 0; i < l; i++) {
									if (aDeltas[i].getDate() == aValues[iDay].getDate()) {
										fDemand += aDeltas[i].getDemand();
									}
								}
							}
						}

						return fDemand;
					},

					/**
					 * 
					 * @param iDay -
					 *          the index within the array of values for which the supply should be returned
					 * @param bWithoutDelta -
					 *          flag to indicate if the deltas should be ignored
					 * @returns the supply of the (via index) specified day, optionally modified by the deltas on this day
					 */
					getSupply : function(iDay, bWithoutDelta) {

						var aValues = this.getValues();
						var aDeltas = this.getDeltas();
						var fSupply = 0;

						if (aValues && (aValues.length > iDay) && (iDay >= 0)) {
							fSupply = aValues[iDay].getSupply();

							if (!bWithoutDelta) {
								// update the supply with the delta on the same day
								// (might be a different index!)
								var l = (aDeltas && aDeltas.length) ? aDeltas.length : 0;

								for ( var i = 0; i < l; i++) {
									if (aDeltas[i].getDate() == aValues[iDay].getDate()) {
										fSupply += aDeltas[i].getSupply();
									}
								}
							}
						}

						return fSupply;
					},

					getShortageAccepted : function(iDay) {

						var aValues = this.getValues();

						if (aValues && (aValues.length > iDay) && (iDay >= 0)) {
							return aValues[iDay].getShortageAccepted();
						}

						return false;
					},

					/**
					 * Rounds a value to the next "useful" value. This is used to make the y-axis a bit larger so there is a small
					 * margin at the top and the bottom of the chart. The actual size of the margins depends on the original min
					 * and max values of the y-axis.
					 */
					reDomain : function(value) {

						if (value > 0) {
							var dy = Math.pow(10, Math.round(Math.log(value + 1) / Math.log(10)) - 1);
							return Math.ceil((value + 1) / dy) * dy;
						} else if (value < 0) {
							return -this.reDomain(-value);
						} else {
							return 0;
						}
					},

					convertIntoOverviewPos : function(oChartSettings, oOverviewSettings, posX) {

						return Math.round(((posX - oChartSettings.chartSize.leftSpace) / oChartSettings.daySize
								* oOverviewSettings.daySize + oOverviewSettings.chartSize.leftSpace) * 10) / 10;
					},

					convertIntoDetailPos : function(oChartSettings, oOverviewSettings, posX) {

						return Math.round(((posX - oOverviewSettings.chartSize.leftSpace) / oOverviewSettings.daySize
								* oChartSettings.daySize + oChartSettings.chartSize.leftSpace) * 10) / 10;
					},

					isVisible : function(sData) {

						var oChartSettings = this.getChartSettings(sData);
						var oOverviewSettings = this.getOverviewSettings(sData);
						var oChart = jQuery("#" + this.getId());

						if (oChart && oChart.length) {

							if (oChart.innerWidth() === 0) {
								jQuery.sap.log.debug("Chart has width = 0");
								return false;
							}
						} else {
							jQuery.sap.log.debug("Chart not in DOM tree");
							return false;
						}

						if (oChartSettings.chartSize.chartHeight === 0) {
							jQuery.sap.log.debug("Chart has calculated height = 0");
							return false;
						}
						if (this.getShowOverview() && oOverviewSettings.chartSize.chartHeight === 0) {
							// return false;
						}
						return true;
					},

					/**
					 * @param sData -
					 *          defines if the setting for the standard chart or the preview chart should be returned.<br>
					 *          value "basic": return the settings for the standard chart<br>
					 *          value "preview": return the settings for the preview chart<br>
					 * @returns the calculated chart settings for either the standard chart or the preview chart<br>
					 * 
					 * Before this function can return the calculated settings it is necessary that
					 * <code>calcChartSettings()</code> has been executed for the requested chart type (i.e. standard or
					 * preview).
					 */
					getChartSettings : function(sData) {

						return this._oChartSettings[sData];
					},

					getOverviewSettings : function(sData) {

						return this._oOverviewSettings[sData];
					},

					/**
					 * 
					 * @param oChartSize -
					 *          defines the width and height of the value area in the chart
					 * @param oValueRange -
					 *          defines the minimum and maximum quantity values to be mapped to te y-axis
					 * @param oTimeframe -
					 *          defines the days to be mapped to the x-axis
					 * @returns the scaling functions for the x- and y-axis. These scaling functions allow to map the quantities
					 *          to pixel in y-direction and the index in the array of days to pixel in x-direction. The scaling
					 *          functions provide a value for arbitrary input values, not just within the interval used to define
					 *          the scaling functions. To define a scaling function it is necessary to use real *intervals* of
					 *          values. Otherwise all input values are mapped on the same output value.
					 */
					getScalingFunctions : function(oChartSize, oValueRange, oTimeframe) {

						var oScaling = {};
						// start with calculating the number of pixel used per day
						var startPosX = oChartSize.valueWidth / (oTimeframe.maxX - oTimeframe.minX);
						// Check if there is just one value, i.e. one day
						if ((oTimeframe.maxX - oTimeframe.minX) === 1) {
							// We have the special case that there is just one value. In this case we have to
							// define the scale function differently so it still defines a linear scaling,
							// i.e. it has two different values for the domain and the range
							oScaling.xScale = d3.scale.linear().domain([-1, 0]).range([0, startPosX]);
						} else {
							oScaling.xScale = d3.scale.linear().domain([oTimeframe.minX, oTimeframe.maxX - 1]).range(
									[startPosX, oChartSize.valueWidth]);
						}
						// reverse the vertical orientation because SVG has the origin in the left *upper* corner
						oScaling.yScale = d3.scale.linear().domain([oValueRange.minY, oValueRange.maxY]).range(
								[oChartSize.valueHeight, 0]);

						return oScaling;
					},

					/**
					 * Calculates the chart setting
					 * 
					 * @param sData -
					 *          defines if the setting for the standard chart or the preview chart should be calculated.<br>
					 *          value "basic": calculate the settings for the standard chart <br>
					 *          value "preview": return the settings for the preview chart <br>
					 * 
					 * Before this function can calculate the settings it is necessary that the size of the visible area
					 * (-visArea) has been set in the DOM tree (see <code>setChartSize()</code>).
					 */
					calcChartSettings : function(sData) {

						// Determine the start and end indexes within the array of values
						var oTimeframes = {
							basic : this.getTimeframe("basic"),
							preview : this.getTimeframe("preview")
						};

						// Create an array with supplies and demands for all days in the chart (including deltas for preview)
						var aData = this.d3Data(sData, oTimeframes[sData]);
						var dataLen = aData.length || 2;

						// determine the quantities with deltas of the day before the first visible day
						var oFirstBalance = {
							basic : this.getFirstBalance(oTimeframes.basic),
							preview : this.getFirstBalance(oTimeframes.preview)
						};

						// determine chart size
						var oChartVisArea = jQuery("#" + this.getId() + "-visArea");
						var chartWidth = (oChartVisArea && oChartVisArea.length) ? oChartVisArea.innerWidth() : 200;
						var chartHeight = (oChartVisArea && oChartVisArea.length) ? oChartVisArea.innerHeight() : 200;

						var iLeftSpace = 11;
						var iRightSpace = 12;
						var iTopBorder = 15;
						// var iBottomBorder = this.getShowOverview() ? 38 + 10 + Math.round(chartHeight / 8) : 38 + 10;
						// 38 pixel for the dates and 10 pixel margin
						var iBottomBorder = 38 + 10;

						// consider minimum chart width
						var minChartWidth = dataLen * (this.getMinBarSize() / 8 * 21) + (iLeftSpace + iRightSpace);

						if (chartWidth < minChartWidth) {
							chartWidth = minChartWidth;
						}

						var oChartSize = {
							leftSpace : iLeftSpace,
							rightSpace : iRightSpace,
							topBorder : iTopBorder,
							bottomBorder : iBottomBorder,
							chartWidth : chartWidth,
							valueWidth : chartWidth - (iLeftSpace + iRightSpace),
							chartHeight : chartHeight /*- (this.getShowOverview() ? Math.round(chartHeight / 8) : 0)*/,
							valueHeight : chartHeight - (iTopBorder + iBottomBorder)
						};

						// determine timeframe for the chart
						var oTimeframe = oTimeframes[sData];
						// determine the minimum and maximum values for the y-axis
						var oValueRange = this.getNumberRange(aData, sData);

						// determine scaling functions for x- and y-axis
						// these scaling functions map
						// - an index within the array of values to a pixel value on the x-axis for that day
						// - a quantity to a pixel value on the y-axis
						var oScaling = this.getScalingFunctions(oChartSize, oValueRange, oTimeframe);

						// use one tick per day but reduce the number of ticks if the day size becomes too small
						// var iTickCntX = Math.min(aData.length, Math.round(oChartSize.valueWidth / 126));
						var iDaySize = oScaling.xScale(1) - oScaling.xScale(0);
						var iTickCntX = (iDaySize < 48 + 24) ? Math.round(aData.length / 2) : aData.length;
						// Define the approximate number of ticks for the y-axis. The actual ticks will be generated by d3.
						// d3 uses this value as "hint" how many ticks it should generate.
						var iTickCntY = Math.round(oChartSize.valueHeight / 40);

						// return the settings
						this._oChartSettings[sData] = {
							chartId : this.getId(),
							firstBalance : oFirstBalance,
							data : aData,
							timeframe : oTimeframe,
							xScale : oScaling.xScale,
							yScale : oScaling.yScale,
							tickCntX : iTickCntX,
							tickCntY : iTickCntY,
							chartSize : oChartSize,
							posY0 : oScaling.yScale(0),
							daySize : iDaySize,
							displayText : true,
							fireEvent : true
						};
					},

					/**
					 * Calculates the chart settings for the overview area.
					 * 
					 * @param sData -
					 *          defines if the setting for the standard chart or the preview chart should be calculated.<br>
					 *          value "basic": calculate the settings for the standard chart <br>
					 *          value "preview": return the settings for the preview chart <br>
					 * 
					 * Before this function can calculate the settings it is necessary that <code>calcChartSettings()</code> has
					 * been executed for the requested chart type (i.e. standard or preview). It is also necessary that the size
					 * of the visible overview area (-overview-visArea) has been set in the DOM tree (see
					 * <code>setChartSize()</code>).
					 * 
					 */
					calcOverviewSettings : function(sData) {

						// Determine the start and end indexes within the array of values
						var oTimeframes = {
							basic : this.getTimeframe("basic"),
							preview : this.getTimeframe("preview")
						};

						// Create an array with supplies and demands for all days in the chart (including deltas for preview)
						var aData = this.d3Data(sData, oTimeframes[sData]);
						var dataLen = aData.length || 2;

						// determine the quantities with deltas of the day before the first visible day
						var oFirstBalance = {
							basic : this.getFirstBalance(oTimeframes.basic),
							preview : this.getFirstBalance(oTimeframes.preview)
						};

						// determine chart size
						var oOverviewArea = jQuery("#" + this.getId() + "-overview-area");
						// var chartHeight = (oOverviewArea && oOverviewArea.length) ? oOverviewArea.height() : 200;

						var oChartVisArea = jQuery("#" + this.getId() + "-overview-visArea");
						var chartWidth = (oChartVisArea && oChartVisArea.length) ? oChartVisArea.width() : 200;
						var chartHeight = (oChartVisArea && oChartVisArea.length) ? oChartVisArea.height() : 0;

						// calculate chart width of the overview relative to the chart width
						// of the regular chart
						var oChartSettings = this.getChartSettings(sData);

						var minDaySize = this.getMinOverviewBarSize() / 8 * 21;
						var minChartWidth = oChartSettings.chartSize.chartWidth / oChartSettings.daySize * minDaySize;
						var daySize = 0;

						if (minDaySize > 0) {

							if (chartWidth < minChartWidth) {
								chartWidth = minChartWidth;
							}
							daySize = minDaySize * chartWidth / minChartWidth;

						} else {
							daySize = oChartSettings.daySize / oChartSettings.chartSize.chartWidth * chartWidth;
						}

						// calculate left and right space as well as day size relative to
						// the settings of the chart
						var iLeftSpace = oChartSettings.chartSize.leftSpace / oChartSettings.daySize * daySize;
						var iRightSpace = oChartSettings.chartSize.rightSpace / oChartSettings.daySize * daySize;
						var iTopBorder = 0;
						var iBottomBorder = 0;

						var oChartSize = {
							leftSpace : iLeftSpace,
							rightSpace : iRightSpace,
							topBorder : iTopBorder,
							bottomBorder : iBottomBorder,
							chartWidth : chartWidth,
							valueWidth : chartWidth - (iLeftSpace + iRightSpace),
							chartHeight : chartHeight,
							valueHeight : chartHeight - (iTopBorder + iBottomBorder)
						};

						// determine timeframe for the chart
						var oTimeframe = oTimeframes[sData];
						// determine the minimum and maximum values for the y-axis
						var oValueRange = this.getNumberRange(aData, sData);

						// determine scaling functions for x- and y-axis
						// these scaling functions map
						// - an index within the array of values to a pixel value on the x-axis for that day
						// - a quantity to a pixel value on the y-axis
						var oScaling = this.getScalingFunctions(oChartSize, oValueRange, oTimeframe);

						// use one tick per day but reduce the number of ticks if the day size becomes too small
						var iDaySize = oScaling.xScale(1) - oScaling.xScale(0);
						var iTickCntX = (iDaySize < 48 + 24) ? Math.round(aData.length / 2) : aData.length;
						// Define the approximate number of ticks for the y-axis. The actual ticks will be generated by d3.
						// d3 uses this value as "hint" how many ticks it should generate.
						var iTickCntY = Math.round(oChartSize.valueHeight / 40);

						// return the settings
						this._oOverviewSettings[sData] = {
							chartId : this.getId() + "-overview",
							firstBalance : oFirstBalance,
							data : aData,
							timeframe : oTimeframe,
							xScale : oScaling.xScale,
							yScale : oScaling.yScale,
							tickCntX : iTickCntX,
							tickCntY : iTickCntY,
							chartSize : oChartSize,
							posY0 : oScaling.yScale(0),
							daySize : iDaySize,
							displayText : false,
							fireEvent : false
						};
					},

					/**
					 * 
					 * @param aData -
					 *          the array with values for all days in the chart
					 * @param sData -
					 *          defines if the values for the standard chart or the preview chart should be calculated.<br>
					 *          value "basic": calculate the values for the standard chart <br>
					 *          value "preview": return the values for the preview chart <br>
					 * @returns the maximum and minimum quantity (y-axis) that will be shown in the chart
					 */
					getNumberRange : function(aData, sData) {

						// get minimum and maximum value (considering all intraday stocks as well)
						var minY = d3.min(aData, function(d) {
							return Math.min(0, d[sData].balanceStart, d[sData].balanceIntraday, d[sData].balanceEnd);
						});
						var maxY = d3.max(aData, function(d) {
							return Math.max(0, d[sData].balanceStart, d[sData].balanceIntraday, d[sData].balanceEnd);
						});

						// ensure that at least 5% of the maximum is used as minimum
						if (minY > -maxY / 20) {
							minY = -maxY / 20;
						}
						// ensure that at least 5% of the minimum is used as maximum
						if (maxY < -minY / 20) {
							maxY = -minY / 20;
						}

						// redomain the values (rounding)
						return {
							minY : this.reDomain(minY),
							maxY : this.reDomain(maxY)
						};
					},

					getTimeframe : function(sData) {

						// determine index of first and last date for the specified view
						var sMinDate = this.getMinDate();
						var sMaxDate = this.getMaxDate();
						var oMinDate = (sMinDate) ? new Date(sMinDate) : null;
						var oMaxDate = (sMaxDate) ? new Date(sMaxDate) : null;
						var aChartValues = this.getValues();
						var iChartValueCnt = (aChartValues) ? aChartValues.length : 0;
						var oChartValue = {};

						var oTimeframe = {
							// start index within the array of values:
							minX : 0,
							// end index within the array of values:
							maxX : iChartValueCnt,
							// only for preview: start index within the array of values for basic view:
							minXBasic : 0,
							// only used for preview: end index within the array of values for basic view:
							maxXBasic : iChartValueCnt
						};

						// if a minimum or maximum date is specified, we have to restrict
						// the timeframe that is displayed in the chart
						if (oMinDate || oMaxDate) {

							// In case of a preview, we might have to extend this timeframe so that
							// all deltas are shown as well
							if (sData == "preview") {

								var aDeltas = this.getDeltas();
								var oDelta;
								var l = (aDeltas && aDeltas.length) ? aDeltas.length : 0;

								for ( var i = 0; i < l; i++) {
									oDelta = aDeltas[i];
									var oDeltaDate = new Date(oDelta.getDate());
									if (oDeltaDate < oMinDate) {
										oMinDate = oDeltaDate;
									}
									if (oDeltaDate > oMaxDate) {
										oMaxDate = oDeltaDate;
									}
								}

								// We change the timeframe for the preview. But we also need the
								// first and last index for the basic view. So we request those
								// indexes separately
								var oBasicTimeframe = this.getTimeframe("basic");
								oTimeframe.minXBasic = oBasicTimeframe.minX;
								oTimeframe.maxXBasic = oBasicTimeframe.maxX;
							}

							// determine the minimum and maximum index for the specified
							// timeframe
							for ( var i = 0; i < iChartValueCnt; i++) {
								oChartValue = aChartValues[i];
								if (oChartValue.getDate() == oMinDate) {
									oTimeframe.minX = i;
									break;
								}
							}

							for ( var i = 0; i < iChartValueCnt; i++) {
								oChartValue = aChartValues[i];
								if (oChartValue.getDate() == oMaxDate) {
									oTimeframe.maxX = i + 1;
								}
							}
						}

						return oTimeframe;
					},

					/**
					 * 
					 * @param oTimeframe -
					 *          component <code>minX</code> contains the index of the first visible day
					 * @param bWithoutDelta -
					 *          flag to indicate if the deltas should be ignored
					 * @returns the quantity before the first visible day, optionally modified by the deltas
					 */
					getFirstBalance : function(oTimeframe, bWithoutDelta) {

						// determine start balance (balance of the day before
						// first visible date)
						var fDemand = 0;
						var fSupply = 0;
						var fBalance = this.getStartBalance();

						// Add the quantities of all days before the first visible day
						for ( var i = 0; i < oTimeframe.minX; i++) {

							fDemand = this.getDemand(i, bWithoutDelta);
							fSupply = this.getSupply(i, bWithoutDelta);
							fBalance = fBalance + fDemand + fSupply;
						}

						return this.roundNumber(fBalance);
					},

					/**
					 * 
					 * @param oTimeframe -
					 *          defines what values from the array of values should be used
					 * @returns an array with data for each day in the chart which is used by d3 to create the chart
					 */
					d3Data : function(sData, oTimeframe) {

						// determine start balance (balance of the day before
						// first visible date)
						var bShortageAccepted = false;
						var fDemand = 0;
						var fSupply = 0;
						var fDemandTotal = 0;
						var fSupplyTotal = 0;
						// determine the quantities with no deltas of the day before the first visible day
						var fBalance = this.getFirstBalance(oTimeframe, true);
						// determine the quantities with deltas (preview) of the day before the first visible day
						var fBalanceTotal = this.getFirstBalance(oTimeframe, false);
						var fMinStock = this.getMinStock();
						var fSafetyStock = this.getSafetyStock();
						var oD3Value;

						// create the data and start with an initial date
						var aD3Values = [];

						// create the array with all supplies and demands (and deltas for preview) that
						// will be used by d3 to create the chart
						for ( var i = oTimeframe.minX; i < oTimeframe.maxX; i++) {

							bShortageAccepted = this.getShortageAccepted(i);
							fSupply = this.getSupply(i, true);
							fDemand = this.getDemand(i, true);
							fSupplyTotal = this.getSupply(i);
							fDemandTotal = this.getDemand(i);

							// calculate size and position of demand and supply box
							// Since we display both the supply and the demand for each day, and we assume
							// all supplies occur before all demands occur during the day, we need
							// - the quantity at the beginning of a day (balanceStart)
							// - the quantity after all supplies occurred (balanceIntraday)
							// - the quantity at the end of the day (balanceEnd)
							oD3Value = {
								index : i,
								date : this.getDate(i),
								minStock : fMinStock,
								safetyStock : fSafetyStock,
								shortageAccepted : bShortageAccepted,
								basic : {
									balanceStart : this.roundNumber(fBalance),
									supply : fSupply,
									balanceIntraday : this.roundNumber(fBalance + fSupply),
									demand : fDemand,
									balanceEnd : this.roundNumber(fBalance + fSupply + fDemand)
								},
								preview : {
									balanceStart : this.roundNumber(fBalanceTotal),
									supply : this.getSupply(i),
									balanceIntraday : this.roundNumber(fBalanceTotal + fSupplyTotal),
									demand : this.getDemand(i),
									balanceEnd : this.roundNumber(fBalanceTotal + fSupplyTotal + fDemandTotal)
								}
							};
							aD3Values.push(oD3Value);

							fBalance += oD3Value.basic.demand + oD3Value.basic.supply;
							fBalanceTotal += oD3Value.preview.demand + oD3Value.preview.supply;
						}

						// TODO: here it should be possible to just return aD3Values instead of using the d3 functions below
						var D3Map = function(i) {
							return aD3Values[i];
						};

						// Number of values in array
						var l = oTimeframe.maxX - oTimeframe.minX;
						return d3.range(l).map(D3Map);
					},

					/**
					 * Sets the size of the different chart container elements, particularly<br>
					 * -width and height of background area <br>
					 * -height of chart visible area <br>
					 * -width and shift position of chart area <br>
					 * -height of overview area <br>
					 * -width and shift position of overview chart area <br>
					 * -line height and font size of both scroll buttons <br>
					 * These values are determined based on the original size of the chart control.<br>
					 * This fuction also calls <code>calcChartSettings()</code> and <code>calcOverviewSettings()</code>
					 */
					setChartSize : function() {

						var oChartControl = jQuery("#" + this.getId());

						if (oChartControl && oChartControl.length) {

							// calculate width and height of the visible area of the chart control
							var visAreaWidth = oChartControl.width();
							var visAreaHeight = oChartControl.height();

							// if navigator(=overview) is visible, reduce height of visible area
							var overviewHeight = 0;
							if (this.getShowOverview()) {
								overviewHeight = this.getFixOverviewHeight();
								if (!overviewHeight) {
									overviewHeight = Math.round(visAreaHeight / 8);
								}
							}
							visAreaHeight -= overviewHeight;

							// set height of Y-Axis
							var oBackground = jQuery("#" + this.getId() + "-backgroundArea");

							if (oBackground && oBackground.length) {

								oBackground[0].style.width = visAreaWidth + "px";
								oBackground[0].style.height = visAreaHeight + "px";
							}

							// set height of visible part of the chart area
							// note: this must be done before calcChartSettings() is called below
							var visAreaInnerWidth = visAreaWidth;
							var oVisArea = jQuery("#" + this.getId() + "-visArea");

							if (oVisArea && oVisArea.length) {
								oVisArea[0].style.height = visAreaHeight + "px";
								visAreaInnerWidth = oVisArea.innerWidth();
							}

							// set the size of the chart area: use at least the minimum width for all days
							this.calcChartSettings("basic");
							this.calcChartSettings("preview");

							var oChartSettings = this.getChartSettings(this._dataset);

							var oChartArea = jQuery("#" + this.getId() + "-chartArea");

							if (oChartArea && oChartArea.length) {
								oChartArea[0].style.width = oChartSettings.chartSize.chartWidth + "px";
								// also adjust attribute "left" in case there's more available space now
								// for the chart and it's scrolled left
								var iMaxShiftLeft = visAreaInnerWidth - oChartArea.outerWidth();
								// note: the shift values are negative or 0
								// here we make sure that the current shift position is between iMaxShiftLeft (negative number) and 0
								var iShift = Math.min(Math.max(this.getShiftLeft(), iMaxShiftLeft), 0);
								oChartArea[0].style.left = iShift + "px";
								this.setProperty("shiftLeft", iShift, true);
							}

							// set the height of the visible part of the overview area
							// note: this must be done before calcOverviewSettings() is called below
							if (this.getShowOverview()) {

								var visOverviewAreaWidth = visAreaWidth;
								var oOverviewArea = jQuery("#" + this.getId() + "-overview-area");
								var oVisOverviewArea = jQuery("#" + this.getId() + "-overview-visArea");

								if (oOverviewArea && oOverviewArea.length) {
									oOverviewArea[0].style.height = overviewHeight + "px";
								}
								if (oVisOverviewArea && oVisOverviewArea.length) {
									visOverviewAreaWidth = oVisOverviewArea.innerWidth();
								}
								this.calcOverviewSettings("basic");
								this.calcOverviewSettings("preview");

								var oOverviewSettings = this.getOverviewSettings(this._dataset);

								var oOverviewChartArea = jQuery("#" + this.getId() + "-overview-chartArea");

								if (oOverviewChartArea && oOverviewChartArea.length) {
									oOverviewChartArea[0].style.width = oOverviewSettings.chartSize.chartWidth + "px";
									var iMaxShiftLeft = visOverviewAreaWidth - oOverviewChartArea.outerWidth();
									var iShift = Math.min(Math.max(oOverviewChartArea.position().left, iMaxShiftLeft), 0);
									oOverviewChartArea[0].style.left = iShift + "px";
								}

								// set the line height of the left and right button
								var oOvrScrollLeft = jQuery("#" + this.getId() + "-ovrScrollLeft");
								var oOvrScrollRight = jQuery("#" + this.getId() + "-ovrScrollRight");

								if (oOvrScrollLeft && oOvrScrollLeft.length) {
									var scrollBtnHeight = oOvrScrollLeft.innerHeight();
									oOvrScrollLeft[0].style.lineHeight = scrollBtnHeight + "px";
									if (scrollBtnHeight && (scrollBtnHeight < 16)) {
										oOvrScrollLeft[0].style.fontSize = scrollBtnHeight + "px";
									}

								}
								if (oOvrScrollRight && oOvrScrollRight.length) {
									var scrollBtnHeight = oOvrScrollRight.innerHeight();
									oOvrScrollRight[0].style.lineHeight = scrollBtnHeight + "px";
									if (scrollBtnHeight && (scrollBtnHeight < 16)) {
										oOvrScrollRight[0].style.fontSize = scrollBtnHeight + "px";
									}
								}
							}
						}
					},

					showDetailsInOverview : function() {

						if (!this.getShowOverview()) {
							return;
						}
						if (!this.isVisible(this._dataset)) {
							return;
						}

						var oChartSettings = this.getChartSettings(this._dataset);
						var oOverviewSettings = this.getOverviewSettings(this._dataset);

						var oChartArea = jQuery("#" + this.getId() + "-chartArea");
						var oOverviewArea = jQuery("#" + this.getId() + "-overview-chartArea");

						if (oChartArea && oChartArea.length && oOverviewArea && oOverviewArea.length) {

							// calculate the visible part of the detail view
							var shiftLeftChart = -oChartArea[0].offsetLeft;
							var visibleWidthChart = oChartArea.parent().innerWidth();

							var shiftLeftOverview = -oOverviewArea[0].offsetLeft;
							var visibleWidthOverview = oOverviewArea.parent().innerWidth();

							// translate the information from the detail view into coordinates of
							// the overview
							var fromX = this.convertIntoOverviewPos(oChartSettings, oOverviewSettings, shiftLeftChart);
							var toX = this.convertIntoOverviewPos(oChartSettings, oOverviewSettings, shiftLeftChart
									+ visibleWidthChart - oChartSettings.chartSize.leftSpace);

							// if the visible window is outside the visible part of the overview
							// shift the overview as well
							if (fromX < shiftLeftOverview) {
								oOverviewArea[0].style.left = -fromX + "px";
							}

							if (toX + oOverviewSettings.chartSize.leftSpace > shiftLeftOverview + visibleWidthOverview) {
								oOverviewArea[0].style.left = visibleWidthOverview - toX - oOverviewSettings.chartSize.leftSpace + "px";
							}

							// refresh the visible part within the overview
							var vis = d3.select("#" + oOverviewSettings.chartId + "-chartArea svg g");

							this.updateOverviewWindow(vis, oOverviewSettings, fromX, toX);
						}
					},

					showOverviewInDetails : function() {

						var oChartSettings = this.getChartSettings(this._dataset);
						var oOverviewSettings = this.getOverviewSettings(this._dataset);

						var oChartArea = jQuery("#" + this.getId() + "-chartArea");
						var oOverviewArea = jQuery("#" + this.getId() + "-overview-chartArea");

						if (oChartArea && oChartArea.length && oOverviewArea && oOverviewArea.length) {

							// calculate the visible part within the overview
							var overviewLeft = d3.select("#" + oOverviewSettings.chartId + "-hidden-left").attr("width");
							var overviewRight = d3.select("#" + oOverviewSettings.chartId + "-hidden-right").attr("x");

							// translate the information from the overview into coordinates of the
							// detail view
							var shiftLeftChart = this.convertIntoDetailPos(oChartSettings, oOverviewSettings, overviewLeft
									- oOverviewSettings.chartSize.leftSpace)
									+ oChartSettings.chartSize.leftSpace;

							// adjust the detail chart
							oChartArea[0].style.left = -shiftLeftChart + "px";
							this.setProperty("shiftLeft", -shiftLeftChart, true);
							return -shiftLeftChart;
						}

						return 0;
					},

					shiftLeftChart : function(sPath, iDeltaX) {

						var oVisArea = jQuery("#" + sPath + "-visArea");
						var oChartArea = jQuery("#" + sPath + "-chartArea");

						if (oVisArea && oVisArea.length && oChartArea && oChartArea.length) {

							var iMaxShiftLeft = oVisArea.innerWidth() - oChartArea.outerWidth();
							// note: this._iStartOffsetX is always <= 0 and iMaxShiftLeft is always <= 0
							var iShift = Math.min(Math.max(this._iStartOffsetX + iDeltaX, iMaxShiftLeft), 0);
							oChartArea[0].style.left = iShift + "px";
							this.setProperty("shiftLeft", iShift, true);

							return iShift;
						}
						return this._iStartOffsetX;
					},

					shiftLeftOverviewWindow : function(iDeltaX) {

						// calculate new position of the overview window
						var overviewLeft = d3.select("#" + this.getId() + "-overview-hidden-left");
						var overviewRight = d3.select("#" + this.getId() + "-overview-hidden-right");
						var overviewWindow = d3.select("#" + this.getId() + "-overview-hidden-window");

						var oVisArea = jQuery("#" + this.getId() + "-overview-visArea");
						var oChartArea = jQuery("#" + this.getId() + "-overview-chartArea");

						var overviewLeftX = parseFloat(overviewLeft.attr("x"));
						var overviewLeftWidth = parseFloat(overviewLeft.attr("width"));
						var overviewRightX = parseFloat(overviewRight.attr("x"));
						var overviewRightWidth = parseFloat(overviewRight.attr("width"));

						var oOverviewSettings = this.getOverviewSettings(this._dataset);

						// check if the new position would be outside the valid range
						if (overviewLeftWidth + iDeltaX < 0) {
							iDeltaX = -overviewLeftWidth;
						}

						if (overviewRightWidth - iDeltaX < 0) {
							iDeltaX = overviewRightWidth;
						}

						// check if the overview window would be displayed outside the visible area
						if (overviewLeftWidth + iDeltaX < -oChartArea[0].offsetLeft) {
							oChartArea[0].style.left = -(overviewLeftWidth + iDeltaX) + "px";
						}

						if (overviewRightX + iDeltaX + oOverviewSettings.chartSize.leftSpace > oVisArea.innerWidth()
								- oChartArea[0].offsetLeft) {
							oChartArea[0].style.left = oVisArea.innerWidth() - overviewRightX - iDeltaX
									- oOverviewSettings.chartSize.leftSpace + "px";
						}

						overviewLeft.attr("width", overviewLeftWidth + iDeltaX);
						overviewRight.attr("x", overviewRightX + iDeltaX).attr("width", overviewRightWidth - iDeltaX);
						overviewWindow.attr("x", overviewLeftX + overviewLeftWidth + iDeltaX).attr("width",
								overviewRightX - overviewLeftX - overviewLeftWidth);

						return iDeltaX;
					},

					resizeChart : function() {

						// change the size of the chart control
						var oChart = jQuery("#" + this.getId());

						if (oChart && oChart.length) {

							var height = this.getHeight();
							var width = this.getWidth();
							oChart[0].style.height = height;
							oChart[0].style.width = width;

							// remove the old chart ...
							var overview = d3.select("#" + this.getId() + "-overview-chartArea svg").remove();
							var chart = d3.select("#" + this.getId() + "-chartArea svg").remove();
							var axis = d3.select("#" + this.getId() + "-backgroundArea svg").remove();

							// ...and create a new one
							this.setChartSize();
							this.renderChart(this._dataset);
						}
					},

					onShortageSelected : function(d) {

						if (d[this._dataset].balanceEnd < d.safetyStock) {
							if (this.getAllowNavigation() === true) {
								this.fireEvent("selected", d);
							} else {
								if (this.getNoNavigationText() != "") {
									sap.m.MessageToast.show(this.getNoNavigationText());
								}
							}
						}
					},

					/**
					 * This function handles the event when a user has clicked on the chart. <br>
					 * The function checks where on the chart the click happended:<br>
					 * 1) in the chart<br>
					 * -determine the date of the day on which the user clicked<br>
					 * -if it is a valid day fire the shortageSelected event<br>
					 * 2) in the overview area on the left of the visible detail window or<br>
					 * -move the overview window to the left by half its width<br>
					 * 3) in the overview area on the right of the visible detail window or<br>
					 * -move the overview window to the right by half its width<br> -
					 * 
					 * @param oEvent
					 */
					onclick : function(oEvent) {

						// Hint: We don't use the ontap function here (which is the one that should be
						// used) as we need to determine the offsetX of the event and jQuery returns
						// this value only for the click event

						// helper function to determine whether a DOM node contains another one
						// (unfortunately IE 10 doesn't support the "contains" function for SVG nodes,
						// so we need this wrapper)
						var contains = function(nodeA, nodeB) {
							if (nodeA.compareDocumentPosition) {
								return (nodeA === nodeB) || (nodeA.compareDocumentPosition(nodeB) & 16);
							} else if (nodeA.contains) {
								return nodeA.contains(nodeB);
							} else {
								return false;
							}
						};

						if (!this._tapStart) {
							return;
						}

						var oChartArea = jQuery("#" + this.getId() + "-chartArea");
						var oOvrWindow = jQuery("#" + this.getId() + "-overview-hidden-window");
						var oOvrBtnLeft = jQuery("#" + this.getId() + "-ovrScrollLeft");
						var oOvrBtnRight = jQuery("#" + this.getId() + "-ovrScrollRight");
						var oOvrHdnLeft = jQuery("#" + this.getId() + "-overview-hidden-left");
						var oOvrHdnRight = jQuery("#" + this.getId() + "-overview-hidden-right");
						var iWidth = (oOvrWindow) ? parseInt(oOvrWindow.attr("width") / 2) : 0;

						// if the user clicked into the chart area, determine which day was selected
						if (oChartArea && oChartArea.length && contains(oChartArea[0], oEvent.target)) {
							var posX = oEvent.getOffsetX();
							if (oEvent.target.offsetLeft) {
								posX += oEvent.target.offsetLeft;
							};
							var oChartSettings = this.getChartSettings(this._dataset);
							var iDay = Math.floor((posX - oChartSettings.chartSize.leftSpace) / oChartSettings.daySize);
							if ((iDay >= 0) && (oChartSettings.data[iDay])) {
								this.onShortageSelected(oChartSettings.data[iDay]);
							}
						}

						// if the user clicked of left button, move to the left
						var bBtnLeft = (oOvrBtnLeft && oOvrBtnLeft.length && contains(oOvrBtnLeft[0], oEvent.target));
						var bHdnLeft = (oOvrHdnLeft && oOvrHdnLeft.length && contains(oOvrHdnLeft[0], oEvent.target));
						if (bBtnLeft || bHdnLeft) {

							this.shiftLeftOverviewWindow(-iWidth);
							this.showOverviewInDetails();
						}

						// if the user clicked of right button, move to the right
						var bBtnRight = (oOvrBtnRight && oOvrBtnRight.length && contains(oOvrBtnRight[0], oEvent.target));
						var bHdnRight = (oOvrHdnRight && oOvrHdnRight.length && contains(oOvrHdnRight[0], oEvent.target));
						if (bBtnRight || bHdnRight) {
							this.shiftLeftOverviewWindow(iWidth);
							this.showOverviewInDetails();
						}
					},

					move : function(oEvent) {

						var oTouchEvent = oEvent.targetTouches[0] ? oEvent.targetTouches[0] : oEvent;
						var iCurrMoveX = (oTouchEvent.pageX) ? oTouchEvent.pageX : oTouchEvent.clientX;
						var iMoveX = iCurrMoveX - this._iStartMoveX;

						// determine if chart can be shifted by this delta to the left/right
						// * max. shift left = chart width - width of visible area
						// * max. shift right = 0
						if (this._bHidden) {
							this._iStartOffsetX = this.shiftLeftChart(this.getId() + "-overview", iMoveX);
							this._iStartMoveX = iCurrMoveX;
						} else if (this._bChart) {
							this._iStartOffsetX = this.shiftLeftChart(this.getId(), iMoveX);
							this._iStartMoveX = iCurrMoveX;
							this.showDetailsInOverview();
						} else if (this._bOverview) {
							this._iStartOffsetX = this.shiftLeftOverviewWindow(iMoveX);
							this._iStartMoveX = iCurrMoveX;
							var shiftLeftChart = this.showOverviewInDetails();
						}

						// if move was for more than 5 pixel, we have to prevent the "selected" event
						// to be fired
						if (Math.abs(this._iStartMoveX - this._iTapStartX) > 5) {
							this._tapStart = false;
						}
					},

					ontouchstart : function(oEvent) {

						// helper function to determine whether a DOM node contains another one
						// (unfortunately IE 10 doesn't support the "contains" function for SVG nodes,
						// so we need this wrapper)
						var contains = function(nodeA, nodeB) {
							if (nodeA.compareDocumentPosition) {
								return (nodeA === nodeB) || (nodeA.compareDocumentPosition(nodeB) & 16);
							} else if (nodeA.contains) {
								return nodeA.contains(nodeB);
							} else {
								return false;
							}
						};

						var oTouchEvent = oEvent.targetTouches[0] ? oEvent.targetTouches[0] : oEvent;
						// This is the detail window (which corresponds to the visible part of the chart) within the overview area
						var oOverviewArea = jQuery("#" + this.getId() + "-overview-hidden-window");
						var oOverviewHidden = jQuery("#" + this.getId() + "-overview-hidden");
						var oChartArea = jQuery("#" + this.getId() + "-chartArea");

						// determine in which part of the chart the touch started
						this._bOverview = oOverviewArea && oOverviewArea.length && contains(oOverviewArea[0], oTouchEvent.target);
						this._bHidden = (!this._bOverview) && oOverviewHidden && oOverviewHidden.length
								&& contains(oOverviewHidden[0], oTouchEvent.target);
						this._bChart = oChartArea && oChartArea.length && contains(oChartArea[0], oTouchEvent.target);

						// determine current shift of the respective chart area
						if (this._bHidden) {
							this._iStartOffsetX = oOverviewArea[0].offsetLeft;
						} else if (this._bChart) {
							this._iStartOffsetX = oChartArea[0].offsetLeft;
						} else if (this._bOverview) {
							this._iStartOffsetX = oOverviewArea[0].offsetLeft;
						}

						this._iStartMoveX = (oTouchEvent.pageX) ? oTouchEvent.pageX : oTouchEvent.clientX;
						this._touchStarted = true;
						this._tapStart = true;
						this._iTapStartX = this._iStartMoveX;

						// replace the cursor in the overview window if touch belongs to it
						if (this._bOverview) {
							var ovrWindow = d3.select("#" + this.getId() + "-overview-hidden-window");
							var bSpecialCursor = !this.getFixOverviewHeight();
							var sCSSOverviewWindow = (bSpecialCursor)
									? "sapMRPChartOverviewWindow"
									: "sapMRPChartOverviewWindowSimple";
							sCSSOverviewWindow += " sapMRPChartExecDrag";
							ovrWindow.attr("class", sCSSOverviewWindow);
						}

						if (this._bChart) {
							oChartArea.removeClass("sapMRPChartNavigation");
							oChartArea.removeClass("sapMRPChartStartDrag");
							oChartArea.addClass("sapMRPChartExecDrag");
						}
					},

					ontouchend : function(oEvent) {

						this._touchStarted = false;

						if (this._bOverview) {
							var ovrWindow = d3.select("#" + this.getId() + "-overview-hidden-window");
							var bSpecialCursor = !this.getFixOverviewHeight();
							var sCSSOverviewWindow = (bSpecialCursor)
									? "sapMRPChartOverviewWindow"
									: "sapMRPChartOverviewWindowSimple";
							sCSSOverviewWindow += " sapMRPChartStartDrag";
							ovrWindow.attr("class", sCSSOverviewWindow);
						}

						if (this._bChart) {
							var allowNavigation = this.getAllowNavigation();
							var oChartArea = jQuery("#" + this.getId() + "-chartArea");
							oChartArea.removeClass("sapMRPChartExecDrag");
							if (allowNavigation) {
								oChartArea.addClass("sapMRPChartNavigation");
							} else {
								oChartArea.addClass("sapMRPChartStartDrag");
							}
						}
					},

					ontouchmove : function(oEvent) {

						this.move(oEvent);
						oEvent.preventDefault();
						oEvent.stopPropagation();
					},

					onBeforeRendering : function() {

						this.removeHandler();
					},

					onAfterRendering : function() {

						this.setChartSize();
						this.renderChart();
					},

					renderer : function(oRm, oControl) {

						var allowNavigation = oControl.getAllowNavigation();

						oRm.write("<div");
						oRm.writeControlData(oControl); // write the Control ID and
						// enables event handling - important!
						oRm.addClass("sapMRPChart");
						oRm.writeClasses(); // write the above classes
						// plus enables support for addStyleClass(...)
						var minHeight = oControl.getMinChartHeight();
						if (minHeight) {
							oRm.addStyle("min-height", minHeight);
						}
						oRm.addStyle("height", oControl.getHeight());
						oRm.addStyle("width", oControl.getWidth());
						oRm.writeStyles();
						oRm.write(">");

						// DIV for chart background (no horizontal scrolling)
						oRm.write("<div id='");
						oRm.writeEscaped(oControl.getId());
						oRm.write("-backgroundArea' class='sapMRPChartBackground'>");
						oRm.write("</div>");

						// DIV for chart (with horizontal scrolling)
						oRm.write("<div id='");
						oRm.writeEscaped(oControl.getId());
						oRm.write("-visArea' class='sapMRPChartVisArea'>");
						oRm.write("<div id='");
						oRm.writeEscaped(oControl.getId());
						oRm.write("-chartArea'");
						oRm.addClass("sapMRPChartArea");
						if (allowNavigation) {
							oRm.addClass("sapMRPChartNavigation");
						} else {
							oRm.addClass("sapMRPChartStartDrag");
						}
						oRm.writeClasses();
						oRm.write(">");

						oRm.write("</div>");
						oRm.write("</div>");

						// DIV for the overview with left and right scroll button
						oRm.write("<div id='");
						oRm.writeEscaped(oControl.getId());
						oRm.write("-overview-area'");
						oRm.addClass("sapMRPChartOverview");
						if (oControl.getFixOverviewHeight()) {
							// oRm.addClass("sapMRPChartOverviewSimple")
						}
						oRm.writeClasses();
						oRm.write(">");
						// DIV for the overview (with horizontal scrolling)
						oRm.write("<div id='");
						oRm.writeEscaped(oControl.getId());
						oRm.write("-overview-visArea' class='sapMRPChartOverviewVisArea'>");
						// DIV to display the overview chart
						oRm.write("<div id='");
						oRm.writeEscaped(oControl.getId());
						oRm.write("-overview-chartArea' class='sapMRPChartOverviewArea'>");
						oRm.write("</div>");
						oRm.write("</div>");

						if (oControl._ovrBtnLeft) {
							oRm.write("<div id='");
							oRm.writeEscaped(oControl.getId());
							oRm.write("-ovrScrollLeft' class='sapMRPChartOverviewScrollLeft'>");
							if (oControl.getShowOverview()) {
								oRm.renderControl(oControl._ovrBtnLeft);
							}
							oRm.write("</div>");
						};
						if (oControl._ovrBtnRight) {
							oRm.write("<div id='");
							oRm.writeEscaped(oControl.getId());
							oRm.write("-ovrScrollRight' class='sapMRPChartOverviewScrollRight'>");
							if (oControl.getShowOverview()) {
								oRm.renderControl(oControl._ovrBtnRight);
							}
							oRm.write("</div>");
						};

						oRm.write("</div>");

						oRm.write("</div>");
					},

					/**
					 * Renders everything that does not scroll
					 * 
					 * @param sData -
					 *          defines if the setting for the standard chart or the preview chart should be calculated.<br>
					 *          value "basic": calculate the settings for the standard chart <br>
					 *          value "preview": return the settings for the preview chart <br>
					 * @param oChartSettings -
					 *          the settings that define the size of the chart
					 */
					renderBackground : function(sData, oChartSettings) {

						var oChartControl = jQuery("#" + oChartSettings.chartId);
						var backgroundAreaWidth = 0;

						if (oChartControl && oChartControl.length) {
							var backgroundAreaWidth = oChartControl.width();
						}

						var chart = d3.select("#" + oChartSettings.chartId + "-backgroundArea").append("svg:svg").attr("id",
								oChartSettings.chartId + "-background").attr("width", backgroundAreaWidth).attr("height",
								oChartSettings.chartSize.chartHeight);

						// create the top border
						var vis = chart.append("svg:g")
								.attr("transform", "translate(0," + oChartSettings.chartSize.topBorder + ")");

						// create the background
						if ((backgroundAreaWidth > 16 + 47) && (oChartSettings.chartSize.valueHeight > 0)) {
							vis.append("svg:rect").attr("id", oChartSettings.chartId + "-background-border").attr("class",
									"sapMRPChartBorder").attr("x", 47).attr("y", oChartSettings.chartSize.topSpace).attr("width",
									backgroundAreaWidth - 16 - 47).attr("height", oChartSettings.chartSize.valueHeight);
						}

						// create the y-axis
						var yAxis = vis.append("svg:g").attr("class", "yAxis");

						// create the ticks at the y-axis
						var yrule = yAxis.selectAll("g.y").data(oChartSettings.yScale.ticks(oChartSettings.tickCntY), function(d) {
							return d;
						}).enter().append("svg:g").attr("class", "y");

						// create the horizontal lines, including the x-axis at d = 0 (i.e. y = 0)
						yrule.append("svg:line").attr("class", function(d) {
							return (d != 0) ? "yLine sapMRPChartYLine" : "yLine sapMRPChartAxis";
						}).attr("x1", 42).attr("x2", backgroundAreaWidth - 16).attr("y1", oChartSettings.yScale).attr("y2",
								oChartSettings.yScale);

						var maxTextWidth = 0;
						var textSpace = 40;
						var sStyle = "";

						// create the texts for the y-axis
						var yRuleText = yrule.append("svg:text").attr("class", "yText sapMRPChartYAxisDescr").attr("x", 40).attr(
								"y", oChartSettings.yScale).attr("dy", "5px").attr("text-anchor", "end").text(
								jQuery.proxy(this.formatNumber, this)
						// oChartSettings.yScale.tickFormat(oChartSettings.tickCntY)
						).attr("style", function(d) {

							var textWidth = this.getComputedTextLength();
							if (textWidth > maxTextWidth) {
								maxTextWidth = textWidth;
							}
							return "";
						});

						// if the text is too long reduce the font size
						if (maxTextWidth > textSpace) {
							sStyle = "font-size:" + Math.floor(875 / maxTextWidth * textSpace) / 1000 + "rem";
							yRuleText.attr("style", sStyle);
						}
					},

					updateBackground : function(sData, oChartSettings) {

						var oChartControl = jQuery("#" + oChartSettings.chartId);
						var backgroundAreaWidth = 0;

						if (oChartControl && oChartControl.length) {
							var backgroundAreaWidth = oChartControl.width();
						}

						var vis = d3.select("#" + oChartSettings.chartId + "-backgroundArea svg g");

						var yAxis = vis.selectAll("g.yAxis");

						var yrule = yAxis.selectAll("g.y").data(oChartSettings.yScale.ticks(oChartSettings.tickCntY), function(d) {
							return d;
						});

						// Add new y-rules if applicable
						var newrule = yrule.enter().append("svg:g").attr("class", "y");

						// add new horizontal lines if necessary with a transition
						newrule.append("svg:line").attr("class", "yLine sapMRPChartYLine").attr("x1", 42).attr("x2",
								backgroundAreaWidth - 16).attr("y1", function(d) {
							return (d < 0) ? oChartSettings.chartSize.valueHeight : this._Y0Pos;
						}).attr("y2", function(d) {
							return (d < 0) ? oChartSettings.chartSize.valueHeight : this._Y0Pos;
						}).transition().duration(this._duration).attr("y1", oChartSettings.yScale)
								.attr("y2", oChartSettings.yScale);

						// add new tick texts if necessary with a transition
						newrule.append("svg:text").attr("class", "yText sapMRPChartYAxisDescr").attr("x", 40).attr("dy", "5px")
								.attr("text-anchor", "end").attr("y", function(d) {
									return (d < 0) ? oChartSettings.chartSize.valueHeight : this._Y0Pos;
								}).text(jQuery.proxy(this.formatNumber, this)).transition().duration(this._duration).attr("y",
										oChartSettings.yScale);

						// Move existing y-rules to their new position
						yrule.select("line.yLine").transition().duration(this._duration).attr("y1", oChartSettings.yScale).attr(
								"y2", oChartSettings.yScale);

						yrule.select("text.yText").transition().duration(this._duration).attr("y", oChartSettings.yScale);

						// calculate the maximum text width after all texts have been transformed
						var maxTextWidth = 0;
						var textSpace = 40;
						var fontSize = 875;

						var yRuleText = yrule.select("text.yText").attr("style", function(d) {

							var textWidth = this.getComputedTextLength();
							if (textWidth > maxTextWidth) {
								maxTextWidth = textWidth;
							}
							if (this.style.fontSize) {
								fontSize = parseFloat(this.style.fontSize) * 1000;
								return "font-size:" + this.style.fontSize;
							}
							return "";
						});

						if (maxTextWidth > textSpace) {
							jQuery.sap.log.debug("adjust font size of " + fontSize + " as text width " + maxTextWidth
									+ " > available text space");
							var sStyle = "font-size:" + Math.floor(fontSize / maxTextWidth * textSpace) / 1000 + "rem";
							yRuleText.attr("style", sStyle);
						}

						// remove obsolete y-rules
						var oldrule = yrule.exit();

						oldrule.select("line.yLine").transition().duration(this._duration).attr("y1", function(d) {
							return (d >= 0) ? 0 : oChartSettings.chartSize.valueHeight;
						}).attr("y2", function(d) {
							return (d >= 0) ? 0 : oChartSettings.chartSize.valueHeight;
						}).remove();

						oldrule.select("text.yText").transition().duration(this._duration).attr("y", function(d) {
							return (d >= 0) ? 0 : oChartSettings.chartSize.valueHeight;
						}).remove();

						oldrule.transition().duration(this._duration).remove();
					},

					renderOverviewWindow : function(vis, oChartSettings) {

						var bSpecialCursor = !this.getFixOverviewHeight();
						var sCSSOverviewWindow = (bSpecialCursor) ? "sapMRPChartOverviewWindow" : "sapMRPChartOverviewWindowSimple";
						sCSSOverviewWindow += " sapMRPChartStartDrag";
						var overviewWindow = vis.append("svg:g").attr("id", oChartSettings.chartId + "-hidden");

						overviewWindow.append("svg:rect").attr("id", oChartSettings.chartId + "-hidden-border").attr("class",
								"sapMRPChartBorder").attr("x", -oChartSettings.chartSize.leftSpace).attr("y", 1).attr(
								"width",
								oChartSettings.chartSize.valueWidth + oChartSettings.chartSize.leftSpace
										+ oChartSettings.chartSize.rightSpace).attr("height", oChartSettings.chartSize.valueHeight - 2);

						overviewWindow.append("svg:rect").attr("id", oChartSettings.chartId + "-hidden-left").attr("class",
								"sapMRPChartOverviewHidden").attr("x", -oChartSettings.chartSize.leftSpace).attr("y", 1).attr("width",
								oChartSettings.chartSize.leftSpace).attr("height", oChartSettings.chartSize.valueHeight - 2);

						overviewWindow.append("svg:rect").attr("id", oChartSettings.chartId + "-hidden-right").attr("class",
								"sapMRPChartOverviewHidden").attr("x", oChartSettings.chartSize.valueWidth).attr("y", 1).attr("width",
								oChartSettings.chartSize.rightSpace).attr("height", oChartSettings.chartSize.valueHeight - 2);

						overviewWindow.append("svg:rect").attr("id", oChartSettings.chartId + "-hidden-window").attr("class",
								sCSSOverviewWindow).attr("x", 0).attr("y", 1).attr("width", oChartSettings.chartSize.valueWidth).attr(
								"height", oChartSettings.chartSize.valueHeight - 2);
					},

					updateOverviewWindow : function(vis, oChartSettings, fromX, toX) {

						var overviewWindow = vis.select("#" + oChartSettings.chartId + "-hidden");
						var rightWidth = oChartSettings.chartSize.chartWidth - toX - oChartSettings.chartSize.leftSpace;
						if (rightWidth < 0) {
							rightWidth = 0;
						}
						var windowWidth = oChartSettings.chartSize.leftSpace + toX - fromX;
						if (windowWidth < 0) {
							windowWidth = 0;
						}

						overviewWindow.select("#" + oChartSettings.chartId + "-hidden-left").attr("width", fromX);
						overviewWindow.select("#" + oChartSettings.chartId + "-hidden-right").attr("x", toX).attr("width",
								rightWidth);

						overviewWindow.select("#" + oChartSettings.chartId + "-hidden-window").attr("x",
								-oChartSettings.chartSize.leftSpace + fromX).attr("width", windowWidth);
					},

					renderXAxis : function(vis, sData, oChartSettings) {

						var xAxis = vis.append("svg:g").attr("id", oChartSettings.chartId + "-chart-xAxis");

						xAxis.append("svg:line").attr("class", "sapMRPChartAxis").attr("x1", -oChartSettings.chartSize.leftSpace)
								.attr("x2", oChartSettings.chartSize.valueWidth + oChartSettings.chartSize.rightSpace).attr("y1",
										oChartSettings.yScale(0)).attr("y2", oChartSettings.yScale(0));
					},

					updateXAxis : function(vis, sData, oChartSettings) {

						var xAxis = vis.select("#" + oChartSettings.chartId + "-chart-xAxis");

						xAxis.select("line").transition().duration(this._duration).attr("x2", oChartSettings.chartSize.chartWidth)
								.attr("y1", oChartSettings.yScale(0)).attr("y2", oChartSettings.yScale(0));
					},

					renderDays : function(vis, sData, oChartSettings) {

						// display all days with changing background color
						var dayArea = vis.append("svg:g").attr("id", oChartSettings.chartId + "-chart-days");

						var days = dayArea.selectAll("rect").data(oChartSettings.data, function(d) {
							return d.date;
						}).enter().append("rect");

						days.attr("x", function(d) {
							return oChartSettings.xScale(d.index - 1);
						}).attr("width", oChartSettings.daySize).attr("y", oChartSettings.chartSize.topSpace).attr("height",
								oChartSettings.chartSize.valueHeight).attr(
								"class",
								function(d) {
									var sDayCSS = ((d.index - oChartSettings.timeframe.minXBasic) % 2 == 0)
											? "sapMRPChartEvenDay"
											: "sapMRPChartOddDay";
									return sDayCSS;
								});
					},

					updateDays : function(vis, sData, oChartSettings) {

						// update days
						var dayArea = vis.select("#" + oChartSettings.chartId + "-chart-days");

						var days = dayArea.selectAll("rect").data(oChartSettings.data, function(d) {
							return d.date;
						});

						// add new days if needed
						var newDays = days.enter().append("rect");

						newDays.attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("width", 0).attr("y", oChartSettings.chartSize.topSpace).attr("height", 0).transition().duration(
								this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d.index - 1);
						}).attr("width", oChartSettings.daySize).attr("height", function(d) {
							return oChartSettings.chartSize.valueHeight;
						}).attr(
								"class",
								function(d) {
									var sDayCSS = ((d.index - oChartSettings.timeframe.minXBasic) % 2 == 0)
											? "sapMRPChartEvenDay"
											: "sapMRPChartOddDay";
									return sDayCSS;
								});

						// update existing days
						days.transition().duration(this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d.index - 1);
						}).attr("width", oChartSettings.daySize).attr("y", oChartSettings.chartSize.topSpace).attr("height",
								oChartSettings.chartSize.valueHeight).attr(
								"class",
								function(d) {
									var sDayCSS = ((d.index - oChartSettings.timeframe.minXBasic) % 2 == 0)
											? "sapMRPChartEvenDay"
											: "sapMRPChartOddDay";
									return sDayCSS;
								});

						// remove obsolete days
						days.exit().transition().duration(this._duration).attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("width", 0).remove();
					},

					renderShortage : function(vis, sData, oChartSettings) {

						// higlight all days with a shortage
						var shortageArea = vis.append("svg:g").attr("id", oChartSettings.chartId + "-chart-shortage");

						var shortages = shortageArea.selectAll("rect").data(oChartSettings.data, function(d) {
							return d.date;
						}).enter().append("rect");

						shortages.attr("x", function(d) {
							return oChartSettings.xScale(d.index - 1);
						}).attr("width", oChartSettings.daySize).attr("y", oChartSettings.chartSize.topSpace).attr("height",
								oChartSettings.chartSize.valueHeight).attr("class", function(d) {

							var sShortageCSS = "sapMRPChartNoShortage";

							if (!d.shortageAccepted) {
								if (d[sData].balanceEnd < d.minStock) {
									sShortageCSS = "sapMRPChartShortage";
								} else if (d[sData].balanceEnd < d.safetyStock) {
									sShortageCSS = "sapMRPChartBelowSafetyStock";
								}
							}

							return sShortageCSS;
						});

						var dayDivider = shortageArea.selectAll("line").data(oChartSettings.data, function(d) {
							return d.date;
						}).enter().append("line");

						dayDivider.attr("x1", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y1", 0).attr("x2", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y2", oChartSettings.chartSize.valueHeight).attr("class", "sapMRPChartDayDivider");
					},

					updateShortage : function(vis, sData, oChartSettings) {

						// update shortages
						var shortageArea = vis.select("#" + oChartSettings.chartId + "-chart-shortage");

						var shortages = shortageArea.selectAll("rect").data(oChartSettings.data, function(d) {
							return d.date;
						});
						var dayDivider = shortageArea.selectAll("line").data(oChartSettings.data, function(d) {
							return d.date;
						});

						// add new shortages if needed
						var newShortages = shortages.enter().append("rect");

						newShortages.attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("width", 0).attr("y", oChartSettings.chartSize.topSpace).attr("height", 0).transition().duration(
								this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d.index - 1);
						}).attr("width", oChartSettings.daySize).attr("height", function(d) {
							return oChartSettings.chartSize.valueHeight;
						}).attr("class", function(d) {

							var sShortageCSS = "sapMRPChartNoShortage";

							if (!d.shortageAccepted) {
								if (d[sData].balanceEnd < d.minStock) {
									sShortageCSS = "sapMRPChartShortage";
								} else if (d[sData].balanceEnd < d.safetyStock) {
									sShortageCSS = "sapMRPChartBelowSafetyStock";
								}
							}

							return sShortageCSS;
						});

						// update existing shortages
						shortages.transition().duration(this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d.index - 1);
						}).attr("width", oChartSettings.daySize).attr("y", oChartSettings.chartSize.topSpace).attr("height",
								function(d) {
									return oChartSettings.chartSize.valueHeight;
								}).attr("class", function(d) {

							var sShortageCSS = "sapMRPChartNoShortage";

							if (!d.shortageAccepted) {
								if (d[sData].balanceEnd < d.minStock) {
									sShortageCSS = "sapMRPChartShortage";
								} else if (d[sData].balanceEnd < d.safetyStock) {
									sShortageCSS = "sapMRPChartBelowSafetyStock";
								}
							}

							return sShortageCSS;
						});

						// remove obsolete shortages
						shortages.exit().transition().duration(this._duration).attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("width", 0).remove();

						// add new day divider if needed
						var newDayDivider = dayDivider.enter().append("line");

						newDayDivider.attr("x1", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y1", 0).attr("x2", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y2", oChartSettings.chartSize.valueHeight).attr("class", "sapMRPChartDayDivider");

						// update existing day divider
						dayDivider.transition().duration(this._duration).attr("x1", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y1", 0).attr("x2", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y2", oChartSettings.chartSize.valueHeight);

						// remove obsolete day divider
						dayDivider.exit().transition().duration(this._duration).attr("x1", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("x2", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).remove();
					},

					renderXTicks : function(vis, sData, oChartSettings) {

						// display x axis with ticks
						var xAxis = vis.append("svg:g").attr("id", oChartSettings.chartId + "-chart-xTicks").attr("minTick",
								oChartSettings.timeframe.minX);

						var xRule = xAxis.selectAll("g").data(oChartSettings.xScale.ticks(oChartSettings.tickCntX),
								jQuery.proxy(this.getDate, this)).enter().append("svg:g");

						xRule.append("svg:text").attr("class", "sapMRPChartXAxisDescr").attr("x", function(d) {
							return oChartSettings.xScale(d) - oChartSettings.daySize / 2;
						}).attr("y", oChartSettings.chartSize.chartHeight - 31).attr("text-anchor", "middle").text(
								jQuery.proxy(this.getDateFormatted, this));
					},

					updateXTicks : function(vis, sData, oChartSettings) {

						// get first existing xrule (to find out if new ones occur before of after the existing ones)
						var xAxis = vis.select("#" + oChartSettings.chartId + "-chart-xTicks");

						var firstExistingX = xAxis.attr("minTick");

						// update x axis
						var xRule = xAxis.attr("minTick", oChartSettings.timeframe.minX).selectAll("g").data(
								oChartSettings.xScale.ticks(oChartSettings.tickCntX), jQuery.proxy(this.getDate, this));

						// add new x rules
						var xRuleNew = xRule.enter().append("svg:g");

						xRuleNew.append("svg:text").attr("class", "sapMRPChartXAxisDescr").attr("x", function(idx) {
							return (idx < firstExistingX) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("y", oChartSettings.chartSize.chartHeight - 31).attr("text-anchor", "middle").text(
								jQuery.proxy(this.getDateFormatted, this)).transition().duration(this._duration).attr("x",
								function(idx) {
									return oChartSettings.xScale(idx) - oChartSettings.daySize / 2;
								});

						// update existing x rules
						xRule.select("text.sapMRPChartXAxisDescr").transition().duration(this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d) - oChartSettings.daySize / 2;
						});

						// remove obsolete x rules
						var xRuleOld = xRule.exit();

						xRuleOld.select("text.sapMRPChartXAxisDescr").transition().duration(this._duration).attr("x",
								function(idx) {
									return (idx < oChartSettings.timeframe.minX) ? 0 : oChartSettings.chartSize.chartWidth;
								}).remove();

						xRuleOld.transition().duration(this._duration).remove();
					},

					renderSupply : function(vis, sData, oChartSettings) {

						// display supply boxes
						var oController = this;
						var supplyArea = vis.append("svg:g").attr("id", oChartSettings.chartId + "-chart-supplies");

						var supplies = supplyArea.selectAll("g").data(oChartSettings.data).enter().append("svg:g");

						supplies.append("rect").attr("class", function(d) {
							var bNewSupply = (d[sData].supply > d.basic.supply);
							return (bNewSupply) ? " sapMRPChartNewSupply" : "sapMRPChartSupply";
						}).attr("x", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 38 / 2;
						}).attr("width", function(d) {
							return oChartSettings.daySize / 21 * 8;
						}).attr("y", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("height", function(d) {
							return oChartSettings.yScale(d[sData].balanceStart) - oChartSettings.yScale(d[sData].balanceIntraday);
						});

						if (oChartSettings.displayText) {

							supplies.append("svg:title").text(function(d) {
								return "" + (oController.formatNumber(d[sData].supply));
							});
						}
					},

					updateSupply : function(vis, sData, oChartSettings) {

						// update supplies
						var oController = this;
						var supplyArea = vis.select("#" + oChartSettings.chartId + "-chart-supplies");

						var supplies = supplyArea.selectAll("g").data(oChartSettings.data, function(d) {
							return d.date;
						});

						// add new supply boxes if needed
						var suppliesNew = supplies.enter().append("svg:g");

						suppliesNew.append("rect").attr("class", function(d) {
							var bNewSupply = (d[sData].supply > d.basic.supply);
							return (bNewSupply) ? " sapMRPChartNewSupply" : "sapMRPChartSupply";
						}).attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("width", 0).attr("y", oChartSettings.yScale(0)).attr("height", 0).transition().duration(
								this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 38 / 2;
						}).attr("width", function(d) {
							return oChartSettings.daySize / 21 * 8;
						}).attr("y", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("height", function(d) {
							return oChartSettings.yScale(d[sData].balanceStart) - oChartSettings.yScale(d[sData].balanceIntraday);
						});

						if (oChartSettings.displayText) {

							suppliesNew.append("svg:title").text(function(d) {
								return "" + (oController.formatNumber(d[sData].supply));
							});
						}

						// update existing supply boxes
						supplies.select("rect").transition().duration(this._duration).attr("class", function(d) {
							var bNewSupply = (d[sData].supply > d.basic.supply);
							return (bNewSupply) ? "sapMRPChartNewSupply" : this.getAttribute("class");
						}).attr("x", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 38 / 2;
						}).attr("width", function(d) {
							return oChartSettings.daySize / 21 * 8;
						}).attr("y", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("height", function(d) {
							return oChartSettings.yScale(d[sData].balanceStart) - oChartSettings.yScale(d[sData].balanceIntraday);
						}).transition().delay(this._duration).duration(0).attr("class", function(d) {
							var bNewSupply = (d[sData].supply > d.basic.supply);
							return (bNewSupply) ? " sapMRPChartNewSupply" : "sapMRPChartSupply";
						});

						if (oChartSettings.displayText) {

							supplies.select("title").text(function(d) {
								return "" + (oController.formatNumber(d[sData].supply));
							});
						}

						// remove obsolete supply boxes
						var suppliesOld = supplies.exit();

						suppliesOld.select("rect").transition().duration(this._duration).attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("width", 0).remove();

						suppliesOld.select("text").transition().duration(this._duration).attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).remove();

						suppliesOld.transition().duration(this._duration).remove();
					},

					renderDemand : function(vis, sData, oChartSettings) {

						// display demand boxes
						var oController = this;
						var demandArea = vis.append("svg:g").attr("id", oChartSettings.chartId + "-chart-demands");

						var demands = demandArea.selectAll("g").data(oChartSettings.data).enter().append("svg:g");

						demands.append("rect").attr("class", "sapMRPChartDemand").attr("x", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 20 / 2;
						}).attr("width", function(d) {
							return oChartSettings.daySize / 21 * 8;
						}).attr("y", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("height", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd) - oChartSettings.yScale(d[sData].balanceIntraday);
						});

						if (oChartSettings.displayText) {

							demands.append("svg:title").text(function(d) {
								return "" + (oController.formatNumber(-d[sData].demand));
							});
						}
					},

					updateDemand : function(vis, sData, oChartSettings) {

						// update demands
						var oController = this;
						var demandArea = vis.select("#" + oChartSettings.chartId + "-chart-demands");

						var demands = demandArea.selectAll("g").data(oChartSettings.data, function(d) {
							return d.date;
						});

						// add new demand boxes if needed
						var demandsNew = demands.enter().append("svg:g");

						demandsNew.append("rect").attr("class", "sapMRPChartDemand").attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("width", 0).attr("y", oChartSettings.yScale(0)).attr("height", 0).transition().duration(
								this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 20 / 2;
						}).attr("width", function(d) {
							return oChartSettings.daySize / 21 * 8;
						}).attr("y", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("height", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd) - oChartSettings.yScale(d[sData].balanceIntraday);
						});

						if (oChartSettings.displayText) {

							demandsNew.append("svg:title").text(function(d) {
								return "" + (oController.formatNumber(-d[sData].demand));
							});
						}

						// update existing demand boxes
						demands.select("rect").transition().duration(this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 20 / 2;
						}).attr("width", function(d) {
							return oChartSettings.daySize / 21 * 8;
						}).attr("y", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("height", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd) - oChartSettings.yScale(d[sData].balanceIntraday);
						});

						if (oChartSettings.displayText) {

							demands.select("title").text(function(d) {
								return "" + (oController.formatNumber(-d[sData].demand));
							});
						}

						// remove obsolete demand boxes
						var demandsOld = demands.exit();

						demandsOld.select("rect").transition().duration(this._duration).attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("width", 0).remove();

						demandsOld.select("text").transition().duration(this._duration).attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).remove();

						demandsOld.transition().duration(this._duration).remove();
					},

					renderBalanceLine : function(vis, sData, oChartSettings) {

						// display balances lines
						var balanceArea = vis.append("svg:g").attr("id", oChartSettings.chartId + "-chart-balances");

						var balanceLines = balanceArea.selectAll("g.balanceLines").data(oChartSettings.data, function(d) {
							return d.date;
						}).enter().append("svg:g").attr("class", "balanceLines");

						balanceLines.append("svg:line").attr("class", "start sapMRPChartLineEndOfDay").attr("x1", function(d) {
							return oChartSettings.xScale(d.index - 1);
						}).attr("x2", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 22 / 2;
						}).attr("y1", function(d) {
							return oChartSettings.yScale(d[sData].balanceStart);
						}).attr("y2", function(d) {
							return oChartSettings.yScale(d[sData].balanceStart);
						});

						balanceLines.append("svg:line").attr(
								"class",
								function(d) {
									var cssClass = ((d[sData].demand != 0) && (d[sData].supply != 0))
											? "sapMRPChartLineIntraday"
											: "sapMRPChartLineEndOfDay";
									return "intraday " + cssClass;
								}).attr("fullX1", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 38 / 2;
						}).attr("x1", function(d) {
							if (d[sData].supply != 0) {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 38 / 2;
							} else {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 22 / 2;
							}
						}).attr("fullX2", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 4 / 2;
						}).attr("x2", function(d) {
							if (d[sData].demand != 0) {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 4 / 2;
							} else {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 20 / 2;
							}
						}).attr("y1", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("y2", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						});

						balanceLines.append("svg:line").attr("class", "end sapMRPChartLineEndOfDay").attr("x1", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 20 / 2;
						}).attr("x2", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y1", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						}).attr("y2", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						});
					},

					updateBalanceLine : function(vis, sData, oChartSettings) {

						// update balance lines
						var balanceArea = vis.select("#" + oChartSettings.chartId + "-chart-balances");

						var balanceLines = balanceArea.selectAll("g.balanceLines").data(oChartSettings.data, function(d) {
							return d.date;
						});

						// add new balance lines if needed
						var balanceLinesNew = balanceLines.enter().append("svg:g").attr("class", "balanceLines");

						balanceLinesNew.append("svg:line").attr("class", "start sapMRPChartLineEndOfDay").attr("x1", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("x2", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("y1", oChartSettings.yScale(0)).attr("y2", oChartSettings.yScale(0)).transition().duration(
								this._duration).attr("x1", function(d) {
							return oChartSettings.xScale(d.index - 1);
						}).attr("x2", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 22 / 2;
						}).attr("y1", function(d) {
							return oChartSettings.yScale(d[sData].balanceStart);
						}).attr("y2", function(d) {
							return oChartSettings.yScale(d[sData].balanceStart);
						});

						balanceLinesNew.append("svg:line").attr(
								"class",
								function(d) {
									var cssClass = ((d[sData].demand != 0) && (d[sData].supply != 0))
											? "sapMRPChartLineIntraday"
											: "sapMRPChartLineEndOfDay";
									return "intraday " + cssClass;
								}).attr("x1", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("x2", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("y1", oChartSettings.yScale(0)).attr("y2", oChartSettings.yScale(0)).transition().duration(
								this._duration).attr("fullX1", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 38 / 2;
						}).attr("x1", function(d) {
							if (d[sData].supply != 0) {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 38 / 2;
							} else {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 22 / 2;
							}
						}).attr("fullX2", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 4 / 2;
						}).attr("x2", function(d) {
							if (d[sData].demand != 0) {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 4 / 2;
							} else {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 20 / 2;
							}
						}).attr("y1", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("y2", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						});

						balanceLinesNew.append("svg:line").attr("class", "end sapMRPChartLineEndOfDay").attr("x1", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("x2", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("y1", oChartSettings.yScale(0)).attr("y2", oChartSettings.yScale(0)).transition().duration(
								this._duration).attr("x1", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 20 / 2;
						}).attr("x2", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y1", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						}).attr("y2", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						});

						// update existing balance lines
						balanceLines.select("line.start").transition().duration(this._duration).attr("x1", function(d) {
							return oChartSettings.xScale(d.index - 1);
						}).attr("y1", function(d) {
							return oChartSettings.yScale(d[sData].balanceStart);
						}).attr("y2", function(d) {
							return oChartSettings.yScale(d[sData].balanceStart);
						}).attr("x2", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 22 / 2;
						});

						balanceLines.select("line.intraday").attr(
								"class",
								function(d) {
									return ((d[sData].demand != 0) && (d[sData].supply != 0))
											? "sapMRPChartLineIntraday"
											: "sapMRPChartLineEndOfDay";
								}).attr("x1", function(d) {
							return this.getAttribute("fullX1");
						}).attr("x2", function(d) {
							return this.getAttribute("fullX2");
						}).transition().duration(this._duration).attr("y1", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("y2", function(d) {
							return oChartSettings.yScale(d[sData].balanceIntraday);
						}).attr("x1", function(d) {
							if (d[sData].supply != 0) {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 38 / 2;
							} else {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 22 / 2;
							}
						}).attr("x2", function(d) {
							if (d[sData].demand != 0) {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 4 / 2;
							} else {
								return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 20 / 2;
							}
						});

						balanceLines.select("line.end").transition().duration(this._duration).attr("x2", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y1", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						}).attr("y2", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						}).attr("x1", function(d) {
							return oChartSettings.xScale(d.index) - oChartSettings.daySize / 21 * 20 / 2;
						});

						// remove obsolete balance lines
						var balanceLinesOld = balanceLines.exit();

						balanceLinesOld.selectAll("line").transition().duration(this._duration).attr("x1", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("x2", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).remove();

						balanceLinesOld.transition().duration(this._duration).remove();
					},

					renderBalanceDot : function(vis, sData, oChartSettings) {

						// display start balance
						var oController = this;
						var balanceArea = vis.select("#" + oChartSettings.chartId + "-chart-balances");

						var balanceFirst = balanceArea.append("svg:g").attr("class", "firstBalance");

						balanceFirst.append("svg:line").attr("class", "sapMRPChartLineEndOfDay").attr("x1", -11).attr("x2",
								oChartSettings.xScale(oChartSettings.timeframe.minX - 1)).attr("y1",
								oChartSettings.yScale(oChartSettings.firstBalance[sData])).attr("y2",
								oChartSettings.yScale(oChartSettings.firstBalance[sData]));

						balanceFirst.append("svg:circle").attr("class", "sapMRPChartBalance").attr("cx",
								oChartSettings.xScale(oChartSettings.timeframe.minX - 1)).attr("cy",
								oChartSettings.yScale(oChartSettings.firstBalance[sData])).attr("r", 5);

						balanceFirst.append("svg:text").attr("class", "sapMRPChartBalanceDescr").attr("x", function(d) {
							return oChartSettings.xScale(oChartSettings.timeframe.minX - 1);
						}).attr("y", oChartSettings.yScale(oChartSettings.firstBalance[sData])).attr("dy", "18px").attr(
								"text-anchor", "middle").text(oController.formatNumber(oChartSettings.firstBalance[sData])).attr(
								"style", function(d) {
									var sStyle = "";
									var textWidth = this.getComputedTextLength();
									var textSpace = oChartSettings.chartSize.leftSpace + oChartSettings.daySize * 3 / 8;

									if (textWidth > textSpace) {
										sStyle = "font-size:" + Math.floor(875 / textWidth * textSpace) / 1000 + "rem";
									}
									return sStyle;
								}).attr("dx", function(d) {

							var textWidth = this.getComputedTextLength();
							if (textWidth > oChartSettings.chartSize.leftSpace * 2) {
								return (textWidth - 2 * oChartSettings.chartSize.leftSpace) + "px";
							}
							return "0px";
						});

						// add end of day balances for each day
						var balanceDot = balanceArea.selectAll("g.balanceDot").data(oChartSettings.data, function(d) {
							return d.date;
						}).enter().append("svg:g").attr("class", "balanceDot");

						balanceDot.append("svg:circle").attr("class", "sapMRPChartBalance").attr("cx", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("cy", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						}).attr("r", function(d) {
							return (d[sData].demand || d[sData].supply) ? 5 : 0;
						});

						// set the tooltip for the balance dots
						if (this.getBalanceDotTooltip() != "") {
							balanceDot.append("svg:title").text(this.getBalanceDotTooltip());
						}

						balanceDot.append("svg:text").attr("class", "sapMRPChartBalanceDescr").attr("x", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						}).attr("dy", "18px").attr("text-anchor", "middle").text(function(d) {
							if (d[sData].demand || d[sData].supply) {
								return oController.formatNumber(d[sData].balanceEnd);
							} else {
								return "";
							}
						}).attr("style", function(d) {
							var sStyle = "";
							var textWidth = this.getComputedTextLength();
							var textSpace = oChartSettings.daySize * 3 / 4;

							if (textWidth > textSpace) {
								sStyle = "font-size:" + Math.floor(875 / textWidth * textSpace) / 1000 + "rem";
							}
							return sStyle;
						});
					},

					updateBalanceDot : function(vis, sData, oChartSettings) {

						// update end of day balances
						var oController = this;
						var balanceArea = vis.select("#" + oChartSettings.chartId + "-chart-balances");

						var balanceFirst = balanceArea.select("g.firstBalance");

						balanceFirst.select("line").transition().duration(this._duration).attr("x2",
								oChartSettings.xScale(oChartSettings.timeframe.minX - 1)).attr("y1",
								oChartSettings.yScale(oChartSettings.firstBalance[sData])).attr("y2",
								oChartSettings.yScale(oChartSettings.firstBalance[sData]));

						balanceFirst.select("circle").transition().duration(this._duration).attr("cx",
								oChartSettings.xScale(oChartSettings.timeframe.minX - 1)).attr("cy",
								oChartSettings.yScale(oChartSettings.firstBalance[sData]));

						balanceFirst.select("text").transition().duration(this._duration).attr("x", function(d) {
							return oChartSettings.xScale(oChartSettings.timeframe.minX - 1);
						}).attr("y", oChartSettings.yScale(oChartSettings.firstBalance[sData])).attr("style", "").text(
								oController.formatNumber(oChartSettings.firstBalance[sData])).attr("style", function(d) {
							var sStyle = "";
							var textWidth = this.getComputedTextLength();
							var textSpace = oChartSettings.chartSize.leftSpace + oChartSettings.daySize * 3 / 8;

							if (textWidth > textSpace) {
								sStyle = "font-size:" + Math.floor(875 / textWidth * textSpace) / 1000 + "rem";
							}
							return sStyle;
						}).attr("dx", function(d) {

							var textWidth = this.getComputedTextLength();
							if (textWidth > oChartSettings.chartSize.leftSpace * 2) {
								return (textWidth - 2 * oChartSettings.chartSize.leftSpace) + "px";
							}
							return "0px";
						});

						// update balances
						var balanceDot = balanceArea.selectAll("g.balanceDot").data(oChartSettings.data, function(d) {
							return d.date;
						});

						// add new balances if needed
						var balanceDotNew = balanceDot.enter().append("svg:g").attr("class", "balanceDot");

						balanceDotNew.append("svg:circle").attr("class", "sapMRPChartBalance").attr("cx", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("cy", oChartSettings.yScale(0)).attr("r", function(d) {
							return (d[sData].demand || d[sData].supply) ? 5 : 0;
						}).transition().duration(this._duration).attr("cx", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("cy", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						});

						balanceDotNew.append("svg:text").attr("class", "sapMRPChartBalanceDescr").attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("y", oChartSettings.yScale(0)).attr("dy", "18px").attr("text-anchor", "middle").text(function(d) {
							if (d[sData].demand || d[sData].supply) {
								return oController.formatNumber(d[sData].balanceEnd);
							} else {
								return "";
							}
						}).transition().duration(this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						});

						// update existing balances
						balanceDot.select("circle.sapMRPChartBalance").transition().duration(this._duration).attr("cx",
								function(d) {
									return oChartSettings.xScale(d.index);
								}).attr("cy", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						}).attr("r", function(d) {
							return (d[sData].demand || d[sData].supply) ? 5 : 0;
						});

						balanceDot.select("text").attr("style", "").text(function(d) {
							if (d[sData].demand || d[sData].supply) {
								return oController.formatNumber(d[sData].balanceEnd);
							} else {
								return "";
							}
						}).transition().duration(this._duration).attr("x", function(d) {
							return oChartSettings.xScale(d.index);
						}).attr("y", function(d) {
							return oChartSettings.yScale(d[sData].balanceEnd);
						}).attr("style", function(d) {
							var sStyle = "";
							var textWidth = this.getComputedTextLength();
							var textSpace = oChartSettings.daySize * 3 / 4;

							if (textWidth > textSpace) {
								sStyle = "font-size:" + Math.floor(875 / textWidth * textSpace) / 1000 + "rem";
							}
							return sStyle;
						});

						// remove obsolete balances
						var balanceDotOld = balanceDot.exit();

						balanceDotOld.select("circle").transition().duration(this._duration).attr("cx", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("cy", oChartSettings.yScale(0)).remove();

						balanceDotOld.select("text").transition().duration(this._duration).attr("x", function(d) {
							return (d.index < oChartSettings.timeframe.minXBasic) ? 0 : oChartSettings.chartSize.chartWidth;
						}).attr("y", oChartSettings.yScale(0)).remove();

						balanceDotOld.transition().duration(this._duration).remove();
					},

					/**
					 * Creates the SVG elements for the chart and the overview.<br>
					 * Depending on the value of the parameter sData it creates either a basic chart or a preview.<br>
					 * The function calls the different render*() functions to render the individual parts of the chart.<br>
					 * Prerequisites: <br>
					 * -the functions calcChartSettings() and calcOverviewSettings() have been executed.<br>
					 * -the chart has data<br>
					 * -there are no SVG elements in the DOM tree part of the chart but the function renderer() has been executed
					 * so the HTML elements exist<br>
					 * 
					 * @param sData
					 */
					renderChart : function(sData) {

						sData = sData || this._dataset || "basic";

						var oChartSettings = this.getChartSettings(sData);
						var oOverviewSettings = this.getOverviewSettings(sData);

						if (oChartSettings.data.length === 0 || oOverviewSettings.data.length === 0) {
							return;
						}

						this._y0Pos = oChartSettings.posY0;

						if (!this.isVisible(sData)) {
							return;
						}

						this.renderBackground(sData, oChartSettings);

						var chart = d3.select("#" + oChartSettings.chartId + "-chartArea").append("svg:svg").attr("id",
								oChartSettings.chartId + "-chart").attr("width", oChartSettings.chartSize.chartWidth).attr("height",
								oChartSettings.chartSize.chartHeight);

						var vis = chart.append("svg:g").attr("transform",
								"translate(" + oChartSettings.chartSize.leftSpace + "," + oChartSettings.chartSize.topBorder + ")");

						if (oChartSettings.data.length) {
							this.renderDays(vis, sData, oChartSettings);
							this.renderShortage(vis, sData, oChartSettings);
							this.renderXTicks(vis, sData, oChartSettings);
							this.renderXAxis(vis, sData, oChartSettings);
							this.renderSupply(vis, sData, oChartSettings);
							this.renderDemand(vis, sData, oChartSettings);
							this.renderBalanceLine(vis, sData, oChartSettings);
							this.renderBalanceDot(vis, sData, oChartSettings);
						}

						if (this.getShowOverview() && (oOverviewSettings.chartSize.chartHeight > 0)) {
							var overview = d3.select("#" + oOverviewSettings.chartId + "-chartArea").append("svg:svg").attr("id",
									oOverviewSettings.chartId + "-chart").attr("width", oOverviewSettings.chartSize.chartWidth).attr(
									"height", oOverviewSettings.chartSize.chartHeight + 2);

							var overviewVis = overview.append("svg:g").attr(
									"transform",
									"translate(" + oOverviewSettings.chartSize.leftSpace + "," + oOverviewSettings.chartSize.topBorder
											+ ")");

							if (oOverviewSettings.data.length) {
								if (!this.getFixOverviewHeight()) {
									this.renderXAxis(overviewVis, sData, oOverviewSettings);
									this.renderSupply(overviewVis, sData, oOverviewSettings);
									this.renderDemand(overviewVis, sData, oOverviewSettings);
									this.renderBalanceLine(overviewVis, sData, oOverviewSettings);
								}
								this.renderOverviewWindow(overviewVis, oOverviewSettings);
								this.showDetailsInOverview();
							}
						}
					},

					updateChart : function(sData) {

						sData = sData || "preview";

						var oChartSettings = this.getChartSettings(sData);
						var oOverviewSettings = this.getOverviewSettings(sData);

						if (!this.isVisible(sData)) {
							return;
						}

						this.updateBackground(sData, oChartSettings);

						var chartArea = d3.select("#" + oChartSettings.chartId + "-chartArea");

						chartArea.transition().duration(this._duration).style({
							width : oChartSettings.chartSize.chartWidth + "px",
							left : "0px"
						});

						var svg = d3.select("#" + oChartSettings.chartId + "-chartArea svg");

						svg.transition().duration(this._duration).attr("width", oChartSettings.chartSize.chartWidth);

						var vis = d3.select("#" + oChartSettings.chartId + "-chartArea svg g");

						if (oChartSettings.data.length) {
							this.updateDays(vis, sData, oChartSettings);
							this.updateShortage(vis, sData, oChartSettings);
							this.updateXTicks(vis, sData, oChartSettings);
							this.updateXAxis(vis, sData, oChartSettings);
							this.updateSupply(vis, sData, oChartSettings);
							this.updateDemand(vis, sData, oChartSettings);
							this.updateBalanceLine(vis, sData, oChartSettings);
							this.updateBalanceDot(vis, sData, oChartSettings);
						}

						if (this.getShowOverview() && (oOverviewSettings.chartSize.chartHeight > 0)) {
							var overviewArea = d3.select("#" + oOverviewSettings.chartId + "-chartArea");

							overviewArea.transition().duration(this._duration).style("left", "0px");

							var overviewVis = d3.select("#" + oOverviewSettings.chartId + "-chartArea svg g");

							if (oOverviewSettings.data.length) {
								this.updateXAxis(overviewVis, sData, oOverviewSettings);
								this.updateSupply(overviewVis, sData, oOverviewSettings);
								this.updateDemand(overviewVis, sData, oOverviewSettings);
								this.updateBalanceLine(overviewVis, sData, oOverviewSettings);
							}
						}
					}
				});

/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.util.CommonConstants");

/**
 * MRP Solution Card Control
 */
sap.ui.core.Control.extend("i2d.pp.mrpcockpit.reuse.controls.SolutionCard", {

	metadata : {
		properties : {

			"myCard" : "object",
			"title" : "string",
			"subTitle" : "string",
			"actionText" : "string",
			"materialShortageSolutionType" : "string",
			"proposalPriority" : "string",
			"state" : "string",
			"status" : "string",
			"tooltipRating" : "string",
			"tooltipAction" : "string"
		},

		aggregations : {
			"ctrlStars" : {
				type : "sap.m.RatingIndicator",
				multiple : false
			},
			"ctrlIcon" : {
				type : "sap.ui.core.Icon",
				multiple : false
			}
		}

	},

	/**
	 * Determine the root location of the tap event. Returns {inside card; execute area "choose"; on icon}
	 * 
	 * @param evt
	 * @memberOf SolutionCard
	 */
	getTapLocation : function(evt) {
		var sTapLocation = "";
		// Use jQuery to get the DOM of the currently selected card
		var oLocation = jQuery("#" + this.getId());
		// Get all children (DIVs, SPANs, ...) of that DOM element
		var aChildren = oLocation.children();
		var oChild = null;
		// Check if the card was selected directly
		if (oLocation[0].id === evt.target.id) {
			sTapLocation = this.Constants.CARD_AREA_INSIDE;
		} else {
			// Loop at each child element and check if the "event target" is part
			// of the particular child. If found, the click/tap event was triggered
			// from there...
			for ( var i = 0; i < aChildren.length; i++) {
				oChild = aChildren[i];
				if (oChild.contains(evt.target)) {
					switch (oChild.className) {
						case "sapMRPSCTitle" :
						case "sapMRPSCSubtitle" :
						case "sapMRPSCRating" :
							sTapLocation = this.Constants.CARD_AREA_INSIDE;
							break;
						case "sapMRPSCAction" :
							sTapLocation = this.Constants.CARD_AREA_EXECUTE;
							break;
						case "sapMRPSCIcon" :
							sTapLocation = this.Constants.CARD_AREA_ICON;
							break;
						default :
							sTapLocation = "";
					}
				}
			}
		}
		return sTapLocation;
	},

	/**
	 * This is a UI5 handler method that is called when the control's area is clicked. No registration required. Dependent
	 * on the location of the click event, an appropiate action is started:<BR>
	 * -Execute the solution card if the area "choose" has been clicked<BR>
	 * -Run a preview/Cancel a preview if the use has clicked somewhere within the card
	 * 
	 * @param evt
	 * @memberOf SolutionCard
	 */
	ontap : function(evt) {
		// Get the data of the current card control
		var oCard = this.getMyCard();
		// If the clicked solution card is locked, we return
		// immediately and no action is performed at all
		if (this.isSolutionCardLocked()) {
			return;
		}
		// Determine the location of the click/tap event
		var sTapLocation = this.getTapLocation(evt);
		// Based on the determined location, we trigger an action
		switch (sTapLocation) {

			case this.Constants.CARD_AREA_EXECUTE :
				// If the card is clicked in the lower area (execution) the click is interpreted as 'open the solution card'.
				this._triggerSolutionCardExecution(oCard);
				break;

			case this.Constants.CARD_AREA_INSIDE :
			case this.Constants.CARD_AREA_ICON :

				// No preview for solution card 'accepted' allowed. So we quit.
				if (this.getMaterialShortageSolutionType() === this.Constants.SOLUTIONTYPE_ACCEPT_REMOVE) {
					return;
				}
				// No preview for solution card 'accept'
				if (this.getMaterialShortageSolutionType() === this.Constants.SOLUTIONTYPE_ACCEPT) {
					// Always cancel any preview when selecting the solution card 'accept'
					this._triggerSolutionCardCancelPreview();
					this.setState(this.Constants.CARD_STATE_ENABLED);
					return;
				}
				// Set the status of the solution card. The status depends on the previous state.
				// It alternates between 'active' and 'enabled'
				if (this.hasState(this.Constants.CARD_STATE_ACTIVE)) {
					// If the card is active, the click is interpreted as cancel preview.
					this._triggerSolutionCardCancelPreview();
					// Mark the solution card as enabled
					this.setState(this.Constants.CARD_STATE_ENABLED);
				} else {
					// If the card is just enabled the click is interpreted as preview.
					this._triggerSolutionCardRunPreview(oCard);
					// Mark the solution card as active
					this.setState(this.Constants.CARD_STATE_ACTIVE);
				}
				break;
		}

	},

	/**
	 * Trigger the execution of the solution card
	 * 
	 * @param oCard
	 * @memberOf SolutionCard
	 */
	_triggerSolutionCardExecution : function(oCard) {
		var bus = sap.ui.getCore().getEventBus();
		bus.publish(this.Constants.EVENT_CHANNELID_SOLCARD, this.Constants.EVENT_EVENTID_DIALOG_START);
		bus.publish(this.Constants.EVENT_CHANNELID_SOLCARD, this.Constants.EVENT_EVENTID_EXECUTE, {
			model : oCard
		});
	},

	/**
	 * Trigger the preview of the solution card
	 * 
	 * @param oCard
	 * @memberOf SolutionCard
	 */
	_triggerSolutionCardRunPreview : function(oCard) {
		var bus = sap.ui.getCore().getEventBus();
		bus.publish(this.Constants.EVENT_CHANNELID_CARD_PREVIEW, this.Constants.EVENT_EVENTID_RUN, {
			model : oCard
		});
	},

	/**
	 * Trigger the cancel preview of the solution card
	 * 
	 * @memberOf SolutionCard
	 */
	_triggerSolutionCardCancelPreview : function() {
		var bus = sap.ui.getCore().getEventBus();
		bus.publish(this.Constants.EVENT_CHANNELID_CARD_PREVIEW, this.Constants.EVENT_EVENTID_CANCEL, {
			model : null
		});
	},

	/**
	 * Initialize the card control. Create an instance of the rating indicator to show the proposal ranking.
	 * 
	 * @memberOf SolutionCard
	 */
	init : function() {

		// Create and initialize the RatingIndicator
		var oCtrl = new sap.m.RatingIndicator({
			maxValue : 2,
			iconSize : "1.125rem",
			value : 0,
			enabled : false
		});
		this.setCtrlStars(oCtrl);
		this.setProposalPriority("0");

		// Shortcut to the MRP constants
		this.Constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;

	},

	/**
	 * Check if the current solution card is active
	 * 
	 * @memberOf SolutionCard
	 */
	isSolutionCardActive : function() {
		return this.hasState(this.Constants.CARD_STATE_ACTIVE);
	},

	/**
	 * Check if the current solution card is locked
	 * 
	 * @memberOf SolutionCard
	 */
	isSolutionCardLocked : function() {
		return this.hasState(this.Constants.CARD_STATE_LOCKED);
	},

	/**
	 * Check if the current solution card is clicked
	 * 
	 * @memberOf SolutionCard
	 */
	isSolutionCardClicked : function() {
		return this.hasState(this.Constants.CARD_STATE_CLICKED);
	},

	/**
	 * Checks if the solution cards has the UI status that the clients asks for.
	 * 
	 * @param sState
	 * @memberOf SolutionCard
	 */
	hasState : function(sState) {
		var bRet = false;
		switch (sState) {
			case this.Constants.CARD_STATE_ENABLED :
				bRet = this.hasStyleClass("sapMRPSCStatusEnabled");
				break;
			case this.Constants.CARD_STATE_DISABLED :
				bRet = this.hasStyleClass("sapMRPSCStatusDisabled");
				break;
			case this.Constants.CARD_STATE_ACTIVE :
				bRet = this.hasStyleClass("sapMRPSCStatusActive");
				break;
			case this.Constants.CARD_STATE_LOCKED :
				bRet = this.hasStyleClass("sapMRPSCStatusLocked");
				break;
			case this.Constants.CARD_STATE_CLICKED :
				bRet = this.hasStyleClass("sapMRPSCStatusClicked");
				break;
			case this.Constants.CARD_STATE_HIDDEN :
				bRet = this.hasStyleClass("sapMRPSCStatusHidden");
				break;
			default :
				bRet = false;
				break;
		}
		return bRet;
	},

	/**
	 * Sets the UI status of a solution card. Only one status can be active at one moment. So if the card has another
	 * status, the other status is removed.<BR>
	 * Each status is represented by a CSS class that is dynamically added to /removed from the HTML element.
	 * 
	 * @param sState
	 *          string that represents a UI status defined in the constant .CARD_STATE_[X]
	 * @memberOf SolutionCard
	 */
	setState : function(sState) {
		switch (sState) {
			case this.Constants.CARD_STATE_ENABLED :
				if (this.hasStyleClass("sapMRPSCStatusHidden")) {
					this.removeStyleClass("sapMRPSCStatusHidden");
				}
				if (this.hasStyleClass("sapMRPSCStatusDisabled")) {
					this.removeStyleClass("sapMRPSCStatusDisabled");
				}
				if (this.hasStyleClass("sapMRPSCStatusActive")) {
					this.removeStyleClass("sapMRPSCStatusActive");
				}
				if (this.hasStyleClass("sapMRPSCStatusLocked")) {
					this.removeStyleClass("sapMRPSCStatusLocked");
				}
				if (this.hasStyleClass("sapMRPSCStatusClicked")) {
					this.removeStyleClass("sapMRPSCStatusClicked");
				}
				if (!this.hasStyleClass("sapMRPSCStatusEnabled")) {
					this.addStyleClass("sapMRPSCStatusEnabled");
				}
				break;
			case this.Constants.CARD_STATE_DISABLED :

				if (!this.hasStyleClass("sapMRPSCStatusDisabled")) {
					this.addStyleClass("sapMRPSCStatusDisabled");
				}
				if (this.hasStyleClass("sapMRPSCStatusEnabled")) {
					this.removeStyleClass("sapMRPSCStatusEnabled");
				}
				if (this.hasStyleClass("sapMRPSCStatusActive")) {
					this.removeStyleClass("sapMRPSCStatusActive");
				}
				if (this.hasStyleClass("sapMRPSCStatusLocked")) {
					this.removeStyleClass("sapMRPSCStatusLocked");
				}
				if (this.hasStyleClass("sapMRPSCStatusClicked")) {
					this.removeStyleClass("sapMRPSCStatusClicked");
				}
				break;
			case this.Constants.CARD_STATE_ACTIVE :
				if (!this.hasStyleClass("sapMRPSCStatusActive")) {
					this.addStyleClass("sapMRPSCStatusActive");
				}
				if (this.hasStyleClass("sapMRPSCStatusEnabled")) {
					this.removeStyleClass("sapMRPSCStatusEnabled");
				}
				if (this.hasStyleClass("sapMRPSCStatusDisabled")) {
					this.removeStyleClass("sapMRPSCStatusDisabled");
				}
				if (this.hasStyleClass("sapMRPSCStatusLocked")) {
					this.removeStyleClass("sapMRPSCStatusLocked");
				}
				if (this.hasStyleClass("sapMRPSCStatusClicked")) {
					this.removeStyleClass("sapMRPSCStatusClicked");
				}
				break;
			case this.Constants.CARD_STATE_LOCKED :
				if (this.hasStyleClass("sapMRPSCStatusEnabled")) {
					this.removeStyleClass("sapMRPSCStatusEnabled");
				}
				if (this.hasStyleClass("sapMRPSCStatusDisabled")) {
					this.removeStyleClass("sapMRPSCStatusDisabled");
				}
				if (this.hasStyleClass("sapMRPSCStatusClicked")) {
					this.removeStyleClass("sapMRPSCStatusClicked");
				}
				if (this.hasStyleClass("sapMRPSCStatusActive")) {
					this.removeStyleClass("sapMRPSCStatusActive");
				}
				if (!this.hasStyleClass("sapMRPSCStatusLocked")) {
					this.addStyleClass("sapMRPSCStatusLocked");
				}
				break;
			case this.Constants.CARD_STATE_CLICKED :
				if (this.hasStyleClass("sapMRPSCStatusDisabled")) {
					this.removeStyleClass("sapMRPSCStatusDisabled");
				}
				if (this.hasStyleClass("sapMRPSCStatusLocked")) {
					this.removeStyleClass("sapMRPSCStatusLocked");
				}
				if (!this.hasStyleClass("sapMRPSCStatusClicked")) {
					this.addStyleClass("sapMRPSCStatusClicked");
				}
				break;
			case this.Constants.CARD_STATE_HIDDEN :
				if (!this.hasStyleClass("sapMRPSCStatusHidden")) {
					this.addStyleClass("sapMRPSCStatusHidden");
				}
				break;
		}
	},

	/**
	 * Initializes the card control. Sets the title, subtitle, action texts and tooltips
	 * 
	 * @memberOf SolutionCard
	 */
	initCard : function() {

		var oBundle = this.getModel("Common_i18n").getResourceBundle();
		var sTitle = "";
		var sSubtitle = "";
		var sActionText = oBundle.getText("CARD_ACT_CHOOSE");
		var myCard = this.getMyCard();
		var sIcon = "";
		var sIconTooltip = oBundle.getText("CARD_XTOL_PREVIEW");
		var sRatingTooltip = "";
		var sActionTooltip = "";

		// -----------------------------------------------
		// Subtitles depend on the type of the card
		var subTitlePoPr = "";
		if (myCard.VendorName) {
			subTitlePoPr = myCard.VendorName;
		} else {
			subTitlePoPr = oBundle.getText("CARD_SUB_UNSOURCED");
		}
		var subTitleToTor = "";
		if (myCard.SupplyingPlant) {
			subTitleToTor = oBundle.getText("CARD_SUB_PLANT", myCard.SupplyingPlant);
		} else {
			subTitleToTor = oBundle.getText("CARD_SUB_UNSOURCED");
		}
		// If the vendor and the supplying plant is provided, we concatenate both values
		// and use it for all card types (MaterialShortageSolutionType)
		if (myCard.VendorName && myCard.SupplyingPlant) {
			subTitlePoPr = oBundle.getText("PLANT_LONG", [myCard.SupplyingPlant, myCard.VendorName]);
			subTitleToTor = subTitlePoPr;
		}

		// -----------------------------------------------
		// Set the title and subtitle based on the solution type
		switch (myCard.MaterialShortageSolutionType) {
			case this.Constants.SOLUTIONTYPE_ACCEPT :
				sTitle = oBundle.getText("CARD_TIT_ACCEPT");
				sSubtitle = "";
				sIcon = this.Constants.CARD_ICON_ACCEPT;
				sIconTooltip = ""; // No tooltip for 'Accept'
				sActionText = oBundle.getText("CARD_ACT_CHOOSE");
				sActionTooltip = oBundle.getText("XTOL_ACCEPT_SOL_CARD");
				break;
			case this.Constants.SOLUTIONTYPE_ACCEPT_REMOVE :
				sTitle = oBundle.getText("CARD_TIT_ACCEPT_REMOVE");
				sSubtitle = "";
				sIcon = this.Constants.CARD_ICON_ACCEPT_REMOVE;
				sIconTooltip = ""; // No tooltip for 'Accepted'
				sActionText = oBundle.getText("CARD_ACT_CANCEL");
				sActionTooltip = oBundle.getText("XTOL_ACCEPTED_SOL_CARD");
				break;
			case this.Constants.SOLUTIONTYPE_PO_CREATE :
				sTitle = oBundle.getText("CARD_TIT_CREATEPO");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_PROCURE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PO_CREATE_TITLE");
				break;
			case this.Constants.SOLUTIONTYPE_PO_INCREASE :
				sTitle = oBundle.getText("CARD_TIT_INCREASE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_INCREASE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PO_INCREASE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_PO_RESCHEDULE :
				sTitle = oBundle.getText("CARD_TIT_RESCHEDULE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_RESCHEDULE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PO_RESCHEDULE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_PR_CREATE :
				sTitle = oBundle.getText("CARD_TIT_CREATEPO");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_PROCURE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PO_CREATE_TITLE");
				break;
			case this.Constants.SOLUTIONTYPE_PR_INCREASE :
				sTitle = oBundle.getText("CARD_TIT_INCREASE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_INCREASE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PR_INCREASE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_PR_RESCHEDULE :
				sTitle = oBundle.getText("CARD_TIT_RESCHEDULE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_RESCHEDULE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PR_RESCHEDULE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_TO_CREATE :
				sTitle = oBundle.getText("CARD_TIT_CREATETO");
				sSubtitle = subTitleToTor;
				sIcon = this.Constants.CARD_ICON_TRANSFER;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_TO_CREATE_TITLE");
				break;
			case this.Constants.SOLUTIONTYPE_TO_INCREASE :
				sTitle = oBundle.getText("CARD_TIT_INCREASE");
				sSubtitle = subTitleToTor;
				sIcon = this.Constants.CARD_ICON_INCREASE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_TO_INCREASE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_TO_RESCHEDULE :
				sTitle = oBundle.getText("CARD_TIT_RESCHEDULE");
				sSubtitle = subTitleToTor;
				sIcon = this.Constants.CARD_ICON_RESCHEDULE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_TO_RESCHEDULE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_TOR_CREATE :
				sTitle = oBundle.getText("CARD_TIT_CREATETO");
				sSubtitle = subTitleToTor;
				sIcon = this.Constants.CARD_ICON_TRANSFER;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_TO_CREATE_TITLE");
				break;
			case this.Constants.SOLUTIONTYPE_TOR_INCREASE :
				sTitle = oBundle.getText("CARD_TIT_INCREASE");
				sSubtitle = subTitleToTor;
				sIcon = this.Constants.CARD_ICON_INCREASE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_TOR_INCREASE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_TOR_RESCHEDULE :
				sTitle = oBundle.getText("CARD_TIT_RESCHEDULE");
				sSubtitle = subTitleToTor;
				sIcon = this.Constants.CARD_ICON_RESCHEDULE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_TOR_RESCHEDULE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_PO_CHANGE :
				sTitle = oBundle.getText("CARD_TIT_CHANGE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_CHANGE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PO_CHANGE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_PR_CHANGE :
				sTitle = oBundle.getText("CARD_TIT_CHANGE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_CHANGE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PR_CHANGE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_TO_CHANGE :
				sTitle = oBundle.getText("CARD_TIT_CHANGE");
				sSubtitle = subTitleToTor;
				sIcon = this.Constants.CARD_ICON_CHANGE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_TO_CHANGE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_TOR_CHANGE :
				sTitle = oBundle.getText("CARD_TIT_CHANGE");
				sSubtitle = subTitleToTor;
				sIcon = this.Constants.CARD_ICON_CHANGE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_TOR_CHANGE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;
			case this.Constants.SOLUTIONTYPE_PA_CHANGE :
				sTitle = oBundle.getText("CARD_TIT_CHANGE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_CHANGE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PA_CHANGE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;		
			case this.Constants.SOLUTIONTYPE_PROD_CONVERT :
				sTitle = oBundle.getText("CARD_TIT_CHANGE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_CHANGE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PA_CHANGE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;					
			case this.Constants.SOLUTIONTYPE_PROC_CONVERT :
				sTitle = oBundle.getText("CARD_TIT_CHANGE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_CHANGE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PA_CHANGE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;	
			case this.Constants.SOLUTIONTYPE_REQ_CONVERT :
				sTitle = oBundle.getText("CARD_TIT_CHANGE");
				sSubtitle = subTitlePoPr;
				sIcon = this.Constants.CARD_ICON_CHANGE;
				sActionTooltip = oBundle.getText("SOLUTION_DIALOG_PA_CHANGE_TITLE", [myCard.MRPElementExternalID,
						myCard.MRPElementItemExternalID]);
				break;									
			default :
				sTitle = oBundle.getText("CARD_TIT_UNKNOWN");
				sSubtitle = myCard.MaterialShortageSolutionType;
				break;
		}

		// Set the text for the tool tip for the "rating"
		switch (myCard.ProposalPriority) {
			case "0" :
				sRatingTooltip = oBundle.getText("CARD_XTOL_RATING_0");
				break;
			case "1" :
				sRatingTooltip = oBundle.getText("CARD_XTOL_RATING_1");
				break;
			case "2" :
				sRatingTooltip = oBundle.getText("CARD_XTOL_RATING_2");
				break;
			default :
				sRatingTooltip = "";
				break;
		}

		// Store the members
		this.setTitle(sTitle);
		this.setSubTitle(sSubtitle);
		this.setActionText(sActionText);
		this.setTooltipAction(sActionTooltip);
		this.setTooltipRating(sRatingTooltip);
		this.setMaterialShortageSolutionType(myCard.MaterialShortageSolutionType);
		this.setProposalPriority(myCard.ProposalPriority);

		// Create and initialize the Icon at the top of the solution card
		var oCtrlIcon = new sap.ui.core.Icon({
			src : sIcon,
			tooltip : sIconTooltip
		});
		this.setCtrlIcon(oCtrlIcon);

		// Set the CSS for the solution cards
		// Mark the solution card as card using CSS
		this.addStyleClass("sapMRPSC");
		// The card 'Accept Shortage' gets an additional CSS for special treatment
		// (The main area of the card shall not be used to trigger a preview)
		if (myCard.MaterialShortageSolutionType === this.Constants.SOLUTIONTYPE_ACCEPT
				|| myCard.MaterialShortageSolutionType === this.Constants.SOLUTIONTYPE_ACCEPT_REMOVE) {
			this.addStyleClass("sapMRPSCTypeAccept");
		}
	},

	/**
	 * Creates the required HTML code for the control. Info: It loops over all items of the object 'model' that contains
	 * the solution proposals of the solution call and creates one separate card for each proposal.
	 * 
	 * @param oRm
	 *          object that represents the renderer
	 * @param oCtrl
	 *          object that represents the control itself
	 * @memberOf control.SolutionCard
	 */
	renderer : function(oRm, oCtrl) {

		oRm.write('<div ');
		// writes the Control ID and enables event handling - important!
		oRm.writeControlData(oCtrl);
		oRm.writeClasses();
		oRm.write(">");

		// =================== ICON ===================
		oRm.write('<div ');
		oRm.addClass("sapMRPSCIcon");
		oRm.writeClasses();
		oRm.write(">");
		oRm.renderControl(oCtrl.getCtrlIcon());
		oRm.write("</div>"); // icon

		// =================== TITLE ===================
		oRm.write('<div ');
		oRm.addClass("sapMRPSCTitle");
		oRm.writeClasses();
		oRm.write(">");
		oRm.writeEscaped(oCtrl.getTitle());
		oRm.write("</div>"); // title

		// =================== SUBTITLE ===================
		oRm.write('<div ');
		if (oCtrl.getMaterialShortageSolutionType() !== oCtrl.Constants.SOLUTIONTYPE_ACCEPT) {
			oRm.addClass("sapMRPSCSubtitle");
			oRm.writeClasses();
		}
		oRm.write(">");
		oRm.writeEscaped(oCtrl.getSubTitle());
		oRm.write("</div>"); // subtitle

		// =================== RATING ===================
		oRm.write('<div ');
		oRm.writeAttributeEscaped("title", oCtrl.getTooltipRating());
		oRm.addClass("sapMRPSCRating");
		oRm.writeClasses();
		oRm.write(">");
		var oStars = oCtrl.getCtrlStars();
		var sPriority = oCtrl.getProposalPriority();
		var fPriority = parseFloat(sPriority);
		oStars.setValue(fPriority);
		oRm.renderControl(oStars);
		oRm.write("</div>"); // rating

		// =================== ACTION ===================
		oRm.write("<div ");
		oRm.writeAttributeEscaped("title", oCtrl.getTooltipAction());
		oRm.addClass("sapMRPSCAction");
		oRm.writeClasses();
		oRm.write(">");

		oRm.write('<span ');
		oRm.addClass("text");
		oRm.writeClasses();
		oRm.write(">");
		// Write the 'action' text of the solution card
		oRm.writeEscaped(oCtrl.getActionText());

		oRm.write("</span>"); // span

		oRm.write("</div>"); // action
		oRm.write("</div>"); // card

	},

	/**
	 * @param oEvent
	 * @memberOf control.SolutionCard
	 */
	onBeforeRendering : function(oEvent) {

	},

	/**
	 * @param oEvent
	 * @memberOf control.SolutionCard
	 */
	onAfterRendering : function(oEvent) {

	}

});

/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("i2d.pp.mrpcockpit.reuse.controls.SolutionCard");
/**
 * MRP SolutionCardContainer as a container for any amount of "Solution Cards"
 */
sap.ui.core.Control.extend("i2d.pp.mrpcockpit.reuse.controls.SolutionCardContainer", {

	metadata : {
		properties : {
			scrollStep : "int",
			animationSpeed : "int",
			cardWidth : "int",
			registrationID : "string",
			materialShortageHasNoSolution : "boolean"
		},

		defaultAggregation : "cards",
		aggregations : {
			"cards" : {
				type : "i2d.pp.mrpcockpit.reuse.controls.SolutionCard",
				multiple : true,
				singularName : "card"
			},
			"ctrlScrollLeft" : {
				type : "sap.ui.core.Icon",
				multiple : false
			},
			"ctrlScrollRight" : {
				type : "sap.ui.core.Icon",
				multiple : false
			}
		},
		associations : {
			"activeCard" : {
				type : "i2d.pp.mrpcockpit.reuse.controls.SolutionCard",
				multiple : false
			}
		}
	},

	/**
	 * Initialization: Register the browser event for resizing. Set default values for card width and animation speed.
	 * Initialize the icons for the scroll elements.
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	init : function() {

		// Set some defaults for the solution cards
		this.setAnimationSpeed(750);
		this.setCardWidth(148);
		this.setScrollStep(0);
		this.setMaterialShortageHasNoSolution(false);
		// Shortcut to the MRP constants
		this.Constants = i2d.pp.mrpcockpit.reuse.util.CommonConstants;

		// Create and init the left arrow
		var oCtrlScrollLeft = new sap.ui.core.Icon({
			id : "mrpScrollLeft",
			src : "sap-icon://navigation-left-arrow"
		});
		this.setCtrlScrollLeft(oCtrlScrollLeft);

		// Create and init the right arrow
		var oCtrlScrollRight = new sap.ui.core.Icon({
			id : "mrpScrollRight",
			src : "sap-icon://navigation-right-arrow"
		});
		this.setCtrlScrollRight(oCtrlScrollRight);

		// Register on events that indicate a solution card interaction
		var bus = sap.ui.getCore().getEventBus();
		// subscribe on event for a processed solution card in order to lock all cards on the screen
		bus.subscribe(this.Constants.EVENT_CHANNELID_SOLCARD, this.Constants.EVENT_EVENTID_DIALOG_START,
				this.onODataSent, this);
		// subscribe on event for a processed solution card in order to unlock all cards on the screen
		bus.subscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_DIALOG_CANCEL,
				this.unlockAllCards, this);
		// subscribe on event for a solution card failure in order to enable all cards on the screen
		bus.subscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_ERROR,
				this.onODataError, this);

	},

	/**
	 * Exit: Unregister the browser event for resizing
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	exit : function() {
		// Unregister the resizing event handler
		sap.ui.core.ResizeHandler.deregister(this.getRegistrationID);
		var bus = sap.ui.getCore().getEventBus();
		// Unregister the data changed events
		bus.unsubscribe(this.Constants.EVENT_CHANNELID_SOLCARD, this.Constants.EVENT_EVENTID_DIALOG_START,
				this.onODataSent, this);
		bus.unsubscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_DIALOG_CANCEL,
				this.onODataSent, this);
		bus.unsubscribe(this.Constants.EVENT_CHANNELID_CARD_DIALOG_DATACHANGED, this.Constants.EVENT_EVENTID_ERROR,
				this.onODataError, this);
	},

	/**
	 * This method is the handler function for the ODataError-Event that is fired from the solution dialogs when the OData
	 * Response has been received from the server but contained an error message. The solution card container has to
	 * enable all available solution cards on the screen in order to allow additional interaction by the user.
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	onODataError : function() {
		this.enableAllCards();
	},

	/**
	 * This method is the handler function for the ODataSent-Event that is fired from the solution dialogs when the OData
	 * Request has been sent to the server. The solution card container has to lock all available solution cards on the
	 * screen in order to prevent additional interaction by the user.
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	onODataSent : function() {
		this.lockAllCards();
	},

	/**
	 * Enable all cards
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	enableAllCards : function() {
		var aCards = this.getCards();
		var i;
		for (i = 0; i < aCards.length; i++) {
			aCards[i].setState(this.Constants.CARD_STATE_ENABLED);
		}
	},

	/**
	 * Enable one specific card
	 * 
	 * @param oCard
	 *          The solution card that shall be enabled
	 * @memberOf control.SolutionCardContainer
	 */
	enableCard : function(oCard) {
		var aCards = this.getCards();
		var i;
		for (i = 0; i < aCards.length; i++) {
			if (oCard === aCards[i]) {
				oCard.setState(this.Constants.CARD_STATE_ENABLED);
			}
		}
	},

	/**
	 * Lock one specific card
	 * 
	 * @param oCard
	 *          The solution card that shall be locked
	 * @memberOf control.SolutionCardContainer
	 */
	lockCard : function(oCard) {
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			if (oCard === aCards[i]) {
				oCard.setState(this.Constants.CARD_STATE_LOCKED);
			}
		}
	},

	/**
	 * Lock all cards
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	lockAllCards : function() {
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			aCards[i].setState(this.Constants.CARD_STATE_LOCKED);
		}
	},

	/**
	 * Un-Lock one specific card. Target status is 'enabled'
	 * 
	 * @param oCard
	 *          The solution card that shall be unlocked
	 * @memberOf control.SolutionCardContainer
	 */
	unlockCard : function(oCard) {
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			if (oCard === aCards[i]) {
				oCard.setState(this.Constants.CARD_STATE_ENABLED);
			}
		}
	},

	/**
	 * Un-Lock all card. Target status is 'enabled'
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	unlockAllCards : function() {
		this.enableAllCards();
	},

	/**
	 * Deactivate one specific card
	 * 
	 * @param oCard
	 *          The solution card that shall be deactivated
	 * @memberOf control.SolutionCardContainer
	 */
	deactivateCard : function(oCard) {
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			if (oCard === aCards[i]) {
				oCard.setState(this.Constants.CARD_STATE_DISABLED);
			}
		}
	},

	/**
	 * Activate one specific card
	 * 
	 * @param oCard
	 *          The solution card that shall be activated
	 * @memberOf control.SolutionCardContainer
	 */
	activateCard : function(oCard) {
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			if (oCard === aCards[i]) {
				oCard.setState(this.Constants.CARD_STATE_ACTIVE);
			}
		}
	},

	/**
	 * Hide one specific card
	 * 
	 * @param oCard
	 *          The solution card that shall be hided
	 * @memberOf control.SolutionCardContainer
	 */
	hideCard : function(oCard) {
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			if (oCard === aCards[i]) {
				oCard.setState(this.Constants.CARD_STATE_HIDDEN);
			}
		}
	},

	/**
	 * Disable all cards
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	disableAllCards : function() {
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			aCards[i].setState(this.Constants.CARD_STATE_DISABLED);
		}
	},

	/**
	 * Disable one specific card
	 * 
	 * @param oCard
	 *          The solution card that shall be disabled
	 * @memberOf control.SolutionCardContainer
	 */
	disableCard : function(oCard) {
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			if (oCard === aCards[i]) {
				oCard.setState(this.Constants.CARD_STATE_DISABLED);
			}
		}
	},

	/**
	 * Create new solution cards based on the given input array containing the data for each solution card. It adds each
	 * card to the internal aggregation and sorts the cards.
	 * 
	 * @param aCards
	 *          Array of data representing each solution card.
	 * @param MaterialShortageHasNoSolution
	 *          boolean indicating if there is a solution for the given shortage problem. If not, a static message is
	 *          shown instead of any solution card.
	 * @memberOf control.SolutionCardContainer
	 */
	addSolutionCards : function(aCards, MaterialShortageHasNoSolution) {
		// Remove all data from the container
		this.removeAllCards();

		if (MaterialShortageHasNoSolution) {
			// No solution then display no cards
			this.setMaterialShortageHasNoSolution(true);
		} else {
			this.setMaterialShortageHasNoSolution(false);
			for ( var i = 0; i < aCards.length; i++) {
				// Create a new solution card and pass the current array
				// element that contains the relevant data
				var oCard = new i2d.pp.mrpcockpit.reuse.controls.SolutionCard({
					myCard : aCards[i]
				});
				// Transfer the i18n model
				oCard.setModel(this.getModel("Common_i18n"), "Common_i18n");
				// Generate the title, subtitle, ... of the card
				oCard.initCard();
				// Set the style classes of the card
				oCard.setState(this.Constants.CARD_STATE_ENABLED);
				// Add the current card to the array
				this.addCard(oCard);
			}
			// Set the UI status of the solution cards
			this.updateStatusOfSolutionCards();
			// Add 'tool tip' for the scroll arrows
			var oBundle = this.getModel("Common_i18n").getResourceBundle();
			var oCtrlScrollLeft = this.getCtrlScrollLeft();
			oCtrlScrollLeft.setTooltip(oBundle.getText("CARD_XTOL_ARROW"));
			var oCtrlScrollRight = this.getCtrlScrollRight();
			oCtrlScrollRight.setTooltip(oBundle.getText("CARD_XTOL_ARROW"));
		}
	},

	/**
	 * Update the status/UI of the solution cards based on the currently selected solution card The update algorithm also
	 * considers the type of existing cards in the collection.
	 * 
	 * @param oCardSel
	 *          The selected solution card (optional).
	 * @memberOf control.SolutionCardContainer
	 */
	updateStatusOfSolutionCards : function(oCardSel) {

		var i;
		var aCards = this.getCards();

		// Check if we have one card of type 'ACCEPT_REMOVE'
		// This happens if the user has accepted a shortage for this
		// particular shortage before. The information comes out of
		// the solution call.
		var bExistsAccepted = this.existsSolutionCardOfType(this.Constants.SOLUTIONTYPE_ACCEPT_REMOVE);
		if (bExistsAccepted) {
			// If there's a card 'accepted', we have to
			// - enable card 'accepted'
			// - hide card 'accept'
			// - lock all other cards
			for (i = 0; i < aCards.length; i++) {
				var oCard = aCards[i];
				if (oCard.getMaterialShortageSolutionType() === this.Constants.SOLUTIONTYPE_ACCEPT_REMOVE) {
					this.enableCard(oCard);
				} else if (oCard.getMaterialShortageSolutionType() === this.Constants.SOLUTIONTYPE_ACCEPT) {
					this.hideCard(oCard);
				} else {
					this.lockCard(oCard);
				}
			}
		} else {
			// If there's no card 'accepted', we interpret the click
			// as a 'preview' or 'cancel preview' depending of the
			// status of the selected solution card.
			for (i = 0; i < aCards.length; i++) {
				var oCard = aCards[i];
				if (oCard !== oCardSel) {
					if (oCardSel && oCardSel.isSolutionCardActive()) {
						// If selected card is active (user has clicked the
						// card for preview) then disable all other cards
						this.disableCard(oCard);
					} else {
						// If selected card is not active (user has clicked
						// the card to cancel the preview) then enable
						// all other cards
						this.enableCard(oCard);
					}
				}
			}
		}

	},

	/**
	 * Checks if a solution card of a given type exists.
	 * 
	 * @param sSolutionType
	 *          string defining the type of a solution card
	 * @memberOf control.SolutionCardContainer
	 */
	existsSolutionCardOfType : function(sSolutionType) {
		var aCards = this.getCards();
		var bExists = false;
		for ( var i = 0; i < aCards.length; i++) {
			if (aCards[i].getMaterialShortageSolutionType() === sSolutionType) {
				bExists = true;
			}
		}
		return bExists;
	},

	/**
	 * Checks if a solution card of a given status exists.
	 * 
	 * @param sStatus
	 *          string defining the status of a solution card
	 * @memberOf control.SolutionCardContainer
	 */
	existsSolutionCardOfState : function(sStatus) {
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			if (aCards[i].hasState(sStatus)) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Add a new solution card to an existing aggregation of solution cards.
	 * 
	 * @param oCard
	 *          object representing the solution card that is added
	 * @memberOf control.SolutionCardContainer
	 */
	addSolutionCard : function(oCard) {

		// Create a new solution card and pass the current array
		// element that contains the relevant data
		var oSolCard = new i2d.pp.mrpcockpit.reuse.controls.SolutionCard({
			myCard : oCard
		});
		// Transfer the i18n model
		oSolCard.setModel(this.getModel("Common_i18n"), "Common_i18n");
		// Generate the title, subtitle, ... of the card
		oSolCard.initCard();
		// Set the style classes of the card
		oSolCard.setState(this.Constants.CARD_STATE_ENABLED);
		// Add the current card to the array
		this.addCard(oSolCard);
		// Set the UI status of the solution cards
		this.updateStatusOfSolutionCards();
	},

	/**
	 * Remove all cards
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	removeCards : function() {
		this.removeAllCards();
	},

	/**
	 * Creates the required HTML code for the control. <BR>
	 * There's an indicator in the solution call that decides whether the solution cards shall be shown or not. Info: It
	 * loops over all items of the internal aggregation of solution cards and calls the renderer of each card.
	 * 
	 * @param oRm
	 *          object representing the renderer
	 * @param oCtrl
	 *          object representing the current control instance
	 * @memberOf control.SolutionCardContainer
	 */
	renderer : function(oRm, oCtrl) {

		// --------------------------
		// Root Tag
		oRm.write('<div');
		oRm.addClass("sapMRPSolutions");
		oRm.writeClasses();
		// writes the Control ID and enables event handling - important!
		oRm.writeControlData(oCtrl);
		oRm.write(">");

		// There's an indicator in the solution call that decides whether the solution cards
		// shall be shown or not.
		if (oCtrl.getMaterialShortageHasNoSolution()) {
			// Create an area that contains the error message
			var oMsg = new sap.m.TextArea({
				value : oCtrl.getModel("Common_i18n").getResourceBundle().getText("MATERIAL_SHORTAGE_HAS_NO_SOLUTION_MSG"),
				valueState : sap.ui.core.ValueState.Warning,
				rows : 8,
				cols : 100,
				editable : false
			});
			oMsg.addStyleClass("sapMRPMaterialShortageHasNoSolutionDescription");
			oRm.renderControl(oMsg);
		} else {

			// --------------------------
			// Create the controls that are used for scrolling
			oRm.write('<div ');
			oRm.writeAttributeEscaped("id", "mrpSolCardNavLeft");
			oRm.addClass("sapMRPSCLeft");
			oRm.addClass("sapMRPSCNav");
			oRm.writeClasses();
			oRm.write(">");
			oRm.renderControl(oCtrl.getCtrlScrollLeft());
			oRm.write("</div>");

			oRm.write('<div ');
			oRm.writeAttributeEscaped("id", "mrpSolCardNavRight");
			oRm.addClass("sapMRPSCRight");
			oRm.addClass("sapMRPSCNav");
			oRm.writeClasses();
			oRm.write(">");
			oRm.renderControl(oCtrl.getCtrlScrollRight());
			oRm.write("</div>");

			// --------------------------
			// Create the main area that is used for the solution cards
			oRm.write('<div ');
			oRm.writeAttributeEscaped("id", "mrpSolCardMiddle");
			oRm.addClass("sapMRPSCMiddle");
			oRm.writeClasses();
			oRm.write(">");

			// --------------------------
			// The main area gets an additional container for the solution card
			oRm.write('<div ');
			oRm.writeAttributeEscaped("id", "mrpSolCardContainer");
			oRm.write(">");

			// --------------------------
			// Render each solution card into the container
			var aChildren = oCtrl.getCards();
			for ( var i = 0; i < aChildren.length; i++) {
				// render the child control
				oRm.renderControl(aChildren[i]);
			}
		}
		oRm.write("</div>");
	},

	/**
	 * @param oEvent
	 *          object representing the event that is passed
	 * @memberOf control.SolutionCardContainer
	 */
	onBeforeRendering : function(oEvent) {

	},

	/**
	 * Method that is called after rendering. At adapts the size of the solution card container.
	 * 
	 * @param oEvent
	 *          object representing the event that is passed
	 * @memberOf control.SolutionCardContainer
	 */
	onAfterRendering : function(oEvent) {
		// Adapt the size of the solution card container
		this.updateSolutionCardContainerSize();
	},

	/**
	 * Determine the root of the tap event.
	 * 
	 * @param evt
	 *          object representing the event that is passed
	 * @memberOf SolutionCardContainer
	 */
	_getTapLocation : function(evt) {

		var sTapLocation = "";
		// Use jQuery to get the DOM of the currently selected area
		var oLocation = jQuery("#" + this.getId());
		// Get all children (DIVs, SPANs, ...) of that DOM element
		var aChildren = oLocation.children();
		var oChild = null;
		// Loop at each child element and check if the "event target" is part
		// of the particular child. If found, the click/tap event was triggered
		// from there and we just check its id...
		for ( var i = 0; i < aChildren.length; i++) {
			oChild = aChildren[i];
			if (oChild.contains(evt.target)) {
				switch (evt.target.id) {
					case "mrpScrollLeft" :
						sTapLocation = this.Constants.CARD_AREA_SCROLLLEFT;
						break;
					case "mrpScrollRight" :
						sTapLocation = this.Constants.CARD_AREA_SCROLLRIGHT;
						break;
					case "mrpSolCardMiddle" :
						sTapLocation = this.Constants.CARD_AREA_OUTSIDE;
						break;
					default :
						sTapLocation = this.Constants.CARD_AREA_INSIDE;
						break;
				}
			}
		}
		return sTapLocation;
	},

	/**
	 * The solution card control consists of several areas and sub controls. This method finds out whether a click/tap
	 * event was triggered from/within a solution card. It traverses the UI5-objects up to a parent that is a solution
	 * card. The existence of a solution card is defined by a specific method that exist only for these cards
	 * "getMaterialShortageSolutionType".
	 * 
	 * @param oCardSel
	 *          object representing the selected solution card
	 * @memberOf SolutionCardContainer
	 */
	_getTapedSolutionCard : function(oCardSel) {
		for ( var i = 0; i < 7; i++) {
			if (!oCardSel.getMaterialShortageSolutionType) {
				oCardSel = oCardSel.getParent();
			}
		}
		if (oCardSel.getMaterialShortageSolutionType) {
			return oCardSel;
		} else {
			return null;
		}
	},

	/**
	 * Event handler for the click/tap event. It checks the source of the event (either navigation or a solution card) and
	 * triggers the relevant action.
	 * 
	 * @param evt
	 *          object representing the incoming event
	 * @memberOf control.SolutionCardContainer
	 */
	ontap : function(evt) {

		var oCardSel = null;
		// Determine the currently selected control and its area within the control
		var sTapLocation = this._getTapLocation(evt);
		switch (sTapLocation) {
			case this.Constants.CARD_AREA_SCROLLLEFT :
				this.moveToLeft(this.getScrollStep());
				break;
			case this.Constants.CARD_AREA_SCROLLRIGHT :
				this.moveToRight(this.getScrollStep());
				break;
			case this.Constants.CARD_AREA_INSIDE :
			case this.Constants.CARD_AREA_ICON :
				// Ensure that the card is selected and not just a sub control of the card
				oCardSel = evt.srcControl;
				oCardSel = this._getTapedSolutionCard(oCardSel);
				if (!oCardSel) {
					return; // Should not happen
				}
				if (oCardSel.isSolutionCardLocked()) {
					// If the currently selected solution card is locked -> no UI changes!
					return;
				}
				if (oCardSel.getMaterialShortageSolutionType() === this.Constants.SOLUTIONTYPE_ACCEPT) {
					// If the currently selected solution card is 'Accept', it might be that we've been in a preview before.
					// So we enable all cards.
					this.enableAllCards();
					return;
				}
				if (oCardSel.getMaterialShortageSolutionType() === this.Constants.SOLUTIONTYPE_ACCEPT_REMOVE) {
					// If the currently selected solution card is 'Accepted' -> no UI changes!
					return;
				}
				// Do the status update of all solution cards (enabled, active, ...)
				this.updateStatusOfSolutionCards(oCardSel);
				break;

			case this.Constants.CARD_AREA_OUTSIDE :
				// If there is one locked solution card, we must not react on this click event
				if (this.existsSolutionCardOfState(this.Constants.CARD_STATE_LOCKED)) {
					return;
				}
				// Cancel the active preview
				this._triggerSolutionCardCancelPreview();
				// Mark all the solution cards as default enabled
				this.enableAllCards();
				this.setActiveCard(null);
				break;
		}
	},

	/**
	 * Recognizes swipe events to the left. Swipe to the left means that the cards are moved to the right
	 * 
	 * @param evt
	 *          object representing the incoming event
	 * @memberOf control.SolutionCardContainer
	 */
	onswipeleft : function(evt) {
		this.moveToRight((this.getScrollStep() / 2));
	},

	/**
	 * Recognizes swipe events to the right. Swipe to the right means that the cards are moved to the left
	 * 
	 * @param evt
	 *          object representing the incoming event
	 * @memberOf control.SolutionCardContainer
	 */
	onswiperight : function(evt) {
		this.moveToLeft((this.getScrollStep() / 2));
	},

	/**
	 * Moves the solution cards to the left by x pixel.
	 * 
	 * @param iPixel
	 *          integer defining the amount of pixels the card shall be moved to the left side
	 * @memberOf control.SolutionCardContainer
	 */
	moveToLeft : function(iPixel) {
		$("#mrpSolCardMiddle").animate({
			scrollLeft : "-=" + (iPixel).toString() + "px"
		}, this.getAnimationSpeed());
	},

	/**
	 * Moves the solution cards to the right by x pixel.
	 * 
	 * @param iPixel
	 *          integer defining the amount of pixels the card shall be moved to the right side
	 * @memberOf control.SolutionCardContainer
	 */
	moveToRight : function(iPixel) {
		$("#mrpSolCardMiddle").animate({
			scrollLeft : "+=" + (iPixel).toString() + "px"
		}, this.getAnimationSpeed());
	},

	/**
	 * Arrange the solution cards into the area 'mrpSolCardMiddle' by setting the size of the container and manage the
	 * scroll arrows
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	updateSolutionCardContainerSize : function() {
		// Determine and set the size of the container containing all solution cards (might be larger than the size of the
		// screen)
		var iContainerWidth = this.getContainerWidth();
		$("#mrpSolCardContainer").width(iContainerWidth);
		// Determine the size of the page, where the container is embedded
		var iScreenWidth = $(".sapMRPSolutions").parent().width();
		// Set the width of the area 'sapMRPSolutions'
		$(".sapMRPSolutions").width("100%");
		// Adjust the relevant screen width by subtracting margins
		var iS4Margins = 32;
		var iScreenWidthRelevant = iScreenWidth - iS4Margins;
		// If the cards do NOT fit into this area, show the scroll arrows
		if (iContainerWidth < iScreenWidthRelevant) {
			// Hide the scroll arrows
			this._hideScrollArrows();
			this.setScrollStep(0);
		} else {
			// Show the scroll arrows
			this._showScrollArrows();
			// Set scrolling offset
			var iStep = this.calculateScrollStep();
			this.setScrollStep(iStep);
		}
	},

	/**
	 * Calculate the width of the container. Amount of cards * Card Size with margins + Safe Margin. Info: Some browsers
	 * have an issue with zoom factors and the calculation of the size and as a consequence the last solution card is
	 * 'overflowed'. Therefore we add 10px for safety reasons.
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	getContainerWidth : function() {
		var iAmountCards = this.getCards().length;
		var iCardWidthWithMargin = $(".sapMRPSC").outerWidth(true); // 'true' reads with margin
		var iSafeMarginRight = 10;
		return (iAmountCards * iCardWidthWithMargin + iSafeMarginRight);
	},

	/**
	 * Get the height of the solution card container
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	getContainerHeight : function() {
		var iSolutionCardContainerHeight = $(".sapMRPSolutions").height();
		return iSolutionCardContainerHeight;
	},

	/**
	 * Calculate the scroll step that is applied when the user scrolls the solution cards. The value depends on how many
	 * cards can be displayed on the screen. The scrollstep equals the amount of cards that can be displayed on the
	 * screen.
	 * 
	 * @memberOf control.SolutionCardContainer
	 */
	calculateScrollStep : function() {
		var iAmountCardsInSection = 0;
		var iCardWidth = 0;
		var iCardsSectionMiddle = $("#mrpSolCardMiddle").width();
		iCardWidth = $(".sapMRPSC").outerWidth(true); // 'true' reads with margin
		if (iCardWidth && (iCardWidth > 0)) {
			iAmountCardsInSection = Math.floor(iCardsSectionMiddle / iCardWidth);
		}
		return iCardWidth * iAmountCardsInSection;
	},

	/**
	 * Hide the scroll arrows by adding the CSS class sapMRPScrollHidden
	 * 
	 * @memberOf SolutionCard
	 */
	_hideScrollArrows : function() {
		$("#mrpScrollLeft").addClass("sapMRPScrollHidden");
		$("#mrpScrollRight").addClass("sapMRPScrollHidden");
	},

	/**
	 * Show the scroll arrows by removing the CSS class sapMRPScrollHidden
	 * 
	 * @memberOf SolutionCard
	 */
	_showScrollArrows : function() {
		$("#mrpScrollLeft").removeClass("sapMRPScrollHidden");
		$("#mrpScrollRight").removeClass("sapMRPScrollHidden");
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
	 * Get the total amount of all visible solution cards
	 * 
	 * @memberOf SolutionCard
	 */
	_getCountVisibleSolutionCards : function() {
		var iCnt = 0;
		var aCards = this.getCards();
		for ( var i = 0; i < aCards.length; i++) {
			if (!aCards[i].hasState(this.Constants.CARD_STATE_HIDDEN)) {
				iCnt++;
			}
		}
		return iCnt;
	}

});

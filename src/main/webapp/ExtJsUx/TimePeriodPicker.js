/*
 * Copyright 2013 52°North Initiative for Geospatial Open Source Software GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Extending Ext JS Library 3.4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
Ext.namespace("Ext.ux.EE");
Ext.namespace("Ext.ux.EE.slider");

/**
 * Class representing a draggable interval indicator between the first two
 * thumbs of a MultiSlider
 */
Ext.ux.EE.slider.IntervalIndicator = Ext.extend(Object, {
	slider : null,
	intervalPixelPaddingLeft : null,
	intervalPixelPaddingRight : null,
	dragging : false,
	tracker : null,
	thumbContextLeft : null,
	thumbContextRight : null,

	/**
	 * Requires a slider config value, referencing an already rendered
	 * Ext.MultiSlider. Automatically shifts thumbs to the outer-most position to
	 * not overlap
	 * 
	 * @param config
	 */
	constructor : function(config) {
		Ext.apply(this, config || {});
		this.slider.on("change", this.refresh, this);
		this.slider.on("resize", this.refresh.createDelegate(this, [ false ]), this);

		// Shift the thumbs of this slider to not overlap
		var thumbEl = this.slider.thumbs[0].el;
		thumbEl.setStyle('margin-left', (-this.slider.halfThumb) + 'px');
		thumbEl = this.slider.thumbs[1].el;
		thumbEl.setStyle('margin-left', this.slider.halfThumb + 'px');

	},

	/**
	 * Updates the position and dimension of the interval indicator based on the
	 * first two thumbs of the associated slider
	 */
	refresh : function(animate) {
		if (this.el) {
			var beginLeft = this.slider.translateValue(this.slider.getValue(0));
			var endLeft = this.slider.translateValue(this.slider.getValue(1));
			this.el.stopFx();
			if (animate === false || this.dragging || this.slider.animate === false) {
				// directly set new dimensions if dragging or
				// slider not animated
				this.el.setLeft(beginLeft);
				this.el.setWidth(endLeft - beginLeft + 2 * this.slider.halfThumb);
			} else {
				// animate dimension change
				this.el.shift({
					left : beginLeft,
					width : endLeft - beginLeft + 2 * this.slider.halfThumb,
					stopFx : true,
					duration : .35
				});

			}
		}
	},

	/**
	 * Renders the interval indicator into the slider
	 */
	render : function() {
		this.el = this.slider.innerEl.insertFirst({
			cls : "ee-slider-interval-indicator"
		});

		this.el.addClassOnOver("x-slider-thumb-over");

		this.tracker = new Ext.dd.DragTracker({
			onBeforeStart : this.onBeforeDragStart.createDelegate(this),
			onStart : this.onDragStart.createDelegate(this),
			onDrag : this.onDrag.createDelegate(this),
			onEnd : this.onDragEnd.createDelegate(this),
			tolerance : 3,
			autoStart : 300,
			el : this.el
		});

		// Contexts to use for propagating drag events
		// to actual slider thumbs. These provide a special
		// tracker override returning the begin/end pixel
		// positions of the interval
		this.thumbContextLeft = Ext.applyIf({
			tracker : {
				getXY : function() {
					var xy = this.tracker.getXY().slice(0);
					xy[0] -= this.intervalPixelPaddingLeft;
					return xy;
				}.createDelegate(this)
			}
		}, this.slider.thumbs[0]);

		this.thumbContextRight = Ext.applyIf({
			tracker : {
				getXY : function() {
					var xy = this.tracker.getXY().slice(0);
					xy[0] += this.intervalPixelPaddingRight;
					return xy;
				}.createDelegate(this)
			}
		}, this.slider.thumbs[1]);

		this.refresh();
	},

	enable : function() {
		this.disabled = false;
	},

	disable : function() {
		this.disabled = true;
	},

	onBeforeDragStart : function(e) {
		return !this.disabled;
	},

	onDragStart : function(e) {
		var pos = this.slider.innerEl.translatePoints(e.getXY());
		this.el.addClass("ee-slider-interval-indicator-drag");
		var left = this.slider.translateValue(this.slider.getValue(0));
		var right = this.slider.translateValue(this.slider.getValue(1));
		this.intervalPixelPaddingLeft = pos.left - left;
		this.intervalPixelPaddingRight = right - pos.left;
		this.dragging = true;
	},

	onDrag : function(e) {
		// Constrain interval to outer bounds
		var newValue = this.slider.thumbs[0].getNewValue.call(this.thumbContextLeft);
		if (newValue < this.slider.minValue) {
			return;
		}
		newValue = this.slider.thumbs[1].getNewValue.call(this.thumbContextRight);
		if (newValue > this.slider.maxValue) {
			return;
		}

		// propagate event to the first slider, using a dummy
		// tracker as context, which returns the start position
		// of the interval
		this.slider.thumbs[0].onDrag.call(this.thumbContextLeft);

		// propagate event to the second slider, using a dummy
		// tracker as context, which returns the end position of
		// the interval
		this.slider.thumbs[1].onDrag.call(this.thumbContextRight);

	},

	onDragEnd : function(e) {
		this.slider.thumbs[0].onDragEnd.call(this.slider.thumbs[0]);
		this.slider.thumbs[1].onDragEnd.call(this.slider.thumbs[1]);

		this.el.removeClass("ee-slider-interval-indicator-drag");
		this.dragging = false;
	},

	destroy : function() {
		Ext.destroyMembers(this, "slider", "el");
	}
});

/**
 * Container consisting of UI Elements for selecting time interval. Provides
 * events for observing changes of time period settings.
 */
Ext.ux.EE.TimePeriodPicker = Ext.extend(Ext.Container, {
	slider : null,
	buttonBegin : null,
	buttonEnd : null,
	outerFrameEndIndicator : null,
	outerFrameStartIndicator : null,

	beginDateMenu : null,
	endDateMenu : null,

	begin : null, // begin Date
	end : null, // end Date

	strings : {
		tooltip_begincrementor_down : 'Beginning of outer time frame % months earlier',
		tooltip_begincrementor_up : 'Beginning of outer time frame % months later',
		tooltip_endcrementor_down : 'End of outer time frame % months earlier',
		tooltip_endcrementor_up : 'End of outer time frame % months later',
		tooltip_beginbutton : 'Set begin of time filter interval',
		tooltip_endbutton : 'Set end of time filter interval',
		tooltip_outerbeginning : 'Beginning of the outer time frame',
		tooltip_outerend : 'End of the outer time frame',
		button_selectmonth : 'Done'
	},

	initComponent : function() {
		var injectIntervalStep = function(res) {
			this.strings[res] = this.strings[res].replace('%', EE.Settings.intervalStepMonths);
		};
		Ext.each([ 'tooltip_begincrementor_down', 'tooltip_begincrementor_up', 'tooltip_endcrementor_down',
				'tooltip_endcrementor_up' ], injectIntervalStep, this);

		this.layout = "anchor";
		this.height = 44; // Maybe find out dynamically

		// Events
		this.addEvents(
		/**
		 * Fires when the period got changed, either by buttons or by finishing drag
		 * operation on slider.
		 * 
		 * @param Object
		 *          Begin and end attributes of period
		 */
		"periodChange",
		/**
		 * Fires whenever the user is changing the period.
		 * 
		 * @param Object
		 *          Begin and end attributes of period
		 */
		"periodChanging");

		if (!this.begin) {
			// No begin Date in config
			this.begin = new Date();
			this.begin.setMonth(this.begin.getMonth() - 1);
		}
		if (!this.end) {
			// No end Date in config
			this.end = new Date();
			this.end.setMonth(this.end.getMonth() + 1);
		}

		// Creation of DateMenus
		this.beginDateMenu = new Ext.menu.DateMenu({
			handler : function(dp, date) {
				this.begin = date;
				this.updateButtons();
				this.updateSlider();
				this.updateDateMenus();
				this.onPeriodChange();
			},
			scope : this
		});
		this.addMonthSelectionToDatePicker(this.beginDateMenu.picker);

		this.endDateMenu = new Ext.menu.DateMenu({
			handler : function(dp, date) {
				this.end = date;
				this.updateButtons();
				this.updateSlider();
				this.updateDateMenus();
				this.onPeriodChange();
			},
			scope : this
		});
		this.addMonthSelectionToDatePicker(this.endDateMenu.picker, true);

		this.outerFrameStartIndicator = new Ext.Button({
			text : Ext.util.Format.date(this.begin, 'Y-m'),
			disabled : true,
			width : 45,
			tooltip : this.strings.tooltip_outerbeginning
		});

		// Button to expand interval at the start
		var buttonOuterFrameLeft = this.createTimeCrementor(function(dir) {
			var newSliderBegin = new Date(this.slider.minValue);
			newSliderBegin.setMonth(newSliderBegin.getMonth() + EE.Settings.intervalStepMonths * dir);
			if (this.slider.getValue(0) >= newSliderBegin.getTime()) {
				this.slider.setMinValue(newSliderBegin.getTime());
				this.periodComponent.refresh(false);
				this.updateOuterFrameIndicator();
			}
		}, this, {
			tooltip : this.strings.tooltip_begincrementor_down
		}, {
			tooltip : this.strings.tooltip_begincrementor_up
		});

		// Button to directly set start of interval
		this.buttonBegin = new Ext.Button({
			text : "begin",
			menu : this.beginDateMenu,
			tooltip : this.strings.tooltip_beginbutton
		});

		this.outerFrameEndIndicator = new Ext.Button({
			text : Ext.util.Format.date(this.end, 'Y-m'),
			disabled : true,
			width : 45,
			tooltip : this.strings.tooltip_outerend
		});

		// Button to expand interval at the end
		var buttonOuterFrameRight = this.createTimeCrementor(function(dir) {
			var newSliderEnd = new Date(this.slider.maxValue);
			newSliderEnd.setMonth(newSliderEnd.getMonth() + EE.Settings.intervalStepMonths * dir);
			if (this.slider.getValue(1) <= newSliderEnd.getTime()) {
				this.slider.setMaxValue(newSliderEnd.getTime());
				this.periodComponent.refresh(false);
				this.updateOuterFrameIndicator();
			}
		}, this, {
			tooltip : this.strings.tooltip_endcrementor_down
		}, {
			tooltip : this.strings.tooltip_endcrementor_up
		});

		// Button to directly set end of interval
		this.buttonEnd = new Ext.Button({
			text : "end",
			menu : this.endDateMenu,
			tooltip : this.strings.tooltip_endbutton
		});

		// Slider to set start/end of interval. Date is mapped
		// using
		// Date.getTime (msec)
		this.slider = new Ext.slider.MultiSlider({
			clickToChange : false,
			minValue : this.begin.getTime(),
			maxValue : this.end.getTime(),
			values : [ this.begin.getTime(), this.end.getTime() ],
			increment : 1000 * 60 * 60 * 24,
			flex : 1,
			listeners : {
				change : function(slider, newValue, thumb) {
					if (thumb.index == 0) {
						this.begin.setTime(newValue);
					} else {
						this.end.setTime(newValue);
					}
					this.updateButtons();
					this.updateDateMenus();
					this.onPeriodChanging();
				},
				changecomplete : function() {
					this.onPeriodChange();
				},
				afterrender : function() {
					this.periodComponent = new Ext.ux.EE.slider.IntervalIndicator({
						slider : this.slider
					});
					this.periodComponent.render();
				},
				scope : this
			}
		});

		// Setting items of this container
		this.items = [
		// First row
		{
			xtype : "panel",
			border : false,
			bodyStyle : {
				"background-color" : "transparent"
			},
			layout : {
				type : "hBox",
				pack : "start"
//				align : "stretch"
			},
			anchor : "100%",
			height : 22,
			items : [ buttonOuterFrameLeft, {
				xtype : 'tbspacer',
				width : 15
			}, this.slider, {
				xtype : 'tbspacer',
				width : 15,
				style : {
					'z-index' : -1
				}
			}, buttonOuterFrameRight ]
		},

		// Second row
		{
			xtype : "panel",
			border : false,
			bodyStyle : {
				"background-color" : "transparent"
			},
			layout : {
				type : "hBox",
				pack : "start"
//				align : "stretch"
			},
			anchor : "100%",
			height : 22,
			items : [ this.outerFrameStartIndicator, {
				xtype : 'tbspacer',
				width : 10
			}, this.buttonBegin, {
				xtype : "box",
				flex : 1
			}, this.buttonEnd, {
				xtype : 'tbspacer',
				width : 10
			}, this.outerFrameEndIndicator ]
		} ];

		this.updateButtons();
		this.updateDateMenus();

		Ext.ux.EE.TimePeriodPicker.superclass.initComponent.call(this);

	},

	onPeriodChanging : function() {
		this.fireEvent("periodChanging", {
			begin : this.begin,
			end : this.end
		});
	},

	onPeriodChange : function() {
		this.fireEvent("periodChange", {
			begin : this.begin,
			end : this.end
		});
	},

	/**
	 * Updates the text of the buttons to reflect the current interval settings
	 */
	updateButtons : function() {
		this.buttonBegin.setText(this.begin ? this.begin.format("Y-m-d") : "Not set");

		this.buttonEnd.setText(this.end ? this.end.format("Y-m-d") : "Not set");

		this.doLayout();
	},

	/**
	 * Updates the values of the slider to reflect the current interval settings
	 */
	updateSlider : function() {
		if (this.begin) {
			if (this.begin.getTime() < this.slider.minValue) {
				this.slider.setMinValue(this.begin.getTime());
				this.updateOuterFrameIndicator();
			}
			this.slider.setValue(0, this.begin.getTime());
		}

		if (this.end) {
			if (this.end.getTime() > this.slider.maxValue) {
				this.slider.setMaxValue(this.end.getTime());
				this.updateOuterFrameIndicator();
			}
			this.slider.setValue(1, this.end.getTime());
		}

		this.doLayout();
	},

	/**
	 * Updates the labels of the outer time interval
	 */
	updateOuterFrameIndicator : function() {
		this.outerFrameEndIndicator.setText(Ext.util.Format.date(new Date(this.slider.maxValue), 'm/Y'));
		this.outerFrameStartIndicator.setText(Ext.util.Format.date(new Date(this.slider.minValue), 'm/Y'));
	},

	/**
	 * Adjusts the max/min dates of the DateMenus based on current interval
	 * settings
	 */
	updateDateMenus : function() {
		if (this.end) {
			this.endDateMenu.picker.setValue(this.end);
			this.beginDateMenu.picker.setMaxDate(this.end);
		}

		if (this.begin) {
			this.beginDateMenu.picker.setValue(this.begin);
			this.endDateMenu.picker.setMinDate(this.begin);
		}
	},

	/**
	 * Returns component displaying two buttons for incrementing/decrementing a
	 * value. Passed handler will be called with -1 after decreasing and +1 for
	 * increasing
	 */
	createTimeCrementor : function(handler, scope, options, optionsRight) {
		options = options || {};
		optionsRight = optionsRight || options;
		var panel = new Ext.Container({
			layout : {
				type : 'hbox',
				pack : 'start'
//				align : 'stretch'
			},
			height: 22,
			width : 40,
			items : [ Ext.applyIf({
				xtype : 'button',
				text : "&lt;",
				width : 20,
				handler : function() {
					handler.call(scope || this, -1);
				}
			}, options), Ext.applyIf({
				xtype : 'button',
				text : "&gt;",
				width : 20,
				handler : function() {
					handler.call(scope || this, 1);
				}
			}, optionsRight) ]
		});
		return panel;
	},

	addMonthSelectionToDatePicker : function(picker, anchorEnd) {
		var doneStr = this.strings.button_selectmonth;
		Ext.apply(picker, {
			isMonthSelectRendered : false,

			createMonthPicker : function() {
				Ext.DatePicker.prototype.createMonthPicker.call(this);
				// init new button for direct selection of month/year
				if (!this.isMonthSelectRendered) {
					this.monthPicker.select('tr.x-date-mp-btns td').first().createChild({
						tag : 'button',
						cls : 'x-date-mp-select',
						cn : doneStr
					});
					this.isMonthSelectRendered = true;
				}
			},

			onMonthClick : function(e, t) {
				Ext.DatePicker.prototype.onMonthClick.call(this, e, t);
				var el = new Ext.Element(t);
				if (el.is('button.x-date-mp-select')) {
					var newDate = null;
					if (anchorEnd === true) {
						newDate = new Date(this.mpSelYear, this.mpSelMonth, 1);
						newDate.setMonth(newDate.getMonth() + 1);
						newDate.setDate(newDate.getDate() - 1);
					} else {
						newDate = new Date(this.mpSelYear, this.mpSelMonth, 1);
					}
					this.setValue(newDate);
					this.fireEvent('select', this, this.value);
				}
			}
		});
	}
});

// register xtype
Ext.reg("timeperiodpicker", Ext.ux.EE.TimePeriodPicker);
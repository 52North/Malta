/*
 * Copyright 2012 52°North Initiative for Geospatial Open Source Software GmbH
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
 *
 * Extending Ext JS Library 3.4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
Ext.namespace('Ext.ux.EE');
/**
 * Custom Ext.Panel extension which manages flot plots. Combines ExtJS with flot
 * jQuery. Provides three flot events using the standard ExtJS event handling
 * mechanisms; plotclick, plothover and plotselected. The resulting plots are
 * resizable, restore their axis settings on redraw and behave generally like an
 * Ext.Panel.
 * 
 * To create a plot with this class, one has to override the getPlotParams
 * method which has to return an object with a series and options attribute.
 * These are passed to the flot plot function:
 * 
 * $.plot(..., plotParams.series, plotParams.options);
 */
Ext.ux.EE.FlotPanel = Ext.extend(Ext.Panel, {

	plotParams : null,

	plot : null,

	eventsBound : null, // flag to ensure that flot events are bound only once

	updateTask : null,

	initComponent : function() {
		Ext.ux.EE.FlotPanel.superclass.initComponent.call(this);

		// delayed task to reset plotparams and initiate redraw
		this.updateTask = new Ext.util.DelayedTask(function(reset) {
			this.plotParams = null;
			this.renderPlot(reset);
		}, this);

		this.eventsBound = false;
		this.addEvents('plotclick');
		this.addEvents('plothover');
		this.addEvents('plotselected');
	},

	onResize : function(adjWidth, adjHeight, rawWidth, rawHeight) {
		Ext.ux.EE.FlotPanel.superclass.onResize.call(this, adjWidth, adjHeight, rawWidth, rawHeight);

		// Render plot on resize
		this.renderPlot();
	},

	renderPlot : function(reset) {
		if (this.rendered) {
			if (this.plotParams == null) {
				try {
					this.plotParams = this.getPlotParams();
				} catch (e) {
					Ext.MessageBox.alert('Error', 'Error generating plot data:\n' + e);
				}
			}

			var element = this.el.child('.x-panel-body');
			try {
				if (this.plot && !reset) {
					// Set current axis ranges in new plotting options to restore pan/zoom
					// settings
					var axes = this.plot.getAxes();
					for ( var key in axes) {
						Ext.apply(this.plotParams.options[key], {
							min : axes[key].min,
							max : axes[key].max
						});
					}
				}
				// Always create a new flot plot, as updating plotting options is not
				// supported
				this.plot = $.plot(element.dom, this.plotParams.series, this.plotParams.options);

				if (!this.eventsBound) {
					// bind events only once
					$(element.dom).bind('plotclick', this.plotClick.createDelegate(this));
					$(element.dom).bind('plothover', this.plotHover.createDelegate(this));
					$(element.dom).bind('plotselected', this.plotSelected.createDelegate(this));
					this.eventsBound = true;
				}
			} catch (e) {
			}
		}
	},

	plotClick : function(event, pos, item) {
		this.fireEvent('plotclick', event, pos, item, this.plot);
	},

	plotHover : function(event, pos, item) {
		this.fireEvent('plothover', event, pos, item, this.plot);
	},

	plotSelected : function(event, ranges) {
		this.fireEvent('plotselected', event, ranges, this.plot);
	},

	/**
	 * Function which has to provide the plot parameters series and options in the
	 * returned object.
	 * 
	 * $.plot(..., result.series, result.options);
	 */
	getPlotParams : function() {

	},

	/**
	 * Forces to request plot params using the getPlotParams method and redraws
	 * itself. Multiple calls to this method are delayed since generating plot
	 * params might block the UI.
	 * 
	 * @param reset
	 *          if true, the panel wont restore the axis state
	 */
	replot : function(reset) {
		// this.plotParams = null;
		// this.renderPlot(reset);
		this.updateTask.delay(100, null, null, [ reset == true ]);
	}
});

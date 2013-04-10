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
 */
Ext.namespace("EE.StatisticsHolder.Base");

/**
 * Base class for objects holding/managing statistics for a single attribute
 * while feeding them with individual values
 */
EE.StatisticsHolder.Base = function(name) {
	this.name = name;
	this.addValue = function(value) {

	};
	this.getMin = function() {
		return null;
	};
	this.getMax = function() {
		return null;
	};
	this.getName = function() {
		return this.name;
	};
	this.getMean = function() {
		return null;
	};
	this.getSD = function() {
		return null;
	};
	this.getMedian = function() {
		return null;
	};
	this.getMode = function() {
		return null;
	};
	this.getPlotPanel = function() {
		return null;
	};
	this.reset = function() {
	};

	this.strings = {
		bins : 'Bins',
		number_realizations : '# Realizations',
		sort : 'Sort',
		frequency : 'Frequency',
		category : 'Category',
		legend : 'Legend'
	};
};

Ext.namespace("EE.StatisticsHolder.Numeric");

/**
 * Class for objects holding/managing statistics for a single numeric attribute
 * while feeding them with individual values
 */
EE.StatisticsHolder.Numeric = function(name) {
	EE.StatisticsHolder.Base.call(this, name);
	this.binarySearchInsertionPoint = function(low, high, value) {
		if (low == high)
			return low;

		var mid = Math.floor((high + low) / 2);

		if (value > this.values[mid])
			return this.binarySearchInsertionPoint(mid + 1, high, value);
		else if (value < this.values[mid])
			return this.binarySearchInsertionPoint(low, mid, value);

		return mid;
	};
	this.addValue = function(value) {
		var insertIndex = this.binarySearchInsertionPoint(0, this.values.length, value);
		this.values.splice(insertIndex, 0, value);
		this.sum += value;
		if (this.min == null || this.min > value) {
			this.min = value;
		}
		if (this.max == null || this.max < value) {
			this.max = value;
		}
	};
	this.getMin = function() {
		return this.min;
	};
	this.getMax = function() {
		return this.max;
	};
	this.getMean = function() {
		return this.sum / this.values.length;
	};
	this.getSD = function() {
		var mean = this.getMean();
		var sumSqrDif = 0;
		for ( var i = 0; i < this.values.length; i++) {
			sumSqrDif += Math.pow(this.values[i] - mean, 2);
		}
		return Math.sqrt(sumSqrDif / this.values.length);
	};
	this.getMedian = function() {
		var mid = Math.floor(this.values.length / 2);

		if (this.values.length % 2 != 0) {
			return this.values[mid];
		} else {
			return (this.values[mid - 1] + this.values[mid]) / 2;
		}
	};

	this.reset = function() {
		this.min = null;
		this.max = null;
		this.sum = 0;
		this.values = [];
	};

	this.getPlotPanel = function(options) {
		var panel = null;
		var binCount = 10;
		var strings = this.strings;
		
		var binLabel = new Ext.form.Label({
			text : binCount + ' ' + this.strings.bins
		});
		var sliderBins = new Ext.form.SliderField({
			value : binCount,
			minValue : 1,
			maxValue : 50,
			increment : 1,
			width : 100,
			tipText : function(thumb) {
				return String.format('<b>{0}</b>', thumb.value);
			},
			onChange : function(slider, value) {
				// workaround for not working 'change' event...
				Ext.form.SliderField.prototype.onChange.apply(this, arguments);
				binLabel.setText(value + ' ' + strings.bins + ' ');
				binCount = value;
				panel.replot();
			}
		});

		options = Ext.apply({
			height : 400,
			width : 400,
			tbar : [ binLabel, ' ', sliderBins ]
		}, options);

		panel = new Ext.ux.EE.FlotPanel(options);

		panel.getPlotParams = function() {
			var minValue = this.getMin(), maxValue = this.getMax();
			var binSize = Math.max((maxValue - minValue) / binCount, minValue == maxValue ? 1 : 0);
			var bins = new Array(binCount);
			for ( var i = 0, count = this.values.length; i < count; i++) {
				var binIndex = Math.min(Math.floor((this.values[i] - minValue) / binSize), binCount - 1);
				if (!bins[binIndex])
					bins[binIndex] = 1;
				else
					bins[binIndex]++;
			}
			var data = [];
			var ticks = [];
			for ( var i = 0; i < binCount; i++) {
				data.push([ minValue + i * binSize, bins[i] ]);
				ticks.push(minValue + i * binSize);
			}

			return {
				series : [ {
					data : data,
					label : this.strings.number_realizations,
					binSize : binSize
				} ],
				options : {
					grid : {
						// color : '#B6B6B6',
						hoverable : true,
						clickable : true,
						mouseActiveRadius : 25
					},
					bars : {
						show : true,
						align : 'left',
						barWidth : binSize,
						fill : 0.9
					},
					xaxis : {
						autoscaleMargin : 0.1,
						ticks : ticks,
						tickDecimals : 1
					}
				}
			};
		}.createDelegate(this);

		var tooltip = new Ext.ToolTip({
			header : true,
			anchor : 'left',
			style : {
				'pointer-events' : 'none'
			}
		});

		panel.on('plothover', function(event, pos, item) {
			if (item && item.datapoint) {
				tooltip.setTitle(item.datapoint[1].toFixed(0) + '<br>' //
						+ item.datapoint[0].toFixed(3) + ' - ' + (item.datapoint[0] + item.series.binSize).toFixed(3));
				tooltip.showAt([ item.pageX + 10, item.pageY + 10 ]);
			} else {
				tooltip.hide();
			}
		});

		return panel;
	};

	this.reset();
};
EE.StatisticsHolder.Numeric.prototype = new EE.StatisticsHolder.Base();

Ext.namespace("EE.StatisticsHolder.Categorical");

/**
 * Class for objects holding/managing statistics for a single string attribute
 * while feeding them with individual values
 */
EE.StatisticsHolder.Categorical = function(name) {
	EE.StatisticsHolder.Base.call(this, name);
	this.addValue = function(value) {
		var currentCount;
		if (!this.categoryCount[value]) {
			currentCount = this.categoryCount[value] = 1;
		} else {
			currentCount = ++this.categoryCount[value];
		}
		if (this.maxCount == null || currentCount > this.maxCount) {
			this.maxCount = currentCount;
			this.maxCat = [ value ];
		} else if (currentCount == this.maxCount) {
			this.maxCat.push(value);
		}
		this.totalCount++;
	};
	this.getMode = function() {
		return this.maxCat.join(", ");
	};

	this.getModeProbability = function() {
		return this.maxCount / this.totalCount;
	};

	this.reset = function() {
		this.categoryCount = {};
		this.maxCount = null;
		this.maxCat = [];
		this.totalCount = 0;
	};

	this.getPlotPanel = function(options) {
		var panel = null;
		var orderBy = 'freq';
		var showLegend = true;

		var sortButton = new Ext.Button({
			text : this.strings.sort,
			menu : [ {
				text : this.strings.frequency,
				handler : function() {
					orderBy = 'freq';
					panel.replot();
				}
			}, {
				text : this.strings.category,
				handler : function() {
					orderBy = 'cat';
					panel.replot();
				}
			} ]
		});

		var legendButton = new Ext.Button({
			text : this.strings.legend,
			enableToggle : true,
			pressed : showLegend,
			toggleHandler : function(b, pressed) {
				showLegend = pressed;
				panel.replot();
			}
		});

		options = Ext.apply({
			height : 400,
			width : 400,
			tbar : [ sortButton, legendButton ]
		}, options);

		panel = new Ext.ux.EE.FlotPanel(options);

		panel.getPlotParams = function() {
			var freqList = [];
			for ( var key in this.categoryCount) {
				freqList.push([ this.categoryCount[key], key ]);
			}

			switch (orderBy) {
			case 'freq':
				freqList.sort(function(a, b) {
					return b[0] - a[0];
				});
				break;
			case 'cat':
				freqList.sort(function(a, b) {
					if (a[1] < b[1])
						return -1;
					if (a[1] > b[1])
						return 1;
					return 0;
				});
				break;
			}

			var data = [];
			for ( var i = 0, len = freqList.length; i < len; i++) {
				data.push({
					label : freqList[i][1],
					data : freqList[i][0],
					fill : 0.8
				});
			}
			var options = {
				series : {
					pie : {
						show : true,
						radius : 0.8,
						label : {
							show : true,
							radius : 0.8,
							formatter : function(label, series) {
								return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">' + label + '<br/>'
										+ series.data[0][1] + ' (' + series.percent.toFixed(1) + '%)</div>';
							},
							background : {
								opacity : 0.5,
								color : '#000'
							}
						}
					}
				},
				grid : {
				// hoverable : true
				},
				legend : {
					show : showLegend
				}
			};
			return {
				series : data,
				options : options
			};
		}.createDelegate(this);
		return panel;
	};

	this.reset();
};
EE.StatisticsHolder.Categorical.prototype = new EE.StatisticsHolder.Base();
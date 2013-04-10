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
Ext.namespace("EE.WFSFilter");

/**
 * Base class for filter provider. Creates menu for interaction and sets
 * corresponding wfs filters.
 */
EE.WFSFilter.Base = Ext.extend(Ext.util.Observable, {

	wfsAttribute : null,
	wfsFilter : null,
	checked : null,

	constructor : function(wfsFilter, config) {
		EE.WFSFilter.Base.superclass.constructor.call(this, config);
		this.checked = false;
		Ext.apply(this, config);
		this.wfsFilter = wfsFilter;

		this.addEvents(
		/**
		 * @event update notifies about changed values
		 */
		'update');
		this.updateTask = new Ext.util.DelayedTask(this.updateFilter, this);

	},

	/**
	 * Called by the update task asking the filter to reset the WFS constraints
	 */
	updateFilter : function() {

	},

	/**
	 * Should return and Ext.menu.Menu for interacting with the filter
	 * 
	 */
	getFilterMenu : function() {
		return null;
	},

	/**
	 * Called when the filter gets activated/deactivated
	 * 
	 * @param checked
	 */
	setChecked : function(checked) {
		this.checked = checked;
	},

	/**
	 * Helper function to add a string as menu item icon.
	 * 
	 * @param text
	 * @param comp
	 */
	addTextIcon : function(text, comp) {
		Ext.DomHelper.insertBefore(comp.getEl(), {
			tag : 'b',
			html : text,
			style : {
				border : '0 none',
				height : '16px',
				padding : 0,
				'vertical-align' : 'top',
				width : '16px',
				position : 'absolute',
				left : '3px',
				margin : 0,
				'margin-top' : '3px',
				'margin-left' : '3px',
				'background-position' : 'center'
			}
		});
	}

});

/**
 * Filter provider for numeric fields. Offers min/max and equals constraints.
 */
EE.WFSFilter.Numeric = Ext.extend(EE.WFSFilter.Base, {

	minValue : null,
	maxValue : null,
	value : null,
	menu : null,

	getFilterMenu : function() {
		if (this.menu == null) {
			this.menu = new Ext.menu.Menu({
				items : [ {
					xtype : 'numberfield',
					iconCls : 'no-icon',
					enableKeyEvents : true,
					listeners : {
						keyup : function(comp, e) {
							this.minValue = comp.getValue();
							this.updateTask.delay(2000);
						},
						render : function(comp) {
							this.addTextIcon('>', comp);
						},
						scope : this
					}
				}, {
					xtype : 'numberfield',
					iconCls : 'no-icon',
					enableKeyEvents : true,
					listeners : {
						keyup : function(comp, e) {
							this.maxValue = comp.getValue();
							this.updateTask.delay(2000);
						},
						render : function(comp) {
							this.addTextIcon('<', comp);
						},
						scope : this
					}
				}, '-', {
					xtype : 'numberfield',
					iconCls : 'no-icon',
					enableKeyEvents : true,
					listeners : {
						keyup : function(comp, e) {
							this.value = comp.getValue();
							this.updateTask.delay(2000);
						},
						render : function(comp) {
							this.addTextIcon('=', comp);
						},
						scope : this
					}
				} ]
			});
		}

		return this.menu;
	},

	updateFilter : function() {
		if (this.minValue == null || this.minValue == '') {
			this.wfsFilter.clearConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.GREATER_THAN);
		} else {
			this.wfsFilter.setConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.GREATER_THAN, this.minValue);
		}
		if (this.maxValue == null || this.maxValue == '') {
			this.wfsFilter.clearConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.LESS_THAN);
		} else {
			this.wfsFilter.setConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.LESS_THAN, this.maxValue);
		}
		if (this.value == null || this.value == '') {
			this.wfsFilter.clearConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.EQUAL_TO);
		} else {
			this.wfsFilter.setConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.EQUAL_TO, this.value);
		}
	},

	setChecked : function(checked) {
		EE.WFSFilter.Numeric.superclass.setChecked.call(this, checked);
		if (checked) {
			this.updateFilter();
		} else {
			this.wfsFilter.clearConstraint(this.wfsAttribute);
		}
	}

});

/**
 * Filters String values. Uses a PropertyIsLike WFS filter with a default
 * wildCard of '*', singleChar of '.' and escape of '!'
 */
EE.WFSFilter.String = Ext.extend(EE.WFSFilter.Base, {

	value : null,
	menu : null,
	strings : {
		wildcard_info : 'Wildcard *, Single Char ., Escape !'
	},

	getFilterMenu : function() {
		if (this.menu == null) {
			this.menu = new Ext.menu.Menu({
				items : [ {
					xtype : 'textfield',
					iconCls : 'no-icon',
					enableKeyEvents : true,
					listeners : {
						keyup : function(comp, e) {
							this.value = comp.getValue();
							this.updateTask.delay(2000);
						},
						render : function(comp) {
							this.addTextIcon('=', comp);
						},
						scope : this
					}
				}, {
					xtype : 'label',
					iconCls : 'no-icon',
					text : this.strings.wildcard_info
				} ]
			});
		}

		return this.menu;
	},

	updateFilter : function() {
		if (this.value == null || this.value.length == 0) {
			this.wfsFilter.clearConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.LIKE, this.value);
		} else {
			this.wfsFilter.setConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.LIKE, this.value, {
				matchCase : false
			});
		}
	},

	setChecked : function(checked) {
		EE.WFSFilter.String.superclass.setChecked.call(this, checked);
		if (checked) {
			this.updateFilter();
		} else {
			this.wfsFilter.clearConstraint(this.wfsAttribute);
		}
	}

});

/**
 * Filters Boolean values. Uses a PropertyIsEqualTo WFS filter.
 */
EE.WFSFilter.Boolean = Ext.extend(EE.WFSFilter.Base, {

	value : null,
	menu : null,
	strings : {
		state : 'State'
	},

	getFilterMenu : function() {
		if (this.menu == null) {
			this.menu = new Ext.menu.Menu({
				items : [ {
					xtype : 'menucheckitem',
					text : this.strings.state,
					hideOnClick : false,
					listeners : {
						checkchange : function(comp, checked) {
							this.value = checked;
							this.updateTask.delay(2000);
						},
						scope : this
					}
				} ]
			});
		}

		return this.menu;
	},

	updateFilter : function() {
		var trueValue = this.column.booleanTrueValue || true;

		if (this.value == null) {
			this.wfsFilter.clearConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.EQUAL_TO);
			this.wfsFilter.clearConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.NOT_EQUAL_TO);
		} else if (this.value === true) {
			this.wfsFilter.setConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.EQUAL_TO, trueValue);
			this.wfsFilter.clearConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.NOT_EQUAL_TO);
		} else {
			this.wfsFilter.setConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.NOT_EQUAL_TO, trueValue);
			this.wfsFilter.clearConstraint(this.wfsAttribute, OpenLayers.Filter.Comparison.EQUAL_TO);
		}

	},

	setChecked : function(checked) {
		EE.WFSFilter.String.superclass.setChecked.call(this, checked);
		if (checked) {
			this.updateFilter();
		} else {
			this.wfsFilter.clearConstraint(this.wfsAttribute);
		}
	}

});

/**
 * Plugin for Grid to make use of custom column/attribute WFS filterings
 */
EE.WFSFilter.Plugin = Ext.extend(Ext.util.Observable, {

	wfsFilter : null,
	strings : {
		filter : 'Filter',
		inactive : 'Not active'
	},

	constructor : function(wfsFilter, config) {
		this.wfsFilter = wfsFilter;
		EE.WFSFilter.Plugin.superclass.constructor.call(this, config);
	},

	init : function(grid) {
		if (grid instanceof Ext.grid.GridPanel) {
			this.grid = grid;

			var cm = this.grid.getColumnModel();
			for ( var i = 0, len = cm.config.length; i < len; i++) {
				var column = cm.config[i];

				if (column.wfsFilter) {
					if (!(column.wfsFilter instanceof EE.WFSFilter.Base)) {
						// create appropriate filter object based on column data type if
						// none was set in column config
						var filterClass = null;
						switch (column.wfsAttributeType) {
						case 'int':
						case 'float':
						case 'double':
							filterClass = EE.WFSFilter.Numeric;
							break;
						case 'string':
							filterClass = EE.WFSFilter.String;
							break;
						case 'boolean':
							filterClass = EE.WFSFilter.Boolean;
							break;
						}

						if (filterClass != null) {
							column.wfsFilter = new filterClass(this.wfsFilter, {
								wfsAttribute : column.dataIndex,
								column : column
							});
						} else {
							column.wfsFilter = null;
						}

					}

				}
			}

			if (grid.rendered) {
				this.onRender();
			} else {
				grid.on('render', this.onRender, this, {
					single : true
				});
			}
		}
	},

	onRender : function() {
		this.createMenu();
		// To handle column reordering and sorting
		this.grid.getView().on('refresh', this.refreshHeaders, this);
	},

	/**
	 * Adds the filtering menu entry to the shared header menu
	 */
	createMenu : function() {
		var view = this.grid.getView();
		var headerMenu = view.hmenu;

		if (headerMenu) {
			headerMenu.addSeparator();
			this.noFilterMenu = new Ext.menu.Menu({
				items : [ {
					disabled : true,
					text : this.strings.inactive
				} ]
			});
			this.menu = headerMenu.add({
				hideOnClick : false,
				checked : false,
				itemId : 'filters',
				text : this.strings.filter,
				menu : this.noFilterMenu,
				listeners : {
					checkchange : function(comp, checked) {
						if (view == null)
							return;

						var column = view.cm.config[view.hdCtxIndex];
						column.wfsFilter.setChecked(checked);
						comp.menu.hide();
						this.onShowHeaderMenu();
					},
					scope : this
				}
			});

			headerMenu.on('beforeshow', this.onShowHeaderMenu, this);
		}

	},

	/**
	 * Adjusts the filtering menu to reflect the currently selected column and
	 * updates the UI.
	 */
	onShowHeaderMenu : function() {
		var view = this.grid.getView();
		if (view == null)
			return;

		var column = view.cm.config[view.hdCtxIndex];
		var wfsFilter = column.wfsFilter;
		if (wfsFilter) {
			this.menu.setDisabled(false);
			this.menu.setChecked(column.wfsFilter.checked, true);
			if (wfsFilter.checked) {
				this.menu.menu = column.wfsFilter.getFilterMenu();
				Ext.fly(view.getHeaderCell(view.hdCtxIndex)).addClass('ee-header-filtered');
			} else {
				this.menu.menu = this.noFilterMenu;
				Ext.fly(view.getHeaderCell(view.hdCtxIndex)).removeClass('ee-header-filtered');
			}
		} else {
			this.menu.setDisabled(true);
		}
	},

	/**
	 * Updates the styling of every header in the grid.
	 */
	refreshHeaders : function() {
		var view = this.grid.getView();
		if (view == null)
			return;

		for ( var i = 0; i < view.cm.config.length; i++) {
			var column = view.cm.config[i];
			var wfsFilter = column.wfsFilter;
			if (wfsFilter && wfsFilter.checked) {

				Ext.fly(view.getHeaderCell(i)).addClass('ee-header-filtered');
			} else {
				Ext.fly(view.getHeaderCell(i)).removeClass('ee-header-filtered');
			}

		}
	}
});

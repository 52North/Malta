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
//custom layer node UI class
Ext.namespace("EE");
/**
 * Main Extreme Events Client class, ensures easy integration into existing
 * projects
 */
EE.Client = Ext
		.extend(
				Object,
				{
					layerNodeClass : Ext.extend(GeoExt.tree.LayerNodeUI, new GeoExt.tree.TreeNodeUIEventMixin()),

					strings : {
						group_event_types : 'Event Types',
						group_time : 'Time',
						group_selection : 'Selection',
						group_statistics : 'Statistics',
						panel_layers : 'Background Information',
						panel_attributes : 'Feature Attributes',
						button_about : 'About',
						button_help : 'Help',
						button_filterselection : 'Filter Selection',
						button_selectall : 'Select all',
						statistics_mean : 'Mean',
						statistics_sd : 'Standard Deviation',
						statistics_median : 'Median',
						statistics_min : 'Min',
						statistics_max : 'Max',
						statistics_mode : 'Mode (Probability)',
						statistics_attribute : 'Attribute',
						info_nofiltermatch : 'No features matching current filter',
						info_noselection : 'No Selection',
						info_numselectedfeatures : '# Selected Features:',
						info_nostatisticsselected : 'Select attribute on the left hand side to see a chart',
						window_statistics : 'Selection Statistics',
						window_export : 'Export',
						window_featuredetails : 'Feature Details',
						action_selectallvisible : 'Select All Visible',
						action_boxselection : 'Box Selection',
						action_hideunselected : 'Hide Unselected',
						action_showstatistics : 'Show Statistics',
						action_zoomtoselection : 'Zoom to Selection',
						context_showdetails : 'Details...',
						context_createreport : 'Create Report',
						context_showonlythis : 'Show only this category',
						context_showallcategories : 'Show all categories',
						tooltip_selectallvisible : 'Select all features visible in the map viewport',
						tooltip_boxselection : 'Select features interactively by drawing a selection rectangle',
						tooltip_hideunselected : 'Hide all features from the map which are not selected',
						tooltip_showstatistics : 'Show a window with summary statistics for currently selected features',
						tooltip_zoomselection : 'Zoom map to the extent of all selected features',
						tooltip_filterselection : 'Exclude currently unselected features from selection',
						tooltip_button_about : 'About this software',
						tooltip_button_help : 'Open full help in new window',
						tooltip_tool_help : 'Show help for this area',
						tooltip_tool_switchposition : 'Switch position of this panel',
						message_exporterror : 'An unkown error occured while exporting data',
						message_heading_error : 'Error',
						message_heading_success : 'Success',
						message_exportsuccess : 'Data exported sucessfully',
						message_nogeometry : 'No geometry available!'

					},
					actions : null, // Wraps all reusable Actions
					map : null,
					wfsLayer : null,
					eventSelectControl : null,
					mapPanel : null,
					featureStyleMap : null,
					attributesPanel : null,
					attributesPanelDummyEast : null,
					attributesPanelDummySouth : null,
					renderTo : null,
					width : 100,
					height : 100,
					displayPanel : null,
					featureGrid : null,
					filter : null,
					eventTypeButtonGroup : null,
					helpProvider : null,
					aboutFile : 'EE/about/about_en.html',
					statisticsAttributes : null,
					statisticsWindow : null,

					constructor : function(config) {
						Ext.apply(this, config || {});
						Ext.QuickTips.init();
						Ext.WindowMgr.zseed = 11000; // Usually 9000, but slider thumbs
						// have
						// higher z-index

						this.helpProvider = new EE.HelpProvider();

						// init OL
						this.initFilter();
						this.initStyle();
						this.initMap();

						// UI
						this.initActions();
						this.initUI();

						// Load data
						this.initEventTypes();

					},

					/**
					 * Creates the featureStyleMap. This is used by the wfsLayer to apply
					 * styles to features based on their event type. The featureStyleMap
					 * is a OpenLayers.StyleMap with extended functionalities such as
					 * hiding unselected features and offering change events so that
					 * layers are enabled to redraw themselves on style change.
					 */
					initStyle : function() {
						// wrapper used to simply share state between style context and
						// stylemap
						var styleSettings = {
							hideUnselected : false
						};

						// Default style based on EE.Settings.defaultFeatureStyle but
						// maintains
						// the display property on its own to optionally hide unselected
						// features
						var defaultStyle = new OpenLayers.Style(OpenLayers.Util.applyDefaults({
							display : '${getDisplay}'
						}, EE.Settings.defaultFeatureStyle), {
							context : {
								getDisplay : function(feature) {
									if (feature.attributes.hidden === true) {
										// Hide feature if special "hidden" flag is set
										return 'none';
									}
									return styleSettings.hideUnselected ? 'none' : '';
								}
							}
						});

						this.featureStyleMap = new OpenLayers.StyleMap({
							'default' : defaultStyle,
							'select' : new OpenLayers.Style(OpenLayers.Util.applyDefaults({
								display : ''
							}, EE.Settings.selectedFeatureStyle))
						}, {
							events : null,
							toggleHideUnselected : function(show) {
								styleSettings.hideUnselected = show;
								this.events.triggerEvent("change");
							}
						});

						// uniqe value rule based on event type
						var styleLookup = {};
						for ( var cat in EE.Settings.eeCats) {
							styleLookup[cat] = EE.Settings.eeCats[cat].style || {};
						}
						this.featureStyleMap.addUniqueValueRules('default', EE.Settings.eeCategoryAttr, styleLookup);

						// init events ojects
						this.featureStyleMap.events = new OpenLayers.Events(this.featureStyleMap);
					},

					initEventTypes : function() {
						// Create buttons for event types and associate them with the common
						// filter instance
						var allCategories = [];
						for ( var cat in EE.Settings.eeCats) {
							allCategories.push(cat);
							// Add button for event cat to event
							// type button group
							var enabled = true;
							var eventButton = new Ext.Button({
								text : EE.Settings.eeCats[cat].title || cat,
								enableToggle : true,
								eeCat : cat, // reference to the category/type
								pressed : enabled,
								cls : 'x-btn-text-icon',
								toggleHandler : function(comp, pressed) {
									// toggles visibility of layer
									this.filter.toggleCategory(comp.eeCat, pressed);
								},
								scope : this,
								listeners : {
									scope : this,
									render : function(comp) {
										// Inserts a GeoExt.FeatureRenderer into Button markup

										// Get center element of button
										var buttonCenterEl = comp.getEl().select('.x-btn-mc').first();
										// Change positioning of button element
										buttonCenterEl.position('relative');
										buttonCenterEl.setStyle('display', 'block'); // for FF
										new GeoExt.FeatureRenderer({
											width : 16,
											style : {
												position : 'absolute',
												top : '-2px',
												left : '0px'
											},
											renderTo : buttonCenterEl,
											// symbolizer = category style + default
											symbolizers : [ OpenLayers.Util.applyDefaults(EE.Settings.eeCats[comp.eeCat].style || {},
													EE.Settings.defaultFeatureStyle) ]
										});

										// Attach a context menu
										comp.getEl().on('contextmenu', function(e) {
											e.preventDefault();
											var menu = new Ext.menu.Menu({
												items : [ {
													text : this.strings.context_showonlythis,
													handler : function() {
														this.filter.enableSingleCategory(comp.eeCat);
													},
													scope : this
												}, {
													text : this.strings.context_showallcategories,
													handler : function() {
														this.filter.toggleCategories(allCategories, true);
													},
													scope : this
												} ]
											});
											menu.showAt(e.xy);
										}, this);
									}
								}
							});
							this.filter.events.register('categorychange', eventButton, function(event) {
								if (this.eeCat == event.category && this.pressed != event.enabled) {
									// Button does not reflect current category state -> toggle
									// without
									// firing event/invoking handler
									this.toggle(event.enabled, true);
								}
							});
							this.eventTypeButtonGroup.add(eventButton);

							this.filter.toggleCategory(cat, enabled);
						}
						this.eventTypeButtonGroup.doLayout();

						/*
						 * Callback for inspecWfs call, will receive information about
						 * available attributes and geometry names
						 */
						var inspectWfsCallback = function(typeInformation, attributes) {

							if (this.attributesPanel.loadMask != null) {
								this.attributesPanel.loadMask.hide();
							}

							if (typeInformation instanceof Error) {
								Ext.MessageBox.alert('Error', typeInformation.message);
								return;
							}

							var fields = [], columns = [], newField;
							for ( var i = 0; i < attributes.length; i++) {
								var attrSettings = EE.Settings.eeWfsAttributeMapping[attributes[i].name] || {};

								if (attrSettings.booleanTrueValue != null) {
									newField = {
										name : attributes[i].name,
										trueComp : attrSettings.booleanTrueValue,
										undefinedComp : attrSettings.booleanUndefinedValue,
										convert : function(v, record) {
											if (v == (this.undefinedComp != null ? this.undefinedComp : null)) {
												return null;
											}
											return v === this.trueComp;
										},
										type : 'boolean'
									};
								} else {
									newField = {
										name : attributes[i].name,
										type : attributes[i].localType || 'string'
									};
								}

								if (newField.type == 'date') {
									newField.dateFormat = "Y-m-d\\Z";
								}

								fields.push(newField);
								var column = {
									wfsFilter : true,
									wfsAttributeType : newField.type,
									header : attrSettings.title || attributes[i].name,
									dataIndex : attributes[i].name,
									sortable : true,
									hidden : attrSettings.hidden || false,
									// Use custom weight or index of attribute
									_sortIndex : attrSettings.sortIndex || i + 20
								};

								if (newField.type == 'date') {
									column.xtype = 'datecolumn';
									column.format = "Y-m-d";
								}

								if (attrSettings.booleanTrueValue != null) {
									column.booleanTrueValue = attrSettings.booleanTrueValue;
								}

								columns.push(column);

							}

							// Sort columns by defined weight attribute
							columns.sort(function(a, b) {
								return a._sortIndex - b._sortIndex;
							});

							var featureTypes = Ext.pluck(typeInformation, 'typeName');
							var geometryNames = Ext.pluck(typeInformation, 'geometryName');

							this.wfsLayer = new OpenLayers.Layer.Vector("Features", {
								strategies : [ new OpenLayers.EE.Strategy.BBOX() ],
								// new OpenLayers.Strategy.BBOX() ],
								// http://dev.openlayers.org/docs/files/OpenLayers/Protocol/WFS/v1-js.html
								protocol : new OpenLayers.Protocol.WFS({
									formatOptions : {
										// use custom format
										// OpenLayers.Format.WFST.v1_0_0_multigeometrynames
										version : '1.1.0.multigeometrynames',
										srsNameInQuery : true
									},
									url : EE.Settings.eeWfsUrl,
									featureType : featureTypes,
									featureNS : EE.Settings.eeWfsNamespace,
									geometryName : geometryNames,
									srsName : "EPSG:3857"
								}),
								projection : "EPSG:3857",
								filter : this.filter.filter,
								// use only toggle buttons to filter, but always show layer
								displayInLayerSwitcher : false,
								styleMap : this.featureStyleMap
							});

							this.filter.events.register('change', this, function() {
								this.wfsLayer.refresh({
									force : true
								});
							});
							this.featureStyleMap.events.register('change', this, function() {
								this.wfsLayer.redraw();
							});

							var featureStore = new GeoExt.data.FeatureStore({
								fields : fields,
								layer : this.wfsLayer,
								selectionsState : null, // field to store last selection state
								// before reloading data
								listeners : {
									load : function(store) {
										if (store.sortInfo) {
											// Re-apply sorting after load
											store.sort(Ext.isArray(store.sortInfo) ? store.sortInfo : [ store.sortInfo ]);
										}
									},
									clear : function(store) {
										// Fired before new data from WFS gets loaded
										if (store.selectionsState == null) {
											store.selectionsState = this.featureGrid.getSelectionModel().getSelections();
										}
									},
									scope : this
								},

								onFeaturesRemoved : function(evt) {
									if (this.layer.features.length == 0 && !this._removing) {
										// Check if all features got removed (usually the case when
										// reloading data from WFS) -> do not remove all items
										// individually but all at once
										this.removeAll();
									} else {
										GeoExt.data.FeatureStore.prototype.onFeaturesRemoved.call(this, evt);
									}
								}
							});

							this.eventSelectControl = new OpenLayers.Control.SelectFeature(this.wfsLayer, {
								toggle : true,
								multipleKey : "ctrlKey",
								box : true
							});
							// Allows to pan the map even when clicking on vector features
							this.eventSelectControl.handlers.feature.stopDown = false;
							this.map.addControl(this.eventSelectControl);

							// Allow box selecting by initializing required components
							this.eventSelectControl.activate();
							this.eventSelectControl.deactivate();
							// Deactivate box selection
							this.eventSelectControl.box = false;

							var selectionCountLabel = new Ext.form.Label({
								text : '0'
							});

							var filterSelectionButton = new Ext.Button({
								text : this.strings.button_filterselection,
								tooltip : this.strings.tooltip_filterselection,
								enableToggle : true,
								toggleHandler : function(comp, pressed) {
									if (pressed) {
										// Add "hidden" flag to all features currently
										// unselected
										var sm = this.featureGrid.getSelectionModel();
										featureStore.each(function(record) {
											record.data.feature.attributes.hidden = !sm.isSelected(record);
										});
										// Filter store by hidden flag to create new
										// view/snapshot
										featureStore.filterBy(function(record) {
											return record.data.feature.attributes.hidden !== true;
										});
										this.wfsLayer.redraw();
									} else {
										// reset store
										featureStore.clearFilter();
										// reset "hidden" flag
										featureStore.each(function(record) {
											record.data.feature.attributes.hidden = false;
										});
										this.wfsLayer.redraw();
									}
								},
								scope : this
							});

							var filterPlugin = new EE.WFSFilter.Plugin(this.filter, {

							});

							this.featureGrid = new Ext.grid.GridPanel({
								store : featureStore,
								width : 320,
								columns : columns,
								plugins : [ filterPlugin ],
								sm : new GeoExt.grid.FeatureSelectionModel({
									// Use custom select control
									selectControl : this.eventSelectControl
								}),
								viewConfig : {
									emptyText : this.strings.info_nofiltermatch,
									deferEmptyText : false,
									getRowClass : function(record, index, rowParams, store) {
										if (record.data.feature.geometry == null) {
											return 'ee-row-no-geometry';
										}
									}
								},
								listeners : {
									rowdblclick : function(grid, rowIndex, e) {
										// Zoom to feature on double click
										var selectedFeature = grid.getStore().getAt(rowIndex).data.feature;
										if (selectedFeature != null) {
											if (selectedFeature.geometry != null) {
												this.map.zoomToExtent(selectedFeature.geometry.getBounds(), false);
											} else {
												Ext.MessageBox.alert(this.strings.message_heading_error, this.strings.message_nogeometry);
											}
										}
									},
									rowcontextmenu : function(comp, rowIndex, e) {
										var record = comp.getStore().getAt(rowIndex);
										if (record == null) {
											return;
										}
										var feature = record.data.feature;
										var menu = new Ext.menu.Menu({

											items : [ {
												text : this.strings.context_showdetails,
												handler : function() {
													this.showFeatureDetails(feature);
												},
												scope : this
											}, {
												text : this.strings.context_createreport,
												handler : function() {
													this.downloadReport(feature);
												},
												scope : this
											}
											// ,
											// {
											// text : 'Export events',
											// handler : function() {
											// this.exportEvents([ feature ]);
											// },
											// scope : this
											// }
											, '-', this.actions.zoomToSelection, this.actions.showStatistics ]

										});
										menu.showAt(e.xy);
										e.preventDefault();
									},
									scope : this
								},
								bbar : [ '->', {
									xtype : 'label',
									text : this.strings.info_numselectedfeatures
								}, selectionCountLabel ],
								tbar : [ filterSelectionButton, this.actions.toggleHideUnselected, '-', {
									text : this.strings.button_selectall,
									handler : function() {
										this.featureGrid.getSelectionModel().selectAll();
									},
									scope : this
								} ]
							});

							this.wfsLayer.events.register('loadstart', this, function() {
								if (this.attributesPanel.loadMask) {
									this.attributesPanel.loadMask.show();
								}
							});
							this.wfsLayer.events.register('loadend', this, function() {
								if (this.attributesPanel.loadMask) {
									this.attributesPanel.loadMask.hide();
								}
							});
							/**
							 * Handler for selection event, updates selected features count
							 */
							var selectionChangeHandler = function(sm) {
								var selRecords = sm.getSelections();
								selectionCountLabel.setText(selRecords.length);
							};

							this.featureGrid.getSelectionModel().on('selectionchange', selectionChangeHandler, this, {
								buffer : 500
							});

							featureStore.on('load', function() {
								// Reset filter button since data is reloaded anyway...
								filterSelectionButton.toggle(false, true);

								if (featureStore.selectionsState != null) {
									// this.featureGrid.getSelectionModel().selectRecords(selectionsState);
									// Differing record instances

									// Get records to select by ids of previous selected ones
									var recordsToSelect = [];
									for ( var i = 0; i < featureStore.selectionsState.length; i++) {
										// Task: somehow make sure that store/record ids match
										// EE.Settings.eeWfsId (or fid) to use
										// featureStore.getById
										record = featureStore.query(EE.Settings.eeWfsId,
												featureStore.selectionsState[i].data[EE.Settings.eeWfsId]);
										if (record != null && record.getCount() == 1) {
											recordsToSelect.push(record.get(0));
										}
									}
									this.featureGrid.getSelectionModel().selectRecords(recordsToSelect);
									featureStore.selectionsState = null;
								}
							}, this);

							// Extract statistics attributes
							this.statisticsAttributes = [];
							for ( var i = 0; i < fields.length; i++) {
								var f = fields[i];
								if (EE.Settings.excludeFromStatistics.indexOf(f.name) != -1) {
									continue;
								}
								if (f.type == 'int' || f.type == 'float' || f.type == 'double'
										|| EE.Settings.includeInStatistics.indexOf(f.name) != -1) {
									this.statisticsAttributes.push(f);
								}
							}

							this.map.addLayers([ this.wfsLayer ]);

							this.attributesPanel.add(this.featureGrid);
							this.attributesPanel.doLayout();
						};

						if (this.attributesPanel.loadMask != null) {
							this.attributesPanel.loadMask.show();
						}

						this.inspectWFS(inspectWfsCallback, this);

					},

					/**
					 * Performs a describefeaturetype request on the wfs endpoint using
					 * the declared feature type names.
					 * 
					 * @see EE.Settings
					 * @param callback
					 *          Callback will receive array of { typename, geometryname}
					 *          and array of attributes supported by all feature types
					 * @param scope
					 */
					inspectWFS : function(callback, scope) {
						scope = scope || this;
						/*
						 * Returns intersection of arrays based on the value of a specific
						 * property of each element
						 */
						var propertyIntersection = function(a, b, prop) {
							b = Ext.pluck(b, prop);
							var result = [];
							for ( var i = 0; i < a.length; i++) {
								if (b.indexOf(a[i][prop]) != -1) {
									result.push(a[i]);
								}
							}
							return result;
						};

						var describeFeatureCallback = function(response) {
							describeFeatureTypeResponse = new OpenLayers.Format.WFSDescribeFeatureType().read(response.responseText);
							var featureTypes = describeFeatureTypeResponse.featureTypes;

							if (!featureTypes) {
								var e = new Error("Could not get feature type descriptions from WFS");
								callback.call(scope, e, e);
								throw e;
							}

							// Potential improvement: handle errors when connection failed
							// etc.
							// (featureTypes null or empty)
							var typeInformation = [];
							var attributes = null;
							for ( var i = 0; i < featureTypes.length; i++) {
								var featureTypeAttributes = [];
								var geometryName = null;
								for ( var j = 0; j < featureTypes[i].properties.length; j++) {
									var prop = featureTypes[i].properties[j];
									if (prop.type.substring(0, 3) == "gml") {
										// Gets geometry name by searching for gml namespace
										// alias
										geometryName = prop.name;
									} else {
										featureTypeAttributes.push(prop);
									}
								}
								if (geometryName == null) {
									throw "No geometry found";
								}

								if (attributes == null) {
									attributes = featureTypeAttributes;
								} else {
									attributes = propertyIntersection(attributes, featureTypeAttributes, 'name');
								}
								typeInformation.push({
									typeName : featureTypes[i].typeName,
									geometryName : geometryName
								});
							}

							callback.call(scope, typeInformation, attributes);

						};

						OpenLayers.Request.GET({
							url : OpenLayers.Util.urlAppend(EE.Settings.eeWfsUrl, "SERVICE=wfs&REQUEST=describefeaturetype&TYPENAME="
									+ EE.Settings.eeFeatureTypes.join(",")),
							callback : describeFeatureCallback
						});

					},

					/**
					 * Initializes actions field, wrapping reusable functionalities to be
					 * used multiple times across the UI
					 */
					initActions : function() {
						this.actions = {};
						this.actions.selectAllVisible = new Ext.Action({
							text : this.strings.action_selectallvisible,
							tooltip : this.strings.tooltip_selectallvisible,
							handler : function(button) {
								if (!this.eventSelectControl) {
									// feature types not yet loaded
									return;
								}
								var viewport = this.map.getViewport();
								var bounds = new OpenLayers.Bounds(viewport.clientLeft, viewport.clientHeight + viewport.clientTop,
										viewport.clientLeft + viewport.clientWidth, viewport.clientTop);
								this.eventSelectControl.selectBox(bounds);
							},
							scope : this
						});

						this.actions.toggleBoxSelection = new Ext.Action({
							iconCls : 'icon-selectbox',
							text : this.strings.action_boxselection,
							tooltip : this.strings.tooltip_boxselection,
							enableToggle : true,
							toggleHandler : function(comp, pressed) {
								if (!this.eventSelectControl) {
									// feature types not yet loaded
									return;
								}
								// enables/disables box selection mode of SelectFeature Control
								// assigned for events wfs layer
								// http://dev.openlayers.org/docs/files/OpenLayers/Control/SelectFeature-js.html#OpenLayers.Control.SelectFeature.box
								this.eventSelectControl.box = pressed;
								if (this.eventSelectControl.active) {
									this.eventSelectControl.deactivate();
									this.eventSelectControl.activate();
								}

								if (pressed) {
									// Register event for end of box selection to reset action
									var selectionEndHandler = function() {
										this.eventSelectControl.events.unregister('boxselectionend', this, selectionEndHandler);
										this.actions.toggleBoxSelection.initialConfig.toggleHandler.call(this, null, false);
									};
									this.eventSelectControl.events.register('boxselectionend', this, selectionEndHandler);
								}

								// Allow Ext.Action to be used with toggle buttons
								this.actions.toggleBoxSelection.each(function(obj) {
									if (obj.toggle)
										obj.toggle(pressed, true);
								});
							},
							scope : this
						});

						this.actions.toggleHideUnselected = new Ext.Action({
							text : this.strings.action_hideunselected,
							tooltip : this.strings.tooltip_hideunselected,
							enableToggle : true,
							toggleHandler : function(comp, pressed) {
								this.featureStyleMap.toggleHideUnselected(pressed);

								// Allow Ext.Action to be used with toggle buttons
								this.actions.toggleHideUnselected.each(function(obj) {
									if (obj.toggle)
										obj.toggle(pressed, true);
								});
							},
							scope : this
						});

						this.actions.showStatistics = new Ext.Action({
							iconCls : 'icon-chart',
							text : this.strings.action_showstatistics,
							tooltip : this.strings.tooltip_showstatistics,
							handler : function(button) {
								this.showStatisticsWindow();
							},
							scope : this
						});

						this.actions.zoomToSelection = new Ext.Action({
							iconCls : 'icon-zoom',
							text : this.strings.action_zoomtoselection,
							tooltip : this.strings.tooltip_zoomselection,
							handler : function(button) {

								var selFeatures = this.wfsLayer.selectedFeatures;
								if (selFeatures && selFeatures.length != 0) {
									var bounds = null;
									for ( var i = 0; i < selFeatures.length; i++) {
										if (selFeatures[i].geometry != null) {
											if (bounds == null) {
												bounds = selFeatures[i].geometry.getBounds().clone();
											} else {
												bounds.extend(selFeatures[i].geometry.getBounds());
											}
										}
									}
									if (bounds != null) {
										this.map.zoomToExtent(bounds, false);
									} else {
										Ext.MessageBox.alert(this.strings.message_heading_error, this.strings.message_nogeometry);
									}
								}
							},
							scope : this
						});
					},

					/*
					 * Initializes UI components. Has to be called after initMap
					 */
					initUI : function() {
						// initMap has to be called beforehand
						this.mapPanel = new GeoExt.MapPanel({
							map : this.map,
							region : 'center',
							listeners : {
								render : function(comp) {
									// Hide menus on map interaction
									Ext.fly(comp.map.layerContainerDiv).on('mousedown', function(e) {
										Ext.menu.MenuMgr.hideAll();
									});

									// Context menu for features on map
									Ext.fly(comp.map.layerContainerDiv).on('contextmenu', function(e) {
										e.preventDefault();
										var feature = this.wfsLayer.getFeatureFromEvent(e);

										if (feature != null) {
											var contextMenu = new Ext.menu.Menu({
												items : [ {
													text : this.strings.context_showdetails,
													handler : function() {
														this.showFeatureDetails(feature);
													},
													scope : this
												}, {
													text : this.strings.context_createreport,
													iconCls : 'icon-acrobat',
													handler : function() {
														this.downloadReport(feature);
													},
													scope : this
												} ]
											});

											contextMenu.showAt(e.xy);
										}
									}, this);

								},
								scope : this
							},
							center : new OpenLayers.LonLat(EE.Settings.center).transform('EPSG:4326', 'EPSG:3857'),
							zoom : EE.Settings.zoom
						});

						var layerPanel = new Ext.tree.TreePanel({
							region : "west",
							title : this.strings.panel_layers,
							width : 250,
							autoScroll : true,
							collapsible : true,
							split : true,
							enableDD : true,
							// apply the tree node component plugin to
							// layer nodes
							plugins : [ {
								ptype : "gx_treenodecomponent"
							} ],
							loader : {
								applyLoader : false,
								uiProviders : {
									"custom_ui" : this.layerNodeClass
								}
							},
							root : {

								nodeType : "gx_layercontainer",
								loader : {
									// Implicitly sets a
									// GeoExt.tree.LayerLoader with the
									// following config
									baseAttrs : {
										// Attributes added to all nodes
										uiProvider : "custom_ui"
									},
									mapPanel : this.mapPanel
								// createNode : function(attr) {
								// if (attr.layer instanceof OpenLayers.Layer.WMS) {
								// // add a WMS legend to each
								// // node created
								// attr.component = {
								// xtype : "gx_wmslegend",
								// useScaleParameter : false,
								// layerRecord : this.mapPanel.layers.getByLayer(attr.layer),
								// showTitle : false,
								// // custom class for css
								// // positioning
								// // see tree-legend.html
								// cls : "legend"
								// };
								// }
								// return
								// GeoExt.tree.LayerLoader.prototype.createNode.call(this,
								// attr);
								// }
								}
							},
							rootVisible : false,
							lines : false,
							tools : [ {
								id : 'help',
								qtip : this.strings.tooltip_tool_help,
								handler : function(e, toolEl) {
									this.helpProvider.showHelpTooltip('layers', toolEl);
								},
								scope : this
							} ]
						});

						this.attributesPanel = new Ext.Panel({
							layout : 'fit',
							loadMask : null,
							listeners : {
								render : function(comp) {
									comp.loadMask = new Ext.LoadMask(comp.getEl(), {
										msg : "Loading..."
									});
								}
							}
						});

						// Button group to reuse for event layers
						this.eventTypeButtonGroup = new Ext.ButtonGroup({
							title : this.strings.group_event_types,
							rows : 2,
							defaults : {
								scale : 'small'
							},
							doLayout : function(shallow, force) {
								// custom override ensures that this group will have a maximum
								// height of
								// 2 items
								this.layout.columns = Math.ceil(this.items.getCount() / 2);
								Ext.ButtonGroup.prototype.doLayout.call(this, shallow, force);
							},
							tools : [ {
								id : 'help',
								qtip : this.strings.tooltip_tool_help,
								handler : function(e, toolEl) {
									this.helpProvider.showHelpTooltip('events', toolEl, 'left');
								},
								scope : this
							} ]
						});

						var timePeriodPicker = new Ext.ux.EE.TimePeriodPicker({
							width : 400,
							begin : EE.Settings.begin || null,
							end : EE.Settings.end || null,
							listeners : {
								periodChange : function(interval) {
									// set new interval for filter
									this.filter.setInterval(interval.begin, interval.end);
								},
								periodChanging : function() {
									this.filter.cancelIntervalUpdate();
								},
								scope : this
							}
						});

						// Set initial filter values based on period picker defaults, not
						// delayed
						this.filter.setInterval(timePeriodPicker.begin, timePeriodPicker.end, true);

						var toolbar = new Ext.Toolbar({
							height : 72,
							region : "north",
							items : [
									this.eventTypeButtonGroup,
									{
										xtype : 'buttongroup',
										title : this.strings.group_time,
										columns : 2,
										defaults : {
											scale : 'small'
										},
										items : [ timePeriodPicker ],
										tools : [ {
											id : 'help',
											qtip : this.strings.tooltip_tool_help,
											handler : function(e, toolEl) {
												this.helpProvider.showHelpTooltip('timepicker', toolEl, 'left');
											},
											scope : this
										} ]
									},
									{
										xtype : 'buttongroup',
										title : this.strings.group_selection,
										columns : 2,
										defaults : {
											scale : 'small'
										},
										items : [ this.actions.selectAllVisible, this.actions.toggleBoxSelection,
												this.actions.toggleHideUnselected, this.actions.zoomToSelection ],
										tools : [ {
											id : 'help',
											qtip : this.strings.tooltip_tool_help,
											handler : function(e, toolEl) {
												this.helpProvider.showHelpTooltip('selection', toolEl, 'left');
											},
											scope : this
										} ]
									}, {
										xtype : 'buttongroup',
										title : this.strings.group_statistics,
										columns : 1,
										defaults : {
											scale : 'small'
										},
										items : [ this.actions.showStatistics ],
										tools : [ {
											id : 'help',
											qtip : this.strings.tooltip_tool_help,
											handler : function(e, toolEl) {
												this.helpProvider.showHelpTooltip('statistics', toolEl, 'left');
											},
											scope : this
										} ]
									}, '->',
									// About and Help
									{
										xtype : 'panel',
										layout : {
											type : 'table',
											columns : 1
										},
										border : false,
										bodyStyle : 'background:transparent;',
										items : [ {
											xtype : 'button',
											text : this.strings.button_about,
											handler : function() {
												this.showHTMLWindow(this.strings.button_about, this.aboutFile);
											},
											tooltip : this.strings.tooltip_button_about,
											scope : this
										}, {
											xtype : 'button',
											text : this.strings.button_help,
											handler : function() {
												this.helpProvider.showHelpWindow();
											},
											tooltip : this.strings.tooltip_button_help,
											scope : this
										} ]

									} ]
						});

						// Panels acting as a kind of placeholder for the actual
						// wfs-ee-attributes-panel. Panels will automatically hide if
						// content is
						// (re)moved
						this.attributesPanelDummyEast = new Ext.Panel({
							layout : 'fit',
							region : 'east',
							width : 300,
							items : [],
							collapsible : true,
							split : true,
							tools : [
									{
										id : 'help',
										qtip : this.strings.tooltip_tool_help,
										handler : function(e, toolEl) {
											this.helpProvider.showHelpTooltip('attributes', toolEl, 'left', 500);
										},
										scope : this
									},
									{
										id : 'restore',
										qtip : this.strings.tooltip_tool_switchposition,
										handler : function(e, toolEl, panel) {
											var targetPanel = panel == this.attributesPanelDummyEast ? this.attributesPanelDummySouth
													: this.attributesPanelDummyEast;
											targetPanel.add(panel.items.getRange());
											// Adding automatically removes components from
											// previous parents
											this.displayPanel.doLayout();
										},
										scope : this
									} ],
							title : this.strings.panel_attributes,
							hidden : true,
							listeners : {
								add : function(comp) {
									comp.show();
								},
								remove : function(comp) {
									if (comp.items.getCount() == 0) {
										comp.hide();
									}
								}
							}
						});

						this.attributesPanelDummySouth = this.attributesPanelDummyEast.cloneConfig({
							region : 'south',
							height : 200,
							items : [ this.attributesPanel ]
						});

						this.displayPanel = new Ext.Panel({
							title : "Malta | Extreme Events Viewer",
							layout : 'border',
							height : this.height,
							width : this.width,
							renderTo : this.renderTo,
							items : [ this.mapPanel, layerPanel, this.attributesPanelDummyEast, this.attributesPanelDummySouth,
									toolbar ],
							plugins : [ 'fittoparent' // plugin to dynamically resize
							]

						});
					},

					/**
					 * Initializes the shared filter to use for event layers. Creates an
					 * object containing all relevant information for temporal filtering
					 * based on fixed attributes EE.Settings.eeBeginAttr and
					 * EE.Settings.eeEndAttr as well as filtering event types by
					 * EE.Settings.eeCategoryAttr, and offering methods and events to set
					 * new intervals and constraints.
					 * 
					 */
					initFilter : function() {
						/**
						 * Simple class to store a Date as reference
						 */
						var DateRef = function() {
							var isoString = "";

							this.setDate = function(date) {
								isoString = OpenLayers.Date.toISOString(date);
							};
							this.toString = function() {
								return isoString;
							};
						};

						var beginRef = new DateRef();
						var endRef = new DateRef();

						var temporalFilter = new OpenLayers.Filter.Logical({
							type : OpenLayers.Filter.Logical.OR,
							filters : [ new OpenLayers.Filter.Comparison({
								type : OpenLayers.Filter.Comparison.BETWEEN,
								property : EE.Settings.eeBeginAttr,
								lowerBoundary : beginRef,
								upperBoundary : endRef
							}), new OpenLayers.Filter.Comparison({
								type : OpenLayers.Filter.Comparison.BETWEEN,
								property : EE.Settings.eeEndAttr,
								lowerBoundary : beginRef,
								upperBoundary : endRef
							}), new OpenLayers.Filter.Logical({
								type : OpenLayers.Filter.Logical.AND,
								filters : [ new OpenLayers.Filter.Comparison({
									type : OpenLayers.Filter.Comparison.LESS_THAN,
									property : EE.Settings.eeBeginAttr,
									value : beginRef
								}), new OpenLayers.Filter.Comparison({
									type : OpenLayers.Filter.Comparison.GREATER_THAN,
									property : EE.Settings.eeEndAttr,
									value : endRef
								}) ]
							}) ]
						});

						var eventTypeComparisons = [];

						var eventTypeFilter = new OpenLayers.Filter.Logical({
							type : OpenLayers.Filter.Logical.OR,
							filters : eventTypeComparisons
						});

						var genericComparisons = [];
						var genericFilter = new OpenLayers.Filter.Logical({
							type : OpenLayers.Filter.Logical.AND,
							filters : genericComparisons
						});

						/**
						 * Function used to set a new temporal interval for the filter
						 */
						var setIntervalFunction = function(begin, end) {
							this.beginRef.setDate(begin);
							this.endRef.setDate(end);
							this.events.triggerEvent("change");
						};

						this.filter = {
							events : null,
							endRef : endRef,
							beginRef : beginRef,
							genericFilterMap : {},
							genericComparisons : genericComparisons,
							eventTypeComparisons : eventTypeComparisons,
							categoryFilterMapping : {},
							setIntervalFunction : setIntervalFunction,
							intervalTask : new Ext.util.DelayedTask(setIntervalFunction),
							setInterval : function(begin, end, noDelay) {
								if (noDelay === true) {
									this.setIntervalFunction.call(this, begin, end);
								} else {
									this.intervalTask.delay(EE.Settings.tempFilterBuffer, undefined, this, [ begin, end ]);
								}
							},
							cancelIntervalUpdate : function() {
								this.intervalTask.cancel();
							},

							setConstraint : function(attribute, comparisonType, value, options) {
								var attributeCache = this.genericFilterMap[attribute];
								if (!attributeCache) {
									this.genericFilterMap[attribute] = attributeCache = {};
								}

								var comparison = attributeCache[comparisonType];
								if (!comparison) {
									comparison = attributeCache[comparisonType] = new OpenLayers.Filter.Comparison(OpenLayers.Util
											.extend({
												type : comparisonType,
												property : attribute
											}, options || {}));
									this.genericComparisons.push(comparison);
								}

								comparison.value = value;
								this.events.triggerEvent('change');
							},

							clearConstraint : function(attribute, comparisonType) {
								var attributeCache = this.genericFilterMap[attribute];
								if (!attributeCache) {
									return;
								}

								if (comparisonType) {
									var comparison = attributeCache[comparisonType];
									if (comparison) {
										this.genericComparisons.splice(this.genericComparisons.indexOf(comparison), 1);
										delete attributeCache[comparisonType];
									}
								} else {
									for ( var type in attributeCache) {
										this.genericComparisons.splice(this.genericComparisons.indexOf(type), 1);
									}
									delete this.genericFilterMap[attribute];
								}

								this.events.triggerEvent('change');
							},

							toggleCategories : function(categories, enabled) {
								for ( var i = 0; i < categories.length; i++) {
									this.toggleCategory(categories[i], enabled, true);
								}
								this.events.triggerEvent('change');
							},

							toggleCategory : function(category, enabled, suppressEvents) {
								if (!enabled) {
									delete this.categoryFilterMapping[category];
								} else {
									var categoryFilter = new OpenLayers.Filter.Comparison({
										type : OpenLayers.Filter.Comparison.EQUAL_TO,
										property : EE.Settings.eeCategoryAttr,
										value : category
									});
									this.categoryFilterMapping[category] = categoryFilter;
								}

								// Clear current eventTypeComparisons
								this.eventTypeComparisons.length = 0;

								for ( var key in this.categoryFilterMapping) {
									this.eventTypeComparisons.push(this.categoryFilterMapping[key]);
								}
								this.events.triggerEvent('categorychange', {
									category : category,
									enabled : enabled
								});
								if (suppressEvents !== true) {
									this.events.triggerEvent('change');
								}
							},
							enableSingleCategory : function(category) {

								// Notify all buttons
								for ( var key in this.categoryFilterMapping) {
									this.events.triggerEvent('categorychange', {
										category : key,
										enabled : false
									});
								}
								// reset categories
								this.categoryFilterMapping = {};

								// select single category
								this.toggleCategory(category, true);
							},
							filter : new OpenLayers.Filter.Logical({
								type : OpenLayers.Filter.Logical.AND,
								filters : [ temporalFilter, eventTypeFilter, genericFilter ]
							})
						};
						this.filter.events = new OpenLayers.Events(this.filter);
					},

					initMap : function() {
						this.map = new OpenLayers.Map({
							projection : 'EPSG:3857',
							controls : [ new OpenLayers.Control.ScaleLine(), new OpenLayers.Control.Zoom(),
									new OpenLayers.Control.Navigation({
										dragPanOptions : {
											enableKinetic : true,
											documentDrag : true
										}
									}), new OpenLayers.Control.Attribution() ]
						});

						for ( var i = 0; i < EE.Settings.baseLayers.length; i++) {
							EE.Settings.baseLayers[i].isBaseLayer = true;
						}
						this.map.addLayers(EE.Settings.baseLayers);
						this.map.addLayers(EE.Settings.overlayLayers);
					},

					/**
					 * Shows window with statistics of currently selected features
					 */
					showStatisticsWindow : function() {
						if (this.statisticsWindow) {
							this.statisticsWindow.show();
							return;
						}

						var roundFunc = function(value) {
							if (value == null) {
								return value;
							}
							var placesFac = Math.pow(10, EE.Settings.numDecimalPlaces);
							return Math.round(value * placesFac) / placesFac;
						};

						var statisticsColumns = [ {
							header : this.strings.statistics_attribute,
							dataIndex : 'attribute',
							sortable : true,
							valueFromStatisticsHolder : function(holder) {
								var name = holder.getName();
								return EE.Settings.eeWfsAttributeMapping[name].title || name;
							}
						}, {
							header : this.strings.statistics_mean,
							dataIndex : 'mean',
							sortable : true,
							valueFromStatisticsHolder : function(holder) {
								return roundFunc(holder.getMean());
							}
						}, {
							header : this.strings.statistics_median,
							dataIndex : 'median',
							sortable : true,
							valueFromStatisticsHolder : function(holder) {
								return roundFunc(holder.getMedian());
							}
						}, {
							header : this.strings.statistics_sd,
							dataIndex : 'sd',
							sortable : true,
							valueFromStatisticsHolder : function(holder) {
								return roundFunc(holder.getSD());
							}
						}, {
							header : this.strings.statistics_min,
							dataIndex : 'min',
							sortable : true,
							valueFromStatisticsHolder : function(holder) {
								return roundFunc(holder.getMin());
							}
						}, {
							header : this.strings.statistics_max,
							dataIndex : 'max',
							sortable : true,
							valueFromStatisticsHolder : function(holder) {
								return roundFunc(holder.getMax());
							}
						}, {
							header : this.strings.statistics_mode,
							dataIndex : 'mode',
							sortable : true,
							valueFromStatisticsHolder : function(holder) {
								if (holder.getMode() != null) {
									return holder.getMode() + ' (' + roundFunc(holder.getModeProbability() * 100) + ' %)';
								} else
									return null;
							}
						} ];

						var statisticsStore = new Ext.data.ArrayStore({
							fields : Ext.pluck(statisticsColumns, 'dataIndex').concat([ 'holder' ]),
							data : [],
							idIndex : 0
						});

						var selectionCountLabel = new Ext.form.Label({
							text : ''
						});

						var plotPanel = null;
						var plotPanelWrapperPanel = new Ext.Panel({
							title : 'Chart',
							layout : 'fit',
							region : 'east',
							width : 200,
							collapsible : true,
							split : true,
							collapsed : false,
							listeners : {
								expand : function(comp) {
									var minWidthOwner = comp.getWidth() + 400;
									if (comp.ownerCt.getWidth() < minWidthOwner) {
										comp.ownerCt.setWidth(minWidthOwner);
									}
								}
							},
							html : '<p class="x-grid-empty">' + this.strings.info_nostatisticsselected + '</p>'
						});

						var statisticsGrid = new Ext.grid.GridPanel({
							region : 'center',
							store : statisticsStore,
							columns : statisticsColumns,
							sm : new Ext.grid.RowSelectionModel({
								singleSelect : true
							}),
							viewConfig : {
								// Configs for GridView
								forceFit : true,
								emptyText : this.strings.info_noselection,
								deferEmptyText : false
							},
							bbar : [ '->', {
								xtype : 'label',
								text : this.strings.info_numselectedfeatures
							}, selectionCountLabel ],
							listeners : {
								rowclick : function(comp, rowIndex, e) {
									var record = comp.getStore().getAt(rowIndex);
									if (record == null) {
										return;
									}
									var holder = record.data.holder;

									if (plotPanel != null) {
										plotPanel.destroy();
									}

									plotPanel = holder.getPlotPanel();
									plotPanelWrapperPanel.add(plotPanel);
									plotPanelWrapperPanel.doLayout();
									plotPanelWrapperPanel.expand();

								}
							}
						});

						var statisticsHolders = {};
						for ( var i = 0; i < this.statisticsAttributes.length; i++) {
							var attr = this.statisticsAttributes[i];
							statisticsHolders[attr.name] = attr.type == 'string' ? new EE.StatisticsHolder.Categorical(attr.name)
									: new EE.StatisticsHolder.Numeric(attr.name);
						}

						/**
						 * Handler for selection event, updates statistics data
						 */
						var selectionChangeHandler = function(sm) {
							if (!this.statisticsAttributes) {
								return;
							}
							var selRecords = sm.getSelections();
							selectionCountLabel.setText(selRecords.length);

							for ( var name in statisticsHolders) {
								statisticsHolders[name].reset();
							}

							if (selRecords.length == 0) {
								statisticsStore.loadData([]);

								if (plotPanel != null) {
									plotPanel.replot(true);
								}
								return;
							}

							for ( var i = 0; i < selRecords.length; i++) {
								for ( var name in statisticsHolders) {
									statisticsHolders[name].addValue(selRecords[i].data[name]);
								}
							}

							if (plotPanel != null) {
								plotPanel.replot(true);
							}

							var statisticsData = [], record;
							for ( var name in statisticsHolders) {
								record = [];
								for ( var i = 0; i < statisticsColumns.length; i++) {
									record.push(statisticsColumns[i].valueFromStatisticsHolder(statisticsHolders[name]));
								}
								record.push(statisticsHolders[name]);
								statisticsData.push(record);
							}
							statisticsStore.loadData(statisticsData);

						};

						this.statisticsWindow = new Ext.Window({
							layout : 'border',
							constrainHeader : true,
							title : this.strings.window_statistics,
							width : 500,
							height : 300,
							items : [ statisticsGrid, plotPanelWrapperPanel ],
							closeAction : 'hide',
							listeners : {
								show : function() {
									// Register for selection events
									this.featureGrid.getSelectionModel().on('selectionchange', selectionChangeHandler, this, {
										buffer : 500
									});

									// Update statistics
									selectionChangeHandler.call(this, this.featureGrid.getSelectionModel());
								},
								hide : function() {
									// Unregister selection events
									this.featureGrid.getSelectionModel().un('selectionchange', selectionChangeHandler, this);
								},
								scope : this
							}
						});

						this.statisticsWindow.show();

					},

					showHTMLWindow : function(title, url) {
						new Ext.Window({
							layout : 'fit',
							constrainHeader : true,
							title : title,
							width : 500,
							height : 500,
							items : [ {
								xtype : 'panel',
								autoScroll : true,
								autoLoad : {
									url : url
								},
								preventBodyReset : true,
								style : {
									background : 'white'
								}
							} ]
						}).show();
					},

					/**
					 * Shows all attributes of a feature in a popup
					 * 
					 * @param feature
					 */
					showFeatureDetails : function(feature) {
						var items = [];
						var attributes = feature.attributes;

						for ( var attributeName in attributes) {
							items
									.push({
										xtype : 'label',
										fieldLabel : (EE.Settings.eeWfsAttributeMapping[attributeName] ? EE.Settings.eeWfsAttributeMapping[attributeName].title
												: null)
												|| attributeName,
										text : attributes[attributeName]
									});
						}

						items.push({
							xtype : 'button',
							text : this.strings.context_createreport,
							iconCls : 'icon-acrobat',
							handler : function() {
								this.downloadReport(feature);
							},
							scope : this
						});

						new Ext.Window({
							layout : 'fit',
							constrainHeader : true,
							title : this.strings.window_featuredetails + ' ' + feature.fid || '',
							width : 350,
							height : 400,
							items : [ {
								padding : 10,
								xtype : 'form',
								autoScroll : true,
								items : items
							} ]
						}).show();
					},

					downloadReport : function(feature) {
						var report = new EE.Report(feature);
						report.getPDFDoc(function(doc) {
							var featureID = EE.Settings.eeWfsId;
							var filename = 'Report_' + (feature.attributes[featureID] || '') + '_' + (feature.fid || '') + '.pdf';
							if (Ext.isChrome) {
								// directly open when using Chrome, no problems expected, saves
								// one click
								doc.save(filename);
							} else {
								// Use downloadify for all other browsers
								this.showDownloadifyWindow({
									filename : filename,
									data : doc.output(),
									message : 'Export of "' + filename + '"'
								});
							}
						}, this);
					},

					/**
					 * Shows a window with the Downloadify Flash object. Configuration
					 * parameters are 'data' for the actual string to store in the file
					 * with the name 'filename', as well as 'title' for the title of this
					 * window
					 */
					showDownloadifyWindow : function(options) {

						var downloadifyButton = new Ext.Container({
							width : 59,
							height : 24,
							listeners : {
								render : function(comp) {
									Downloadify.create(comp.getEl().dom, {
										filename : options.filename || 'download.dat',
										data : function() {
											// Feature detection, not all browsers have btoa, use
											// external implementation instead
											if (!window.btoa) {
												window.btoa = base64.encode;
											}
											// encode as base64, since downloadify seems to have
											// problems with encoded image data in pdf
											return btoa(options.data) || '';
										},
										onComplete : function() {
											Ext.MessageBox.alert(this.strings.message_heading_success, this.strings.message_exportsuccess);

										},
										onError : function() {
											Ext.MessageBox.alert(this.strings.message_heading_error, this.strings.message_exporterror);
										},
										swf : 'jsPDF/Downloadify/downloadify.swf',
										downloadImage : 'EE/resources/images/downloadifyButton.png',
										width : 59,
										height : 24,
										transparent : true,
										append : false,
										strings : this.strings,
										dataType : 'base64' // Since there seem to be problems with
									// the encoded image data in pdf stream
									});
								},
								scope : this
							}
						});

						new Ext.Window({
							layout : {
								type : 'vbox',
								align : 'stretch',
								pack : 'start'
							},
							constrainHeader : true,
							title : options.title || this.strings.window_export,
							width : 250,
							height : 150,
							items : [ {
								flex : 1,
								html : options.message || '',
								border : false,
								bodyStyle : 'background:transparent;',
								padding : 10
							}, {
								flex : 1,
								layout : {
									type : 'hbox',
									pack : 'center',
									align : 'stretch'
								},
								border : false,
								bodyStyle : 'background:transparent;',
								items : [ downloadifyButton ]
							} ]
						}).show();

					}

				// ,
				//
				// exportEvents : function(features, format) {
				// format = format || OpenLayers.Format.WKT;
				// format = new format({
				// 'maxDepth' : 10,
				// 'extractStyles' : true,
				// 'internalProjection' : this.map.baseLayer.projection,
				// 'externalProjection' : new OpenLayers.Projection("EPSG:4326")
				// });
				//
				// if (!features.length) {
				// features = [ features ];
				// }
				// this.showDownloadifyWindow({
				// data : format.write(features)
				// });
				// }
				});
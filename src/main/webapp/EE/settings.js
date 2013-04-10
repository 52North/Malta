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
Ext.namespace("EE.Settings");

// Base layers, automatically setting isBaseLayer config option to true
// Find more WMS Layers at http://www.mapmatters.org
EE.Settings.baseLayers = [
		new OpenLayers.Layer.OSM(null, null, {}),
		new OpenLayers.Layer.WMS("Blue Marble",
				"http://demo.mapserver.org/cgi-bin/wms?", {
					layers : "BlueMarble",
					format : "image/png",
					transparent : true
				}, {}), new OpenLayers.Layer("Blank", {
			isBaseLayer : true,
			projection : OpenLayers.Projection("EPSG:3857")
		}) ];

EE.Settings.center = [ 8.747997, 50.103343 ]; // LonLat
EE.Settings.zoom = 3;

// default temporal interval
EE.Settings.begin = new Date();
EE.Settings.begin.setFullYear(EE.Settings.begin.getFullYear() - 2);
// Today minus 2 years

EE.Settings.end = new Date(); // Today
EE.Settings.intervalStepMonths = 6;

// Buffer in milliseconds to wait before updating the temporal filter. Further
// filter interactions within this temporal buffer will reset the timeout.
EE.Settings.tempFilterBuffer = 1500;

// WFS layers for EE types
EE.Settings.eeWfsUrl = "http://my-service/.../wfs?";

EE.Settings.eeWfsNamespace = "<namespace>";
EE.Settings.eeFeatureTypes = [ "<namespace>:<featureTypeA>",
		"<namespace>:<featureTypeB>", "<namespace>:<featureTypeC>" ];

EE.Settings.eeWfsUrl = "http://services.eule-gdi.de/geoserver/DWD_PWD/wfs?";

EE.Settings.eeWfsNamespace = "dwd_pwd";
EE.Settings.eeFeatureTypes = [ "DWD_PWD:ee_rpoint", "DWD_PWD:ee_rline",
		"DWD_PWD:ee_rpol" ];

// Attribute name currently used to identify objects e.g. for report name
// generation and for feature store queries
EE.Settings.eeWfsId = "ee_id";

// Attribute name to use for category/type negotiation
EE.Settings.eeCategoryAttr = "ee_cat";

// Attributes for temporal extent
EE.Settings.eeBeginAttr = "ee_beg";
EE.Settings.eeEndAttr = "ee_end";

// Categories/event types. Key corresponds to value of eeCategoryAttr
EE.Settings.eeCats = {
	'Wildfire' : {
		title : 'Wildfire', // for localization
		style : { // extends defaultFeatureStyle
			strokeColor : '#A52A2A', // brown, use hex values for ful browser
			// support
			fillColor : '#A52A2A'
		}
	},
	'Rainfall' : {
		title : 'Rainfall',
		style : {
			strokeColor : '#00FFFF', // cyan
			fillColor : '#00FFFF'
		}
	},
	'Storm' : {
		title : 'Storm',
		style : {
			strokeColor : '#800080', // purple
			fillColor : '#800080'
		}
	},
	'Cold' : {
		title : 'Cold',
		style : {
			strokeColor : '#0000FF', // blue
			fillColor : '#0000FF'
		}
	},
	'Heat' : {
		title : 'Heat',
		style : {
			strokeColor : '#FF0000', // red
			fillColor : '#FF0000'
		}
	},
	'Flood' : {
		title : 'Flood',
		style : {
			strokeColor : '#008000', // green
			fillColor : '#008000'
		}
	},
	'Drought' : {
		title : 'Drought',
		style : {
			strokeColor : '#FFA500', // orange
			fillColor : '#FFA500'
		}
	},
	'Landslide' : {
		title : 'Landslide',
		style : {
			strokeColor : '#DEB887', // burly wood
			fillColor : '#DEB887'
		}
	},
	'Snowslide' : {
		title : 'Snowslide',
		style : {
			strokeColor : '#D3D3D3 ', // light gray
			fillColor : '#D3D3D3 '
		}
	}
};

EE.Settings.defaultFeatureStyle = {
	pointRadius : 10,
	fillOpacity : 0.5,
	strokeOpacity : 0.8,
	strokeWidth : 2,
	strokeColor : 'none',
	strokeDashstyle : 'solid'
};

EE.Settings.selectedFeatureStyle = {
	strokeColor : 'gray',
	strokeWidth : 5,
	strokeDashstyle : 'dash'
};

// Human readable attribute names
EE.Settings.eeWfsAttributeMapping = {
	'ee_id' : {
		title : 'Identifier', // Text to show as header of table column
		sortIndex : 1
	// 1- based index for ordering the columns, lowest index first, highest
	// last.
	// Unset indices are set automatically beginnging with index 20.
	},
	'ee_cat' : {
		title : 'Category'
	},
	'ee_beg' : {
		title : 'Begin',
		sortIndex : 10
	},
	'ee_end' : {
		title : 'End',
		sortIndex : 11
	},
	'ee_descr' : {
		title : 'Description'
	},
	'ee_country' : {
		title : 'Country',
		sortIndex : 20
	},
	'ee_dur' : {
		title : 'Duration (days)',
		sortIndex : 21
	},
	'ee_death' : {
		title : '# Killed (Estimated number of killed people)'
	},
	'ee_displ' : {
		title : '# Displaced (Estimated number of displaced people)'
	},
	'ee_damg' : {
		title : 'Damage (USD, estimated)'
	},
	'ee_cyacy' : {
		title : 'Cyclone, Anticyclone'
	},
	'ee_ccode' : {
		title : 'Country Code (ISO)',
		sortIndex : 30
	},
	'ee_afreg' : {
		title : 'Affected  regions',
		sortIndex : 31
	},
	'ee_lupd' : {
		title : 'Last update',
		sortIndex : 40
	},
	'ee_updby' : {
		title : 'Updated by (institution)',
		hidden : true, // Initially hides a column
		sortIndex : 41
	// Highest index, even higher than auto-generated indices -> last column
	},
	'ee_aidef' : {
		title : 'Area of interest (definition of extent)',
		hidden : true
	},
	'ee_fkey' : {
		title : 'Foreign key in source dataset',
		hidden : true
	},
	'ee_glide' : {
		title : 'Glide-ID',
		hidden : true
	},
	'ee_aoisrcid' : {
		title : 'Source of geometry',
		hidden : true
	},
	'ee_srcid' : {
		title : 'Origin of event',
		sortIndex : 3
	},
	'src_cat' : {
		title : 'Category in source dataset',
		hidden : true
	},
	'ee_rgid' : {
		title : 'Reference Geometry ID',
		hidden : true
	},
	'EE_SYSBOOL' : {
		title : 'Systematic Collection',
		booleanTrueValue : '1',
		booleanUndefinedValue : '',
		sortIndex : 2
	}
};

// Settings for attributes to use in statistics. Automatically uses all numeric
// attributes as described by the WFS, categorical attributes have to be defined
// explicitly
EE.Settings.includeInStatistics = [ 'ee_cat' ];
EE.Settings.excludeFromStatistics = [ 'ee_rgid' ];

EE.Settings.numDecimalPlaces = 3;

// Regular OpenLayers Layers to add to the map
// See http://www.mapmatters.org or http://geopole.org/ for more!
EE.Settings.overlayLayers = [
		// background overlays
		new OpenLayers.Layer.WMS("Countries",
				"http://geoportal.logcluster.org:8081/gp_map_service201/wms?",
				{
					layers : "SDI-Countries",
					format : "image/png",
					transparent : true
				}, {
					visibility : false
				}),
		new OpenLayers.Layer.WMS("Rivers",
				"http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/forecasts?",
				{
					layers : "world_rivers",
					format : "image/png",
					transparent : true
				}, {
					visibility : false
				}),
		new OpenLayers.Layer.WMS("Lakes",
				"http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/forecasts?",
				{
					layers : "world_lakes",
					format : "image/png",
					transparent : true
				}, {
					visibility : false
				}) ];

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
EE.Settings.baseLayers = [ new OpenLayers.Layer.OSM(null, null, {}),
		new OpenLayers.Layer.WMS("Blue Marble", "http://demo.mapserver.org/cgi-bin/wms?", {
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
EE.Settings.eeWfsNamespacePrefix = "<namespace prefix>";
EE.Settings.eeFeatureTypes = [ "<namespace>:<featureTypeA>", "<namespace>:<featureTypeB>", "<namespace>:<featureTypeC>" ];

// Attribute name currently used to identify objects e.g. for report name
// generation and for feature store queries
EE.Settings.eeWfsId = "EE_ID";

// Attribute name to use for category/type negotiation
EE.Settings.eeCategoryAttr = "EE_CAT";

// Attributes for temporal extent
EE.Settings.eeBeginAttr = "EE_BEG";
EE.Settings.eeEndAttr = "EE_END";

// Format to use to parse date values from WFS; Defaults to ISO 8601 Date;
// See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for examples.
// EE.Settings.eeDateFormatOverride = "Y-m-d\\Z";

// Date Format to use to display date columns in attributes table; Defaults to
// "Y-m-d";
// See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for examples.
// EE.Settings.eeDateFormatDisplayOverride = "Y-m-d";

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
	'EE_ID' : {
		title : 'Identifier', // Text to show as header of table column
		sortIndex : 1
	// 1- based index for ordering the columns, lowest index first, highest
	// last.
	// Unset indices are set automatically beginnging with index 20.
	},
	'EE_CAT' : {
		title : 'Category'
	},
	'EE_BEG' : {
		title : 'Begin',
		sortIndex : 10
	},
	'EE_END' : {
		title : 'End',
		sortIndex : 11
	},
	'EE_DESCR' : {
		title : 'Description'
	},
	'EE_COUNTRY' : {
		title : 'Country',
		sortIndex : 20
	},
	'EE_DUR' : {
		title : 'Duration (days)',
		sortIndex : 21
	},
	'EE_DEATH' : {
		title : '# Killed (Estimated number of killed people)'
	},
	'EE_DISPL' : {
		title : '# Displaced (Estimated number of displaced people)'
	},
	'EE_DAMG' : {
		title : 'Damage (USD, estimated)'
	},
	'EE_CYACY' : {
		title : 'Cyclone, Anticyclone'
	},
	'EE_CCODE' : {
		title : 'Country Code (ISO)',
		sortIndex : 30
	},
	'EE_AFREG' : {
		title : 'Affected  regions',
		sortIndex : 31
	},
	'EE_LUPD' : {
		title : 'Last update',
		sortIndex : 40
	},
	'EE_UPDBY' : {
		title : 'Updated by (institution)',
		hidden : true, // Initially hides a column
		sortIndex : 41
	// Highest index, even higher than auto-generated indices -> last column
	},
	'EE_AIDEF' : {
		title : 'Area of interest (definition of extent)',
		hidden : true
	},
	'EE_FKEY' : {
		title : 'Foreign key in source dataset',
		hidden : true
	},
	'EE_GLIDE' : {
		title : 'Glide-ID',
		hidden : true
	},
	'EE_AOISRCID' : {
		title : 'Source of geometry',
		hidden : true
	},
	'EE_SRCID' : {
		title : 'Origin of event',
		sortIndex : 3
	},
	'SRC_CAT' : {
		title : 'Category in source dataset',
		hidden : true
	},
	'EE_RGID' : {
		title : 'Reference Geometry ID',
		hidden : true
	},
	'EE_SYSBOOL' : {
		title : 'Systematic Collection',
		booleanTrueValue : '1',
		booleanUndefinedValue : '',
		sortIndex : 2
	},
	'EE_GTYPE' : {
		title: 'Geometry type',
		hidden : true
	},
	'EE_CLIMCMT' : {
		title: 'Comment',
		hidden : true
	}
};

// Settings for attributes to use in statistics. Automatically uses all numeric
// attributes as described by the WFS, categorical attributes have to be defined
// explicitly
EE.Settings.includeInStatistics = [ 'EE_CAT' ];
EE.Settings.excludeFromStatistics = [ 'EE_RGID' ];

EE.Settings.numDecimalPlaces = 3;

// Regular OpenLayers Layers to add to the map
// See http://www.mapmatters.org or http://geopole.org/ for more!
EE.Settings.overlayLayers = [
// background overlays
new OpenLayers.Layer.WMS("Countries", "http://geoportal.logcluster.org:8081/gp_map_service201/wms?", {
	layers : "SDI-Countries",
	format : "image/png",
	transparent : true
}, {
	visibility : false
}), new OpenLayers.Layer.WMS("Rivers", "http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/forecasts?", {
	layers : "world_rivers",
	format : "image/png",
	transparent : true
}, {
	visibility : false
}), new OpenLayers.Layer.WMS("Lakes", "http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/forecasts?", {
	layers : "world_lakes",
	format : "image/png",
	transparent : true
}, {
	visibility : false
}) ];

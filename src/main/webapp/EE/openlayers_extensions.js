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
/**
 * Based on/copies OpenLayers.Format.WFST.v1_0_0 and
 * OpenLayers.Format.WFST.v1_1_0 with some changed details for allowing multiple
 * geometry names in the same way as multiple feature types are supported
 * 
 * Used as WFS protocol filter if there are different geometry names among the
 * different EE feature types
 */
OpenLayers.Format.WFST.v1_1_0_multigeometrynames = OpenLayers.Class(OpenLayers.Format.WFST.v1_1_0, {

	writers : OpenLayers.Util.applyDefaults({
		"wfs" : OpenLayers.Util.applyDefaults({
			"GetFeature" : function(options) {
				var node = this.createElementNSPlus("wfs:GetFeature", {
					attributes : {
						service : "WFS",
						version : "1.1.0",
						handle : options && options.handle,
						outputFormat : options && options.outputFormat,
						maxFeatures : options && options.maxFeatures,
						"xsi:schemaLocation" : this.schemaLocationAttr(options)
					}
				});
				if (typeof this.featureType == "string") {
					this.writeNode("Query", options, node);
				} else {
					for ( var i = 0, len = this.featureType.length; i < len; i++) {
						options.featureType = this.featureType[i];
						options.geometryName = this.geometryName[i];
						this.writeNode("Query", options, node);
					}
				}

				options && this.setAttributes(node, {
					resultType : options.resultType,
					startIndex : options.startIndex,
					count : options.count
				});
				return node;
			},
			"Query" : function(options) {
				if (options.filter) {
					options.filter._geometryName = options.geometryName;
				}
				options = OpenLayers.Util.extend({
					featureNS : this.featureNS,
					featurePrefix : this.featurePrefix,
					featureType : this.featureType,
					srsName : this.srsName
				}, options);
				var prefix = options.featurePrefix;
				var node = this.createElementNSPlus("wfs:Query", {
					attributes : {
						typeName : (prefix ? prefix + ":" : "") + options.featureType,
						srsName : options.srsName
					}
				});
				if (options.featureNS) {
					node.setAttribute("xmlns:" + prefix, options.featureNS);
				}
				if (options.propertyNames) {
					for ( var i = 0, len = options.propertyNames.length; i < len; i++) {
						this.writeNode("wfs:PropertyName", {
							property : options.propertyNames[i]
						}, node);
					}
				}
				if (options.filter) {
					this.setFilterProperty.call(this, options.filter);
					this.writeNode("ogc:Filter", options.filter, node);
				}
				return node;

			}
		}, OpenLayers.Format.WFST.v1_1_0.prototype.writers["wfs"])
	}, OpenLayers.Format.WFST.v1_1_0.prototype.writers),

	setFilterProperty : function(filter, geometryName) {
		geometryName = geometryName || filter._geometryName;
		if (filter.filters) {
			for ( var i = 0, len = filter.filters.length; i < len; ++i) {
				this.setFilterProperty.call(this, filter.filters[i], geometryName);
			}
		} else {
			if (filter instanceof OpenLayers.Filter.Spatial && (!filter.property || filter.multigeometryhint)) {
				// got a spatial filter without property, so set it
				filter.property = geometryName;
				filter.multigeometryhint = true;
			}
		}
	}
});

OpenLayers.Format.Filter.v1_1_0.prototype.writers.ogc.PropertyIsNull = function(filter) {
	var node = this.createElementNSPlus("ogc:PropertyIsNull");
	this.writeNode("PropertyName", filter, node);
	return node;
};
OpenLayers.Format.Filter.v1_1_0.prototype.filterMap['NULL'] = 'PropertyIsNull';

OpenLayers.EE = OpenLayers.EE || {};
OpenLayers.EE.Strategy = OpenLayers.EE.Strategy || {};

/**
 * Extension of BBOX Strategy to also query for empty geometries. Overrides
 * Filter format to support PropertyIsNull filter, which is not part of OL 2.12
 */
OpenLayers.EE.Strategy.BBOX = OpenLayers.Class(OpenLayers.Strategy.BBOX, {

	createFilter : function() {
		var filter = new OpenLayers.Filter.Spatial({
			type : OpenLayers.Filter.Spatial.BBOX,
			value : this.bounds,
			projection : this.layer.projection
		});

		// Using Filter.Spatial ensures that geometry attribute will be set as
		// filter property by protocol format
		var filterNoGeometry = new OpenLayers.Filter.Spatial({
			type : 'NULL'
		});

		filter = new OpenLayers.Filter.Logical({
			type : OpenLayers.Filter.Logical.OR,
			filters : [ filter, filterNoGeometry ]
		});

		if (this.layer.filter) {
			filter = new OpenLayers.Filter.Logical({
				type : OpenLayers.Filter.Logical.AND,
				filters : [ this.layer.filter, filter ]
			});
		}
		return filter;
	},

	/**
	 * Override to ensure that features without geometry report that they were
	 * invisible to exclude them from operations requiring geometries
	 */
	merge : function(resp) {
		if (resp.features) {
			var features = resp.features;

			var returnFalseFunc = function() {
				return false;
			};
			for ( var i = 0, len = features.length; i < len; i++) {
				if (features[i].geometry == null) {
					// set getVisibility function to always return false
					features[i].getVisibility = returnFalseFunc;
				}
			}
		}

		OpenLayers.Strategy.BBOX.prototype.merge.call(this, resp);
	}

});

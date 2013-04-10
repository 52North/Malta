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
Ext.namespace("EE");

/**
 * Class to create a pdf report for a specific feature
 */
// TODO externalize wfs attribute names
EE.Report = Ext.extend(Object,
		{
			feature : null,

			// Dimensions in cm
			leftMargin : null,
			rightMargin : null,
			leftIdent : null,
			logoWidth : null,
			logoHeight : null,

			logoUrl : 'EE/resources/images/reportlogo.jpg',

			strings : {
				no_value : 'No Value',
				header : 'Created by Malta | Extreme Events Viewer',
				title : 'Report about extreme weather and climate events',
				caption_event : 'Event',
				caption_id : 'Id',
				caption_date : 'Date, time period',
				caption_location : 'Location',
				caption_affectedcountry : 'Affected Country',
				caption_affectedregions : 'Affected Regions',
				caption_description : 'Description of the event',
				caption_impacts : 'Impacts, known damages',
				caption_fatalities : 'Fatalities',
				caption_origin : 'Data origin',
				caption_geomsource : 'Source of geometry',
				caption_authors : 'Authors',
				caption_lastupdate : 'Last update',
				unit_damage : 'USD estimated damage',
				unit_displaced : 'displaced people (estimated)',
				unit_killed : 'killed people (estimated)',
				properties_title : 'Extreme Events Report'
			},

			constructor : function(feature, config) {
				this.feature = feature;
				this.leftMargin = 2;
				this.rightMargin = 2;
				this.leftIdent = 0.3;

				this.logoWidth = 6.03;
				this.logoHeight = 3;
				Ext.apply(this, config || {});
			},

			getBinaryImageDataFromUrl : function(url, callback, scope) {
				var img = new Image();

				img.onError = function() {
					callback.call(scope || this, null);
					// throw new Error('Unable to load ' + url);
				};
				img.onload = function() {
					var canvas = document.createElement('canvas');
					document.body.appendChild(canvas);
					canvas.width = img.width;
					canvas.height = img.height;

					if (!canvas.getContext) {
						// IE <8
						callback.call(scope || this, null);
					} else {
						var ctx = canvas.getContext('2d');
						ctx.drawImage(img, 0, 0);
						// use data url, ignore beginning ('data:image/jpeg;base64,', 23
						// chars)
						data = canvas.toDataURL('image/jpeg').slice(23);
						data = atob(data);
						document.body.removeChild(canvas);

						callback.call(scope || this, data);
					}
				};
				img.src = url;
			},

			getPDFDoc : function(callback, scope) {

				var imageCallback = function(binaryImgData) {
					var doc = new jsPDF('p', 'cm', 'a4');
					var maxTextWidth = 21.7 - this.rightMargin - this.leftMargin - this.leftIdent;
					var attributes = this.feature.attributes;

					// Metadata
					doc.setFont('times', 'normal').setFontSize(8);
					doc.text(this.leftMargin, 1, doc.splitTextToSize(this.strings.header + ', ' + new Date().toUTCString(),
							maxTextWidth));

					// Title
					doc.setFont('times', 'bold').setFontSize(14);
					doc.text(this.leftMargin + this.logoWidth + 1.5, 4, doc.splitTextToSize(this.strings.title,
							maxTextWidth - this.logoWidth - 1.5));

					if (binaryImgData) {
						doc.addImage(binaryImgData, 'JPEG', this.leftMargin, 1.5, this.logoWidth, this.logoHeight);
					}

					var captionFont = function() {
						doc.setFont('times', 'bold').setFontSize(12);
					};
					var normalFont = function() {
						doc.setFont('times', 'normal').setFontSize(10);
					};

					var vOffset = 6;
					// Event
					captionFont();
					doc.text(this.leftMargin, vOffset, doc.splitTextToSize(this.strings.caption_event, maxTextWidth));
					normalFont();
					doc.text(this.leftMargin + this.leftIdent, vOffset + 0.5, doc.splitTextToSize(attributes['ee_cat']
							|| this.strings.no_value, maxTextWidth - 3));

					// Id
					captionFont();
					doc.text(this.leftMargin + maxTextWidth - 3, vOffset, doc.splitTextToSize(this.strings.caption_id,
							maxTextWidth));
					normalFont();
					doc.text(this.leftMargin + this.leftIdent + maxTextWidth - 3, vOffset + 0.5, doc.splitTextToSize(
							attributes['ee_id'] || this.strings.no_value, 2.5));
					vOffset += 1.5;

					// Date Time
					captionFont();
					doc.text(this.leftMargin, vOffset, doc.splitTextToSize(this.strings.caption_date, maxTextWidth));
					var dateText = attributes[EE.Settings.eeBeginAttr] + ' - ' + attributes[EE.Settings.eeEndAttr] + ', '
							+ attributes['ee_dur'] + ' days';
					normalFont();
					doc.text(this.leftMargin + this.leftIdent, vOffset + 0.5, doc.splitTextToSize(dateText, maxTextWidth));
					vOffset += 1.5;

					// // Location
					// captionFont();
					// doc.text(this.leftMargin, vOffset,
					// doc.splitTextToSize(this.strings.caption_location, maxTextWidth));
					// normalFont();
					// doc.text(this.leftMargin + this.leftIdent, vOffset + 0.5,
					// doc.splitTextToSize('ToDo', maxTextWidth));
					// vOffset += 1.5;

					// Affected Country
					captionFont();
					doc.text(this.leftMargin, vOffset, doc.splitTextToSize(this.strings.caption_affectedcountry, maxTextWidth));
					var affCountryText = attributes['ee_country'] + ' (' + attributes['ee_ccode'] + ')';
					normalFont();
					doc.text(this.leftMargin + this.leftIdent, vOffset + 0.5, doc.splitTextToSize(affCountryText, maxTextWidth));
					vOffset += 1.5;

					// Affected Regions
					captionFont();
					doc.text(this.leftMargin, vOffset, doc.splitTextToSize(this.strings.caption_affectedregions, maxTextWidth));
					normalFont();
					doc.text(this.leftMargin + this.leftIdent, vOffset + 0.5, doc.splitTextToSize(attributes['ee_afreg']
							|| this.strings.no_value, maxTextWidth));
					vOffset += 1.5;

					// Description
					captionFont();
					doc.text(this.leftMargin, vOffset, doc.splitTextToSize(this.strings.caption_description, maxTextWidth));
					normalFont();
					var lines = doc.splitTextToSize(attributes['ee_descr'] || this.strings.no_value, maxTextWidth);
					doc.text(this.leftMargin + this.leftIdent, vOffset + 0.5, lines);
					vOffset += ((lines.length * 12) / 72) * 2.54 + 1.5;

					// Impacts, known damages
					captionFont();
					var tempOffset = vOffset;
					doc.text(this.leftMargin, vOffset, doc.splitTextToSize(this.strings.caption_impacts, maxTextWidth / 2));
					vOffset += 0.5;
					normalFont();
					if (attributes['ee_damg']) {
						doc.text(this.leftMargin + this.leftIdent, vOffset, doc.splitTextToSize(attributes['ee_damg'] + ' '
								+ this.strings.unit_damage, maxTextWidth / 2));
						vOffset += 0.5;
					}
					if (attributes['ee_displ']) {
						doc.text(this.leftMargin + this.leftIdent, vOffset, doc.splitTextToSize(attributes['ee_displ'] + ' '
								+ this.strings.unit_displaced, maxTextWidth / 2));
					}
					vOffset = tempOffset;

					// Fatalities
					captionFont();
					doc.text(this.leftMargin + maxTextWidth / 2, vOffset, doc.splitTextToSize(this.strings.caption_fatalities,
							maxTextWidth / 2));
					normalFont();
					if (attributes['ee_death']) {
						doc.text(this.leftMargin + this.leftIdent + maxTextWidth / 2, vOffset + 0.5, doc.splitTextToSize(
								attributes['ee_death'] + ' ' + this.strings.unit_killed, maxTextWidth / 2));
					}
					vOffset = Math.max(tempOffset, vOffset);

					vOffset += 1.5;

					// Origin and geometry source
					captionFont();
					doc.text(this.leftMargin, vOffset, doc.splitTextToSize(this.strings.caption_origin, maxTextWidth));
					normalFont();
					doc.text(this.leftMargin + this.leftIdent, vOffset + 0.5, doc.splitTextToSize(attributes['ee_srcid']
							|| this.strings.no_value, maxTextWidth));

					if (attributes['ee_aoisrcid']) {
						captionFont();
						doc.text(this.leftMargin + maxTextWidth / 2, vOffset, doc.splitTextToSize(this.strings.caption_geomsource,
								maxTextWidth / 2));
						normalFont();
						doc.text(this.leftMargin + this.leftIdent + maxTextWidth / 2, vOffset + 0.5, doc.splitTextToSize(
								attributes['ee_aoisrcid'], maxTextWidth / 2));
					}
					
					vOffset += 1.5;

					// Authors
					captionFont();
					doc.text(this.leftMargin, vOffset, doc.splitTextToSize(this.strings.caption_authors, maxTextWidth));
					normalFont();
					doc.text(this.leftMargin + this.leftIdent, vOffset + 0.5, doc.splitTextToSize(attributes['ee_updby']
							|| this.strings.no_value, maxTextWidth));
					vOffset += 1.5;

					// Last update
					captionFont();
					doc.text(this.leftMargin, vOffset, doc.splitTextToSize(this.strings.caption_lastupdate, maxTextWidth));
					normalFont();
					doc.text(this.leftMargin + this.leftIdent, vOffset + 0.5, doc.splitTextToSize(attributes['ee_lupd']
							|| this.strings.no_value, maxTextWidth));
					vOffset += 1.5;

					doc.setProperties({
						title : this.strings.properties_title,
						subject : '',
						author : '',
						keywords : '',
						creator : ''
					});

					callback.call(scope || this, doc);
				};

				this.getBinaryImageDataFromUrl(this.logoUrl, imageCallback, this);
			}

		});
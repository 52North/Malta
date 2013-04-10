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
if (EE.Client) {
	// Override EE.Client strings
	Ext.apply(EE.Client.prototype.strings, {
		group_event_types : 'Ereignistypen',
		group_time : 'Zeit',
		panel_layers : 'Ebenen',
		panel_attributes : 'Attribute',
		button_about : 'Über',
		button_help : 'Hilfe',
		button_filterselection : 'Selektion Filtern',
		button_selectall : 'Alle auswählen',
		statistics_mean : 'Mittelwert',
		statistics_sd : 'Standardabweichung',
		statistics_median : 'Median',
		statistics_min : 'Min',
		statistics_max : 'Max',
		statistics_mode : 'Modus (Wahrscheinlichkeit)',
		statistics_attribute : 'Attribut',
		info_nofiltermatch : 'Keine Daten für aktuelle Filtereinstellungen',
		info_noselection : 'Keine Auswahl',
		info_numselectedfeatures : '# Selektierter Einträge:',
		info_nostatisticsselected : 'Wählen Sie ein Attribute auf der linken Seite für ein Diagramm',
		window_statistics : 'Auswahlstatistiken',
		window_export : 'Exportierung',
		window_featuredetails : 'Details',
		action_selectallvisible : 'Selektiere alle Sichtbaren',
		action_boxselection : 'Rechteckauswahl',
		action_hideunselected : 'Verstecke Unselektierte',
		action_showstatistics : 'Zeige Statistiken',
		action_zoomtoselection : 'Zoome zur Selektion',
		context_showdetails : 'Details...',
		context_createreport : 'Report Erstellen',
		context_showonlythis : 'Nur diese Kategorie anzeigen',
		context_showallcategories : 'All Kategorien zeigen',
		tooltip_selectallvisible : 'Selektiere alle aktuell sichtbaren Einträge',
		tooltip_boxselection : 'Selektieren durch das Ziehen eines Auswahlrechtecks',
		tooltip_hideunselected : 'Versteckt alle Einträge von der Karte, die nicht selektiert sind',
		tooltip_showstatistics : 'Zeigt ein Fenster mit Statistiken für das ausgewählte Ereignis',
		tooltip_zoomselection : 'Zoomt Karte um alle ausgewählten Ereignisse anzuzeigen',
		tooltip_filterselection : 'Schließt alle zur zeit nicht ausgewählten Ereignisse von der weiteren Betrachtung aus',
		tooltip_button_about : 'Über diese Software',
		tooltip_button_help : 'Öffnet komplette Hilfe in einem neuem Fenster',
		tooltip_tool_help : 'Hilfe für diese Funktionen zeigen',
		tooltip_tool_switchposition : 'Position dieses Panels wechseln',
		message_exporterror : 'Ein unbekannter Fehler trat beim Exportieren auf',
		message_heading_error : 'Fehler',
		message_heading_success : 'Erfolg',
		message_exportsuccess : 'Daten erfolgreich exportiert',
		message_nogeometry : 'Dieses Ereignis hat keine Geometrie'
	});

	Ext.apply(EE.Client.prototype, {
		aboutFile : 'EE/about/about_de.html'
	});
}

if (EE.HelpProvider) {
	// Override EE.HelpProvider help file path
	Ext.apply(EE.HelpProvider.prototype, {
		helpFile : 'EE/help/help_de.html'
	});

	// Override EE.HelpProvider strings
	Ext.apply(EE.HelpProvider.prototype.strings, {
		help : 'Hilfe'
	});
}

if (EE.Settings) {
	// Category names
	var categoryNameMapping = {
		'Wildfire' : 'Verheerender Großflächenbrand',
		'Rainfall' : 'Regen',
		'Storm' : 'Sturm',
		'Cold' : 'Kälte',
		'Heat' : 'Hitze',
		'Flood' : 'Hochwasser',
		'Drought' : 'Dürre',
		'Landslide' : 'Erdrutsch',
		'Snowslide' : 'Lawine'
	};
	for ( var key in EE.Settings.eeCats) {
		EE.Settings.eeCats[key].title = categoryNameMapping[key] || EE.Settings.eeCats[key].title;
	}

	// Attribute names
	var attributeNameMapping = {
		'ee_id' : 'Kennung',
		'ee_cat' : 'Kategorie',
		'ee_beg' : 'Start',
		'ee_end' : 'Ende',
		'ee_descr' : 'Beschreibung',
		'ee_country' : 'Land',
		'ee_dur' : 'Dauer (Tage)',
		'ee_death' : '# Getötete (Geschätzte Anzahl getöteter Menschen)',
		'ee_displ' : '# Vertriebene (Geschätzte Anzahl vertriebener Menschen)',
		'ee_damg' : 'Schaden (USD, geschätzt)',
		'ee_cyacy' : 'Zyklon, Antizyklon',
		'ee_ccode' : 'Ländercode (ISO)',
		'ee_afreg' : 'Betroffene Regionen',
		'ee_lupd' : 'Letzte Aktualisierung',
		'ee_updby' : 'Aktualisiert durch (Institution)',
		'ee_aidef' : 'Area of interest (Definition der Ausdehnung)',
		'ee_fkey' : 'Fremdschlüssel in Quelldatenbestand',
		'ee_glide' : 'Glide-ID',
		'ee_srcid' : 'Quelle',
		'src_cat' : 'Kategorie in Quelldatenbestand',
		'ee_rgid' : 'Referenzgeometriekennung',
		'EE_SYSBOOL' : 'Systematische Erfassung'
	};
	for ( var key in EE.Settings.eeWfsAttributeMapping) {
		EE.Settings.eeWfsAttributeMapping[key].title = attributeNameMapping[key]
				|| EE.Settings.eeWfsAttributeMapping[key].title;
	}

}

if (EE.StatisticsHolder.Base) {
	// Statistics
	Ext.apply(EE.StatisticsHolder.Base.prototype.strings, {
		bins : 'Klassen',
		number_realizations : '# Elemente',
		sort : 'Sortieren',
		frequency : 'Häufigkeit',
		category : 'Kategorie',
		legend : 'Legende'
	});
}

// WFS Filter
if (EE.WFSFilter.String) {
	Ext.apply(EE.WFSFilter.String.prototype.strings, {
		wildcard_info : 'Platzhalter *, Einzelnes Zeichen ., Maskierung !'
	});
}

if (EE.WFSFilter.Boolean) {
	Ext.apply(EE.WFSFilter.Boolean.prototype.strings, {
		state : 'Zustand'
	});
}

if (EE.WFSFilter.Plugin) {
	Ext.apply(EE.WFSFilter.Plugin.prototype.strings, {
		filter : 'Filter',
		inactive : 'Nicht aktiv'
	});
}

if (Ext.ux.EE.TimePeriodPicker) {
	// Time selection
	
	Ext.apply(Ext.ux.EE.TimePeriodPicker.prototype.strings, {
		tooltip_begincrementor_down : 'Start des äußeren Zeitrahmens % Monate früher',
		tooltip_begincrementor_up : 'Start des äußeren Zeitrahmens % Monate später',
		tooltip_endcrementor_down : 'Ende des äußeren Zeitrahmens % Monate früher',
		tooltip_endcrementor_up : 'Ende des äußeren Zeitrahmens % Monate später',
		tooltip_beginbutton : 'Start des Zeitintervalls setzen',
		tooltip_endbutton : 'Ende des Zeitintervalls setzen',
		tooltip_outerbeginning : 'Start des äußeren Zeitrahmens',
		tooltip_outerend : 'Ende des äußeren Zeitrahmens',
		button_selectmonth : 'Fertig'
	});
}

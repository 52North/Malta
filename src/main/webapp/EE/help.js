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
 * Main Extreme Events Help class. Extracts help topics from a HTML page by IDs
 * with the following schema: ee_help_<topic>
 */
EE.HelpProvider = Ext.extend(Object, {

	strings : {
		help : 'Help'
	},
	helpFile : 'EE/help/help_en.html',
	helpElement : null,
	helpToolTip : null,

	/**
	 * Function to (re)load the internal help page.
	 * 
	 * @param callback
	 * @param scope
	 */
	loadHelp : function(callback, scope) {
		Ext.Ajax.request({
			url : this.helpFile,
			success : function(response) {
				this.helpElement = document.createElement('div');
				this.helpElement.innerHTML = response.responseText;
				callback.call(scope);
			},
			failure : function() {
				callback.call(null);
			},
			scope : this
		});
	},

	/**
	 * Returns the content of the specified help topic to the passed callback
	 * 
	 * @param topic
	 * @param callback
	 */
	getHelp : function(topic, callback) {
		if (this.helpElement == null) {
			this.loadHelp(function() {
				if (this.helpElement == null) {
					callback.call('Could not load help');
					return;
				}

				this.getHelp(topic, callback);
			}, this);
			return;
		}

		callback.call(this, Ext.DomQuery.selectNode('div[id=ee_help_' + topic + ']', this.helpElement));
	},

	/**
	 * Creates and shows an Ext.ToolTip with the specified help topic and
	 * targeting the specified Element.
	 * 
	 * @param topic
	 * @param targetEl
	 * @param anchor
	 *          optional. set 'left' to show the ToolTip left of the targeted
	 *          Element
	 */
	showHelpTooltip : function(topic, targetEl, anchor, width) {
		this.getHelp(topic, function(helpEl) {
			if (this.helpToolTip != null) {
				this.helpToolTip.hide();
			}
			if (helpEl == null) {
				return;
			}
			var helpWidth = helpEl.clientWidth != 0 ? helpEl.clientWidth : 200;
			helpWidth = width != null ? width : helpWidth;
			
			var helpButton = new Ext.Button({
				text : 'More...',
				handler : function() {
					this.showHelpWindow();
				},
				scope : this
			});

			var helpPanel = new Ext.Panel({
				layout : 'fit',
				html : helpEl.innerHTML,
				border : false,
				bodyStyle : 'background:transparent;',
				buttons : [ '->', helpButton ],
				cls : 'ee-help-tooltip'
			});

			this.helpToolTip = new Ext.ToolTip({
				title : this.strings.help,
				items : [ helpPanel ],
				anchor : 'right',
				width : helpWidth,
				autoHide : false,
				closable : true
			});

			// Task: find out why things like this.helpToolTip.showBy(targetEl,
			// 'tr-bl') do not work as expected
			var pos = [ targetEl.getLeft(), targetEl.getTop() ];
			if (anchor === 'left') {
				pos[0] -= helpWidth - targetEl.getWidth();
			}
			this.helpToolTip.showAt(pos);
		});
	},

	showHelpWindow : function() {
		window.open(this.helpFile, 'helpWindow');
	}
});
﻿function ocInitCodeMirror(mimeType, model) {
	var schema = model.schema;
	var options = model.options;

	var fieldsModels = {
		address: {
			schema: {
				"title": "Address",
				"type": "object",
				"properties": {
					"street": {
						"title": "Street",
						"type": "string"
					},
					"number": {
						"title": "House Number",
						"type": "string"
					},
					"city": {
						"title": "City",
						"type": "string"
					},
					"state": {
						"title": "State",
						"type": "string",
						"enum": ["AL", "AK", "AS", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FM", "FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MH", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "MP", "OH", "OK", "OR", "PW", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VI", "VA", "WA", "WV", "WI", "WY"]
					},
					"postalcode": {
						"title": "Postal Code",
						"type": "string"
					},
					"country": {
						"title": "Country",
						"type": "string"
					},
					"latitude": {
						"title": "Latitude",
						"type": "number"
					},
					"longitude": {
						"title": "Longitude",
						"type": "number"
					}
				}
			},
			options: {}
		},
		gallery: {
			schema: {
				items: {
					"type": "object",
					"properties": {

						"Image": {
							"title": "Image",
							"type": "string"
						}
					}
				}
			},
			options: {
				items: {
					"fields": {
						"Image": {
							"type": "image"
						}
					}
				}
			}
		},
		documents: {
			schema: {
				items: {
					"type": "object",
					"properties": {
						"Title": {
							"title": "Title",
							"type": "string"
						},
						"File": {
							"title": "File",
							"type": "string"
						}
					}
				}
			},
			options: {
				items: {
					"fields": {
						"File": {
							"type": "file"
						}
					}
				}
			}
		}
	};
	var contextVars = ['ModuleId', 'ModuleTitle', 'PortalId', 'GoogleApiKey', 'MainUrl', 'HomeDirectory', 'HTTPAlias'];
	var contextListVars = ['ModuleId', 'ModuleTitle', 'PortalId', 'GoogleApiKey', 'IsEditable', 'IsEditMode', 'MainUrl', 'HomeDirectory', 'HTTPAlias', 'DetailUrl', 'Id', 'EditUrl'];

	CodeMirror.defineMode("htmlhandlebars", function (config) {
		return CodeMirror.multiplexingMode(
		  CodeMirror.getMode(config, "text/html"),
		  {
		  	open: "{{", close: "}}",
		  	mode: CodeMirror.getMode(config, "handlebars"),
		  	parseDelimiters: true
		  });
	});

	var handlebarsHints = [
				/*{ 'text': '{{#each Items}}\n\n{{/each}}', 'displayText': '#each', 'sort': '#each' },
				{ 'text': '{{#if var}}\n\n{{/if}}', 'displayText': '#if', 'sort': '#if' }*/
	];

	var addHbsProperties = function (sch, opt, vartext, vardisplaytext) {
		var hints = [];
		if (sch) {
			if (sch.type == 'object') {
				var properties = sch.properties;
				var fields = opt ? opt.fields : null;
				if (opt && fieldsModels[opt.type]) {
					properties = fieldsModels[opt.type].schema.properties;
					fields = fieldsModels[opt.type].options.fields;
				}
				if (properties) {
					for (var k in properties) {
						p = properties[k];

						var vt = (vartext ? vartext + '.' : '') + k;
						var vdt = (vardisplaytext ? vardisplaytext + '.' : '') + k;
						var o = fields ? fields[k] : null;

						var childHints = addHbsProperties(p, o, vt, vdt);
						hints = hints.concat(childHints);
					}
				} else {
					hints.push({ 'text': '{{' + vartext + '.var}}', 'displayText': vardisplaytext });
				}
				//handlebarsHints.push({'text':'{{#with '+k+'}} {{/with}}', 'displayText': k+ (parent ? ' ('+ parent+')' : ''), 'sort': (parent ? parent+'.' : '')+k});
			} else if (sch.type == 'array') {
				var s = sch;
				var o = opt;
				if (!sch.items) {
					if (opt && fieldsModels[opt.type]) {
						s = fieldsModels[opt.type].schema;
						o = fieldsModels[opt.type].options;
					} else if (opt && opt.type == 'select2' && opt.dataService && opt.dataService.data && opt.dataService.data.dataKey) {
						var addData = model.additionalData[opt.dataService.data.dataKey];
						if (addData && addData.schema.items) {
							s = addData.schema;
							o = addData.options;
						}
					}
				}
				if (s.items) {
					var childHints = addHbsProperties(s.items, o ? o.items : null, '', vardisplaytext);
					var snipet = '';
					for (i = 0; i < childHints.length; i++) {
						snipet += childHints[i].text + '\n';
					}
					snipet = '{{#each ' + vartext + '}}\n' + snipet + '{{/each}}';
					hints.push({ 'text': snipet, 'displayText': vardisplaytext });
					hints = hints.concat(childHints);
				} else {
					hints.push({ 'text': '{{#each ' + vartext + '}}\n\n{{/each}}', 'displayText': vardisplaytext });
				}
			} else if (opt && opt.type == 'select2' && opt.dataService && opt.dataService.data && opt.dataService.data.dataKey) {
				var addData = model.additionalData[opt.dataService.data.dataKey];
				if (addData && addData.schema.items) {
					var childHints = addHbsProperties(addData.schema.items, (addData.options ? addData.options.items : null), vartext, vardisplaytext);
					hints = hints.concat(childHints);
				}
			} else {
				if (opt && opt.type == 'image') {
					hints.push({ 'text': '<img src="{{' + vartext + '}}" alt="" />', 'displayText': vardisplaytext });
				} else if (opt && opt.type == 'file') {
					hints.push({ 'text': '<a href="{{' + vartext + '}}" target="_blank" >Download</a>', 'displayText': vardisplaytext });
				} else if (opt && opt.type == 'url') {
					hints.push({ 'text': '<a href="{{' + vartext + '}}"  >More</a>', 'displayText': vardisplaytext });
				} else if (opt && (opt.type == 'ckeditor' || opt.type == 'wysihtml')) {
					hints.push({ 'text': '{{{' + vartext + '}}}', 'displayText': vardisplaytext });
				} else {
					hints.push({ 'text': '{{' + vartext + '}}', 'displayText': vardisplaytext });
				}
			}
		}
		return hints;
	};

	var addRazorProperties = function (sch, opt, vartext, vardisplaytext, varfulltext) {
		var hints = [];
		if (sch) {
			if (sch.type == 'object') {
				var properties = sch.properties;
				var fields = opt ? opt.fields : null;
				if (opt && fieldsModels[opt.type]) {
					properties = fieldsModels[opt.type].schema.properties;
					fields = fieldsModels[opt.type].options.fields;
				}
				if (properties) {
					for (var k in properties) {
						p = properties[k];
						var vft = (varfulltext ? varfulltext + '.' : 'Model.') + k;
						var vt = k;
						var vdt = (vardisplaytext ? vardisplaytext + '.' : '') + k;
						var o = fields ? fields[k] : null;

						var childHints = addRazorProperties(p, o, vt, vdt, vft);
						hints = hints.concat(childHints);
					}
				} else {
					hints.push({ 'text': '@' + varfulltext + '.var', 'displayText': vardisplaytext });
				}
			} else if (sch.type == 'array') {
				var s = sch;
				var o = opt;
				if (!sch.items && opt && fieldsModels[opt.type]) {
					s = fieldsModels[opt.type].schema;
					o = fieldsModels[opt.type].options;
				}
				if (s.items) {
					var childHints = addRazorProperties(s.items, o ? o.items : null, vartext + 'Item', vardisplaytext, vartext + 'Item');
					var snipet = '';
					for (i = 0; i < childHints.length; i++) {
						snipet += '  ' + childHints[i].text + '\n';
					}
					snipet = '@foreach(var ' + vartext + 'Item in ' + varfulltext + ') {\n' + snipet + '}';
					hints.push({ 'text': snipet, 'displayText': vardisplaytext });
					hints = hints.concat(childHints);
				} else {
					hints.push({ 'text': '@foreach(var ' + vartext + 'Item in ' + (vartext ? vartext : 'Model.' + vartext) + ') {\n}', 'displayText': vardisplaytext });
				}
			} else {
				if (opt && opt.type == 'image') {
					hints.push({ 'text': '<img src="@(' + varfulltext + ')" alt="" />', 'displayText': vardisplaytext });
				} else if (opt && opt.type == 'file') {
					hints.push({ 'text': '<a href="@(' + varfulltext + ')" target="_blank" >Download</a>', 'displayText': vardisplaytext });
				} else if (opt && opt.type == 'url') {
					hints.push({ 'text': '<a href="@(' + varfulltext + ')"  >More</a>', 'displayText': vardisplaytext });
				} else if (opt && (opt.type == 'ckeditor' || opt.type == 'wysihtml')) {
					hints.push({ 'text': '@Html.Raw(' + varfulltext + ')', 'displayText': vardisplaytext });
				} else {
					hints.push({ 'text': '@' + varfulltext + '', 'displayText': vardisplaytext });
				}
			}
		}
		return hints;
	};
	if (mimeType == 'htmlhandlebars') {
		var hints = addHbsProperties(schema, options, '', '');
		if (model.listTemplate) {
			var snipet = '';
			for (i = 0; i < hints.length; i++) {
				snipet += hints[i].text + '\n';
			}
			snipet = '{{#each Items}}\n' + snipet + '{{/each}}';
			handlebarsHints.push({ 'text': snipet, 'displayText': 'Items' });
		}
		handlebarsHints = handlebarsHints.concat(hints);
		var settingsHints = addHbsProperties(model.settingsSchema, model.settingsOptions, 'Settings', 'Settings');
		handlebarsHints = handlebarsHints.concat(settingsHints);
		var cv = model.listTemplate ? contextListVars : contextVars;
		for (var i = 0; i < cv.length; i++) {
			handlebarsHints.push({ 'text': '{{Context.' + cv[i] + '}}', 'displayText': 'Context.' + cv[i] });
		}
		if (model.localization) {
			for (var i in model.localization) {
				handlebarsHints.push({ 'text': '{{Localization.' + i + '}}', 'displayText': 'Localization.' + i });
			}
		}
		if (model.additionalData) {
			for (var i in model.additionalData) {
				var aHints = addHbsProperties(model.additionalData[i].schema, model.additionalData[i].options, 'AdditionalData.' + i, 'AdditionalData.' + i);
				handlebarsHints = handlebarsHints.concat(aHints);
			}
		}
	} else if (mimeType == 'text/html') { //razor
		var hints = [];
		if (model.listTemplate) {
			hints = addRazorProperties(schema, options, 'item', '', 'item');
			var snipet = '';
			for (i = 0; i < hints.length; i++) {
				snipet += '  ' + hints[i].text + '\n';
			}
			snipet = '@foreach(var item in Model.Items) {\n' + snipet + '}';
			handlebarsHints.push({ 'text': snipet, 'displayText': 'Items' });
		} else {
			hints = addRazorProperties(schema, options, '', '', '');
		}
		handlebarsHints = handlebarsHints.concat(hints);
		var settingsHints = addRazorProperties(model.settingsSchema, model.settingsOptions, 'Settings', 'Settings', 'Model.Settings');
		handlebarsHints = handlebarsHints.concat(settingsHints);
		for (var i = 0; i < contextVars.length; i++) {
			handlebarsHints.push({ 'text': '@Model_or_item.Context.' + contextVars[i], 'displayText': 'Context.' + contextVars[i] });
		}
		if (model.localization) {
			for (var i in model.localization) {
				handlebarsHints.push({ 'text': '@Model.Localization.' + i + '}}', 'displayText': 'Localization.' + i });
			}
		}
		if (model.additionalData) {
			for (var i in model.additionalData) {
				var aHints = addRazorProperties(model.additionalData[i].schema, model.additionalData[i].options, i, 'AdditionalData.' + i, 'Model.AdditionalData.' + i);
				handlebarsHints = handlebarsHints.concat(aHints);
			}
		}
	}

	//console.log(handlebarsHints);
	CodeMirror.registerHelper("hint", "htmlhandlebars", function (editor) {
		var list = handlebarsHints;
		var cursor = editor.getCursor();
		var currentLine = editor.getLine(cursor.line);
		var start = cursor.ch;
		var end = start;
		while (end < currentLine.length && /[\w$]+/.test(currentLine.charAt(end)))++end;
		while (start && /[\w$]+/.test(currentLine.charAt(start - 1)))--start;
		var curWord = start != end && currentLine.slice(start, end);
		var regex = new RegExp('^' + curWord, 'i');
		var result = {
			list: (!curWord ? list : list.filter(function (item) {
				return item.displayText.match(regex);
			})).sort(function compare(a, b) {
				if (a.displayText < b.displayText)
					return -1;
				if (a.displayText > b.displayText)
					return 1;
				return 0;
			}),
			from: CodeMirror.Pos(cursor.line, start),
			to: CodeMirror.Pos(cursor.line, end)
		};
		return result;
	});
}

function ocSetupCodeMirror(mimeType, elem) {

	var handlebarsHelpers = [
		{ 'text': '{{#each var}}\n{{/each}}', 'displayText': 'each'},
		{ 'text': '{{#if var}}\n{{/if}}', 'displayText': 'if'},
		{ 'text': '{{else}}', 'displayText': 'else' },
		{ 'text': '{{#ifand var1 var2 var3}}\n{{/ifand}}', 'displayText': 'ifand'},
		{ 'text': '{{#ifor var1 var2 var3}}\n{{/ifor}}', 'displayText': 'ifor' },
		{ 'text': '{{multiply var 2}}', 'displayText': 'multiply' },
		{ 'text': '{{divide var 2}}', 'displayText': 'divide'},
		{ 'text': '{{add var 2}}', 'displayText': 'add' },
		{ 'text': '{{substract var 2}}', 'displayText': 'substract' },
		{ 'text': '{{registerscript "javascript.js"}}', 'displayText': 'registerscript'},
		{ 'text': '{{registerstylesheet "stylesheet.css"}}', 'displayText': 'registerstylesheet'},
		{ 'text': '{{formatNumber var "0.00"}}', 'displayText': 'formatNumber'},
		{ 'text': '{{formatDateTime var "dd/MMM/yy" "nl-NL" }}', 'displayText': 'formatDateTime'},
		{ 'text': '{{convertHtmlToText var }}', 'displayText': 'convertHtmlToText'},
		{ 'text': '{{convertToJson var }}', 'displayText': 'convertToJson'},
		{ 'text': '{{truncateWords var 50 "..." }}', 'displayText': 'formatDateTime'},
		{ 'text': '{{#equal var "value"}}\n{{/equal}}', 'displayText': 'equal' },
		{ 'text': '{{#unless var}}\n{{/unless}}', 'displayText': 'unless' },
		{ 'text': '{{#with var}}\n{{/with}}', 'displayText': 'with' }
	];

	var htmlHints = [
		{ 'text': '<div class="row">\n\t<div class="col-md-12">\n\t</div>\n</div>', 'displayText': 'row' },
		{ 'text': '\t<div class="col-md-1">\n\t</div>', 'displayText': 'col1' },
		{ 'text': '\t<div class="col-md-2">\n\t</div>', 'displayText': 'col2' },
		{ 'text': '\t<div class="col-md-3">\n\t</div>', 'displayText': 'col3' },
		{ 'text': '\t<div class="col-md-4">\n\t</div>', 'displayText': 'col4' },
		{ 'text': '\t<div class="col-md-6">\n\t</div>', 'displayText': 'col6' },
		{ 'text': '\t<div class="col-md-12">\n\t</div>', 'displayText': 'col12' },
		{ 'text': '<img src="..." class="img-responsive" alt="">', 'displayText': 'img-responsive' },
		{ 'text': '<img src="..." alt="" class="img-rounded">', 'displayText': 'img-rounded' },
		{ 'text': '<img src="..." alt="" class="img-circle">', 'displayText': 'img-circle' },
		{ 'text': '<img src="..." alt="" class="img-thumbnail">', 'displayText': 'img-thumbnail' },
		{ 'text': '<a href="..." class="btn btn-default">Default</a>', 'displayText': 'button-default' },
		{ 'text': '<a href="" class="btn btn-primary">Primary</a>', 'displayText': 'button-primary' },
		{ 'text': '<div class="table-responsive">\n\t<table class="table">\n\t\t<tr>\n\t\t\t<td>\n\t\t\t</td>\n\t\t</tr>\n\t</table>\n</div>', 'displayText': 'table-responsive' },
	];

	var getHintsList = function (editor, list) {
		
		var cursor = editor.getCursor();
		var currentLine = editor.getLine(cursor.line);
		var start = cursor.ch;
		var end = start;
		while (end < currentLine.length && /[\w$]+/.test(currentLine.charAt(end)))++end;
		while (start && /[\w$]+/.test(currentLine.charAt(start - 1)))--start;
		var curWord = start != end && currentLine.slice(start, end);
		var regex = new RegExp('^' + curWord, 'i');
		var result = {
			list: (!curWord ? list : list.filter(function (item) {
				return item.displayText.match(regex);
			})).sort(function compare(a, b) {
				if (a.sort < b.sort)
					return -1;
				if (a.sort > b.sort)
					return 1;
				return 0;
			}),
			from: CodeMirror.Pos(cursor.line, start),
			to: CodeMirror.Pos(cursor.line, end)
		};
		return result;
	}

	var cm = CodeMirror.fromTextArea(elem, {
		lineNumbers: true,
		matchBrackets: true,
		lineWrapping: true,
		mode: mimeType,
		extraKeys: {
			"Ctrl-Space": "autocomplete",
			"Shift-Space": function (editor) {
				if (editor.doc.modeOption == 'htmlhandlebars') {
					var options = {
						hint: function myfunction() {
							return getHintsList(editor, handlebarsHelpers);
						}
					};
					editor.showHint(options);
				}
			},
			"Shift-Ctrl-Space": function (editor) {
				if (editor.doc.modeOption == 'htmlhandlebars' || editor.doc.modeOption == 'text/html') {
					var options = {
						hint: function myfunction() {
							return getHintsList(editor, htmlHints);
						}
					};
					editor.showHint(options);
				}
			}
		},
		hintOptions: { hint: CodeMirror.hint.htmlhandlebars }
	});
	/*
				cm.on("inputRead", function(editor, change) {
				  if (change.text[0] == "{"){
					var options = {
						hint: function() {
						  return {
							from: editor.getDoc().getCursor(),
							  to: editor.getDoc().getCursor(),
							list: handlebarsHints
						  }
						}
					  };
					  editor.showHint(options);
					}
				});
	*/
	return cm;
}
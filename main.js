/*
	The toggle and handler code was borrowed from brackets-quick-search,
	which was in turn borrowed from brackets-automatch-pairs. Including
	and adopting the original license.
	
	- Gwen Mullinix
*/

/*
* Copyright (c) 2013 Zaidin Amiot. All rights reserved.
*
* Permission is hereby granted, free of charge, to any person obtaining a
* copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*
*/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";

	// Brackets modules
    var CommandManager  = brackets.getModule("command/CommandManager"),
	Menus               = brackets.getModule("command/Menus"),
	ScrollTrackMarkers  = brackets.getModule("search/ScrollTrackMarkers"),
    EditorManager  		= brackets.getModule("editor/EditorManager"),
    KeyEvent 			= brackets.getModule("utils/KeyEvent");
	
	// Extension variables
	var _enabled = true,
		scrollTrackPositions = [];
	
	//  Main function
    function makeHeatmap() {
		
		var editor = EditorManager.getCurrentFullEditor();
		
		// Get line number where edit was made
		var pos = editor.getCursorPos();
		
		// Loop through array and check for duplicate entries
		duplicateCheck(pos.line);
		
		// Push line number to array
		scrollTrackPositions.unshift(pos);
		
		// Clip off old entries in array
		// TODO: make the length a preference
		if (scrollTrackPositions.length > 10) {
			scrollTrackPositions.length = 10;
		}
		
		// TODO: more research into clearing/setting visible and what's necessary.
		// TODO: style appearance of tick markers depending on their position in the array via classes (higher numbers = brighter, lower = darker)
		// TODO: add line highlighting or gutter marker
		ScrollTrackMarkers.clear();		
		ScrollTrackMarkers.setVisible(editor, true);
		ScrollTrackMarkers.addTickmarks(editor, scrollTrackPositions);
    }

	function duplicateCheck(linenumber) {	
		for (var i = 0; i < scrollTrackPositions.length - 1; i++) {
			if (scrollTrackPositions[i].line == linenumber) {
				// Remove the duplicate entry
				scrollTrackPositions.splice(i, 1);
			}
		}
	}
	
	// Don't run main function on literally every key press
	// Gets laggy otherwise
	var slowDown = false;
	
	function _handler(event, editor, keyevent) {
		if (keyevent.type == "keyup" && slowDown == false) {
			makeHeatmap();
			slowDown = true;
			// Only allow to re-run after a second delay
			setTimeout(function(){slowDown = false;},1000);
		}
	}

	function _handlerOff(editor) {
        //_find.clear(editor);
        editor.off('keyEvent', _handler);
    }
    
    function _disableHandler(editor) {
       // editor.off('cursorActivity', _handler);
        editor.off('keyEvent', _handler);
    }
    
    function _handlerOn(editor) {
        //editor.on('cursorActivity', _handler);
        editor.on('keyEvent', _handler);
		scrollTrackPositions = [];
		// TODO: save different scrollTrackPosition arrays for every active window, otherwise you lose them on focus change
    }
    
    // Toggle the extension, set the _document and register the listener.
    function _toggle() {
        _enabled = !_enabled;
        
        // Set the new state for the menu item.
        CommandManager.get(WORK_HEATMAP).setChecked(_enabled);
        
        var editor = EditorManager.getActiveEditor();
        
        // Register or remove listener depending on _enabled.
        if (_enabled) {
            _handlerOn(editor);
        } else {
            _handlerOff(editor);
        }
    }
    
    // Reset the listeners when the active editor change.
    EditorManager.on("activeEditorChange",
        function (event, current, previous) {
            if (_enabled) {
                if (previous) {
                    _handlerOff(previous);
                }
                if (current) {
                    _handlerOn(current);
                }
            }
        });

		
	var WORK_HEATMAP = "heatmap.makeHeatmap";
	
    // Register command.
    CommandManager.register("Work Heatmap", WORK_HEATMAP, _toggle);

    // Add command to View menu.
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(WORK_HEATMAP);

    // Set the starting state for the menu item.
    CommandManager.get(WORK_HEATMAP).setChecked(_enabled);

});


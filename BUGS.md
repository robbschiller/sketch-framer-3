# BUGS

## running the plugin on a just-launched-sketch-just-opened-document state won't work:

    12/05/14 15:26:51,081 Sketch[41048]: Sketch-Scripting Error on Line 231 (/Users/ale/Library/Containers/com.bohemiancoding.sketch3/Data/Library/Application Support/com.bohemiancoding.sketch3/Plugins/sketch-framer-3/Export to Framer.sketchplugin): TypeError: 'null' is not an object (evaluating 'art. includeBackgroundColorInExport')

Apparently, art is not defined
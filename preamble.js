// Preamble
var log = function(msg){}
var app = [COScript application:"Sketch"]
var windows = [app windows]
var doc

for (var i=0; i<[windows count]; i++) {
    var window = [windows objectAtIndex:i]
    if ([window document])
        doc = [window document]
}
var selection = doc ? doc.selectedLayers() : null

// Define these to coscript doesn't barf
var MSLayerGroup, MSSliceMaker, MSSliceExporter,MSArtboardGroup

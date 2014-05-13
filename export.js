// Some sanity checks, before we begin:
var error = check_for_errors()

if(error) { // Stop execution and display error
  alert("Make sure to fix these before we can continue:\n\n" + error)
} else { // Let's go
  // Setup
  var ViewsMetadata = new MetadataExtractor()

  // Authorize
  // authorize_app_to_save()
  make_export_folder()

  var views = extract_views_from_document()
  for (var v = 0; v < views.length; v++) {
    var view = [views objectAtIndex:v]
    export_assets_for_view(view)
  }

  // Traverse hierarchy to extract metadata
  if (document_has_artboards()) {
    var artboards = [[doc currentPage] artboards]
    for(var a=0; a < [artboards count]; a++){
      var artboard = [artboards objectAtIndex:a]
      ViewsMetadata.addView(artboard)
    }
  } else {
    var layers = [[doc currentPage] layers]
    if (layers) {
      for (var i = 0; i < layers.length; i++) {
        var lay = [layers objectAtIndex:i]
        if(view_should_be_extracted(lay)){
          ViewsMetadata.addView(lay)
        }
      }
    } else {
      alert("WHY U NO LAYERS IN UR DOC")
    }
  }

  save_structure_to_json(ViewsMetadata)

  // All done!
  print("Export complete")
  [doc showMessage:"Export Complete"]
}

// Some sanity checks, before we begin:
var error = check_for_errors()

if(error) { // Stop execution and display error
  alert("Make sure to fix these before we can continue:\n\n" + error)
} else { // Let's go

  // When DRY_RUN is true, files won't be saved
  var DRY_RUN = false

  // Setup
  var ViewsMetadata = new MetadataExtractor(doc)

  var home_folder = "/Users/" + NSUserName()
  new AppSandbox().authorize(home_folder, function(){
    make_export_folder()
    save_structure_to_json(ViewsMetadata)
    var views = ViewsMetadata.getViews()
    for (var v = 0; v < views.length; v++) {
      var view = views[v]
      log(view)
      export_assets_for_view(view)
    }
  })

  views = nil;
  ViewsMetadata = nil;
  error = nil;

  // All done!
  print("Export complete")
  [doc showMessage:"Export Complete"]
}

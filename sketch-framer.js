// sketch-framer.js
// ale@bohemiancoding.com


// Steps
function authorize_app_to_save(){
  if (!in_sandbox()) {
    log("✅ We’re not sandboxed")
    return
  } else {
    log("⭕️ We’re sandboxed, asking for permission…")
    var home_folder = [@"~/" stringByExpandingTildeInPath]
    var sandboxAccess = AppSandboxFileAccess.init({
      message: "Please authorize Sketch to write to your home folder. Hopefully, you will only need to do this once.",
      prompt:  "Authorize",
      title: "Sketch Authorization"
    })
    sandboxAccess.accessFilePath_withBlock_persistPermission(home_folder, function(){
      log("Sandbox access granted")
    }, true)
  }
}
function export_folder(){
  var doc_folder = [[doc fileURL] path].replace([doc displayName], ''),
      doc_name = [doc displayName].replace(".sketch",""),
      folder = export_path.replace("{doc_name}",doc_name)
  return doc_folder + folder + "/"
}
function image_folder(){
  return export_folder() + "images/"
}
function make_export_folder(){
  var path = export_folder()
  make_folder(path + "/images")
}
function make_folder(path){
  if (in_sandbox()) {
    AppSandboxFileAccess.init({message: "", prompt:  "", title: ""}).accessFilePath_withBlock_persistPermission(path, function(){
      [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:true attributes:null error:null]
    }, true)
  } else {
    [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:true attributes:null error:null]
  }
}
function export_assets_for_view(view){
  log("export_assets_for_view("+[view name]+")")

  // TODO: Decide what to do with Pages
  // TODO: Decide what to do with Artboards

  if([[[doc currentPage] artboards] count] > 0){
    log("Here be artboards")
    var current_artboard = [view parentArtboard],
        did_disable_background = false

    if([current_artboard includeBackgroundColorInExport]){
      log("Artboard has a background color set to export")
      if(!is_artboard(view)){
        // disable the background color if we're not exporting the actual artboard
        log(" so we'll momentarily disable it")
        [current_artboard setIncludeBackgroundColorInExport:false]
        did_disable_background = true
      }
    }
  }

  make_folder(image_folder() + [current_artboard name])

  var filename = image_folder() + [current_artboard name] + "/" + [view name] + ".png",
      slice = [[MSSliceMaker slicesFromExportableLayer:view] firstObject]

      log(filename)
  slice.page = [doc currentPage]

  var imageData = [MSSliceExporter dataForSlice:slice format:@"png"]

  if (in_sandbox()) {
    sandboxAccess.accessFilePath_withBlock_persistPermission(image_folder(), function(){
      [imageData writeToFile:filename atomically:YES]
    }, true)
  } else {
    [imageData writeToFile:filename atomically:YES]
  }

  if (did_disable_background) {
    [current_artboard setIncludeBackgroundColorInExport:true]
  }
}
function extract_views_from_document(){
  log("Extracting views from document")
  var everything = [[doc currentPage] children],
      views = []

  for(var i=0; i < [everything count]; i++){
    var obj = [everything objectAtIndex:i]

    if (view_should_be_extracted(obj)) {
      log("    " + [obj name] + " will become a view")
      views.push(obj)
    }

  }
  views = [[NSArray alloc] initWithArray:views]
  return views
}
function save_structure_to_json(data){
  save_file_from_string(export_folder() + json_filename, data.getJSON())
}

// Utils
function alert(msg){
  [[NSApplication sharedApplication] displayDialog:msg withTitle:"Sketch Framer found some errors"]
  // alternatively, we could do:
  // [doc showMessage:msg]
  // but maybe that's too subtle for an alert :)
}
function check_for_errors(){
  var error = ""
  if (!document_is_saved()) {
    error += "— Please save your document to export it."
  }
  /*
  if (document_has_artboards()){
    error += "\n— Artboard support is still a work in progress."
  }
  */
  return error
}
function document_is_saved(){
  return [doc fileURL] != null
}
function document_has_artboards(){
  return [[[doc currentPage] artboards] count] > 0]
}
function is_artboard(layer){
  return [layer isMemberOfClass:MSArtboardGroup]
}
function msg(msg){
  [doc showMessage:msg]
}
function save_file_from_string(filename,the_string) {
  var path = [@"" stringByAppendingString:filename],
      str = [@"" stringByAppendingString:the_string];

  if (in_sandbox()) {
    sandboxAccess.accessFilePath_withBlock_persistPermission(filename, function(){
      [str writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:null];
    }, true)
  } else {
    [str writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:null];
  }
}
function view_should_be_extracted(view){
  log("  view_should_be_extracted("+[view className]+")")
  return [view isMemberOfClass:MSLayerGroup] || is_artboard(view) || [view name].match(/\+/)
}

// Classes
function MetadataExtractor(){
  this.data = []
}
MetadataExtractor.prototype.addView = function(view){
  var metadata = extract_metadata_from_view(view)
  this.data.push(metadata)
}
MetadataExtractor.prototype.getJSON = function(){
  return "[" + this.data.join(",\n") + "]"
}
function extract_metadata_from_view(view){
  // log("extract_metadata_from_view("+[view name]+")")
  // log([view children])
  /*
	{
		"id": 3,
		"name": "Background",
		"layerFrame": {
			"x": 0,
			"y": 0,
			"width": 320,
			"height": 568
		},
		"maskFrame": null,
		"image": {
			"path": "images/Background.png",
			"frame": {
				"x": 0,
				"y": 0,
				"width": 320,
				"height": 568
			}
		},
		"imageType": "png",
		"children": [

		],
		"modification": "1834086366"
	}
  */
  var metadata = {
    id: "" + [view objectID],
    name: "" + [view name],
    layerFrame: {
      x: [[view frame] x],
      y: [[view frame] y],
      width: [[view frame] width],
      height: [[view frame] height]
    },
    maskFrame: null,
    image: {
      path: "images/" + [[view parentArtboard] name] + "/" + [view name] + ".png",
      frame: {
        x: [[view frame] x],
        y: [[view frame] y],
        width: [[view frame] width],
        height: [[view frame] height]
      }
    },
    imageType: "png",
    modification: null
  }
  if ([view children]) {
    // Insert metadata for children
  } else {
    metadata.children = []
  }
  // Correct position for artboards:
  if (is_artboard(view)) {
    metadata.layerFrame.x = 0
    metadata.layerFrame.y = 0
    metadata.image.frame.x = 0
    metadata.image.frame.y = 0
  }
  return JSON.stringify(metadata, null, '\t')
}

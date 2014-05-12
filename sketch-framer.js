// sketch-framer.js
// ale@bohemiancoding.com


if (!DEBUG) {
  log = function(txt){}
}

// Steps
function authorize_app_to_save(){
  if (!in_sandbox()) {
    log("— We’re not sandboxed")
  } else {
    log("— We’re sandboxed, asking for permission…")
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
function make_export_folder(){
  var path = export_folder()
  make_folder(path + "/images")
}
function make_folder(path){
  if (in_sandbox()) {
    sandboxAccess.accessFilePath_withBlock_persistPermission(path, function(){
      [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:true attributes:null error:null]
    }, true)
  } else {
    [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:true attributes:null error:null]
  }
}
function export_assets_for_view(view){

  make_folder(folder_path_for_view(view))

  if (document_has_artboards()) {
    var current_artboard = [view parentArtboard],
        current_artboard_name = [current_artboard name],
        did_disable_background = false

    if([current_artboard includeBackgroundColorInExport]){
      // log("Artboard has a background color set to export")
      if(!is_artboard(view)){
        // disable the background color if we're not exporting the actual artboard
        // log(" so we'll momentarily disable it")
        [current_artboard setIncludeBackgroundColorInExport:false]
        did_disable_background = true
      }
    }
  }

  // Hide children if they will be exported individually
  if(has_subviews(view)){
    var sublayers = subviews_for_view(view),
        hidden_children = [NSMutableArray new]

    var loop = [sublayers objectEnumerator],
        sublayer
    while(sublayer = [loop nextObject]){
      if ([sublayer isVisible]) {
        // log("We should hide " + [sublayer name] + ", as it will be exported individually")
        [sublayer setIsVisible:false]
        hidden_children.addObject(sublayer)
      }
    }
  }

  // Actual writing of asset
  var filename = asset_path_for_view(view),
      slice = [[MSSliceMaker slicesFromExportableLayer:view] firstObject]
  slice.page = [doc currentPage]
  var imageData = [MSSliceExporter dataForSlice:slice format:@"png"]

  if (in_sandbox()) {
    sandboxAccess.accessFilePath_withBlock_persistPermission(folder_path_for_view(view), function(){
      [imageData writeToFile:filename atomically:false]
    }, true)
  } else {
    [imageData writeToFile:filename atomically:false]
  }

  // Restore background color for layer
  if(current_artboard != null && did_disable_background){
    [current_artboard setIncludeBackgroundColorInExport:true]
  }

  // Make sublayers visible again
  if (has_subviews(view)) {
    for(var s=0; s < [hidden_children count]; s++){
      var show_me = [hidden_children objectAtIndex:s]
      [show_me setIsVisible:true]
    }
  }
}
function extract_views_from_document(){
  var everything = [[doc currentPage] children],
      views = []

  var loop = [everything objectEnumerator],
      obj;
  while (obj = [loop nextObject]) {
    if (view_should_be_extracted(obj)) {
      views.push(obj)
    }
  }
  views = [[NSArray alloc] initWithArray:views]
  return views
}
function save_structure_to_json(data){
  // log("save_structure_to_json()")
  save_file_from_string(export_folder() + json_filename, data.getJSON())
}

// Utils
function alert(msg){
  [[NSApplication sharedApplication] displayDialog:msg withTitle:"Sketch Framer found some errors"]
  // alternatively, we could do:
  // [doc showMessage:msg]
  // but maybe that's too subtle for an alert :)
}
function asset_path_for_view(view){
  var r = folder_path_for_view(view) + [view name] + ".png"
  return r
}
function image_path_for_view(view){
  var r = ""
  if(document_has_artboards()) {
    r = "images/" + [[view parentArtboard] name] + "/" + [view name] + ".png"
  } else {
    r = "images/" + [view name] + ".png"
  }
  return r
}
function folder_path_for_view(view){
  var r = ""
  if(document_has_artboards()) {
    r = image_folder() + [[view parentArtboard] name] + "/"
  } else {
    r = image_folder()
  }
  return r
}
function check_for_errors(){
  var error = ""
  if (!document_is_saved()) {
    error += "— Please save your document to export it."
  }

  // if ([[doc pages] count] > 1) {
  //   error += "\n— We'll export just the first page of your document"
  // }
  //
  // if (document_has_artboards()){
  //   error += "\n— Artboard support is still a work in progress."
  // }

  return error
}
function document_is_saved(){
  return [doc fileURL] != null
}
function document_has_artboards(){
  return [[[doc currentPage] artboards] count] > 0
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
function has_subviews(view){
  var sublayers = [view layers]
  for(var v=0; v < [sublayers count]; v++){
    var sublayer = [sublayers objectAtIndex:v]
    if(view_should_be_extracted(sublayer)){
      return true
    }
  }
  return false
}
function subviews_for_view(view){
  var sublayers = [view layers],
      subviews = [NSMutableArray new]
  for(var v=0; v < [sublayers count]; v++){
    var sublayer = [sublayers objectAtIndex:v]
    if(view_should_be_extracted(sublayer)){
      subviews.addObject(sublayer)
    }
  }
  if ([subviews count] > 0) {
    return subviews
  } else {
    return null
  }
}
function is_artboard(layer){
  return [layer isMemberOfClass:MSArtboardGroup]
}
function msg(msg){
  [doc showMessage:msg]
}
function save_file_from_string(filename,the_string) {
  var path = [@"" stringByAppendingString:filename],
      str = [@"" stringByAppendingString:the_string]

  if (in_sandbox()) {
    sandboxAccess.accessFilePath_withBlock_persistPermission(filename, function(){
      [str writeToFile:path atomically:false encoding:NSUTF8StringEncoding error:null];
    }, true)
  } else {
    [str writeToFile:path atomically:false encoding:NSUTF8StringEncoding error:null];
  }
}
function view_should_be_extracted(view){
  // log("  view_should_be_extracted("+[view className]+")?")
  var r = [view isMemberOfClass:MSLayerGroup] || is_artboard(view) || [view name].match(/\+/)
  // log("    " + r)
  return r
}

// Classes
function MetadataExtractor(){
  this.data = []
}
MetadataExtractor.prototype.addView = function(view){
  var metadata = this.extract_metadata_from_view(view)
  this.data.push(metadata)
}
MetadataExtractor.prototype.getJSON = function(){
  return JSON.stringify(this.data, null, '\t')
}
MetadataExtractor.prototype.extract_metadata_from_view = function(view){
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
      path: image_path_for_view(view),
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

  // Does view have subviews?
  if(has_subviews(view)){
    var subviews = subviews_for_view(view),
        children_metadata = []
    var loop = [subviews objectEnumerator]
    while(child = [loop nextObject]){
      // TODO: fix children position, by adding parent offset
      children_metadata.push(this.extract_metadata_from_view(child))
    }
    metadata.children = children_metadata
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
  return metadata
}

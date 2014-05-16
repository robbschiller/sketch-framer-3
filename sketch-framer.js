// sketch-framer.js
// ale@bohemiancoding.com

// Setup

// Steps
function make_export_folder(){
  var path = image_folder()
  make_folder(path)
}
function make_folder(path){
  log("make_folder("+path+")")
  if (DRY_RUN) {
    log("DRY_RUN, won't make folder " + path)
    return
  }
  [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:true attributes:null error:null]
}
function export_assets_for_view(view){
  // log("export_assets_for_view("+view+")")
  if (DRY_RUN) {
    log("DRY_RUN, won't export assets")
    return
  }

  make_folder(folder_path_for_view(view))

  if (document_has_artboards()) {
    var current_artboard = [view parentArtboard],
        current_artboard_name = [current_artboard name],
        did_disable_background = false

    if([current_artboard includeBackgroundColorInExport]){
      // print("Artboard has a background color set to export")
      if(!is_artboard(view)){
        // disable the background color if we're not exporting the actual artboard
        // print(" so we'll momentarily disable it")
        [current_artboard setIncludeBackgroundColorInExport:false]
        did_disable_background = true
      }
    }
  }

  // Hide children if they will be exported individually
  if(has_subviews(view)){
    var sublayers = subviews_for_view(view),
        hidden_children = []

    for (var s = 0; s < sublayers.length; s++) {
      var sublayer = sublayers[s]
      if ([sublayer isVisible]) {
        // print("We should hide " + [sublayer name] + ", as it will be exported individually")
        [sublayer setIsVisible:false]
        hidden_children.push(sublayer)
      }
    }
  }

  // Actual writing of asset
  var filename = asset_path_for_view(view),
      slice = [[MSSliceMaker slicesFromExportableLayer:view] firstObject]
      log(filename)
      log(slice)
  slice.page = [doc currentPage]
  var imageData = [MSSliceExporter dataForSlice:slice format:@"png"]
  [imageData writeToFile:filename atomically:false]

  // Restore background color for layer
  if(current_artboard != null && did_disable_background){
    [current_artboard setIncludeBackgroundColorInExport:true]
  }

  // Make sublayers visible again
  if (has_subviews(view)) {
    for(var s=0; s < hidden_children.length; s++){
      var show_me = hidden_children[s]
      [show_me setIsVisible:true]
    }
  }

}
function extract_views_from_document(document){
  // TODO: traverse multiple pages
  var everything = [[document currentPage] children],
      views = []

  for (var i = 0; i < [everything count]; i++) {
    var obj = [everything objectAtIndex:i]
    if (view_should_be_extracted(obj)) {
      views.push(obj)
    }
  }
  return views
}
function save_structure_to_json(data){
  print("save_structure_to_json()")
  save_file_from_string(export_folder() + "layers.json", data.getJSON())
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
  var errors = []
  if (!document_is_saved()) {
    errors.push("— Please save your document to export it.")
  }

  if ([[doc pages] count] > 1) {
    errors.push("— Multiple pages are not yet supported.")
  }

  return errors.join("\n")
}
function document_is_saved(){
  return [doc fileURL] != null
}
function document_has_artboards(){
  return [[[doc currentPage] artboards] count] > 0
}
function export_folder(){
  var doc_folder = [[doc fileURL] path].replace([doc displayName], ''),
      doc_name = [doc displayName].replace(".sketch","")
  return doc_folder + doc_name + "/"
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
  // log("subviews_for_view()")
  var sublayers = [view layers],
      subviews = []

  log(subviews)
  for(var v=0; v < [sublayers count]; v++){
    var sublayer = [sublayers objectAtIndex:v]
    log(sublayer)
    if(view_should_be_extracted(sublayer)){
      subviews.push(sublayer)
    }
  }
  if (subviews.length > 0) {
    return subviews
  } else {
    return null
  }
}
function is_artboard(layer){
  return ([layer className] == "MSArtboardGroup")
}
function mask_bounds(layer){
  var sublayers = [layer layers],
      effective_mask = null

  for (var i = 0; i < [sublayers count]; i++) {
    var current = [sublayers objectAtIndex:i]
    if(current && [current hasClippingMask]) {
      // If a native mask is detected, rename it and disable it (for now) so we can export its contents
      var _name = [current name] + "@@mask";
      [current setName:_name];
      [current setHasClippingMask:false];
      print("Disabling mask " + [current name]);

      if (!effective_mask) {
        // Only the bottom-most one will be effective
        print("Effective mask " + _name)
        effective_mask = current
      }
    }
  }

  if (effective_mask) {
    return coordinates_for(effective_mask);
  } else {
    return null;
  }
}
function coordinates_for(layer){
  // print("coordinates_for("+layer+")")
  var frame = [layer frame],
      gkrect = [GKRect rectWithRect:[layer rectByAccountingForStyleSize:[[layer absoluteRect] rect]]],
      absrect = [layer absoluteRect]

  var rulerDeltaX = [absrect rulerX] - [absrect x],
      rulerDeltaY = [absrect rulerY] - [absrect y],
      GKRectRulerX = [gkrect x] + rulerDeltaX,
      GKRectRulerY = [gkrect y] + rulerDeltaY,
      x = Math.round(GKRectRulerX),
      y = Math.round(GKRectRulerY)

  return {
    x: x,
    y: y,
    width:  [gkrect width],
    height: [gkrect height]
  }
}
function msg(msg){
  [doc showMessage:msg]
}
function save_file_from_string(filename,the_string) {
  // log("save_file_from_string()")
  if (DRY_RUN) {
    log("DRY_RUN, won't save file " + filename)
    return
  }

  var path = [@"" stringByAppendingString:filename],
      str = [@"" stringByAppendingString:the_string]

  [str writeToFile:path atomically:false encoding:NSUTF8StringEncoding error:null];
}
function view_should_be_extracted(view){
  // log("view_should_be_extracted("+view+")")
  r = [view className] == "MSLayerGroup" || is_artboard(view)
  return r
  // return ( [view isMemberOfClass:[MSLayerGroup class]] || is_artboard(view) || [view name].match(/\+/) )
}

// Classes
function MetadataExtractor(document){
  this.doc = document
  this.data = []
  this.views = extract_views_from_document(this.doc)
  this.hideArtboards = false
  this.parse()
}
MetadataExtractor.prototype.getViews = function(){
  return this.views
}
MetadataExtractor.prototype.getJSON = function(){
  return JSON.stringify(this.data, null, '\t')
}
MetadataExtractor.prototype.extract_metadata_from_view = function(view){
  // log("extract_metadata_from_view("+view+")")
  // var maskFrame = mask_bounds(view)
  var maskFrame = null

  var metadata = {
    id: "" + [view objectID],
    name: "" + [view name],
    maskFrame: maskFrame,
    layerFrame: {},
    image: {
      path: image_path_for_view(view),
      frame: {}
    },
    imageType: "png",
    modification: null
  }

  // Does view have subviews?
  if(has_subviews(view)){
    // log("View has subviews")
    var subviews = subviews_for_view(view),
        children_metadata = []

    for (var i = 0; i < subviews.length; i++) {
      var child = subviews[i]
      children_metadata.push(this.extract_metadata_from_view(child))
    }
    metadata.children = children_metadata
  } else {
    metadata.children = []
  }

  // Reset position for artboards:
  if (is_artboard(view)) {
    if(this.hideArtboards == false){
      metadata.visible = true
      this.hideArtboards = true
    } else {
      metadata.visible = false
    }
    var frame = [view frame]
    metadata.layerFrame.x = metadata.image.frame.x = 0
    metadata.layerFrame.y = metadata.image.frame.y = 0
    metadata.layerFrame.width = metadata.image.frame.width = [frame width]
    metadata.layerFrame.height = metadata.image.frame.height = [frame height]
  } else {
    metadata.visible = [view isVisible] ? true : false
    metadata.layerFrame = metadata.image.frame = coordinates_for(view)
  }

  // if ([layer name].indexOf("@@mask") != -1) {
  //   var _name = [layer name].replace("@@mask", "");
  //   print("Re-enabling mask " + _name);
  //   [layer setHasClippingMask:true];
  //   [layer setName:_name];
  // }

  return metadata
}
MetadataExtractor.prototype.parse = function(){
  for (var i = 0; i < this.views.length; i++) {
    var v = this.views[i]
    var metadata = this.extract_metadata_from_view(v)
    this.data.push(metadata)
  }
}
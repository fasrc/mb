var D = D || {};

D.manager = function() {

  this._websocket = null;
  this._controller = new D.controller(this);

  this._viewers = [];

  this._prev_viewer = null;
  this._viewer = null;
  this._next_viewer = null;

  this._contrast = 10;

  this.init();

};

D.manager.prototype.init = function() {

  // let's parse the url args
  var args = UTIL.parse_args();

  if (args['data']) {
    this._controller._data = args['data'];
  }


  this._websocket = new D.websocket(this);

  this.setup_controls();

};

D.manager.prototype.setup_controls = function() {

  $("#contrast").slider({
    range: "min",
    min: 10,
    max: 100,
    value: 10,
    slide: function(e, ui) {
      // $("#c_currentVal").html(ui.value);
      MANAGER._contrast = ui.value;
      MANAGER.update_parameters();
    }
  });

};

D.manager.prototype.update_parameters = function() {

  $(MANAGER._viewer.canvas.children[0]).css('webkit-filter','contrast('+(this._contrast)/10+')');

};

D.manager.prototype.update_tree = function(data) {

  $('#nav').tree({
    data: data,
    autoOpen: 0
  });

};

D.manager.prototype.setup_viewer = function(content) {

  this._content = content;

  for (var i=0; i<content.length; i++) {

    var that = this;

    content[i].getTileUrl = function( level, x, y ) {
      // in openseadragon:
      // 0: smallest
      // for us, 0 is the largest
      level = this.maxLevel - level;

      return "data/" + this.data_path + '/' + level + "-" + x + "-" + y + "-" + this.layer;
    
    }

  }

  this._page = 0;

  this._viewer = this.create_viewer(this._page, true);

  if (content.length > 1) {
    this._next_viewer = this.create_viewer(this._page+1, false);
  }

  // update data_path in the controller
  this._controller._data = content[0].data_path;

};

D.manager.prototype.create_viewer = function(page, visible) {
  
  // create dom element
  var container_id = 'viewer_'+page;
  if (!visible) {
    var style = 'z-index:0'//display:none';
  } else {
    var style = 'z-index:1';
  }

  $('#viewers').append('<div id="'+container_id+'" class="viewers" style="'+style+'"></div>');

  return OpenSeadragon({
      id:            container_id,
      prefixUrl:     "images/",
      navigatorSizeRatio: 0.25,
      // preserveViewport: true,
      // sequenceMode:   false,
      maxZoomPixelRatio: 10,
      showFullPageControl: false,
      imageLoaderLimit: 3,
      // showNavigator: true,
      tileSources:   this._content[page]
    });

};



D.manager.prototype.move = function(sign) {

  if (this._page + 1*sign >= this._content.length) {
    console.log('reached right end');
    return;
  } else if (this._page + 1*sign < 0) {
    console.log('reached left end');
    return;
  }

  var old_container = '#viewer_'+this._page;
  this._page += 1*sign;
  var new_container = '#viewer_'+this._page;
  
  // 
  this._controller._data = this._content[this._page].data_path;


  if (sign > 0) {
    // moving to next

    // we destroy the old previous viewer
    if (this._prev_viewer) {
      this._prev_viewer.destroy();
      // console.log('freeing previous viewer');
    }

    // the prev viewer is set to the current one
    var old_viewer = this._viewer;
    this._prev_viewer = this._viewer;
    // the current viewer is set to the next one
    this._viewer = this._next_viewer;
    // and the next viewer shall be a new one
    if (this._page+1 >= this._content.length) {
      this._next_viewer = null;
    } else {
      this._next_viewer = this.create_viewer(this._page+1, false);  
    }
    

  } else {
    // moving to prev

    // we destroy the old next viewer
    if (this._next_viewer) {
      this._next_viewer.destroy();
      // console.log('freeing next viewer');
    }

    // the next viewer is set to the current one
    var old_viewer = this._viewer;
    this._next_viewer = this._viewer;
    // the current viewer is set to the previous one
    this._viewer = this._prev_viewer;
    // and the previous viewer shall be a new one
    if (this._page-1 < 0) {
      this._prev_viewer = null;
    } else {
      this._prev_viewer = this.create_viewer(this._page-1, false);
    }

  }

  this._viewer.viewport.panTo(old_viewer.viewport.getCenter(), true);
  this._viewer.viewport.zoomTo(old_viewer.viewport.getZoom(), null, true);

  $(new_container).css('z-index', 1);    
  $(old_container).css('z-index', 0);

  this.update_parameters();

};

D.manager.prototype.prev = function() {
  

  var old_container = '#viewer_'+this._page;
  this._page--;
  var new_container = '#viewer_'+this._page;
  
  // 
  this._controller._data = this._content[this._page].data_path;
  // CCC[this._page].width = CCC[0].width
  // CCC[this._page].height = CCC[0].height
  // CCC[this._page].layer = 0;

  // this._viewer.destroy();

  // var new_viewer = this.create_viewer(this._page, false);

  this._viewers.push(this.create_viewer(this._page-1, false));

  $(new_container).show();
  $(old_container).hide();

};


D.manager.prototype.refresh_viewer = function() {

  console.log('Refreshing');
  this._viewer.world.resetItems();

};
var FeaturedListingsSlider = {
  init: function() {
    this.featuredListingsSliders = new Array();
    $$('div.app-featured-listings-slider').each(function(show) {
      FeaturedListingsSlider.featuredListingsSliders.push(FeaturedListingsSlider.featuredListingsSliderInstance(show));
    });
  },
  featuredListingsSliderInstance: function(featuredListingsSliderEl) {
    var showObject = {
      init: function(featuredListingsSliderBox) {
        this.controlToFeatureMap = new Hash();
        this.delay = 4 * 1000;
        this.screenEl = featuredListingsSliderBox.getElements('div.screen')[0];
        this.activeControlIndex = -1;
        
        var thisRef = this;
        var featureEls = featuredListingsSliderBox.getElements('div.features')[0].getElements('div.feature');
        this.controlEls = featuredListingsSliderBox.getElements('div.controls')[0].getElements('a');
        this.controlElsCount = this.controlEls.length;
        this.controlEls.each(function(control, index) { thisRef._observeFeature(featureEls[index], control); });
        this._restart();
      },
      // Causes a restart, so that the user gets a chance to look at the feature if it is clicked intentionally
      show: function(feature, control) {
        this._showFeature(feature, control, this.controlEls.indexOf(control));
        this._restart();
      },
      _showFeature: function(feature, control, index) {
        if (this.activeFeatureControl) this.activeFeatureControl.removeClass('showing');
    	  new Fx.Scroll(this.screenEl, {wheelStops: false}).toElement(feature);
        this.activeFeatureControl = control;
        this.activeFeatureControl.addClass('showing');
        this.activeControlIndex = index;
      },
      _observeFeature: function(feature, control) {
        var thisRef = this;  
        this.controlToFeatureMap.set(control.id, feature);
        control.addEvent('click', function() { thisRef.show(feature, control); });
        if (control.hasClass('showing')) { 
          thisRef.show(thisRef.controlToFeatureMap.get(control.id), control)
        }
      },
      _jump: function(addIndex) {
        var f = this.activeControlIndex + addIndex; 
        if (f >= this.controlElsCount) { f = 0; }
        else if (f < 0) { f = this.controlElsCount - 1; }
        var control = this.controlEls[f];
        this._showFeature(this.controlToFeatureMap.get(control.id), control, f);
      },
      _next: function() { this._jump(1); },
      _restart: function() { this._stop(); this._start(); },
      _stop: function() { if (this.timer) { $clear(this.timer); this.timer = null; } },
      _start: function() { var thisRef = this; this.timer = (function(){thisRef._next();}).periodical(thisRef.delay); }
    };
    showObject.init(featuredListingsSliderEl);
    return showObject;
  }
}
FeaturedListingsSlider.init();
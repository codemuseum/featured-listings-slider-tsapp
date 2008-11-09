// Parses the features form correctly for a featuredListingsSlider editor.  
// Also requires PictureSelect to be included; and register each feature with picture select

var FeaturedListingsSliderEdit = {
  init: function() {
    var featuredListingsSliderEls = $$('div.app-featured-listings-slider');
    this.featuredListingsSliders = new Array();
    featuredListingsSliderEls.each(function(show) {
      FeaturedListingsSliderEdit.featuredListingsSliders.push(FeaturedListingsSliderEdit.featuredListingsSliderInstance(show));
    });
  },
  findByUrn: function(urn) { return this.featuredListingsSliders.detect(function(i) { return i.urn == urn; }); },
  
  featuredListingsSliderInstance: function(featuredListingsSliderEl) {
    var showObject = {
      init: function(featuredListingsSliderBox) {
        this.controlToFeatureMap = new Hash();
        var urnEl = featuredListingsSliderBox.getElementsBySelector('div.box')[0];
        this.urn = urnEl.className.substring(urnEl.className.indexOf('urn-') + 'urn-'.length);
        
        this.featuresEl = featuredListingsSliderBox.getElementsBySelector('div.features')[0];
        this.featureControlsEl = featuredListingsSliderBox.getElementsBySelector('div.controls')[0];
        this.screenEl = featuredListingsSliderBox.getElementsBySelector('div.screen')[0];
        var creationCode = this._extractCreationCode(featuredListingsSliderBox.getElementsBySelector('div.new-feature-code')[0]);
        var controlCreationCode = this._extractCreationCode(featuredListingsSliderBox.getElementsBySelector('div.new-feature-control-code')[0]);
        this.featureLinkHtml = this._extractCreationCode(featuredListingsSliderBox.getElementsBySelector('div.new-feature-link-code')[0]);;
        this.newFeatureControl = featuredListingsSliderBox.getElementsBySelector('.add-feature')[0];
      
        var thisRef = this;
        this.featureEls = this.featuresEl.getElementsBySelector('div.feature');
        var controlEls = this.featureControlsEl.getElementsBySelector('a');
        this.featureCount = this.featureEls.size();
        this.featureEls.each(function(feature, index) { thisRef._observeFeature(feature, controlEls[index]); });
        this.newFeatureControl.observe('click', 
          function(ev) { Event.stop(ev); thisRef._addFeature(creationCode, controlCreationCode); thisRef._makeSortable(); });
        this._makeSortable();
        featuredListingsSliderBox.ancestors().detect(function(anc) { return anc.tagName == 'FORM' }).observe('submit', function(ev) { thisRef._saveOrder(); });
        
        // Go to marked feature to show
        controlEls.each(function(control) { if (control.hasClassName('showing')) { thisRef._showFeature(thisRef.controlToFeatureMap.get(control.id), control)}});
        
        // Read the request in
        //...new Ajax.Request(this.fetchable.sourceUrl, {asynchronous:true, evalScripts:true, method:'get'});
        
        featuredListingsSliderBox.getElementsBySelector('.datapath a').each(function(a) { a.observe('click', function() {
          featuredListingsSliderBox.getElementsBySelector('.datapath .readonly')[0].addClassName('hidden');
          featuredListingsSliderBox.getElementsBySelector('.datapath .editable')[0].removeClassName('hidden');
          featuredListingsSliderBox.getElementsBySelector('.datapath .editable input')[0].focus();
        }); });
        
        var selectorEl = featuredListingsSliderBox.getElementsBySelector('.selector')[0];
        this.createFetchable(selectorEl.getElementsBySelector('a.source')[0], selectorEl.getElementsBySelector('div.body')[0]);
        this.createPopdiv(selectorEl);
      },
      // Returns creation code from element and removes element from DOM tree
      _extractCreationCode: function(el) {
        var creationCode = el.innerHTML;
        el.remove();
        return creationCode;
      },
      _addFeature: function(html, controlHtml) {
        var newEl=this._featureEl(html, null);
        this.featuresEl.appendChild(newEl);
        var controlEl = $(document.createElement('div'));
        controlEl.update(controlHtml.replace(/_INDEX_/, this.featureCount));
        controlEl = controlEl.firstDescendant().remove();
        this.featureControlsEl.insertBefore(controlEl, this.newFeatureControl);
        
        this._observeFeature(newEl, controlEl);
        this.featureCount++;
        this._showFeature(newEl, controlEl);
        
        this.selectedFeatureItem = newEl; 
        this.popup();
        this.fetch();
      },
      _featureEl: function(html, values) {
        var newEl=$(document.createElement('div'));
        var newHtml = html.replace(/_INDEX_/, this.featureCount);
        if (values) {
          for (var m in values)
      			newHtml = newHtml.replace(new RegExp('_' + m.toUpperCase() + '_', 'g'), values[m]);
        }
        newEl.update(newHtml);
        return newEl.firstDescendant().remove();
      },
      _showFeature: function(feature, control) {
        this.screenEl.scrollLeft = feature.offsetLeft - this.screenEl.offsetLeft;
        if (this.activeFeatureControl) this.activeFeatureControl.removeClassName('showing');
        this.activeFeatureControl = control;
        this.activeFeatureControl.addClassName('showing');
      },
      _observeFeature: function(feature, control) {
        var thisRef = this;
        this.controlToFeatureMap.set(control.id, feature);
        control.observe('click', function() { thisRef._showFeature(feature, control); });
        var remove = feature.getElementsBySelector('.remove a')[0];
        remove.observe('click', function() { feature.remove(); control.remove(); thisRef.featureCount--; thisRef.controlToFeatureMap.unset(control.id); });
      },
      _makeSortable: function() {  
        Sortable.create(this.featureControlsEl, { only:'control', tag:'a', constraint:'horizontal' });
      },
      _saveOrder: function() {
        var currentPosition = 0;
        var thisRef = this;
        this.featureControlsEl.getElementsBySelector('a.control').each(function(control) {
          thisRef.controlToFeatureMap.get(control.id).getElementsBySelector('input.position-value')[0].value = currentPosition;
          currentPosition++;
        });
      },
      
      observeFetched: function(fetchedEl) { 
        var thisRef = this;
        fetchedEl.getElementsBySelector('a').each(function(elm) { elm.observe('click', function(ev) { 
          ev.stop(); 
          thisRef.selectFectched(elm); 
        }); });
      },
      
      fetchSuccessful: function(transport) {
        var data = transport.responseText.evalJSON();
        var thisRef = this;
        this.fetchable.listEl.update('');
        data.each(function(d) {
          var newEl = thisRef._featureEl(thisRef.featureLinkHtml, d);
          thisRef.fetchable.listEl.appendChild(newEl);
        });
        this.observeFetched(this.fetchable.listEl);
      },
      
      selectFectched: function(fetchedEl) {
        if (this.selectedFeatureItem) { 
          this.selectedFeatureItem.getElementsBySelector('a.feature-link')[0].remove();
          fetchedEl.remove();
          this.selectedFeatureItem.appendChild(fetchedEl);
          fetchedEl.stopObserving('click');
          fetchedEl.observe('click', function(ev) {ev.stop();});
          this.selectedFeatureItem.getElementsBySelector('input.urn-value')[0].value =
            fetchedEl.className.substring(fetchedEl.className.indexOf('urn-') + 'urn-'.length);
          
          this.selectedFeatureItem = null;
          
        }
        this.popdown();
      },
    };
    
    Object.extend(showObject, TS.Fetchable);
    Object.extend(showObject, TS.Popdiv);
    showObject.init(featuredListingsSliderEl);
    return showObject;
  }
}
FeaturedListingsSliderEdit.init();
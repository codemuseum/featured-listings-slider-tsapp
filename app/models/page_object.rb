class PageObject < ActiveRecord::Base
  include ThriveSmartObjectMethods
  self.caching_default = 'interval[5]' #[in :forever, :page_update, :any_page_update, 'data_update[datetimes]', :never, 'interval[5]']

  has_many :features, :order => :position, :dependent => :destroy
  attr_accessor :added_features
  
  validates_associated :features

  after_save :save_features
  
  
  def validate
    unless self.added_features.nil?
      self.added_features.each do |feature|
        unless feature.valid?
          errors.add(:features, " have an error that must be corrected")
        end
      end
    end
  end
  
  # Override caching information to be on data_update of the data path
  def caching
    @caching = "data_update[#{data_path}]"
  end
  
  def fetch_data(attrs = {})
    data = self.organization.find_data(self.data_path, 
      :include => [:url, :name, :description, :picture], 
      :conditions => { :urn => features.map(&:urn).concat((added_features || []).map(&:urn)) })
      
    features.each { |f| f.grab_listing(data) }
  end
  
  # Responsible for removing and adding all features to this page_object. The general flow is:
  #  If the feature isn't a part of the features array already, save to added_features for after_save
  #  If the feature is missing from the array, mark it to be removed for after_save 
  def assigned_features=(array_hash)
    # Find new features (but no duplicates)
    self.added_features = []
    array_hash.each do |h|
      unless features.detect { |c| c.id.to_s == h[:id] } || self.added_features.detect { |f| f.id.to_s == h[:id] }
        c = !h[:id].blank? ? Feature.find(h[:id]) : Feature.new({:page_object => self})
        c.attributes = h.reject { |k,v| k == :id } # input values, but don't try to overwrite the id
        self.added_features << c unless c.nil?
      end
    end
    # Delete removed features
    features.each do |c|
      if h = array_hash.detect { |h| h[:id] == c.id.to_s }
        c.attributes = h.reject { |k,v| k == :id }
      else
        c.destroy_association = 1
      end
    end
  end
  
  protected
    
    # Destroy features marked for deletion, and adds features marked for addition.
    # Done this way to account for association auto-saves.
    def save_features
      self.features.each { |c| if c.destroy_association? then c.destroy else c.save end }
      self.added_features.each { |c| c.save unless c.nil? } unless self.added_features.nil?
    end
end

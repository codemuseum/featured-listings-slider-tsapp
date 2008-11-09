class Feature < ActiveRecord::Base
  belongs_to :page_object
  
  validates_presence_of :urn
  
  attr_accessor :url, :name, :description, :picture
  

  
  def grab_listing(listing_data)
    listing_data.each { |l| copy_listing(l) if l.urn == self.urn }
  end
  
  ###### Association Specific Code

  # Used for other models that might need to mark a slide as *no longer* associated 
  attr_accessor :destroy_association

  # Used for other models (like an page_object) that might need to mark this slide as *no longer* associated
  def destroy_association?
    destroy_association.to_i == 1
  end
  
  protected
  
  def copy_listing(listing)
    self.url = listing.url rescue nil
    self.name = listing.name rescue nil
    self.description = listing.description rescue nil
    self.picture = listing.picture rescue nil
  end
end

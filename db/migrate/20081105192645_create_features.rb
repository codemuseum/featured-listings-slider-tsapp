class CreateFeatures < ActiveRecord::Migration
  def self.up
    create_table :features do |t|
      t.references :page_object
      t.string :urn
      t.integer :position
    
      t.timestamps
    end
    add_index :features, :page_object_id
    add_index :features, :position
  end

  def self.down
    drop_table :features
  end
end

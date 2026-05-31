class CreateItems < ActiveRecord::Migration[8.1]
  def change
    create_table :items do |t|
      t.string :name
      t.string :category
      t.integer :low
      t.integer :high
      t.string :unit
      t.string :source

      t.timestamps
    end
  end
end

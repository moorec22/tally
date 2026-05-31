class CreateInventorySnapshots < ActiveRecord::Migration[8.1]
  def change
    create_table :inventory_snapshots do |t|
      t.references :item, null: false, foreign_key: true
      t.integer :value, null: false
      t.text :note

      t.timestamps
    end
  end
end

class RenameItemsSourceToPreferredSource < ActiveRecord::Migration[8.1]
  def change
    rename_column :items, :source, :preferred_source
  end
end

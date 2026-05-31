class Item < ApplicationRecord
  has_many :inventory_snapshots
end

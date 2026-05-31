class Item < ApplicationRecord
  has_many :inventory_snapshots

  validates :low, numericality: { only_integer: true, allow_nil: true }
  validates :high, numericality: { only_integer: true, allow_nil: true }
end

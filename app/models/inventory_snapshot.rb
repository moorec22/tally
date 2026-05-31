class InventorySnapshot < ApplicationRecord
  belongs_to :item

  validates :value, presence: true
end

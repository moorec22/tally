class InventorySnapshot < ApplicationRecord
  belongs_to :item

  validates :value, presence: true
  validates :value, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, if: -> { value.present? }
end

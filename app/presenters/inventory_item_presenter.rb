class InventoryItemPresenter
  def initialize(item, latest_snapshot:)
    @item = item
    @latest_snapshot = latest_snapshot
  end

  def as_json(*)
    {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      source: item.source,
      low: item.low,
      high: item.high,
      value: latest_snapshot&.value,
      last_updated_at: latest_snapshot&.updated_at&.iso8601
    }
  end

  private

  attr_reader :item, :latest_snapshot
end

class InventorySnapshotPresenter
  def initialize(inventory_snapshot)
    @inventory_snapshot = inventory_snapshot
  end

  def as_json(*)
    {
      id: inventory_snapshot.id,
      item_id: inventory_snapshot.item_id,
      value: inventory_snapshot.value,
      note: inventory_snapshot.note,
      created_at: inventory_snapshot.created_at.iso8601,
      updated_at: inventory_snapshot.updated_at.iso8601
    }
  end

  private

  attr_reader :inventory_snapshot
end

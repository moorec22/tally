require "rails_helper"

RSpec.describe InventorySnapshotPresenter do
  it "includes snapshot fields" do
    item = Item.create!(name: "Printer Paper")
    inventory_snapshot = InventorySnapshot.create!(
      item:,
      value: 12,
      note: "Counted shelf stock"
    )

    presented_snapshot = described_class.new(inventory_snapshot).as_json

    expect(presented_snapshot).to eq(
      id: inventory_snapshot.id,
      item_id: item.id,
      value: 12,
      note: "Counted shelf stock",
      created_at: inventory_snapshot.created_at.iso8601,
      updated_at: inventory_snapshot.updated_at.iso8601
    )
  end

  it "formats timestamps as ISO8601" do
    item = Item.create!(name: "Printer Paper")
    inventory_snapshot = InventorySnapshot.create!(item:, value: 12)

    presented_snapshot = described_class.new(inventory_snapshot).as_json

    expect(presented_snapshot[:created_at]).to eq(inventory_snapshot.created_at.iso8601)
    expect(presented_snapshot[:updated_at]).to eq(inventory_snapshot.updated_at.iso8601)
  end
end

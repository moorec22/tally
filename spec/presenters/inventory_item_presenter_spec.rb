require "rails_helper"

RSpec.describe InventoryItemPresenter do
  it "includes item fields" do
    item = Item.create!(
      name: "Printer Paper",
      category: "Office",
      unit: "reams",
      source: "Supply Closet",
      low: 5,
      high: 30
    )
    snapshot = InventorySnapshot.create!(item:, value: 12)

    presented_item = described_class.new(item, latest_snapshot: snapshot).as_json

    expect(presented_item).to include(
      id: item.id,
      name: "Printer Paper",
      category: "Office",
      unit: "reams",
      source: "Supply Closet",
      low: 5,
      high: 30
    )
  end

  it "uses the latest snapshot value" do
    item = Item.create!(name: "Printer Paper")
    InventorySnapshot.create!(item:, value: 12, created_at: 2.days.ago)
    older_snapshot = InventorySnapshot.create!(item:, value: 18, created_at: 1.day.ago)
    latest_snapshot = InventorySnapshot.create!(item:, value: 20, created_at: older_snapshot.created_at)

    presented_item = described_class.new(item, latest_snapshot: latest_snapshot).as_json

    expect(presented_item[:value]).to eq(20)
  end

  it "uses nil for value when there is no snapshot" do
    item = Item.create!(name: "Printer Paper")

    presented_item = described_class.new(item, latest_snapshot: nil).as_json

    expect(presented_item[:value]).to be_nil
  end
end

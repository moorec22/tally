require "rails_helper"

RSpec.describe InventorySnapshot, type: :model do
  it "belongs to an item" do
    item = Item.create!(name: "Printer Paper")
    snapshot = described_class.create!(item: item, value: 12)

    expect(snapshot.item).to eq(item)
    expect(item.inventory_snapshots).to contain_exactly(snapshot)
  end

  it "requires a value" do
    item = Item.create!(name: "Printer Paper")
    snapshot = described_class.new(item: item, value: nil)

    expect(snapshot).not_to be_valid
    expect(snapshot.errors[:value]).to include("can't be blank")
  end
end

require "rails_helper"

RSpec.describe "Items", type: :request do
  describe "GET /api/v1/items/:id" do
    it "returns the presented item with the latest snapshot value" do
      item = Item.create!(
        name: "Printer Paper",
        category: "Office",
        unit: "reams",
        source: "Supply Closet",
        low: 5,
        high: 30
      )
      InventorySnapshot.create!(item:, value: 12, created_at: 2.days.ago)
      same_time_snapshot = InventorySnapshot.create!(item:, value: 18, created_at: 1.day.ago)
      latest_snapshot = InventorySnapshot.create!(item:, value: 20, created_at: same_time_snapshot.created_at)

      get item_path(item)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq(
        "id" => item.id,
        "name" => "Printer Paper",
        "category" => "Office",
        "unit" => "reams",
        "source" => "Supply Closet",
        "low" => 5,
        "high" => 30,
        "value" => latest_snapshot.value
      )
    end

    it "returns null value when the item has no snapshots" do
      item = Item.create!(name: "Printer Paper")

      get item_path(item)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["value"]).to be_nil
    end

    it "returns not found for a missing item" do
      get item_path(id: 123_456)

      expect(response).to have_http_status(:not_found)
    end
  end
end

require "rails_helper"

RSpec.describe "Items", type: :request do
  describe "GET /api/v1/items" do
    it "returns all items with their latest snapshot values ordered by name and id" do
      markers = Item.create!(name: "Markers", category: "Office", unit: "boxes")
      paper = Item.create!(name: "Printer Paper", category: "Office", unit: "reams")
      tape = Item.create!(name: "Tape", category: "Packing", unit: "rolls")
      InventorySnapshot.create!(item: paper, value: 12, created_at: 2.days.ago)
      same_time_snapshot = InventorySnapshot.create!(item: paper, value: 18, created_at: 1.day.ago)
      latest_snapshot = InventorySnapshot.create!(item: paper, value: 20, created_at: same_time_snapshot.created_at)
      tape_snapshot = InventorySnapshot.create!(item: tape, value: 4)

      get items_path

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq(
        [
          {
            "id" => markers.id,
            "name" => "Markers",
            "category" => "Office",
            "unit" => "boxes",
            "source" => nil,
            "low" => nil,
            "high" => nil,
            "value" => nil,
            "last_updated_at" => nil
          },
          {
            "id" => paper.id,
            "name" => "Printer Paper",
            "category" => "Office",
            "unit" => "reams",
            "source" => nil,
            "low" => nil,
            "high" => nil,
            "value" => latest_snapshot.value,
            "last_updated_at" => latest_snapshot.updated_at.iso8601
          },
          {
            "id" => tape.id,
            "name" => "Tape",
            "category" => "Packing",
            "unit" => "rolls",
            "source" => nil,
            "low" => nil,
            "high" => nil,
            "value" => tape_snapshot.value,
            "last_updated_at" => tape_snapshot.updated_at.iso8601
          }
        ]
      )
    end
  end

  describe "GET /api/v1/items/:id" do
    it "returns the presented item with the latest snapshot value" do
      item = Item.create!(
        name: "Printer Paper",
        category: "Office",
        unit: "reams",
        preferred_source: "Supply Closet",
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
        "preferred_source" => "Supply Closet",
        "low" => 5,
        "high" => 30,
        "value" => latest_snapshot.value,
        "last_updated_at" => latest_snapshot.updated_at.iso8601
      )
    end

    it "returns null value when the item has no snapshots" do
      item = Item.create!(name: "Printer Paper")

      get item_path(item)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["value"]).to be_nil
      expect(response.parsed_body["last_updated_at"]).to be_nil
    end

    it "returns not found for a missing item" do
      get item_path(id: 123_456)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/items/:id" do
    it "updates editable item fields and returns the presented item" do
      item = Item.create!(
        name: "Printer Paper",
        category: "Office",
        unit: "reams",
        preferred_source: "Supply Closet",
        low: 5,
        high: 30
      )
      latest_snapshot = InventorySnapshot.create!(item:, value: 20)

      patch item_path(item), params: {
        item: {
          category: "Warehouse",
          unit: "boxes",
          preferred_source: "Aisle 4",
          low: 2,
          high: 40
        }
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq(
        "id" => item.id,
        "name" => "Printer Paper",
        "category" => "Warehouse",
        "unit" => "boxes",
        "preferred_source" => "Aisle 4",
        "low" => 2,
        "high" => 40,
        "value" => latest_snapshot.value,
        "last_updated_at" => latest_snapshot.updated_at.iso8601
      )
      expect(item.reload).to have_attributes(
        category: "Warehouse",
        unit: "boxes",
        preferred_source: "Aisle 4",
        low: 2,
        high: 40
      )
    end

    it "does not update unpermitted fields" do
      item = Item.create!(name: "Printer Paper", unit: "reams")

      patch item_path(item), params: {
        item: {
          name: "Copy Paper",
          unit: "boxes"
        }
      }

      expect(response).to have_http_status(:ok)
      expect(item.reload).to have_attributes(
        name: "Printer Paper",
        unit: "boxes"
      )
    end

    it "allows nullable threshold values" do
      item = Item.create!(name: "Printer Paper", low: 5, high: 30)

      patch item_path(item), params: {
        item: {
          low: nil,
          high: nil
        }
      }

      expect(response).to have_http_status(:ok)
      expect(item.reload).to have_attributes(low: nil, high: nil)
      expect(response.parsed_body["low"]).to be_nil
      expect(response.parsed_body["high"]).to be_nil
    end

    it "returns validation errors for non-integer thresholds" do
      item = Item.create!(name: "Printer Paper", low: 5, high: 30)

      patch item_path(item), params: {
        item: {
          low: "low",
          high: "30.5"
        }
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include("low", "high")
      expect(item.reload).to have_attributes(low: 5, high: 30)
    end

    it "returns not found for a missing item" do
      patch item_path(id: 123_456), params: { item: { unit: "boxes" } }

      expect(response).to have_http_status(:not_found)
    end
  end
end

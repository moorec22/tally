require "rails_helper"

RSpec.describe "Inventory snapshots", type: :request do
  describe "POST /api/v1/items/:item_id/inventory_snapshots" do
    it "creates a snapshot for the item and returns the presented snapshot" do
      item = Item.create!(name: "Printer Paper")

      post item_inventory_snapshots_path(item), params: {
        inventory_snapshot: {
          value: 24,
          note: "Counted shelf stock"
        }
      }

      inventory_snapshot = InventorySnapshot.last

      expect(response).to have_http_status(:created)
      expect(inventory_snapshot).to have_attributes(
        item:,
        value: 24,
        note: "Counted shelf stock"
      )
      expect(response.parsed_body).to eq(
        "id" => inventory_snapshot.id,
        "item_id" => item.id,
        "value" => 24,
        "note" => "Counted shelf stock",
        "created_at" => inventory_snapshot.created_at.iso8601,
        "updated_at" => inventory_snapshot.updated_at.iso8601
      )
    end

    it "persists a blank note when one is not provided" do
      item = Item.create!(name: "Printer Paper")

      post item_inventory_snapshots_path(item), params: {
        inventory_snapshot: {
          value: 24
        }
      }

      inventory_snapshot = InventorySnapshot.last

      expect(response).to have_http_status(:created)
      expect(inventory_snapshot.note).to be_nil
      expect(response.parsed_body["note"]).to be_nil
    end

    it "returns validation errors when value is missing" do
      item = Item.create!(name: "Printer Paper")

      expect do
        post item_inventory_snapshots_path(item), params: {
          inventory_snapshot: {
            note: "Counted shelf stock"
          }
        }
      end.not_to change(InventorySnapshot, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include("value")
    end

    it "returns not found for a missing item" do
      post item_inventory_snapshots_path(item_id: 123_456), params: {
        inventory_snapshot: {
          value: 24
        }
      }

      expect(response).to have_http_status(:not_found)
    end
  end
end

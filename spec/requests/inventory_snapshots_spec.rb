require "rails_helper"

RSpec.describe "Inventory snapshots", type: :request do
  describe "POST /api/v1/inventory_snapshots/bulk" do
    it "creates multiple snapshots and returns the presented snapshots" do
      paper = Item.create!(name: "Printer Paper")
      tape = Item.create!(name: "Packing Tape")

      post bulk_inventory_snapshots_path, params: {
        inventory_snapshots: [
          { item_id: paper.id, value: 24, note: "Counted shelf stock" },
          { item_id: tape.id, value: 8 }
        ]
      }

      snapshots = InventorySnapshot.order(:id)

      expect(response).to have_http_status(:created)
      expect(snapshots.map { |snapshot| [ snapshot.item_id, snapshot.value, snapshot.note ] }).to eq(
        [
          [ paper.id, 24, "Counted shelf stock" ],
          [ tape.id, 8, nil ]
        ]
      )
      expect(response.parsed_body).to eq(
        snapshots.map do |snapshot|
          {
            "id" => snapshot.id,
            "item_id" => snapshot.item_id,
            "value" => snapshot.value,
            "note" => snapshot.note,
            "created_at" => snapshot.created_at.iso8601,
            "updated_at" => snapshot.updated_at.iso8601
          }
        end
      )
    end

    it "allows blank notes" do
      item = Item.create!(name: "Printer Paper")

      post bulk_inventory_snapshots_path, params: {
        inventory_snapshots: [
          { item_id: item.id, value: 24, note: "" }
        ]
      }

      expect(response).to have_http_status(:created)
      expect(InventorySnapshot.last.note).to eq("")
    end

    it "rejects invalid values without partial creation" do
      paper = Item.create!(name: "Printer Paper")
      tape = Item.create!(name: "Packing Tape")

      expect do
        post bulk_inventory_snapshots_path, params: {
          inventory_snapshots: [
            { item_id: paper.id, value: 24 },
            { item_id: tape.id, value: -1 }
          ]
        }
      end.not_to change(InventorySnapshot, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]["1"]).to include("value")
    end

    it "rejects missing items without partial creation" do
      item = Item.create!(name: "Printer Paper")

      expect do
        post bulk_inventory_snapshots_path, params: {
          inventory_snapshots: [
            { item_id: item.id, value: 24 },
            { item_id: 123_456, value: 10 }
          ]
        }
      end.not_to change(InventorySnapshot, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include("item_id")
    end
  end

  describe "POST /api/v1/items/:item_id/inventory_snapshots" do
    it "is not routable" do
      item = Item.create!(name: "Printer Paper")

      expect do
        Rails.application.routes.recognize_path(
          "/api/v1/items/#{item.id}/inventory_snapshots",
          method: :post
        )
      end.to raise_error(ActionController::RoutingError)
    end
  end
end

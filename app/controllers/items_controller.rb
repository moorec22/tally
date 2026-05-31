class ItemsController < ApplicationController
  def show
    item = Item.find(params[:id])
    latest_snapshot = item.inventory_snapshots.order(created_at: :desc, id: :desc).first

    @inventory_item_presenter = InventoryItemPresenter.new(item, latest_snapshot:)

    render json: @inventory_item_presenter.as_json
  end
end

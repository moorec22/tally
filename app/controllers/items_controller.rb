class ItemsController < ApplicationController
  def show
    item = Item.find(params[:id])
    render json: presented_item(item)
  end

  def update
    item = Item.find(params[:id])

    if item.update(item_params)
      render json: presented_item(item)
    else
      render json: { errors: item.errors.to_hash }, status: :unprocessable_content
    end
  end

  private

  def presented_item(item)
    latest_snapshot = item.inventory_snapshots.order(created_at: :desc, id: :desc).first
    @inventory_item_presenter = InventoryItemPresenter.new(item, latest_snapshot:)

    @inventory_item_presenter.as_json
  end

  def item_params
    params.require(:item).permit(:unit, :low, :high, :category, :source)
  end
end

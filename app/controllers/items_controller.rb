class ItemsController < ApplicationController
  def index
    items = Item.order(:name, :id)
    latest_snapshots_by_item_id = latest_snapshots_by_item_id(items)
    presented_items = items.map do |item|
      InventoryItemPresenter
        .new(item, latest_snapshot: latest_snapshots_by_item_id[item.id])
        .as_json
    end

    render json: presented_items
  end

  def show
    item = Item.find(params[:id])
    render json: presented_item(item)
  end

  def create
    item = Item.new(create_item_params)

    if item.save
      render json: presented_item(item), status: :created
    else
      render json: { errors: item.errors.to_hash }, status: :unprocessable_content
    end
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

  def latest_snapshots_by_item_id(items)
    InventorySnapshot
      .where(item: items)
      .select("DISTINCT ON (item_id) inventory_snapshots.*")
      .order(:item_id, created_at: :desc, id: :desc)
      .index_by(&:item_id)
  end

  def create_item_params
    params.require(:item).permit(:name, :unit, :low, :high, :category, :preferred_source)
  end

  def item_params
    params.require(:item).permit(:unit, :low, :high, :category, :preferred_source)
  end
end

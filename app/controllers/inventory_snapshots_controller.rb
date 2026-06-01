class InventorySnapshotsController < ApplicationController
  def create
    item = Item.find(params[:item_id])
    inventory_snapshot = item.inventory_snapshots.build(inventory_snapshot_params)

    if inventory_snapshot.save
      inventory_snapshot_presenter = InventorySnapshotPresenter.new(inventory_snapshot)

      render json: inventory_snapshot_presenter.as_json, status: :created
    else
      render json: { errors: inventory_snapshot.errors.to_hash }, status: :unprocessable_content
    end
  end

  private

  def inventory_snapshot_params
    params.require(:inventory_snapshot).permit(:value, :note)
  end
end

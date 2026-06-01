class InventorySnapshotsController < ApplicationController
  def bulk
    snapshot_attributes = inventory_snapshots_params
    item_ids = snapshot_attributes.map { |snapshot_params| snapshot_params[:item_id].to_i }
    items_by_id = Item.where(id: item_ids).index_by(&:id)
    inventory_snapshots = snapshot_attributes.map do |snapshot_params|
      item = items_by_id[snapshot_params[:item_id].to_i]
      InventorySnapshot.new(
        item:,
        value: snapshot_params[:value],
        note: snapshot_params[:note]
      )
    end

    missing_item_ids = item_ids.uniq - items_by_id.keys
    errors = bulk_errors(inventory_snapshots, missing_item_ids)

    if errors.any?
      render json: { errors: }, status: :unprocessable_content
      return
    end

    InventorySnapshot.transaction do
      inventory_snapshots.each(&:save!)
    end

    render json: inventory_snapshots.map { |inventory_snapshot|
      InventorySnapshotPresenter.new(inventory_snapshot).as_json
    }, status: :created
  end

  private

  def inventory_snapshots_params
    params.require(:inventory_snapshots).map do |snapshot_params|
      snapshot_params.permit(:item_id, :value, :note)
    end
  end

  def bulk_errors(inventory_snapshots, missing_item_ids)
    errors = {}
    errors[:item_id] = [ "must reference an existing item" ] if missing_item_ids.any?

    inventory_snapshots.each_with_index do |inventory_snapshot, index|
      next if inventory_snapshot.valid?

      errors[index] = inventory_snapshot.errors.to_hash
    end

    errors
  end
end

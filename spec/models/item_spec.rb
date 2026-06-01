require "rails_helper"

RSpec.describe Item, type: :model do
  it "allows blank low and high thresholds" do
    item = described_class.new(name: "Printer Paper", low: nil, high: nil)

    expect(item).to be_valid
  end

  it "requires a name" do
    item = described_class.new(name: "")

    expect(item).not_to be_valid
    expect(item.errors[:name]).to include("can't be blank")
  end

  it "requires low and high thresholds to be integers when present" do
    item = described_class.new(name: "Printer Paper", low: 1.5, high: "many")

    expect(item).not_to be_valid
    expect(item.errors[:low]).to include("must be an integer")
    expect(item.errors[:high]).to include("is not a number")
  end
end

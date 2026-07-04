require "rails_helper"

RSpec.describe AccountPresenter do
  describe "#as_json" do
    it "returns the frontend account payload" do
      user = User.create!(email_address: "owner@example.com", password: "password")

      expect(described_class.new(user).as_json).to eq(
        id: user.id,
        email_address: "owner@example.com"
      )
    end
  end
end

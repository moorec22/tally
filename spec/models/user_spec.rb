require "rails_helper"

RSpec.describe User, type: :model do
  it "normalizes email addresses before saving" do
    user = described_class.create!(
      email_address: " Owner@Example.COM ",
      password: "password"
    )

    expect(user.email_address).to eq("owner@example.com")
  end

  it "authenticates by email address and password" do
    user = described_class.create!(
      email_address: "owner@example.com",
      password: "password"
    )

    expect(described_class.authenticate_by(
      email_address: "owner@example.com",
      password: "password"
    )).to eq(user)
    expect(described_class.authenticate_by(
      email_address: "owner@example.com",
      password: "wrong-password"
    )).to be_nil
  end
end

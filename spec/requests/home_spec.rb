require "rails_helper"

RSpec.describe "Home", type: :request do
  let(:user) { User.create!(email_address: "owner@example.com", password: "password") }

  it "redirects unauthenticated root requests to sign in" do
    get root_path

    expect(response).to redirect_to("/sign-in")
  end

  it "renders the React mount point for signed-in root requests" do
    sign_in_as(user)

    get root_path

    expect(response).to have_http_status(:ok)
    expect(response.body).to include(%(id="root"))
  end

  it "renders the React mount point for signed-in item pages" do
    sign_in_as(user)
    item = Item.create!(name: "Printer Paper")

    get "/items/#{item.id}"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include(%(id="root"))
  end

  it "renders the React mount point for the sign-in page" do
    get "/sign-in"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include(%(id="root"))
  end
end

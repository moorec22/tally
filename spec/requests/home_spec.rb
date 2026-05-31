require "rails_helper"

RSpec.describe "Home", type: :request do
  it "renders the React mount point" do
    get root_path

    expect(response).to have_http_status(:ok)
    expect(response.body).to include(%(id="root"))
  end
end

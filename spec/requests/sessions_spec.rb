require "rails_helper"

RSpec.describe "Sessions", type: :request do
  describe "GET /api/v1/session" do
    it "returns the current account" do
      user = User.create!(email_address: "owner@example.com", password: "password")
      sign_in_as(user)

      get session_path

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq(
        "account" => {
          "id" => user.id,
          "email_address" => "owner@example.com"
        }
      )
    end

    it "returns unauthorized when no account is signed in" do
      get session_path

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq("error" => "Authentication required")
    end
  end

  describe "POST /api/v1/session" do
    it "signs in with valid credentials" do
      user = User.create!(email_address: "owner@example.com", password: "password")

      post session_path, params: {
        email_address: "owner@example.com",
        password: "password"
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq(
        "account" => {
          "id" => user.id,
          "email_address" => "owner@example.com"
        }
      )
      expect(Session.last.user).to eq(user)
    end

    it "returns unauthorized for invalid credentials" do
      User.create!(email_address: "owner@example.com", password: "password")

      post session_path, params: {
        email_address: "owner@example.com",
        password: "wrong-password"
      }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq("error" => "Invalid email/password")
    end
  end

  describe "DELETE /api/v1/session" do
    it "signs out the current account" do
      user = User.create!(email_address: "owner@example.com", password: "password")
      sign_in_as(user)

      expect do
        delete session_path
      end.to change(Session, :count).by(-1)

      expect(response).to have_http_status(:no_content)
      get session_path
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

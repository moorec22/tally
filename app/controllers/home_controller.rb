class HomeController < ApplicationController
  allow_unauthenticated_access only: :index
  before_action :require_authentication, unless: :sign_in_path?

  def index
  end

  private

  def sign_in_path?
    request.path == "/sign-in"
  end
end

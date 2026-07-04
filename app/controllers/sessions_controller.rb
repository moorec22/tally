class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ create ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> {
    render json: { error: "Try again later." }, status: :too_many_requests
  }

  def show
    account_presenter = AccountPresenter.new(Current.user)

    render json: { account: account_presenter.as_json }
  end

  def create
    if user = User.authenticate_by(params.permit(:email_address, :password))
      start_new_session_for user
      account_presenter = AccountPresenter.new(user)

      render json: { account: account_presenter.as_json }
    else
      render json: { error: "Try another email address or password." }, status: :unauthorized
    end
  end

  def destroy
    terminate_session
    head :no_content
  end
end

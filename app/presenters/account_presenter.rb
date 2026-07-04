class AccountPresenter
  def initialize(user)
    @user = user
  end

  def as_json
    {
      id: @user.id,
      email_address: @user.email_address
    }
  end
end

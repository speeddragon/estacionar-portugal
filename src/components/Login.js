import React, { Component } from "react"
import { Redirect } from "react-router-dom"
import { AuthenticationConsumer } from "./Auth"

class LoginForm extends Component {
  componentDidMount = () => {
    if (this.emailInput) {
      this.emailInput.focus()
    }
  }

  render() {
    return (
      <AuthenticationConsumer>
        {({
          login,
          authState,
          handleEmailChange,
          handlePasswordChange,
          handleAppIdChange
        }) => (
          <div className="login_panel">
            {authState.isAuthed && <Redirect to="/session/active" />}
            <form onSubmit={login}>
              <div className="login_panel_inner">
                <div className="section_title">Autenticação</div>

                <label htmlFor="email" className="new_session_field">
                  Utilizador
                </label>
                <input
                  className="select_popup"
                  id="email"
                  type="text"
                  name="email"
                  ref={node => {
                    this.emailInput = node
                  }}
                  value={authState.email}
                  onChange={handleEmailChange}
                />

                <label htmlFor="password" className="new_session_field">
                  Palavra-chave
                </label>
                <input
                  className="select_popup"
                  id="password"
                  type="password"
                  name="password"
                  value={authState.password}
                  onChange={handlePasswordChange}
                />

                <label htmlFor="app_id" className="new_session_field">
                  Plataforma
                </label>
                <select
                  className="select_popup"
                  id="app_id"
                  name="app_id"
                  onChange={handleAppIdChange}
                  value={authState.appId}
                >
                  <option value="1">Via Verde</option>
                  <option value="2">Telpark</option>
                </select>
              </div>
              {authState.withError && (
                <div className="login_error">{authState.errorInfo}</div>
              )}
              <div className="start_new_session_btn">
                <button type="submit">Enviar</button>
              </div>
            </form>
          </div>
        )}
      </AuthenticationConsumer>
    )
  }
}

export default LoginForm

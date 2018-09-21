import React, { Component } from "react";
import { Link } from "react-router-dom";
import SessionCard from "./SessionCard";
import API from "../config/api";
import { AuthenticationConsumer } from "./Auth";

/* global chrome */

class Sessions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoaded: false,
      sessions: [],
      authState: props.authState
    };
  }

  componentDidMount = () => {
    console.log("Sessions - componentDidMount");
    const { authState } = this.state;

    if (authState.isAuthed) {
      this.getSessions(authState.accountToken, this.props.type.toUpperCase());
    }
  };

  componentDidUpdate(prevProps) {
    console.log("Sessions - componentDidUpdate");
    console.log(this.state);
    if (JSON.stringify(this.props) !== JSON.stringify(prevProps)) {
      const { authState } = this.state;

      this.getSessions(authState.accountToken, this.props.type.toUpperCase());
      this.setState({ isLoaded: false });
    }
  }

  getSessions(accountToken, type) {
    console.log(`Sessions - getSessions(${type})`);

    if (!(type === "ACTIVE" || type === "CLOSED")) {
      return;
    }

    API.request({
      method: "GET",
      url: `/parking/sessions?account=${accountToken}&session_state=${type}`,
      responseType: "json"
    })
      .then(response => {
        // Mock for testing active sessions
        console.log(response.data);
        if (
          type === "ACTIVE" &&
          response.data.length > 0 &&
          response.data[0].coordinates.length > 0
        ) {
          this.props.updateCoordinates(
            response.data[0].coordinates[1],
            response.data[0].coordinates[0]
          );

          // Update selected zone based on current active
          this.props.updateSelectedZone(response.data[0].position_token);
        }

        this.setState({ sessions: response.data, isLoaded: true });
      })
      .catch(error => {
        console.log(error);
        if (
          error.response.data.type === "authenticationFailed" &&
          error.response.data.message === "invalid token"
        ) {
          this.props.refreshToken();
        }
      });
  }

  render() {
    const { isLoaded, sessions } = this.state;

    const sessionList = sessions
      .slice(0, 10)
      .map(session => <SessionCard session={session} />);

    return (
      <div className="sessions">
        <div>
          <div>
            <div style={{ float: `left` }} className="section_title">
              As minhas sessões
            </div>
            <div className="top_option">
              <Link to="/settings">Settings</Link>{" "}
              <span style={{ color: `#98a5b3` }}> | </span>
              <Link to="/logout">Logout</Link>
            </div>
          </div>

          <ul className="tabs">
            <li className={this.props.type === "active" ? `tab_active` : `tab`}>
              <Link to="/session/active">Activas</Link>
            </li>
            <li className={this.props.type === "closed" ? `tab_active` : `tab`}>
              <Link to="/session/closed">Passadas</Link>
            </li>
          </ul>
        </div>

        {isLoaded && sessionList.length > 0 && <div>{sessionList}</div>}
        {isLoaded &&
          sessionList.length == 0 && (
            <div className="no_info_sessions">
              Sem sessões de estacionamento.
            </div>
          )}
        {!isLoaded && (
          <div className="no_info_sessions">
            A procurar pelas últimas sessões de estacionamento. Por favor
            aguarde.
          </div>
        )}
      </div>
    );
  }
}

export default props => (
  <AuthenticationConsumer>
    {({ authState, refreshToken }) => (
      <Sessions {...props} authState={authState} refreshToken={refreshToken} />
    )}
  </AuthenticationConsumer>
);

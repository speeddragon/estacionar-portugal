import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import StartNewSession from "./StartNewSession.js";
import Sessions from "./Sessions.js";
import { AuthenticationConsumer } from "./Auth";

class MainSessions extends Component {
  state = {
    coordinates: {
      latitude: null,
      longitude: null
    },
    positionToken: ""
  };

  updateCoordinates = (latitude, longitude) => {
    this.setState({
      coordinates: { latitude: latitude, longitude: longitude }
    });
  };

  updateSelectedZone = positionToken => {
    this.setState({ positionToken: positionToken });
  };

  render = () => {
    return (
      <AuthenticationConsumer>
        {({ authState }) => (
          <div style={{ display: `flex` }}>
            {!authState.isAuthed && <Redirect to="/login" />}
            {!authState.isLoading &&
              authState.municipalToken == null && <Redirect to="/settings" />}
            <StartNewSession
              coordinates={this.state.coordinates}
              positionToken={this.state.positionToken}
            />
            <Sessions
              type={this.props.match.params.type}
              updateCoordinates={this.updateCoordinates}
              updateSelectedZone={this.updateSelectedZone}
            />
          </div>
        )}
      </AuthenticationConsumer>
    );
  };
}

export default MainSessions;

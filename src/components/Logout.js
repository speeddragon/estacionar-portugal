import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { AuthenticationConsumer } from "./Auth";

class Logout extends Component {
  componentDidMount = () => {
    this.props.logout();
  };

  render() {
    return (
      <AuthenticationConsumer>
        {({ logout }) => (
          <div href="">
            <Redirect to="/login" />
            Logged out!
          </div>
        )}
      </AuthenticationConsumer>
    );
  }
}
export default props => (
  <AuthenticationConsumer>
    {({ logout }) => <Logout {...props} logout={logout} />}
  </AuthenticationConsumer>
);

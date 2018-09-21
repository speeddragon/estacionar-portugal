import React, { Component } from "react";
import API from "../config/api";

export const {
  Provider: AuthenticationProvider,
  Consumer: AuthenticationConsumer
} = React.createContext();

/* global chrome */

class Auth extends Component {
  state = {
    isLoading: true,
    isAuthed: false,
    withError: false,
    errorInfo: "",
    userSessionToken: "",
    accountToken: "",
    email: "",
    password: "",
    appId: 1,
    config: {},
    zones: [],
    municipalToken: null
  };

  componentDidMount = () => {
    this.checkAuthentication();
  };

  findZoneNameByToken = token => {
    // TODO: Improve this code
    console.log("findZoneNameByToken");

    for (let i = 0; i < this.state.zones.length; i++) {
      if (this.state.zones[i].token === token) {
        return this.state.zones[i].name;
      }
    }

    return false;
  };

  setZones = zones => {
    this.setState({ zones: zones });
  };

  setMunicipalToken = token => {
    this.setState({ municipalToken: token });

    const { config } = this.state;
    config.municipal_token = token;

    chrome.storage.sync.set({ config: this.state.config });
  };

  checkAuthentication = () => {
    chrome.storage.sync.get(["config"], items => {
      let userSessionToken;
      let accountToken;
      let isAuthed = false;
      let municipalToken = null;
      let appId = 1;

      if (items.config !== undefined && Object.keys(items.config).length > 0) {
        // TODO: Check if user session token is still valid
        userSessionToken = items.config.user_session_token;
        accountToken = items.config.account_token;
        isAuthed = true;
        municipalToken = items.config.municipal_token;
        appId = items.config.app_id;

        // Set API
        API.defaults.headers.common["X-EOS-USER-TOKEN"] = userSessionToken;
      }

      this.setState({
        isLoading: false,
        isChecking: false,
        isAuthed,
        userSessionToken,
        accountToken,
        config: items.config,
        email: items.config.username,
        password: items.config.password,
        municipalToken: municipalToken,
        appId: appId
      });
    });
  };

  handlePasswordChange = event => {
    this.setState({ password: event.target.value, withError: false });
  };

  handleEmailChange = event => {
    this.setState({ email: event.target.value, withError: false });
  };

  handleAppIdChange = event => {
    this.setState({ appId: event.target.value, withError: false });
  };

  logout = () => {
    const config = {};

    // Remove data from Google Chrome
    chrome.storage.sync.set({ config: config, notifications: {} });

    this.setState({
      isAuthed: false,
      userSessionToken: "",
      accountToken: "",
      email: "",
      password: "",
      config: config
    });
  };

  login = event => {
    const { appId, email, password, config } = this.state;

    switch (appId) {
      case 1:
        // Via Verde
        API.defaults.headers.common["X-EOS-CLIENT-TOKEN"] =
          "2463bc87-6e92-480e-a56b-4260ff8b6a38";
        break;

      case 2:
        // Telpark
        API.defaults.headers.common["X-EOS-CLIENT-TOKEN"] =
          "4cc77160-4458-4f0d-a1f1-551d70daded0";
        break;

      default:
        break;
    }

    console.log("LOGIN request");
    API.request({
      method: "POST",
      url: "/auth/accounts",
      responseType: "json",
      data: {
        username: email,
        password
      }
    })
      .then(({ data: { user_session_token, account_token } }) => {
        console.log("Successfully LOGGED IN!");
        console.log(`User Session Token: ${user_session_token}`);
        console.log(`Account Token: ${account_token}`);

        API.defaults.headers.common["X-EOS-USER-TOKEN"] = user_session_token;

        // Information to save in Chrome LocalStorage
        config.user_session_token = user_session_token;
        config.account_token = account_token;
        config.username = email;
        config.password = password;
        config.app_id = appId;

        this.setState({
          userSessionToken: user_session_token,
          accountToken: account_token,
          isAuthed: true,
          withError: false,
          config
        });

        // Update google chrome config
        chrome.storage.sync.set({ config: this.state.config });
      })
      .catch(error => {
        if (error.response.data.type === "accNotFound") {
          this.setState({
            withError: true,
            errorInfo: "Utilizador não encontrado"
          });
        } else {
          this.setState({
            withError: true,
            errorInfo: "Aconteceu um erro imprevisto"
          });
        }

        /*
          When app id not defined
          "This subject is anonymous - it does not have any identifying principals and authorization operations require an identity to check against.  A Subject instance will acquire these identifying principals automatically after a successful login is performed be executing org.apache.shiro.subject.Subject.login(AuthenticationToken) or when 'Remember Me' functionality is enabled by the SecurityManager.  This exception can also occur when a previously logged-in Subject has logged out which makes it anonymous again.  Because an identity is currently not known due to any of these conditions, authorization is denied."
        */
      });

    if (event !== undefined) {
      event.preventDefault();
    }
  };

  refreshToken = () => {
    console.log("refreshToken");
    console.log(this.state);
    const { config, isAuthed, email, password } = this.state;
    delete config.account_token;
    delete config.user_session_token;

    if (isAuthed && email && password) {
      // Try to login again
      this.setState({ isAuthed: false, config });
      this.login();
    } else {
      // Logout
      this.setState({ isAuthed: false, config });
    }

    chrome.storage.sync.set({ config });
  };

  render = () => (
    <AuthenticationProvider
      value={{
        authState: this.state,

        handleEmailChange: this.handleEmailChange,
        handlePasswordChange: this.handlePasswordChange,
        handleAppIdChange: this.handleAppIdChange,
        findZoneNameByToken: this.findZoneNameByToken,
        setZones: this.setZones,
        setMunicipalToken: this.setMunicipalToken,
        login: this.login,
        logout: this.logout,
        refreshToken: this.refreshToken
      }}
    >
      {this.props.children}
    </AuthenticationProvider>
  );
}

export default Auth;

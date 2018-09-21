import React from "react";
import { Switch, Route } from "react-router-dom";
import MainSessions from "./components/MainSessions.js";
import LoginForm from "./components/Login.js";
import Auth from "./components/Auth.js";
import Logout from "./components/Logout.js";
import Settings from "./components/Settings.js";
import "./App.css";

const App = () => (
  <div className="App">
    <Auth>
      <Switch>
        <Route exact path="/" component={LoginForm} />
        <Route path="/login" component={LoginForm} />
        <Route path="/logout" component={Logout} />
        <Route path="/session/:type" component={MainSessions} />
        <Route path="/settings" component={Settings} />
      </Switch>
    </Auth>
    <div className="clear_both" />
  </div>
);

export default App;

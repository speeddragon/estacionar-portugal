import React, { Component } from "react";
import API from "../config/api";
import { Link } from "react-router-dom";
import { AuthenticationConsumer } from "./Auth";

/* global chrome */

class Settings extends Component {
  constructor(props) {
    super(props);

    console.log(props);

    this.state = {
      municipals: [],
      zones: [],
      municipalToken: props.authState.municipalToken
    };
  }

  componentDidMount = () => {
    console.log("Settings - componentDidMount");
    if (!this.props.authState.isLoading && this.state.municipals.length === 0) {
      this.getAllMunicipal();
    }
  };

  componentDidUpdate(prevProps) {
    console.log("componentDidUpdate");
    if (JSON.stringify(this.props) !== JSON.stringify(prevProps)) {
      if (!this.props.authState.isLoading) {
        this.getAllMunicipal();
      }
      this.setState({ municipalToken: this.props.authState.municipalToken });
    }
  }

  getAllConcessionary() {
    API.request({
      method: "GET",
      url: "/concessionary/all_concessionaries",
      responseType: "json"
    }).then(response => {
      console.log("Sessions");
      console.log(response.data);
    });
  }

  getAllMunicipal() {
    API.request({
      method: "GET",
      url: "/centers/services?type=MUNICIPAL_CONTEXT",
      responseType: "json"
    }).then(response => {
      console.log("get All Municipal");

      this.setState({ municipals: response.data.result });

      if (response.data.result.length > 0) {
        if (this.state.municipalToken) {
          this.getMunicipal(this.state.municipalToken);
        } else {
          this.getMunicipal(response.data.result[0].token);
        }
      }
    });
  }

  handleChange = event => {
    const id = event.target.value;
    this.getMunicipal(id);
  };

  getMunicipal = id => {
    API.request({
      method: "GET",
      url: `/geo/search?context_token=${id}&polygon_info=true`,
      responseType: "json"
    }).then(response => {
      console.log("getMunicipal");
      console.log(response.data.result);

      this.setState({ municipalToken: id, zones: response.data.result });
      this.props.setZones(response.data.result);
      this.props.setMunicipalToken(id);
    });
  };

  render() {
    const { municipals, zones } = this.state;
    const municipalsOptions = municipals.map(municipal => (
      <option
        value={municipal.token}
        {...(municipal.token === this.state.municipalToken ? `selected` : ``)}
      >
        {municipal.name}
      </option>
    ));

    const zonesListing = zones
      .sort(function(a, b) {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      })
      .map(zone => <li title={zone.token}>{zone.name}</li>);

    return (
      <div>
        <h1>Definições</h1>
        <div>
          <h2>
            <Link to="/session/active">Voltar</Link>
          </h2>
        </div>
        <form>
          <div>Por favor selecione com o município que pretende utilizar.</div>
          <label style={{ width: `150px`, display: `inline-block` }}>
            Município
          </label>
          <select
            value={this.state.municipalToken}
            onChange={this.handleChange}
          >
            {municipalsOptions}
          </select>
        </form>

        <h2>Zonas</h2>
        <ul>{zonesListing}</ul>
      </div>
    );
  }
}

export default props => (
  <AuthenticationConsumer>
    {({ authState, setZones, setMunicipalToken }) => (
      <Settings
        {...props}
        authState={authState}
        setZones={setZones}
        setMunicipalToken={setMunicipalToken}
      />
    )}
  </AuthenticationConsumer>
);

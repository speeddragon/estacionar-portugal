import React, { Component } from "react";
import SessionDurationSelector from "./SessionDurationSelector";
import { AuthenticationConsumer } from "./Auth";
import API from "../config/api";
import inside from "../utils/coordinates";

class StartNewSession extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // Possible values
      cars: [],
      zones: [],
      sessionDurationOptions: [],
      authState: props.authState,
      // Selected values
      currentTime: new Date(),
      licensePlate: "",
      currentSessionDuration: null,
      promiseToken: null,
      positionToken: this.props.positionToken,
      coordinates: props.coordinates
    };
  }

  componentDidMount = () => {
    if (this.state.authState.isAuthed) {
      this.getVehicles(this.state.authState.accountToken);
    }

    setInterval(() => {
      this.setState({ currentTime: new Date() });
    }, 10000);
  };

  componentDidUpdate(prevProps) {
    if (JSON.stringify(this.props) !== JSON.stringify(prevProps)) {
      const { coordinates, positionToken } = this.props;
      this.setState({ coordinates: coordinates, positionToken: positionToken });
    }
  }

  getVehicles(accountToken) {
    API.request({
      method: "GET",
      url: `/accounts/${accountToken}/vehicles/`,
      responseType: "json"
    })
      .then(response => {
        console.log("Get Vehicles OK Response");
        const licensePlate =
          response.data.length > 0 ? response.data[0].number : "";
        this.setState({ cars: response.data, licensePlate: licensePlate });

        // Load Municipal Zones
        if (this.state.authState.municipalToken) {
          this.getMunicipal(this.state.authState.municipalToken);
        }
      })
      .catch(error => {
        // TODO: Improve this
        if (
          error.response.data.type === "authenticationFailed" &&
          error.response.data.message === "invalid token"
        ) {
          this.props.refreshToken();
        }
      });
  }

  getMunicipal = id => {
    API.request({
      method: "GET",
      url: `/geo/search?context_token=${id}&polygon_info=true`,
      responseType: "json"
    }).then(response => {
      console.log("getMunicipal");

      const zoneList = response.data.result.sort(function(a, b) {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });

      // Load first values
      console.log("LicensePlate: " + this.state.licensePlate);
      if (zoneList.length > 0 && this.state.licensePlate) {
        this.checkParkingSession(
          this.state.authState.accountToken,
          this.state.licensePlate,
          zoneList[0].token
        );
      }

      this.setState({ zones: zoneList });
      this.props.setZones(zoneList);
    });
  };

  onChangeLicensePlate = event => {
    this.setState({ licensePlate: event.target.value });
  };

  onChangeZone = event => {
    const positionToken = event.target.value;

    // TODO: Create a Map ?
    // Set new coordinate
    let i = 0;
    let zone = null;
    while (i < this.state.zones.length && zone === null) {
      if (this.state.zones[i].token == positionToken) {
        zone = this.state.zones[i];
      } else {
        i++;
      }
    }
    console.log("Zona encontrada: " + zone.name);

    if (
      !(
        this.state.coordinates.latitude != null &&
        this.state.coordinates.longitude != null &&
        inside(
          [this.state.coordinates.longitude, this.state.coordinates.latitude],
          zone.geoInfo.coordinates[0]
        )
      )
    ) {
      console.log(zone.geoInfo);
      this.setState({
        coordinates: {
          latitude: zone.geoInfo.coordinates[0][0][1],
          longitude: zone.geoInfo.coordinates[0][0][0]
        }
      });
    }

    this.checkParkingSession(
      this.state.authState.accountToken,
      this.state.licensePlate,
      positionToken
    );
  };

  onSessionDurationClick = event => {
    console.log("onSessionDurationClick");
    const position = event.currentTarget.getAttribute("data-index");
    console.log(position);

    const sessionDurationOptions = this.state.sessionDurationOptions.map(
      (session, index) => {
        if (index == position) {
          session.selected = true;
        } else {
          session.selected = false;
        }
        return session;
      }
    );

    this.setState({
      sessionDurationOptions: sessionDurationOptions,
      currentSessionDuration: sessionDurationOptions[position]
    });
  };

  checkParkingSession = (accountToken, licensePlate, positionToken) => {
    console.log("checkParkingSession");
    var body = {
      account_token: accountToken,
      dtstart: {
        date: new Date().toISOString().split(".")[0] + "Z"
      },
      plate: {
        id: licensePlate,
        type: "PT"
      },
      position_token: positionToken,
      type: "MANAGED"
    };

    API.request({
      method: "POST",
      url: "/parking/fares/table/",
      responseType: "json",
      data: body
    }).then(response => {
      console.log("Fares");
      console.log(response.data);

      const simpleViewCorrected = this.extrapulateRealDuration(
        response.data.simple_view,
        response.data.values
      );

      const sessionDurationOptions = simpleViewCorrected.map(
        (session, index) => {
          if (index == 0) {
            session.selected = true;
          } else {
            session.selected = false;
          }
          return session;
        }
      );

      this.setState({
        sessionDurationOptions: sessionDurationOptions,
        currentSessionDuration: sessionDurationOptions[0],
        promiseToken: response.data.promise_token,
        positionToken: positionToken
      });
    });
  };

  extrapulateRealDuration(simpleView, values) {
    const base_real_duration =
      values[values.length - 1].real_duration -
      values[values.length - 1].charged_duration;

    const newSimpleView = simpleView.map(value => {
      value.real_duration = base_real_duration + value.charged_duration;
      return value;
    });

    console.log(newSimpleView);

    return newSimpleView;
  }

  startParkingSession = event => {
    const accountToken = this.state.authState.accountToken;
    const {
      currentSessionDuration,
      licensePlate,
      promiseToken,
      positionToken
    } = this.state;

    var body = {
      account_token: accountToken,
      coordinates_key: {
        latitude: this.state.coordinates.latitude,
        longitude: this.state.coordinates.longitude
      },
      cost_time_pair: {
        cost: currentSessionDuration.cost,
        duration_ms: currentSessionDuration.real_duration,
        charged_duration_ms: currentSessionDuration.charged_duration
      },
      dtstart: {
        date: new Date().toISOString().split(".")[0] + "Z"
      },
      plate: {
        id: licensePlate,
        type: "PT"
      },
      position_token: positionToken,
      promise_token: promiseToken,
      type: "MANAGED"
    };

    API.request({
      method: "POST",
      url: "/parking/sessions/",
      responseType: "json",
      data: body
    })
      .then(response => {
        console.log(
          "Start parking sessions starting at " +
            new Date().toLocaleString() +
            " for " +
            currentSessionDuration.real_duration / 1000 / 60 +
            " minutes."
        );
      })
      .catch(error => {
        const { message, meta } = error.response.data;
        // message = "There already exists an active parking session for…ccount TOKEN, position TOKEN and vehicle LICENSEPLATE." &&
        if (
          meta.display_message ==
          "Já tem um estacionamento a decorrer para este veículo e localização"
        ) {
          alert("Já tem um estacionamento activa para este veículo e local.");
        } else {
          alert("Aconteceu um erro inesperado.");
        }
      });
  };

  render() {
    const {
      zones,
      currentTime,
      cars,
      sessionDurationOptions,
      currentSessionDuration,
      positionToken
    } = this.state;
    const zonesOption = zones.map(zone => (
      <option value={zone.token}>{zone.name}</option>
    ));
    const sessionDurationSelector = sessionDurationOptions.map(
      (option, index) => (
        <SessionDurationSelector
          cost={option.cost}
          chargedDuration={option.charged_duration}
          realDuration={option.real_duration}
          selected={option.selected}
          onClick={this.onSessionDurationClick}
          index={index}
        />
      )
    );

    return (
      <div className="StartNewSession">
        <div className="StartNewSession_panel">
          <div className="parking_head">
            <div className="parking_logo" />
            <div className="parking_logo_title">Estacionar - Portugal</div>
          </div>

          <div className="sub_section_title">Criar nova sessão</div>

          <label className="new_session_field">Matrícula</label>
          <select className="select_popup" onChange={this.onChangeLicensePlate}>
            {cars.map(item => (
              <option value={item.number}>{item.number}</option>
            ))}
          </select>

          <label className="new_session_field">Zona</label>
          <select
            className="select_popup"
            value={positionToken}
            onChange={this.onChangeZone}
          >
            {zonesOption}
          </select>

          <label className="new_session_field">Duração</label>
          <div>{sessionDurationSelector}</div>

          <div
            style={{
              color: `#313745`,
              fontSize: `16px`,
              marginTop: `20px`,
              marginBottom: `20px`
            }}
          >
            <img
              src="images/clock.svg"
              style={{ width: `16px`, marginRight: `10px` }}
            />
            {currentTime.toLocaleTimeString()}{" "}
            &middot;&middot;&middot;&middot;&middot;&middot;{" "}
            {new Date(
              currentTime.getTime() +
                (currentSessionDuration
                  ? currentSessionDuration.real_duration
                  : 0)
            ).toLocaleTimeString()}
          </div>
          {this.state.coordinates.latitude !== null && (
            <img
              alt="Mapa"
              style={{ borderRadius: `4px` }}
              src={`https://api.mapbox.com/styles/v1/mapbox/light-v9/static/url-https%3A%2F%2Fapi.tiles.mapbox.com%2Fmapbox.js%2Fv3.0.1%2Fimages%2Fmarker-icon.png(${
                this.state.coordinates.longitude
              },${this.state.coordinates.latitude})/${
                this.state.coordinates.longitude
              },${
                this.state.coordinates.latitude
              },16.0,0,0/340x180?access_token=pk.eyJ1Ijoic3BlZWRkcmFnb24iLCJhIjoiY2psejBmc2w3MGF4YTNwbmtrM2ZrbWp2dCJ9.SV5DQY91VkdVLUI_f1b-_w`}
            />
          )}
        </div>
        <div className="start_new_session_btn">
          <button onClick={this.startParkingSession}>
            Começar nova sessão
          </button>
        </div>
      </div>
    );
  }
}

export default props => (
  <AuthenticationConsumer>
    {({ setZones, authState, refreshToken }) => (
      <StartNewSession
        {...props}
        authState={authState}
        refreshToken={refreshToken}
        setZones={setZones}
      />
    )}
  </AuthenticationConsumer>
);

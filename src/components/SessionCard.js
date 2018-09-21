import React, { Component } from "react";
import { AuthenticationConsumer } from "./Auth";

class SessionCard extends Component {
  constructor(props) {
    super(props);

    const readDurationMs = props.session.cost_time_pair.charged_duration_ms;

    const startDate = new Date(props.session.dtstart.date);
    const endDate = new Date(startDate.getTime() + readDurationMs);
    let coordinates = {};
    const inProgress = new Date() < endDate;

    if (props.session.coordinates != null) {
      coordinates = {
        latitude: props.session.coordinates[1],
        longitude: props.session.coordinates[0]
      };
    }

    this.state = {
      id: props.session.token,
      licensePlate: props.session.plate.id,
      durationMinutes: readDurationMs / 60000,
      price: props.session.cost_time_pair.cost,
      coordinates,
      startDate,
      endDate,
      inProgress,
      currentTime: new Date(),
      zoneName: props.findZoneNameByToken(props.session.position_token)
    };
  }

  componentDidMount = () => {
    if (this.state.inProgress && new Date() < this.state.endDate) {
      setTimeout(this.updateTime, 1000);
    }
  };

  updateTime = () => {
    if (new Date() < this.state.endDate) {
      this.setState({ currentTime: new Date() });
      setTimeout(this.updateTime, 1000);
    } else {
      this.setState({ inProgress: false });
    }
  };

  render() {
    const {
      id,
      price,
      durationMinutes,
      licensePlate,
      startDate,
      endDate,
      coordinates,
      inProgress,
      currentTime,
      zoneName
    } = this.state;

    let diff = endDate.getTime() - currentTime.getTime();
    let hours = Math.floor(diff / (1000 * 60 * 60));
    let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let countDownString = `${hours.toLocaleString("en-US", {
      minimumIntegerDigits: 2,
      useGrouping: false
    })}:${minutes.toLocaleString("en-US", {
      minimumIntegerDigits: 2,
      useGrouping: false
    })}:${seconds.toLocaleString("en-US", {
      minimumIntegerDigits: 2,
      useGrouping: false
    })}`;

    return (
      <table className="new_session_card" data-id={id}>
        <tr>
          <td style={{ paddingLeft: `10px`, paddingTop: `6px` }}>
            <div style={{ paddingBottom: `10px`, fontSize: `12px` }}>
              <span className="parking_zone">{zoneName}</span>
              <span className="parking_cost">
                €{price} ({durationMinutes} MIN)
              </span>
              <span className="license_plate">
                <span className="license_plate_stripe">&nbsp;</span>
                <span className="license_plate_text">{licensePlate}</span>
              </span>
            </div>
            <div style={{ fontSize: `16px`, paddingTop: `10px` }}>
              <img
                src="images/clock.svg"
                style={{ width: `16px`, marginRight: `10px` }}
              />
              ({startDate.toLocaleDateString()})
              <span style={{ marginLeft: `10px` }} className="text_dark">
                {startDate.toLocaleTimeString()}
              </span>
              <span style={{ padding: `0px 10px` }}>
                &middot;&middot;&middot;&middot;&middot;&middot;
              </span>
              {startDate.toLocaleDateString() === endDate.toLocaleDateString()
                ? ""
                : `(<span style="margin-left: 10px;">${endDate.toLocaleDateString()}</span>)`}
              <span className="text_dark">{endDate.toLocaleTimeString()}</span>
            </div>
          </td>

          <td style={{ textAlign: `center` }}>
            {inProgress && (
              <div>
                <div>TEMPO RESTANTE</div>
                <div
                  style={{
                    color: `#FF5F33`,
                    fontSize: `24px`,
                    paddingTop: `4px`
                  }}
                >
                  {countDownString}
                </div>
              </div>
            )}
          </td>

          <td style={{ textAlign: `right`, padding: `4px 4px 1px 1px` }}>
            {Object.keys(coordinates).length > 0 && (
              <img
                alt="Mapa"
                style={{ borderRadius: `4px` }}
                src={`https://maps.googleapis.com/maps/api/staticmap?markers=color:red|size:mid|${
                  coordinates.latitude
                },${
                  coordinates.longitude
                }&zoom=16&scale=1&size=244x77&maptype=roadmap&format=png&visual_refresh=true`}
              />
            )}
            {Object.keys(coordinates).length == 0 && (
              <div style={{ height: `77px` }} />
            )}
          </td>
        </tr>
      </table>
    );
  }
}

export default props => (
  <AuthenticationConsumer>
    {({ findZoneNameByToken }) => (
      <SessionCard {...props} findZoneNameByToken={findZoneNameByToken} />
    )}
  </AuthenticationConsumer>
);

import React, { Component } from "react";
import PropTypes from "prop-types";

class SessionDurationSelector extends React.Component {
  render() {
    const { onClick, cost, chargedDuration, selected, index } = this.props;
    return (
      <div
        data-index={index}
        onClick={onClick}
        className={`cost_duration ${selected ? `selected` : ``}`}
      >
        <div className="cost_duration_top">{cost} €</div>
        <div className="cost_duration_bottom">
          {chargedDuration / 60 / 1000} MIN
        </div>
      </div>
    );
  }
}

SessionDurationSelector.propTypes = {
  minutes: PropTypes.number,
  cost: PropTypes.number
};

export default SessionDurationSelector;

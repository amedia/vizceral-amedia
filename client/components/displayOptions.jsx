'use strict';

import React from 'react';

class DisplayOptions extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      allowDraggingOfNodes: false,
      showLabels: true,
      metric: 'http'
    };
  }

  componentWillReceiveProps (nextProps) {
    this.setState(nextProps.options);
  }

  _onCheckBoxChanged (event) {
    const checkBox = event.target;
    const statePropName = checkBox.id;
    const newState = {};
    newState[statePropName] = checkBox.checked;
    this.setState(newState);
    this.props.changedCallback(newState);
  }

  _onRadioBoxChanged (event) {
    const radio = event.target;
    const statePropName = radio.id;
    const newState = {};
    newState[statePropName] = radio.value;
    this.setState(newState);
    this.props.changedCallback(newState);
  }

  render () {
    const allowDraggingOfNodes = this.state.allowDraggingOfNodes;
    const showLabels = this.state.showLabels;
    return (
      <div>
        <div>
          <input type="checkbox" id="allowDraggingOfNodes" checked={allowDraggingOfNodes} onChange={event => this._onCheckBoxChanged(event)}/>
          <label htmlFor="allowDraggingOfNodes">Allow dragging nodes</label>
        </div>
        <div>
          <input id="showLabels" type="checkbox" checked={showLabels} onChange={event => this._onCheckBoxChanged(event)}/>
          <label htmlFor="showLabels">Show Labels</label>
        </div>
        <div>
          <label>
            <input id="metric" type="radio" value="http" checked={this.state.metric === 'http'} onChange={event => this._onRadioBoxChanged(event)}/>
            Http
          </label>
          <label>
            <input id="metric" type="radio" value="cache" checked={this.state.metric === 'cache'} onChange={event => this._onRadioBoxChanged(event)}/>
            Cache
          </label>
        </div>
      </div>
    );
  }
}

DisplayOptions.propTypes = {
  options: React.PropTypes.object.isRequired,
  changedCallback: React.PropTypes.func.isRequired
};

export default DisplayOptions;

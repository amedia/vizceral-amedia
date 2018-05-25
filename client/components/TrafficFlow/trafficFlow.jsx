'use strict';

import _ from 'lodash';
import { Alert } from 'react-bootstrap';
import React from 'react';
import TWEEN from 'tween.js'; // Start TWEEN updates for sparklines and loading screen fading out
import queryString from 'query-string';
import request from 'superagent';

import Vizceral from '../Vizceral/vizceral';
import keypress from '../../../node_modules/keypress.js/keypress';
import './trafficFlow.css';
import Breadcrumbs from '../Breadcrumbs/breadcrumbs';
import DisplayOptions from '../displayOptions';
import PhysicsOptions from '../PhysicsOption/physicsOptions';
import FilterControls from '../FilterControls/filterControls';
import DetailsPanelConnection from '../DetailsPanel/detailsPanelConnection';
import DetailsPanelNode from '../DetailsPanel/detailsPanelNode';
import LoadingCover from '../LoadingCover/loadingCover';
import Locator from '../Locator/locator';
import OptionsPanel from '../OptionsPanel/optionsPanel';
import UpdateStatus from '../UpdateStatus/updateStatus';

import filterActions from '../../store/filterActions';
import filterStore from '../../store/filterStore';

const listener = new keypress.Listener();

const hasOwnPropFunc = Object.prototype.hasOwnProperty;

function animate (time) {
  requestAnimationFrame(animate);
  TWEEN.update(time);
}

requestAnimationFrame(animate);

const panelWidth = 400;

const erebosBaseUrl = typeof EREBOS_BASE_URL !== 'undefined' ? EREBOS_BASE_URL : 'http://localhost:9810/api/erebos';
const apiPath = typeof API_PATH !== 'undefined' ? API_PATH : '/api/vizceral';

class TrafficFlow extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      currentView: undefined,
      redirectedFrom: undefined,
      selectedChart: undefined,
      objectToHighlight: undefined,
      objectToHighlightName: '',
      focusedNode: undefined,
      displayOptions: {
        allowDraggingOfNodes: true,
        showLabels: true,
        metric: 'http'
      },
      currentGraph_physicsOptions: {
        isEnabled: true,
        viscousDragCoefficient: 0.2,
        hooksSprings: {
          restLength: 50,
          springConstant: 0.2,
          dampingConstant: 0.1
        },
        particles: {
          mass: 1
        }
      },
      labelDimensions: {},
      appliedFilters: filterStore.getChangedFilters(),
      filters: filterStore.getFiltersArray(),
      searchTerm: '',
      matches: {
        total: -1,
        visible: -1
      },
      trafficData: {
        nodes: [],
        connections: []
      },
      regionUpdateStatus: [],
      timeOffset: 0,
      modes: {
        detailedNode: 'volume'
      }
    };

    // Keyboard interactivity
    listener.simple_combo('esc', () => {
      if (this.state.detailedNode) {
        this.setState({ detailedNode: undefined });
      } else if (this.state.currentView.length > 0) {
        this.setState({ currentView: this.state.currentView.slice(0, -1) });
      }
    });
  }

  viewChanged = (data) => {
    const changedState = {
      currentView: data.view,
      searchTerm: '',
      matches: { total: -1, visible: -1 },
      redirectedFrom: data.redirectedFrom
    };
    if (hasOwnPropFunc.call(data, 'graph')) {
      let oldCurrentGraph = this.state.currentGraph;
      if (oldCurrentGraph == null) oldCurrentGraph = null;
      let newCurrentGraph = data.graph;
      if (newCurrentGraph == null) newCurrentGraph = null;
      if (oldCurrentGraph !== newCurrentGraph) {
        changedState.currentGraph = newCurrentGraph;
        const o = newCurrentGraph === null ? null : newCurrentGraph.getPhysicsOptions();
        changedState.currentGraph_physicsOptions = o;
      }
    }
    this.setState(changedState);
  };

  viewUpdated = () => {
    this.setState({});
  };

  nodeContextSizeChanged = (dimensions) => {
    this.setState({ labelDimensions: dimensions });
  };

  checkInitialRoute () {
    // Check the location bar for any direct routing information
    const path = window.location.pathname.replace(apiPath, '');
    const pathArray = path.split('/');
    const currentView = [];
    if (pathArray[1]) {
      currentView.push(pathArray[1]);
      if (pathArray[2]) {
        currentView.push(pathArray[2]);
      }
    }
    const parsedQuery = queryString.parse(window.location.search);

    this.setState({ currentView: currentView, objectToHighlightName: parsedQuery.highlighted });
  }

  updateData (newTraffic, clientUpdateTime) {
    const regionUpdateStatus = _.map(_.filter(newTraffic.nodes, n => n.name !== 'INTERNET'), (node) => {
      const updated = node.updated;
      return { region: node.name, updated: updated };
    });
    const lastUpdatedTime = _.max(_.map(regionUpdateStatus, 'updated'));
    this.setState({
      regionUpdateStatus: regionUpdateStatus,
      timeOffset: clientUpdateTime - newTraffic.serverUpdateTime,
      lastUpdatedTime: lastUpdatedTime,
      trafficData: newTraffic
    });
  }

  update () {
    request.get(`${erebosBaseUrl}/v1/vizceral?metric=${this.state.displayOptions.metric}`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res && res.status === 200) {
          this.updateData(res.body, Date.now());
        }
      });
  }

  componentDidMount () {
    this.checkInitialRoute();
    this.update();

    // Listen for changes to the stores
    filterStore.addChangeListener(this.filtersChanged);
    this.timer = setInterval(this.update.bind(this), 1000);
  }

  componentWillUnmount () {
    filterStore.removeChangeListener(this.filtersChanged);
    clearInterval(this.timer);
  }

  displayOptionsChanged = (options) => {
    const displayOptions = _.merge({}, this.state.displayOptions, options);
    this.setState({ displayOptions: displayOptions });
  };

  physicsOptionsChanged = (physicsOptions) => {
    this.setState({ currentGraph_physicsOptions: physicsOptions });
    let currentGraph = this.state.currentGraph;
    if (currentGraph == null) currentGraph = null;
    if (currentGraph !== null) {
      currentGraph.setPhysicsOptions(physicsOptions);
    }
  };

  calculateBrowserHistory () {
    return {
      title: 'Vizceral',
      selected: this.state.currentView,
      highlighted: this.state.objectToHighlightName,
      url: `${apiPath}/${this.state.currentView.join('/')}${this.state.objectToHighlightName ? `?highlighted=${this.state.objectToHighlightName}` : ''}`,
    };
  }

  updateUrl () {
    const browserState = this.calculateBrowserHistory();
    window.history.pushState(browserState, browserState.title, browserState.url);
  }

  navigationCallback = (newView) => {
    this.setState({ currentView: newView }, this.updateUrl);
  };

  focusNode (node) {
    this.setState({
      currentView: [this.state.currentView[0], node.getName()],
      focusedNode: node,
    }, this.updateUrl);
  }

  unfocusNode () {
    const node = this.state.focusedNode;
    this.setState({
      currentView: [this.state.currentView[0]],
      focusedNode: undefined,
    }, this.updateUrl);
    return node;
  }

  highlightObject = (obj) => {
    if (!obj) {
      // Vizceral sometimes calls this function with "undefined" (for unknown reasons)
      return;
    }

    this.setState({
      objectToHighlight: obj,
      objectToHighlightName: obj.getName(),
      searchTerm: '',
      matches: { total: -1, visible: -1 },
      redirectedFrom: undefined
    }, this.updateUrl);
  };

  unhightligthObject () {
    const obj = this.state.objectToHighlight;
    this.setState({ focusedNode: undefined, objectToHighlight: undefined, objectToHighlightName: '' }, this.updateUrl);
    return obj;
  }

  zoomCallback = () => {
    // If node is focused then zoom back to highlighted mode
    if (this.state.focusedNode) {
      const node = this.unfocusNode();
      this.highlightObject(node);
      return;
    }
    // Zooming in only available for nodes
    const obj = this.unhightligthObject();
    if (obj.type === 'node') {
      this.focusNode(obj);
    }
  };

  detailsClosed = () => {
    if (this.state.focusedNode) {
      this.unfocusNode();
      return;
    }
    this.unhightligthObject();
  };

  filtersChanged = () => {
    this.setState({
      appliedFilters: filterStore.getChangedFilters(),
      filters: filterStore.getFiltersArray()
    });
  };

  filtersCleared = () => {
    if (!filterStore.isClear()) {
      if (!filterStore.isDefault()) {
        filterActions.resetFilters();
      } else {
        filterActions.clearFilters();
      }
    }
  };

  locatorChanged = (value) => {
    this.setState({ searchTerm: value });
  };

  matchesFound = (matches) => {
    this.setState({ matches: matches });
  };

  nodeClicked = (node) => {
    if (!this.state.objectToHighlight) {
      this.highlightObject(node);
      return;
    }
    this.unhightligthObject();
    this.focusNode(node);
  };

  resetLayoutButtonClicked = () => {
    const g = this.state.currentGraph;
    if (g != null) {
      g._relayout();
    }
  };

  dismissAlert = () => {
    this.setState({ redirectedFrom: undefined });
  };

  getNodeToShowDetails () {
    let nodeToShowDetails = this.state.currentGraph && this.state.currentGraph.focusedNode;
    if (!nodeToShowDetails && this.state.objectToHighlight && this.state.objectToHighlight.type === 'node') {
      nodeToShowDetails = this.state.objectToHighlight;
    }
    return nodeToShowDetails;
  }

  render () {
    const globalView = this.state.currentView && this.state.currentView.length === 0;
    const nodeView = !globalView && this.state.currentView && this.state.currentView[1] !== undefined;
    const connectionToShowDetails = this.state.objectToHighlight && this.state.objectToHighlight.type === 'connection' ? this.state.objectToHighlight : undefined;
    const showLoadingCover = !this.state.currentGraph;
    const nodeToShowDetails = this.getNodeToShowDetails();

    let matches;
    if (this.state.currentGraph) {
      matches = {
        totalMatches: this.state.matches.total,
        visibleMatches: this.state.matches.visible,
        total: this.state.currentGraph.nodeCounts.total,
        visible: this.state.currentGraph.nodeCounts.visible
      };
    }

    return (
      <div className="vizceral-container">
        {this.state.redirectedFrom ?
          <Alert onDismiss={this.dismissAlert}>
            <strong>{this.state.redirectedFrom.join('/') || '/'}</strong> does not exist, you were redirected
            to <strong>{this.state.currentView.join('/') || '/'}</strong> instead
          </Alert>
          : undefined}
        <div className="subheader">
          <Breadcrumbs rootTitle="global" navigationStack={this.state.currentView || []}
                       navigationCallback={this.navigationCallback}/>
          <UpdateStatus status={this.state.regionUpdateStatus} baseOffset={this.state.timeOffset}
                        warnThreshold={180000}/>
          <div style={{ float: 'right', paddingTop: '4px' }}>
            {(!globalView && matches) &&
            <Locator changeCallback={this.locatorChanged} searchTerm={this.state.searchTerm} matches={matches}
                     clearFilterCallback={this.filtersCleared}/>}
            <OptionsPanel title="Filters"><FilterControls/></OptionsPanel>
            <OptionsPanel title="Display"><DisplayOptions options={this.state.displayOptions}
                                                          changedCallback={this.displayOptionsChanged}/></OptionsPanel>
            <OptionsPanel title="Physics"><PhysicsOptions options={this.state.currentGraph_physicsOptions}
                                                          changedCallback={this.physicsOptionsChanged}/></OptionsPanel>
            <a role="button" className="reset-layout-link" onClick={this.resetLayoutButtonClicked}>Reset Layout</a>
          </div>
        </div>
        <div className="service-traffic-map">
          <div style={{
            position: 'absolute',
            top: '0px',
            right: nodeToShowDetails || connectionToShowDetails ? '380px' : '0px',
            bottom: '0px',
            left: '0px'
          }}>
            <Vizceral traffic={this.state.trafficData}
                      view={this.state.currentView}
                      showLabels={this.state.displayOptions.showLabels}
                      filters={this.state.filters}
                      viewChanged={this.viewChanged}
                      viewUpdated={this.viewUpdated}
                      objectHighlighted={this.highlightObject}
                      nodeContextSizeChanged={this.nodeContextSizeChanged}
                      objectToHighlight={this.state.objectToHighlight || this.state.objectToHighlightName}
                      matchesFound={this.matchesFound}
                      match={this.state.searchTerm}
                      modes={this.state.modes}
                      allowDraggingOfNodes={this.state.displayOptions.allowDraggingOfNodes}
            />
          </div>
          {
            !!nodeToShowDetails &&
            <DetailsPanelNode node={nodeToShowDetails}
                              nodeSelected={nodeView}
                              region={this.state.currentView[0]}
                              width={panelWidth}
                              zoomCallback={this.zoomCallback}
                              closeCallback={this.detailsClosed}
                              nodeClicked={node => this.nodeClicked(node)}
            />
          }
          {
            !!connectionToShowDetails &&
            <DetailsPanelConnection connection={connectionToShowDetails}
                                    region={this.state.currentView[0]}
                                    width={panelWidth}
                                    closeCallback={this.detailsClosed}
                                    nodeClicked={node => this.nodeClicked(node)}
            />
          }
          <LoadingCover show={showLoadingCover}/>
        </div>
      </div>
    );
  }
}

TrafficFlow.propTypes = {};

export default TrafficFlow;

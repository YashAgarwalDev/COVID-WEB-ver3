import React, { Component } from "react";
import axios from "axios";
import Lottie from "react-lottie";
import { formatDistance } from "date-fns";
import { withStyles } from "@material-ui/styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBellSlash,
  faSyncAlt,
} from "@fortawesome/free-solid-svg-icons";

import Barchart from "./Barchart";
import Charts from "./Charts";
import DisplayTable from "./DisplayTable";
import Footer from "./Footer";
import MapSection from "./MapSection";
import Overview from "./Overview";

import colors from "../constants/colors";
import stateCodes from "../constants/stateCodes";
import * as animationData from "../assets/loading.json";

import styles from "../styles/CovidAppStyles";
import "../styles/DarkModeButton.css";

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData.default,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

const months = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

class CovidApp extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      todayData: {},
      isLoading: false,
      mapData: [],
      tableData: [],
    };

    this.fetchData = this.fetchData.bind(this);
    this.formatData = this.formatData.bind(this);
    this.findId = this.findId.bind(this);
    this.handleFormat = this.handleFormat.bind(this);
    this.handleNotification = this.handleNotification.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  async fetchData() {
    this.setState({ isLoading: !this.state.isLoading });
    const countryData = axios.get("https://api.covid19india.org/v4/min/data.min.json");
    const districtLevel = axios.get(
      "https://api.covid19india.org/v4/min/data.min.json"
    );
    const stateChanges = axios.get(
      "https://data.covid19india.org/csv/latest/states.csv"
    );
    const updates = axios.get(
      "https://api.covid19india.org/v4/min/data.min.json"
    );

    axios.all([countryData, districtLevel, stateChanges, updates]).then(
      axios.spread((...responses) => {
        const countryData = responses[0].data;
        const districtLevel = responses[1].data;
        const updates = responses[3].data;

        const [todayData] = countryData.statewise.slice(0, 1);
        const casesTimeline = countryData.cases_time_series;

        const data = countryData.statewise.slice(1, -1);

        this.setState(
          {
            data: data,
            todayData: todayData,
            casesTimeline: casesTimeline,
            districtLevel: districtLevel,
            updates: updates,
            expanded: false,
          },
          this.handleFormat
        );
      })
    );
  }

  formatData(data) {
    const formatedData = data.map((state, i) => {
      return {
        id: this.findId(state.state),
        state: state.state.replace(" and ", " & "),
        value: state.confirmed,
      };
    });
    return formatedData;
  }

  findId(location) {
    for (let [key, value] of Object.entries(stateCodes)) {
      if (location === key) {
        return value;
      }
    }
  }

  handleFormat() {
    const newdata = this.formatData(this.state.data);
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 1000);
    this.setState({ mapData: newdata });
  }

  handleNotification() {
    this.setState({ expanded: !this.state.expanded });
  }

  formatDate(date) {
    try {
      const day = date.slice(0, 2);
      const month = date.slice(3, 5);
      const time = date.slice(11);
      return `${day} ${months[month]}, ${time.slice(0, 5)} IST`;
    } catch (err) {}
  }

  render() {
    const { classes, setDarkMode, isDarkMode } = this.props;
    const {
      mapData,
      isLoading,
      data,
      districtLevel,
      expanded,
      updates,
    } = this.state;

    if (isLoading) {
      return (
        <div className={classes.loadingIcon}>
          <Lottie options={defaultOptions} height={500} width={500} />
        </div>
      );
    }
    let displayUpdates;
    try {
      displayUpdates = updates
        .slice(-5)
        .reverse()
        .map(({ update, timestamp }, i) => {
          update = update.replace("\n", "<br/>");
          return (
            <div className={classes.updateBox} key={i}>
              <h5 className={classes.updateHeading}>
                {`${formatDistance(
                  new Date(timestamp * 1000),
                  new Date()
                )} ago`}
              </h5>
              <h4
                className={classes.updateText}
                dangerouslySetInnerHTML={{
                  __html: update,
                }}
              ></h4>
            </div>
          );
        });
    } catch (err) {}

    return (
      <>
        <div className={classes.header}>
          <h1 className={classes.heading}>
            <span>Covid-19</span> India Trend
          </h1>
          <div className={classes.btnBox}>
            <FontAwesomeIcon
              icon={faSyncAlt}
              className={classes.button}
              onClick={this.fetchData}
            />
          </div>
          <div className={classes.lastUpdatedTime}>
            Last Updated:{" "}
            {this.formatDate(this.state.todayData.lastupdatedtime)}
          </div>
          <div className={classes.updates}>
            <div className={classes.notification}>
              {expanded ? (
                <FontAwesomeIcon
                  icon={faBellSlash}
                  onClick={this.handleNotification}
                />
              ) : (
                <div className={classes.notificationBell}>
                  <FontAwesomeIcon
                    icon={faBell}
                    onClick={this.handleNotification}
                  />
                </div>
              )}
            </div>
            {expanded && <div className={classes.update}>{displayUpdates}</div>}
          </div>
          <div className="darkModeButton">
            <label className="switch">
              <input
                type="checkbox"
                onChange={setDarkMode}
                checked={isDarkMode}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        <div>
          <Overview
            isDarkMode={isDarkMode}
            data={this.state.todayData}
            loadingStatus={this.loadingStatus}
          />
        </div>
        <div className={classes.content}>
          <div className={classes.contentArea}>
            <div className={classes.mapArea}>
              <MapSection
                data={data}
                mapData={mapData}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
          <div className={classes.chartArea}>
            <div className={classes.chartRes}>
              <Charts
                data={this.state.casesTimeline}
                isLoading={this.state.isLoading}
              />
            </div>
            <div className={classes.tinyChartArea}>
              <div className={classes.tinyChart}>
                <div
                  className={classes.tinych}
                  style={{ background: "rgba(249, 52, 94,.1)" }}
                >
                  <h3 style={{ color: colors.red }}>confirmed</h3>
                  <Barchart
                    data={this.state.casesTimeline}
                    isLoading={this.state.isLoading}
                    dataKey="totalconfirmed"
                    stroke={colors.red}
                  />
                </div>
              </div>
              <div className={classes.tinyChart}>
                <div
                  className={classes.tinych}
                  style={{ background: "rgba(250, 100, 0,.1)" }}
                >
                  <h3 style={{ color: colors.orange }}>active</h3>
                  <Barchart
                    data={this.state.casesTimeline}
                    isLoading={this.state.isLoading}
                    dataKey="totalactive"
                    stroke={colors.orange}
                  />
                </div>
              </div>
              <div className={classes.tinyChart}>
                <div
                  className={classes.tinych}
                  style={{ background: "rgba(28, 177, 66,.1)" }}
                >
                  <h3 style={{ color: colors.green }}>Recovered</h3>
                  <Barchart
                    data={this.state.casesTimeline}
                    isLoading={this.state.isLoading}
                    dataKey="totalrecovered"
                    stroke={colors.green}
                  />
                </div>
              </div>
              <div className={classes.tinyChart}>
                <div
                  className={classes.tinych}
                  style={{ background: "rgba(98, 54, 255,.1)" }}
                >
                  <h3 style={{ color: colors.purple }}>Deceased</h3>
                  <Barchart
                    data={this.state.casesTimeline}
                    isLoading={this.state.isLoading}
                    dataKey="totaldeceased"
                    stroke={colors.purple}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={classes.tableContainer}>
            <h2 className={classes.tableHeading}>
              State/UT Wise Data (Sortable){" "}
            </h2>
            <DisplayTable
              tableData={data}
              districtLevel={districtLevel}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
        <Footer />
      </>
    );
  }
}

export default withStyles(styles)(CovidApp);

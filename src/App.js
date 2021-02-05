import React, { Component, Fragment } from "react";
import axios from "axios";
import APIbase from "./API/APIbase";
import "./App.css";
//Import Components
import Header from "./components/Header";
import Description from "./components/Description";
import SearchBar from "./components/SearchBar";
import ClearQuery from "./components/ClearQuery";
import ResultsHeader from "./components/ResultsHeader";
import ResultsList from "./components/ResultsList";
import Welcome from "./components/Welcome";
import NoResults from "./components/NoResults";
import PaginationWidget from "./components/PaginationWidget";
import Footer from "./components/Footer";
import Spinner from "./components/Spinner";
// import Keys from "./config/keys";
const Keys = {};
const guestAPIMode = true; /* Api calls are limited to 60 per hour in guestAPIMode */

/* When making guestAPIMode = false, also comment out const Keys = {} and uncomment the import Keys line above.
   Setup your keys by making a config folder in src ./config/keys.js paste in the following:

  exports.Keys = {
    clientID: '<ReplaceMe>',
    clientSecret: '<ReplaceMe>'
  };

  Replace both <ReplaceMe>'s with a clientID and clientSecret obtained as explained in the README -- How to Obtain Client ID and Client Secret.
  Homepage URL and Authorization callback URL can both just be http://localhost:3000/ or your equivalent
*/

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      issues: "",
      issuesCount: "",
      returnedAPI: "no",
      spinner: "hide",
      errorMessage: "",
      input: "",
      readOnly: "",
      language: "",
      label: "",
      labelText: "",
      sortOption: "",
      sortOptionText: "",
      pageLink: "",
      firstPage: 1,
      lastPage: 15,
      selectedPage: 1
    };
  }

  showSpinner() {
    this.setState({
      returnedAPI: "pending",
      spinner: "show"
    });
  }

  callAPI() {
    const value = this.state.input;
    //return empty string for parameter if no label, language, or sortOption is selected
    //empty parameters dont work well in query string
    let labelParameter;
    if (this.state.label === "") {
      labelParameter = "";
    } else {
      labelParameter = `+label:"${this.state.label}"`;
    }
    //set language parameter
    let languageParameter;
    if (this.state.language === "") {
      languageParameter = "";
    } else {
      languageParameter = `+language:${this.state.language}`;
    }
    //set sort option
    let sortOption;
    if (this.state.sortOption === "") {
      sortOption = "";
    } else {
      //parameters already set in DropdownSort.js
      sortOption = this.state.sortOption;
    }
    const clientAPIKeys = guestAPIMode ? "" : `&client_id=${Keys.clientID}&client_secret=${Keys.clientSecret}`;

    const params = {
      params: {
        per_page: 25
      }
    };
    APIbase.get(
      `issues?q=${value}+state:open${labelParameter}${languageParameter}${clientAPIKeys}${sortOption}`,
      params
    )
      .then(res => {
        let headers;
        let pageLink;
        //set as 0 as default
        let lastPage = 0;
        //only run logic if results are more than 0
        //link isnt sent when there are no results
        if (
          res.data.total_count.toLocaleString() !== "0" &&
          res.headers.link !== undefined
        ) {

          headers = res.headers.link.split(";");
          //logic to get pageLink
          pageLink = headers[0].slice(1, headers[0].length - 2);
          //logic to grab last page number from header and updateState
          lastPage = headers[1].split("=");
          let returnLength = lastPage.length - 1;
          lastPage = lastPage[returnLength].slice(
            0,
            lastPage[returnLength].length - 1
          );
        }
        this.setState({
          issues: res.data,
          issuesCount: res.data.total_count.toLocaleString(), //returns a language-sensitive represenation of string
          returnedAPI: "yes",
          spinner: "hide",
          lastPage: parseInt(lastPage),
          pageLink: pageLink,
          readOnly: ""
        });
      })
      .catch(err => {
        console.log(err.message);
        this.setState({ errorMessage: err.message });
      });
  }

  //hold value in searchbar
  searchInput(event) {
    this.setState({ input: event.target.value });
  }

  //quotes are used for search query
  searchByLabel(event) {
    //disable buttons when waiting for API
    //when spinner is showing
    if (this.state.spinner === "show") {
      return null;
    } else {
      this.setState(
        {
          label: event.target.dataset.id,
          labelText: event.target.dataset.text,
          selectedPage: 1
        },
        () => this.searchNormal()
      );
    }
  }

  searchByLanguage(event) {
    if (this.state.spinner === "show") {
      return null;
    } else {
      this.setState(
        {
          language: event.target.dataset.id,
          selectedPage: 1
        },
        () => this.searchNormal()
      );
    }
  }

  searchBySort(event) {
    if (this.state.spinner === "show") {
      return null;
    } else {
      this.setState(
        {
          sortOption: event.target.dataset.id,
          sortOptionText: event.target.dataset.text,
          selectedPage: 1
        },
        () => this.searchNormal()
      );
    }
  }

  clearQuery(e, attribute) {
    if (attribute) {
      this.showSpinner();
      this.setState({ [attribute]: "", [attribute + "Text"]: "" }, () =>
        this.callAPI()
      );
    } else {
      this.setState(
        {
          issues: "",
          issuesCount: "0",
          input: "",
          language: "",
          label: "",
          labelText: "",
          sortOption: "",
          sortOptionText: ""
        },
        () => this.ResultsListRender()
      );
    }
  }

  //event.preventDefault not working in callback
  searchNormal() {
    this.showSpinner();
    this.callAPI();
  }
  //Make API on load so user can see the data right away
  componentDidMount() {
    this.searchNormal();
  }
  //only search for open issues
  search(event) {
    event.preventDefault();
    this.showSpinner();
    //clear any parameters before making new search
    this.setState(
      {
        issues: "",
        issuesCount: "0",
        language: "",
        label: "",
        sortOption: "",
        readOnly: "readonly",
        selectedPage: 1
      },
      () => this.callAPI()
    );
  }

  ResultsListRender() {
    if (
      this.state.returnedAPI === "yes" &&
      this.state.issues !== "" &&
      this.state.issuesCount !== "0"
    ) {
      return (
        <div>
          <ResultsList issuesReturn={this.state.issues} />
          <PaginationWidget
            selectPageNumber={event => this.selectPageNumber(event)}
            nextButton={event => this.nextButton(event)}
            previousButton={event => this.previousButton(event)}
            firstPage={this.state.firstPage}
            lastPage={this.state.lastPage}
            selectedPage={this.state.selectedPage}
          />
        </div>
      );
    }
    if (this.state.spinner === "show" && this.state.returnedAPI !== "yes") {
      return <Spinner />;
    }
    //error handling if no issues returned
    if (this.state.issuesCount === "0" && this.state.issues !== "") {
      return <NoResults />;
      //on load no issues in state
    }
    if (this.state.issues === "") {
      return <Welcome />;
    }
    return <Welcome />;
  }

  QueryRender() {
    const { language, labelText, input, sortOptionText, issues } = this.state;
    const filterExists = language || labelText || sortOptionText;
    return (
      <Fragment>
        {(filterExists || issues || input) && (
          <ClearQuery
            text="Clear search query and filters"
            onClearQuery={e => this.clearQuery(e)}
          />
        )}
        {language && (
          <ClearQuery
            text={language}
            onClearQuery={event => this.clearQuery(event, "language")}
          />
        )}
        {labelText && (
          <ClearQuery
            text={labelText}
            onClearQuery={event => this.clearQuery(event, "label")}
          />
        )}
        {sortOptionText && (
          <ClearQuery
            text={sortOptionText}
            onClearQuery={event => this.clearQuery(event, "sortOption")}
          />
        )}
      </Fragment>
    );
  }

  //Widget previous and next buttons
  previousButton(event) {
    event.preventDefault();
    if (this.state.selectedPage !== 1) {
      this.showSpinner();
      this.setState(
        {
          selectedPage: this.state.selectedPage - 1
        },
        () => this.callApiFromWidget()
      );
    }
  }

  nextButton(event) {
    event.preventDefault();
    if (this.state.selectedPage < this.state.lastPage) {
      this.showSpinner();
      this.setState(
        {
          selectedPage: this.state.selectedPage + 1
        },
        () => this.callApiFromWidget()
      );
    } else {
      this.setState({
        selectedPage: this.state.selectedPage
      });
    }
  }

  callApiFromWidget() {
    axios.get(`${this.state.pageLink}${this.state.selectedPage}`).then(
      res => {
        this.setState({
          issues: res.data,
          returnedAPI: "yes",
          spinner: "hide"
        });
      },
      err => {
        console.log(err.message);
        this.setState({ errorMessage: err.message });
      }
    );
  }

  selectPageNumber(event) {
    event.preventDefault();
    //convert string to number
    let pageNumber = parseInt(event.target.dataset.id);
    //only update state if it is a number
    if (isNaN(pageNumber)) {
      return;
    } else {
      this.showSpinner();
      this.setState(
        {
          selectedPage: pageNumber
        },
        () => this.callApiFromWidget()
      );
    }
  }

  render() {
    const { language, label, sortOption } = this.state;
    return (
      <div className="App">
        <Header />
        <div className="container">
          <Description />
          <SearchBar
            readOnly={this.state.readOnly}
            searchInput={event => this.searchInput(event)}
            searchIssues={event => this.search(event)}
            input={this.state.input}
          />
          <div>{this.QueryRender()}</div>
          <ResultsHeader
            searchBySort={event => this.searchBySort(event)}
            currentSortOption={sortOption}
            searchedLabel={label}
            searchedLanguaged={language}
            totalCount={this.state.issuesCount}
            searchByLabel={event => this.searchByLabel(event)}
            searchByLanguage={event => this.searchByLanguage(event)}
          />
          {this.ResultsListRender()}
          <Footer />
        </div>
      </div>
    );
  }
}

export default App;

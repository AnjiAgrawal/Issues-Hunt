import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import Keys from './config/keys';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      issues: '',
      errorMessage: ''
    };
  }

  componentDidMount() {
    axios.get(`https://api.github.com/search/issues?q=pyton&client_id=${Keys.clientID}&client_secret=${Keys.clientSecret}`)
    .then(res => {
      console.log(res.data);
      this.setState({ issues: res.data});
    },
    err => {
      console.log(err.message);
      this.setState({errorMessage: err.message});
    })
  }

  render() {
    return (
      <div className="App">
        'hello there' I have a total count of {this.state.issues.total_count}
      </div>
    );
  }
}

export default App;
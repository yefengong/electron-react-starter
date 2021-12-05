import React from 'react';
import { Route, Switch } from 'react-router';
import logo from './assets/logo.svg';
import './App.css';
import Home from './components/Home';
import About from './components/About';

const App: React.FC = () => {
  return (
    <>
      <img alt="Vite logo" src={logo} width="300"></img>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
      </Switch>
    </>
  );
};

export default App;

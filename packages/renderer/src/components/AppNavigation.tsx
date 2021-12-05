import React from 'react';
import { Link } from 'react-router-dom';
import './AppNavigation.css';

const AppNavigation: React.FC = () => {
  return (
    <nav>
      <Link to="/">Home</Link>
      <span> | </span>
      <Link to="/about">About</Link>
    </nav>
  );
};

export default AppNavigation;

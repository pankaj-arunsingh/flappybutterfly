import React from 'react';
import './App.css';
import Game from './Game';
import { Analytics } from '@vercel/analytics/react';

const App: React.FC = () => {
  return (
    <div className="App">
      <Game />
      <Analytics />
    </div>
  );
};

export default App;

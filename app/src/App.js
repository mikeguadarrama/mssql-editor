import React from 'react';
import { Route } from 'react-router-dom'
import Table from './components/table'
import Tables from './components/tables'

function App() {
  return (
    <div className="App">
      <Route path="/" exact component={Tables} />
      <Route path="/table/:table" exact component={Table} />
    </div>
  );
}

export default App;

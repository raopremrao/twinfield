import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import HubView from './HubView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hub/:hubId" element={<HubView />} />
      </Routes>
    </Router>
  );
}

export default App;

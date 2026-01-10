import { BrowserRouter as Router, HashRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  // Use HashRouter for GitHub Pages compatibility
  // If deploying to subdirectory, switch to BrowserRouter with proper base path in vite.config.js
  const RouterComponent = HashRouter;

  return (
    <RouterComponent>
      <Routes>
        {/* Main dashboard - shows all links */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Workflow-specific dashboards - shows only links for that workflow */}
        <Route path="/workflow/:workflowName" element={<Dashboard />} />
      </Routes>
    </RouterComponent>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Reservation from './pages/Reservation';
import CheckIn from './pages/CheckIn';
import Member from './pages/Member';
import Tables from './pages/Tables';
import MetricsAdmin from './pages/MetricsAdmin';
import { APIProvider } from './contexts/APIContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <APIProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/reservation" element={<Reservation />} />
              <Route path="/checkin" element={<CheckIn />} />
              <Route path="/member/:groupId" element={<Member />} />
              <Route path="/tables" element={<Tables />} />
              <Route path="/admin" element={<MetricsAdmin />} />
            </Routes>
          </Layout>
        </Router>
      </APIProvider>
    </ErrorBoundary>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';

/**
 * Main App Component
 * Sets up routing and global providers
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/workspace/:id"
            element={
              <PrivateRoute>
                <Workspace />
              </PrivateRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  );
}

export default App;

// Made with Bob

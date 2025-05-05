import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage.tsx';
import WhitepaperPage from './pages/WhitepaperPage.tsx';
import LatestNewsPage from './pages/LatestNewsPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/whitepaper" element={<WhitepaperPage />} />
          <Route path="/latest-news" element={<LatestNewsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin" 
            element={ 
              <ProtectedRoute> 
                <AdminPage /> 
              </ProtectedRoute> 
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
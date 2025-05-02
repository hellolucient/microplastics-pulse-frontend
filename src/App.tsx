import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage.tsx';
import WhitepaperPage from './pages/WhitepaperPage.tsx';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/whitepaper" element={<WhitepaperPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
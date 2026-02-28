import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import ToolPage from './pages/ToolPage';
import ImageEditor from './pages/ImageEditor';
import SplitPdfPage from './pages/SplitPdfPage';

function App() {
  return (
    <BrowserRouter basename="/ilovepdf-in">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="tool/split-pdf" element={<SplitPdfPage />} />
            <Route path="tool/:toolId" element={<ToolPage />} />
            <Route path="image-editor" element={<ImageEditor />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

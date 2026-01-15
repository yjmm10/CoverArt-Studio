
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import EditorPage from './components/EditorPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'editor'>('landing');

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {currentPage === 'landing' ? (
        <LandingPage onStart={() => setCurrentPage('editor')} />
      ) : (
        <EditorPage onBack={() => setCurrentPage('landing')} />
      )}
    </div>
  );
};

export default App;

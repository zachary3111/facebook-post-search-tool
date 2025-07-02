import React from 'react';
import SearchForm from './components/SearchForm';

const App = () => (
  <div style={{ backgroundColor: '#0d1117', color: '#c9d1d9', minHeight: '100vh', padding: '2rem', fontFamily: 'Segoe UI, sans-serif' }}>
    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Facebook Post Search Tool By: Z </h1>
    <SearchForm />
  </div>
);

export default App;

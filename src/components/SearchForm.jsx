
import React, { useState } from 'react';

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN;

const SearchForm = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationUid, setLocationUid] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxResults, setMaxResults] = useState(100);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const fetchApifyData = async () => {
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/powerai~facebook-post-search-scraper/runs?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            location_uid: locationUid || "112483542097587",
            start_date: startDate,
            end_date: endDate,
            recent_posts: true,
            maxResults: Number(maxResults)
          }),
        }
      );

      const runData = await response.json();
      const runId = runData?.data?.id;
      if (!runId) throw new Error('Failed to retrieve Apify run ID.');

      const statusUrl = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`;

      const pollUntilReady = async () => {
        const maxTries = 10;
        for (let i = 0; i < maxTries; i++) {
          const res = await fetch(statusUrl);
          const data = await res.json();
          if (data.length > 0) return data;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return [];
      };

      const finalData = await pollUntilReady();
      setResults(finalData);
    } catch (error) {
      console.error('Apify fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchApifyData();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apify_results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!results || results.length === 0) return;
    const keys = Object.keys(results[0]);
    const csv = [
      keys.join(','),
      ...results.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apify_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
      <label>
        Search Query:
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </label>
      <label>
        Location UID:
        <input type="text" value={locationUid} onChange={(e) => setLocationUid(e.target.value)} />
      </label>
      <label>
        Start Date:
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>
      <label>
        End Date:
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>
      <label>
        Max Results:
        <input type="number" value={maxResults} onChange={(e) => setMaxResults(e.target.value)} />
      </label>
      <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#238636', color: 'white', border: 'none' }}>
        ▶ Start
      </button>

      {loading && <p>Loading...</p>}
      {results && results.length > 0 && (
        <div style={{ marginTop: '1rem', backgroundColor: '#161b22', padding: '1rem', borderRadius: '8px' }}>
          <h3>Results:</h3>
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={exportJSON} style={{ marginRight: '1rem' }}>Export JSON</button>
            <button onClick={exportCSV}>Export CSV</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {Object.keys(results[0]).map((key) => (
                  <th key={key} style={{ border: '1px solid #333', padding: '0.5rem', backgroundColor: '#0d1117', color: '#c9d1d9' }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((item, idx) => (
                <tr key={idx}>
                  {Object.values(item).map((val, i) => (
                    <td key={i} style={{ border: '1px solid #333', padding: '0.5rem', color: '#c9d1d9' }}>
                      {typeof val === 'object' ? JSON.stringify(val) : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </form>
  );
};

export default SearchForm;

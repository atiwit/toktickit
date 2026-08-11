import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// กำหนด Type สำหรับ Category
interface Category {
  id: number;
  name: string;
}

function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCheckSystem = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    setCategories([]);

    try {
      // เรียก API 2 ตัวพร้อมกัน: Health (Issue 2) และ Categories (Issue 4)
      const [healthRes, categoriesRes] = await Promise.all([
        fetch('http://localhost:3000/api/health'), // ปรับพอร์ตให้ตรงกับ Backend ของคุณ
        fetch('http://localhost:3000/api/categories')
      ]);

      if (!healthRes.ok || !categoriesRes.ok) {
        throw new Error('API is unavailable');
      }

      const healthData = await healthRes.json();
      const categoriesData = await categoriesRes.json();

      setStatus(healthData.status === 'ok' ? 'Online' : 'Offline');
      setCategories(categoriesData);
    } catch (err) {
      setStatus('Offline');
      setError('Unable to connect to Tok TickIT API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h1>TokTickIT IT Service Desk</h1>
      
      <button 
        className="btn btn-primary mb-4" 
        onClick={handleCheckSystem}
        disabled={loading}
      >
        [ Check System ]
      </button>

      {/* Loading State */}
      {loading && (
        <div className="alert alert-info">
          ⏳ loading...
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div>
          <p>System Status: <strong>{status}</strong></p>
          <div className="alert alert-danger">{error}</div>
        </div>
      )}

      {/* Success State */}
      {!loading && !error && status === 'Online' && (
        <div>
          <p>System Status: <strong className="text-success">{status}</strong></p>
          <h5>Supported Request Categories:</h5>
          <ul>
            {categories.map((cat) => (
              <li key={cat.id}>{cat.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
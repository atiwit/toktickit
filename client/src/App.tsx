import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  // สร้าง State สำหรับเก็บสถานะต่างๆ
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckSystem = async () => {
    setLoading(true);
    setError(null); // เคลียร์ error เก่าก่อนเริ่มเรียก API
    setStatus(null);

    try {
      // เรียก API ไปที่ Backend (ปรับ URL ให้ตรงกับพอร์ตที่คุณรัน)
      const response = await fetch('http://localhost:3000/api/health');
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // ถ้าสำเร็จ ให้เซ็ตสถานะเป็น Online
      if (data.status === 'ok') {
        setStatus('Online');
      }
    } catch (err) {
      // ถ้า Backend ปิดอยู่ หรือมี Error ให้แสดงข้อความที่มีประโยชน์
      setStatus('Offline');
      setError('Unable to connect to Tok TickIT API');
    } finally {
      setLoading(false); // ปิดสถานะ Loading
    }
  };

  return (
    <div className="container mt-5">
      <h2>Tok TickIT IT Service Desk</h2>
      
      <button 
        className="btn btn-primary my-3" 
        onClick={handleCheckSystem}
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Check System'}
      </button>

      {/* แสดงสถานะระบบ */}
      {status && (
        <div className="mb-2">
          <strong>System Status: </strong> 
          <span className={status === 'Online' ? 'text-success' : 'text-danger'}>
            {status}
          </span>
        </div>
      )}

      {/* แสดง Error Message ถ้าเชื่อมต่อไม่ได้ */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
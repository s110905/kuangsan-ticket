// src/App.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Apps Script Web App URL
const API_URL =
  'https://script.google.com/macros/s/AKfycbzuVVsvGHI0NhlGU_A07aYgu_m0xk5fNq2cJXUHXLLiCKb_7rRmx9SQQ1g_8h1LPXEGpQ/exec';

// localStorage keys
const LOCAL_TOKEN_KEY = 'kuangsan_2025_ticket_token';
const LOCAL_PHONE_KEY = 'kuangsan_2025_phone';

// 呼叫後端發票：帶 phone
async function issueTicketAPI(phone) {
  const res = await fetch(
    `${API_URL}?action=issue&source=kuangsan_2025&phone=${encodeURIComponent(phone)}`
  );
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || '領取票券失敗');
  }
  return data.token; // 可能是新票，也可能是後端找回舊票
}

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  // 一進頁面就看 localStorage 有沒有之前的票券
  useEffect(() => {
    const savedToken = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleGetTicket = async () => {
    try {
      setLoading(true);
      setError('');

      // ✅ 若這台裝置已領過（有 token），直接跳票券頁
      const savedTokenQuick = localStorage.getItem(LOCAL_TOKEN_KEY);
      if (savedTokenQuick) {
        window.gtag?.('event', 'kuangsan_view_existing_ticket', {
          page_location: window.location.href,
        });
        navigate(`/ticket/${savedTokenQuick}`);
        return;
      }

      const trimmedPhone = phone.trim();

      // 1️⃣ 檢查手機格式（台灣手機：09 開頭 10 碼）
      if (!/^09\d{8}$/.test(trimmedPhone)) {
        setError('請輸入正確的手機號碼（例：0912345678）');
        return;
      }

      // 3️⃣ GA：按下領券按鈕
      window.gtag?.('event', 'kuangsan_click_get_ticket', {
        page_location: window.location.href,
      });

      // 4️⃣ 呼叫 API 發票（後端會依手機判斷是否已領過）
      const newToken = await issueTicketAPI(trimmedPhone);
      setToken(newToken);

      // 記住手機跟票券（同瀏覽器不再允許換手機再領）
      localStorage.setItem(LOCAL_PHONE_KEY, trimmedPhone);
      localStorage.setItem(LOCAL_TOKEN_KEY, newToken);

      // 5️⃣ GA：票券產生成功（不管是新發或後端找回）
      window.gtag?.('event', 'kuangsan_ticket_issued', {
        source: 'kuangsan_2025',
        token_prefix: newToken.slice(0, 6),
      });

      // 6️⃣ 跳票券頁
      navigate(`/ticket/${newToken}`);
    } catch (err) {
      console.error(err);
      setError(err.message || '發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card">
        <header className="card-header">
  {/* ⭐ 新增：主視覺圖片 */}
  

  <h1 className="card-title">🎉 廣三活動專屬｜樂園體驗券免費領</h1>
<img
    src="/public/images/ride-banner.png"
    alt="旋轉木馬與碰碰車體驗"
    style={{
      width: '100%',
      maxWidth: 320,
      margin: '0 auto 12px',
      display: 'block',
      borderRadius: 12,
    }}
  />
  <p className="card-subtitle">
    恭喜您獲得一次<br />
    <strong style={{ fontSize: '1.5rem' }}> 旋轉木馬</strong> 或
    <strong style={{ fontSize: '1.5rem' }}> 碰碰車 </strong>
    免費體驗。
  </p>
</header>


        {/* 手機輸入欄位 */}
        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor="phone"
            style={{
              display: 'block',
              fontSize: '0.85rem',
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            手機號碼
          </label>

          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="例：0912345678"
            disabled={!!token}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              fontSize: '0.95rem',
              outline: 'none',
              opacity: token ? 0.6 : 1,
              cursor: token ? 'not-allowed' : 'text',
            }}
          />

          {token ? (
            <p className="text-xs" style={{ marginTop: 6, color: '#6b7280' }}>
              此裝置已領取過票券，請直接點「查看我的票券」。
            </p>
          ) : (
            <p className="text-xs" style={{ marginTop: 4, color: '#6b7280' }}>
              本活動每支手機限領一張票券，同一裝置僅能綁定一支手機號碼。
            </p>
          )}
        </div>

        <button onClick={handleGetTicket} disabled={loading} className="btn btn-primary">
          {loading ? '處理中…' : token ? '查看我的票券' : '立即領取專屬體驗券'}
        </button>

        {error && <p className="msg-error">{error}</p>}

        {token && (
          <p
            className="text-xs"
            style={{ marginTop: 6, textAlign: 'center', wordBreak: 'break-all' }}
          >
            （測試用）目前票券 token：{token}
          </p>
        )}

        <section className="section">
          <h3>活動說明</h3>
          活動期間：1/15~3/15
          <p style={{ marginBottom: 6 }}>
            廣三好友限定小禮物！活動期間，透過本頁領取體驗券，至
            <strong> 九九峰動物樂園 </strong>
            現場出示票券，即可免費體驗
            <strong> 旋轉木馬 或 碰碰車 </strong>
            乙次（擇一）。
          </p>

          <h3>如何使用體驗券</h3>
          <ol>
            <li>輸入手機號碼並點擊「立即領取專屬體驗券」。</li>
            <li>系統會依手機產出（或找回）一張專屬票券。</li>
            <li>畫面將自動跳轉至票券頁，顯示一組 QR Code。</li>
            <li>
              至九九峰動物樂園指定遊樂設施排隊時，出示票券給現場工作人員掃描核銷。
            </li>
          </ol>

          <h3>貼心提醒</h3>
          <ul style={{ paddingLeft: 18, margin: '4px 0 0', fontSize: '0.85rem' }}>
            <li>每支手機號碼限領一張票券，請妥善保管票券畫面。</li>
            <li>同一裝置僅能綁定一支手機號碼，如需更換請洽現場服務人員。</li>
            <li>實際開放設施與安全規範以現場公告為主。</li>
            <li>您提供之手機號碼僅供本活動登記使用，不會作其他用途。</li>
          </ul>
        </section>

        {/* 🧪 測試用按鈕：只有在 localhost 才會顯示 */}
        {window.location.hostname === 'localhost' && (
          <button
            onClick={() => {
              localStorage.removeItem(LOCAL_TOKEN_KEY);
              localStorage.removeItem(LOCAL_PHONE_KEY);
              alert('✔ 已清除測試資料（手機 / token）');
              window.location.href = '/';
            }}
            style={{
              marginTop: '20px',
              padding: '10px 16px',
              width: '100%',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '0.9rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            🧹 清除測試資料（僅測試環境）
          </button>
        )}
      </div>
    </div>
  );
}

export default App;

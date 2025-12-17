// src/pages/RedeemPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Apps Script Web App URL
const API_URL =
  'https://script.google.com/macros/s/AKfycbzuVVsvGHI0NhlGU_A07aYgu_m0xk5fNq2cJXUHXLLiCKb_7rRmx9SQQ1g_8h1LPXEGpQ/exec';

async function fetchTicketInfo(token) {
  const res = await fetch(
    `${API_URL}?action=getTicket&token=${encodeURIComponent(token)}`
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.message || '票券不存在');
  return data; // { success, token, status, usedAt, item, ... }
}

async function redeemAPI(token, item) {
  const res = await fetch(
    `${API_URL}?action=redeem&token=${encodeURIComponent(
      token
    )}&item=${encodeURIComponent(item)}`
  );
  return res.json();
}

export default function RedeemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState('');

  const readableItem = (code) => {
    if (code === 'carousel') return '旋轉木馬';
    if (code === 'bumper_car') return '碰碰車';
    return code || '未指定';
  };

  // ✅ 沒 token：友善提示
  if (!token) {
    return (
      <div className="page-shell">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#b91c1c', marginBottom: 8 }}>⚠️ 無法核銷（缺少票券代碼）</h2>
          <p className="text-muted">此頁面需由「票券頁 QR Code」進入。</p>
          <p className="text-xs" style={{ marginTop: 8, color: '#6b7280' }}>
            請請遊客出示票券畫面，重新掃描 QR Code 進行核銷。
          </p>
        </div>
      </div>
    );
  }

  // ✅ 首次載入先查票券狀態
  useEffect(() => {
    const load = async () => {
      try {
        setPageLoading(true);
        setError('');
        setResult(null);
        setSelectedItem('');

        const data = await fetchTicketInfo(token);
        setTicket(data);

        // ✅ 如果本來就已核銷，停留一下後直接回票券頁
        if (data.status === 'used') {
          setTimeout(() => {
            navigate(`/ticket/${encodeURIComponent(data.token)}`, { replace: true });
          }, 5000);
        }
      } catch (err) {
        setTicket(null);
        setError(err.message || '讀取票券失敗');
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [token, navigate]);

  // ✅ 核銷成功後：1.2 秒自動回票券頁
  useEffect(() => {
    if (result?.success && ticket?.token) {
      const t = setTimeout(() => {
        navigate(`/ticket/${encodeURIComponent(ticket.token)}`, { replace: true });
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [result, ticket, navigate]);

  if (pageLoading) {
    return (
      <div className="page-shell">
        <div className="card" style={{ textAlign: 'center' }}>核銷畫面載入中…</div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="page-shell">
        <div className="card" style={{ textAlign: 'center', color: '#b91c1c' }}>
          {error}
        </div>
      </div>
    );
  }

  const isUsed = ticket?.status === 'used';
  const isFinished = isUsed || !!(result && result.success);

  const handleRedeem = async (itemCode) => {
    try {
      setLoading(true);
      setError('');
      setResult(null);

      if (ticket?.status === 'used') {
        setError('本券已核銷，無法重複核銷');
        return;
      }

      const data = await redeemAPI(token, itemCode);
      if (!data.success) {
        setError(data.message || '核銷失敗，請再試一次');
        return;
      }

      setResult({ ...data, item: itemCode });

      // ✅ 刷新票券狀態（拿到 usedAt / item）
      const refreshed = await fetchTicketInfo(token);
      setTicket(refreshed);
    } catch (err) {
      console.error(err);
      setError('核銷時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (itemCode) => {
    if (loading || isFinished) return;

    if (selectedItem === itemCode) {
      handleRedeem(itemCode);
    } else {
      setSelectedItem(itemCode);
      setError('');
      setResult(null);
    }
  };

  return (
    <div className="page-shell">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 6 }}>
          <span className="badge badge-ghost">工作人員核銷專用</span>
        </div>

        <h2 className="card-title" style={{ fontSize: '1.35rem', marginBottom: 4 }}>
          🎫 九九峰動物樂園｜遊樂體驗兌換
        </h2>

        <p className="card-subtitle" style={{ marginBottom: 10 }}>
          本券可擇一兌換
          <strong style={{ fontSize: '1.5rem' }}> 旋轉木馬 </strong>
          或
          <strong style={{ fontSize: '1.5rem' }}> 碰碰車 </strong>
          一次體驗。<br />
          請由現場工作人員協助操作。
        </p>

        <p className="text-xs" style={{ marginBottom: 8, wordBreak: 'break-all' }}>
          票券編號：{ticket?.token || token}
        </p>

        {/* ✅ 已核銷狀態 */}
        {isUsed && (
          <div style={{ marginTop: 12 }}>
            <span className="badge badge-gray">已核銷</span>
            <div className="text-xs" style={{ marginTop: 8, color: '#6b7280' }}>
              {ticket?.usedAt ? (
                <>
                  核銷時間：{String(ticket.usedAt)}
                  <br />
                </>
              ) : null}
              {ticket?.item ? <>使用項目：{readableItem(ticket.item)}</> : null}
              <div style={{ marginTop: 8, fontWeight: 650 }}>
                即將返回票券頁…
              </div>
            </div>
          </div>
        )}

        {/* ✅ 未核銷：兩次點擊確認 */}
        {!isUsed && (
          <div style={{ marginTop: 16 }}>
            <p
              className="text-xs"
              style={{ marginBottom: 12, color: '#dc2626', fontWeight: 600 }}
            >
              請確認遊客選擇的項目後，由工作人員「再次點擊同一按鈕」完成核銷：
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                disabled={loading || isFinished}
                onClick={() => handleItemClick('carousel')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  backgroundColor: selectedItem === 'carousel' ? '#16a34a' : '#22c55e',
                  color: 'white',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: isFinished ? 'not-allowed' : 'pointer',
                  opacity: loading || isFinished ? 0.5 : 1,
                }}
              >
                {loading && selectedItem === 'carousel'
                  ? '處理中…'
                  : selectedItem === 'carousel' && !isFinished
                  ? '再次點擊確認：旋轉木馬'
                  : '旋轉木馬'}
              </button>

              <button
                disabled={loading || isFinished}
                onClick={() => handleItemClick('bumper_car')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  backgroundColor: selectedItem === 'bumper_car' ? '#1d4ed8' : '#3b82f6',
                  color: 'white',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: isFinished ? 'not-allowed' : 'pointer',
                  opacity: loading || isFinished ? 0.5 : 1,
                }}
              >
                {loading && selectedItem === 'bumper_car'
                  ? '處理中…'
                  : selectedItem === 'bumper_car' && !isFinished
                  ? '再次點擊確認：碰碰車'
                  : '碰碰車'}
              </button>
            </div>
          </div>
        )}

        {result && result.success && (
          <div className="msg-success" style={{ marginTop: 14, padding: 8, borderRadius: 8 }}>
            <strong style={{ fontSize: '1.5rem' }}>✅ 核銷成功!!!</strong>
            <div className="text-xs" style={{ marginTop: 6 }}>
              使用項目：{readableItem(result.item)}
            </div>
            <div className="text-xs" style={{ marginTop: 6, color: '#166534', fontWeight: 650 }}>
              即將返回票券頁…
            </div>
          </div>
        )}

        {error && (
          <div className="msg-error" style={{ marginTop: 14, padding: 8, borderRadius: 8 }}>
            ❗ {error}
          </div>
        )}

        <p className="text-xs" style={{ marginTop: 12, color: '#6b7280' }}>
          如遇問題，請記錄畫面訊息並回報園區窗口。
        </p>
      </div>
    </div>
  );
}

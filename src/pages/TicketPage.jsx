// src/pages/TicketPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const API_URL =
  'https://script.google.com/macros/s/AKfycbzuVVsvGHI0NhlGU_A07aYgu_m0xk5fNq2cJXUHXLLiCKb_7rRmx9SQQ1g_8h1LPXEGpQ/exec';

// 用 token 查票
async function fetchTicketInfo(token) {
  const res = await fetch(
    `${API_URL}?action=getTicket&token=${encodeURIComponent(token)}`
  );
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || '票券不存在');
  }
  return data;
}

export default function TicketPage() {
  const { token: routeToken } = useParams(); // 只用來查票
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        if (!routeToken) throw new Error('缺少票券代碼');
        const data = await fetchTicketInfo(routeToken);
        setTicket(data);
      } catch (err) {
        setError(err.message || '讀取票券時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [routeToken]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="card" style={{ textAlign: 'center' }}>
          票券載入中…
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page-shell">
        <div className="card" style={{ textAlign: 'center', color: '#b91c1c' }}>
          {error || '票券資料異常'}
        </div>
      </div>
    );
  }

  const isUsed = ticket.status === 'used';

  // ✅【重點】核銷網址一律用「後端回來的 ticket.token」
  const redeemUrl = `/redeem?token=${encodeURIComponent(ticket.token)}`;

  // 點 QR 同頁跳轉（測試 + 現場都安全）
  const handleClickQR = () => {
    navigate(redeemUrl);
  };

  return (
    <div className="page-shell">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 6 }}>
          <span className="badge badge-ghost">廣三好友專屬票券</span>
        </div>

        <h2 className="card-title" style={{ fontSize: '1.35rem', marginBottom: 4 }}>
          🎫 九九峰動物樂園｜遊樂體驗券
        </h2>

        <p className="card-subtitle">
          出示本票券並由工作人員掃描核銷後，
          <br />
          可享
          <strong style={{ fontSize: '1.5rem' }}> 旋轉木馬 </strong>
          或
          <strong style={{ fontSize: '1.5rem' }}> 碰碰車 </strong>
          免費體驗一次。
        </p>

        <div style={{ margin: '14px 0' }}>
          <span className={`badge ${isUsed ? 'badge-gray' : 'badge-success'}`}>
            {isUsed ? '已使用' : '未使用'}
          </span>
        </div>

        {!isUsed ? (
          <>
            <p className="text-muted" style={{ marginBottom: 10 }}>
              📱 請由工作人員
              <strong> 掃描 </strong>
              下方 QR Code，或
              <strong> 點擊 QR Code </strong>
              直接開啟核銷畫面。
            </p>

            {/* QR Code：一定含 token */}
            <div
              className="qr-wrapper"
              onClick={handleClickQR}
              style={{ cursor: 'pointer' }}
            >
              <QRCodeCanvas
                value={window.location.origin + redeemUrl}
                size={210}
              />
            </div>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 650, marginTop: 8 }}>
              此票券已完成兌換
            </p>
            {ticket.usedAt && (
              <p className="text-muted" style={{ marginTop: 4 }}>
                使用時間：{String(ticket.usedAt)}
              </p>
            )}
            {ticket.item && (
              <p className="text-muted" style={{ marginTop: 4 }}>
                使用項目：
                {ticket.item === 'carousel'
                  ? ' 旋轉木馬'
                  : ticket.item === 'bumper_car'
                  ? ' 碰碰車'
                  : ` ${ticket.item}`}
              </p>
            )}
          </>
        )}

        <div className="section">
          <h3>票券資訊</h3>
          <p
            className="text-xs"
            style={{ wordBreak: 'break-all', marginBottom: 4 }}
          >
            票券編號：{ticket.token}
          </p>
          <p className="text-xs">
            本券限使用一次，核銷後即失效，請勿將畫面提供他人截圖轉傳。
          </p>
        </div>
      </div>
    </div>
  );
}

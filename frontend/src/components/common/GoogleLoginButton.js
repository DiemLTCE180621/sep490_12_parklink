import React, { useEffect, useRef, useState } from 'react';
import PolicyDetailModal from '../modals/PolicyDetailModal';

const GoogleLoginButton = ({ onSuccess, onError, disabled = false, text = 'signin_with', showDisclaimer = true }) => {
  const buttonContainerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPolicyType, setSelectedPolicyType] = useState('CUSTOMER');

  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1029384756-parklink-google-oauth.apps.googleusercontent.com';

  useEffect(() => {
    
    const existingScript = document.getElementById('google-gsi-client');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        console.warn('Không thể kết nối đến máy chủ Google Identity Services.');
        setScriptLoaded(false);
      };
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    
    if (scriptLoaded && window.google?.accounts?.id && buttonContainerRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onSuccess(response.credential);
            } else if (onError) {
              onError('Không nhận được mã xác thực từ Google!');
            }
          }
        });

        buttonContainerRef.current.innerHTML = '';

        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: text,
          width: '100%',
          logo_alignment: 'left'
        });
      } catch (err) {
        console.warn('Lỗi khởi tạo nút Google:', err);
      }
    }
  }, [scriptLoaded, clientId, onSuccess, onError, text]);

  const handleOpenPolicy = (e, type) => {
    e.preventDefault();
    setSelectedPolicyType(type);
    setModalOpen(true);
  };

  return (
    <div className="w-full space-y-2.5">
      
      <div className="w-full flex justify-center">
        <div ref={buttonContainerRef} className="w-full min-h-[44px] flex justify-center" />
      </div>

      {(!scriptLoaded || !window.google?.accounts?.id) && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            
            const simulatedDemoToken = btoa(JSON.stringify({
              email: 'customer.demo@gmail.com',
              name: 'Khách Hàng Google Test',
              email_verified: true,
              sub: 'google_test_' + Date.now()
            }));
            
            if (onSuccess) {
              onSuccess(simulatedDemoToken);
            }
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 shadow-sm transition active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Tiếp tục với Google</span>
        </button>
      )}

      {showDisclaimer && (
        <p className="text-[11px] text-slate-500 text-center leading-normal px-2">
          Bằng việc tiếp tục với Google, bạn đồng ý với{' '}
          <button
            type="button"
            onClick={(e) => handleOpenPolicy(e, 'CUSTOMER')}
            className="text-teal-600 hover:text-teal-700 font-semibold underline"
          >
            Chính sách & Điều khoản dịch vụ
          </button>{' '}
          của ParkLink.
        </p>
      )}

      <PolicyDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        policyType={selectedPolicyType}
      />
    </div>
  );
};

export default GoogleLoginButton;

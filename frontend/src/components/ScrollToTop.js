import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component lắng nghe sự thay đổi URL đường dẫn (pathname)
 * và tự động cuộn trang lên trên cùng (Top) khi chuyển trang
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;

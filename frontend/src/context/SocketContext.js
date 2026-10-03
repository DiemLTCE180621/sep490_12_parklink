import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Chỉ kết nối Socket khi người dùng đã đăng nhập thành công
        if (!isAuthenticated || !user) {
            if (socket) {
                socket.close();
                setSocket(null);
            }
            return;
        }

        // Tạo kết nối một lần duy nhất
        const newSocket = io('http://localhost:5000', {
            query: { userId: user.id }
        });

        setSocket(newSocket);

        // Hủy kết nối khi user đăng xuất hoặc tắt trình duyệt
        return () => newSocket.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

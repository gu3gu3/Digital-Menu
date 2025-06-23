import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { notificationService } from '../services/notificationService';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getNotifications(5, 0);
            if (response.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling every 60 seconds (optimizado para reducir rate limiting)
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            // Refresh list after marking as read
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
             // Refresh list after marking all as read
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark all notifications as read", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationService.deleteNotification(id);
            // Refresh list after deleting
            fetchNotifications();
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };
    
    const timeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos";
        return Math.floor(seconds) + " segundos";
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none">
                <span className="sr-only">Ver notificaciones</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-white ring-2 ring-red-500"></span>
                )}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 md:w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <div className="px-4 py-3 flex items-center justify-between border-b">
                            <h3 className="text-md font-medium text-gray-900">Notificaciones</h3>
                            {unreadCount > 0 && (
                               <button onClick={handleMarkAllAsRead} className="text-sm text-indigo-600 hover:text-indigo-800">Marcar todas como leídas</button>
                            )}
                        </div>
                        
                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {loading ? (
                                <p className="text-center py-4 text-gray-500">Cargando...</p>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto" />
                                    <h4 className="mt-2 text-md font-medium text-gray-800">Todo al día</h4>
                                    <p className="text-sm text-gray-500 mt-1">No tienes notificaciones nuevas.</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div key={notif.id} className={`p-4 hover:bg-gray-50 ${!notif.leida ? 'bg-indigo-50' : ''}`}>
                                        <div className="flex items-start">
                                             {!notif.leida && <div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0"></div>}
                                            <div className="ml-3 w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900">{notif.titulo}</p>
                                                <p className="mt-1 text-sm text-gray-600">{notif.mensaje}</p>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <p className="text-xs text-gray-500">{timeSince(notif.createdAt)}</p>
                                                    <div className="flex items-center space-x-3">
                                                        {!notif.leida && (
                                                            <button onClick={() => handleMarkAsRead(notif.id)} className="text-xs text-indigo-500 hover:underline">
                                                                Marcar como leída
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDelete(notif.id)} className="text-gray-400 hover:text-red-600">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                         <div className="px-4 py-2 border-t">
                            <Link 
                                to="/admin/notifications"
                                className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                onClick={() => setIsOpen(false)}
                            >
                                Ver todas las notificaciones
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell; 
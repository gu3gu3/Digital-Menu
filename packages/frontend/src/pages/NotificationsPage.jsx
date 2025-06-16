import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { BellIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        offset: 0,
        limit: 15,
        hasMore: true,
    });
    
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

    const loadNotifications = useCallback(async (isNewLoad = false) => {
        if (loading && !isNewLoad) return;
        setLoading(true);

        try {
            const currentOffset = isNewLoad ? 0 : pagination.offset;
            const response = await notificationService.getNotifications(pagination.limit, currentOffset);

            if (response.success) {
                setNotifications(prev => isNewLoad ? response.data.notifications : [...prev, ...response.data.notifications]);
                setPagination(prev => ({
                    ...prev,
                    offset: currentOffset + response.data.notifications.length,
                    hasMore: response.data.pagination.hasMore,
                }));
            }
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, pagination.offset, loading]);

    useEffect(() => {
        // Initial load
        loadNotifications(true);
    }, []); // Dependency array is empty to run only once on mount

    const handleDelete = async (id) => {
        try {
            await notificationService.deleteNotification(id);
            // Visually remove the notification from the list without a full reload
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Failed to delete notification:", error);
            // Optionally show an error to the user
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <BellIcon className="h-8 w-8 text-primary-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Centro de Notificaciones</h1>
                        <p className="text-sm text-gray-500">Historial completo de todas tus alertas y comunicaciones.</p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-200">
                {notifications.map(notif => (
                    <div key={notif.id} className={`p-5 flex items-start space-x-4 transition-all duration-300 ${!notif.leida ? 'bg-primary-50' : 'bg-white'}`}>
                        <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${!notif.leida ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">{notif.titulo}</p>
                            <p className="text-gray-600 mt-1">{notif.mensaje}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500 flex-shrink-0 w-36 flex items-center justify-end space-x-4">
                            <span>{timeSince(notif.createdAt)} atrás</span>
                             <button onClick={() => handleDelete(notif.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                                <span className="sr-only">Eliminar</span>
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {loading && (
                 <div className="py-6 text-center text-gray-500">Cargando más notificaciones...</div>
            )}

            {!loading && pagination.hasMore && (
                <div className="p-4 bg-gray-50 border-t">
                    <button
                        onClick={() => loadNotifications()}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        Cargar más
                    </button>
                </div>
            )}

            {!loading && notifications.length === 0 && (
                <div className="text-center py-20 px-4">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
                    <h4 className="mt-4 text-xl font-semibold text-gray-800">Bandeja de entrada limpia</h4>
                    <p className="text-gray-500 mt-2">No tienes ninguna notificación por ahora.</p>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage; 
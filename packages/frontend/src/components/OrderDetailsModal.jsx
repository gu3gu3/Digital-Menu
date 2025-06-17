import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { 
  XMarkIcon, 
  ClockIcon,
  UserIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ChevronUpDownIcon,
  UsersIcon 
} from '@heroicons/react/24/outline';
import OrderStatusBadge from './OrderStatusBadge';
import ordersService from '../services/ordersService';
import staffService from '../services/staffService';

const OrderDetailsModal = ({ isOpen, onClose, order, onOrderUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [availableMeseros, setAvailableMeseros] = useState([]);
  const [selectedMesero, setSelectedMesero] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const statusOptions = [
    { value: 'ENVIADA', label: 'Enviada' },
    { value: 'RECIBIDA', label: 'Recibida' },
    { value: 'CONFIRMADA', label: 'Confirmada' },
    { value: 'EN_PREPARACION', label: 'En Preparación' },
    { value: 'LISTA', label: 'Lista' },
    { value: 'SERVIDA', label: 'Servida' },
    { value: 'COMPLETADA', label: 'Completada' },
    { value: 'CANCELADA', label: 'Cancelada' }
  ];

  useEffect(() => {
    if (order) {
      setSelectedStatus(statusOptions.find(s => s.value === order.estado) || statusOptions[0]);
      setNotes('');
      setSelectedMesero(order.mesero ? {
        id: order.mesero.id,
        label: `${order.mesero.nombre} ${order.mesero.apellido || ''}`.trim(),
        value: order.mesero.id
      } : null);
    }
  }, [order]);

  useEffect(() => {
    // Load current user info
    const adminUser = localStorage.getItem('adminUser');
    const staffUser = localStorage.getItem('staffUser');
    
    if (adminUser) {
      setCurrentUser({ ...JSON.parse(adminUser), role: 'ADMINISTRADOR' });
    } else if (staffUser) {
      setCurrentUser({ ...JSON.parse(staffUser), role: 'MESERO' });
    }
  }, []);

  useEffect(() => {
    if (isOpen && currentUser?.role === 'ADMINISTRADOR') {
      loadAvailableMeseros();
    }
  }, [isOpen, currentUser]);

  const loadAvailableMeseros = async () => {
    try {
      const response = await staffService.getMeseros({ activo: 'true' });
      const meseros = response.data?.meseros || [];
      setAvailableMeseros([
        { id: null, label: 'No asignado', value: null },
        ...meseros.map(mesero => ({
          id: mesero.id,
          label: `${mesero.nombre} ${mesero.apellido || ''}`.trim(),
          value: mesero.id
        }))
      ]);
    } catch (error) {
      console.error('Error loading meseros:', error);
    }
  };

  const handleAssignMesero = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      await ordersService.assignMeseroToOrder(order.id, selectedMesero?.value || null);
      
      // Notify parent component
      onOrderUpdate && onOrderUpdate();
      
    } catch (error) {
      console.error('Error assigning mesero:', error);
      alert('Error al asignar mesero');
    } finally {
      setUpdating(false);
    }
  };

  const handleTakeOrder = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      await ordersService.takeOrder(order.id);
      
      // Notify parent component
      onOrderUpdate && onOrderUpdate();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error taking order:', error);
      alert('Error al tomar la orden');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus || !order) return;

    try {
      setUpdating(true);
      await ordersService.updateOrderStatus(order.id, selectedStatus.value, notes);
      
      // Notify parent component
      onOrderUpdate && onOrderUpdate();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado de la orden');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
    return new Date(dateString).toLocaleString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    return `C$ ${parseFloat(amount).toFixed(2)}`;
  };

  if (!order) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      Orden #{order.numeroOrden}
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 mt-1">
                      Mesa {order.mesa?.numero} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <OrderStatusBadge status={order.estado} />
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Cliente</p>
                      <p className="text-sm font-medium">
                        {order.nombreClienteFactura || order.sesion?.clienteNombre || 'Cliente anónimo'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <UsersIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Mesero</p>
                      <p className="text-sm font-medium">
                        {order.mesero 
                          ? `${order.mesero.nombre} ${order.mesero.apellido || ''}`.trim()
                          : 'No asignado'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Tiempo transcurrido</p>
                      <p className="text-sm font-medium">
                        {order.createdAt ? Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60)) : 'N/A'} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CreditCardIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Productos</h4>
                  <div className="space-y-3">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.producto?.nombre}</p>
                          {item.notas && (
                            <p className="text-sm text-gray-600 mt-1">
                              <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                              {item.notas}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-600">x{item.cantidad}</p>
                          <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                {order.notas && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Notas del pedido</h4>
                    <p className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      {order.notas}
                    </p>
                  </div>
                )}

                {/* Status Update Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Actualizar Estado</h4>
                  
                  <div className="space-y-4">
                    {/* Status Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nuevo Estado
                      </label>
                      <Listbox value={selectedStatus} onChange={setSelectedStatus}>
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <span className="block truncate">
                              {selectedStatus?.label || 'Seleccionar estado'}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              {statusOptions.map((status) => (
                                <Listbox.Option
                                  key={status.value}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                                    }`
                                  }
                                  value={status}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {status.label}
                                      </span>
                                      {selected && (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                                          <CheckIcon className="h-5 w-5" />
                                        </span>
                                      )}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas adicionales (opcional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Agregar notas sobre la actualización del estado..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={updating}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleUpdateStatus}
                        disabled={updating || !selectedStatus || selectedStatus.value === order.estado}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? 'Actualizando...' : 'Actualizar Estado'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mesero Assignment Section */}
                {currentUser?.role === 'ADMINISTRADOR' && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Asignar Mesero</h4>
                    
                    <div className="space-y-4">
                      {/* Mesero Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mesero
                        </label>
                        <Listbox value={selectedMesero} onChange={setSelectedMesero}>
                          <div className="relative">
                            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                              <span className="block truncate">
                                {selectedMesero?.label || 'Seleccionar mesero'}
                              </span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                              </span>
                            </Listbox.Button>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                {availableMeseros.map((mesero) => (
                                  <Listbox.Option
                                    key={mesero.value}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                                      }`
                                    }
                                    value={mesero}
                                  >
                                    {({ selected }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {mesero.label}
                                        </span>
                                        {selected && (
                                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                                            <CheckIcon className="h-5 w-5" />
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          onClick={handleAssignMesero}
                          disabled={updating || !selectedMesero}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating ? 'Asignando...' : 'Asignar Mesero'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Take Order Section */}
                {currentUser?.role === 'MESERO' && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Tomar Orden</h4>
                    
                    <div className="space-y-4">
                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          onClick={handleTakeOrder}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating ? 'Tomando...' : 'Tomar Orden'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default OrderDetailsModal; 
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
  UsersIcon,
  PrinterIcon 
} from '@heroicons/react/24/outline';
import OrderStatusBadge from './OrderStatusBadge';
import ordersService from '../services/ordersService';
import staffService from '../services/staffService';
import restaurantService from '../services/restaurantService';
import useRestaurantCurrency from '../hooks/useRestaurantCurrency';

const OrderDetailsModal = ({ isOpen, onClose, order, onOrderUpdate }) => {
  const { formatAmount } = useRestaurantCurrency();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [availableMeseros, setAvailableMeseros] = useState([]);
  const [selectedMesero, setSelectedMesero] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadRestaurantData();
    }
  }, [isOpen]);

  const loadRestaurantData = async () => {
    try {
      const data = await restaurantService.getMyRestaurant();
      setRestaurantData(data);
    } catch (e) {
      console.error('Error loading restaurant info for print:', e);
    }
  };

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

  const handlePrint = () => {
    const printContent = document.getElementById('print-ticket-container').innerHTML;
    
    // Crear iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write('<html><head><title>Prefactura - ' + (restaurantData?.nombre || 'Orden') + '</title>');
    doc.write('<style>');
    doc.write(`
      @page { margin: 0; }
      body { 
        margin: 0; 
        padding: 15px; 
        font-family: monospace; 
        font-size: 13px; 
        color: #000; 
        max-width: 80mm; 
        margin: 0 auto; 
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .font-bold { font-weight: bold; }
      .text-xl { font-size: 20px; }
      .text-xs { font-size: 11px; }
      .text-sm { font-size: 14px; }
      .mb-1 { margin-bottom: 4px; }
      .mb-2 { margin-bottom: 8px; }
      .mb-4 { margin-bottom: 16px; }
      .mt-1 { margin-top: 4px; }
      .mt-2 { margin-top: 8px; }
      .mt-6 { margin-top: 24px; }
      .uppercase { text-transform: uppercase; }
      .py-1 { padding-top: 4px; padding-bottom: 4px; }
      .py-2 { padding-top: 8px; padding-bottom: 8px; }
      .pt-2 { padding-top: 8px; }
      .pb-1 { padding-bottom: 4px; }
      .px-1 { padding-left: 4px; padding-right: 4px; }
      .w-8 { width: 32px; }
      .w-full { width: 100%; }
      .italic { font-style: italic; }
      .border-t { border-top: 1px dashed #000; }
      .border-b { border-bottom: 1px dashed #000; }
      .space-y-1 > * + * { margin-top: 4px; }
      .flex { display: flex; justify-content: space-between; }
      table { border-collapse: collapse; width: 100%; table-layout: fixed; }
      th, td { text-align: left; vertical-align: top; word-wrap: break-word; }
      th.text-right, td.text-right { text-align: right; }
      th.text-center, td.text-center { text-align: center; }
    `);
    doc.write('</style></head><body>');
    doc.write(printContent);
    doc.write('</body></html>');
    doc.close();
    
    // Esperar a que el contenido se renderice
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Eliminar iframe después de la impresión
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
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
                      {order.tipoPedido === 'A_DOMICILIO' 
                        ? 'A Domicilio' 
                        : order.tipoPedido === 'RECOGER' 
                        ? 'Pasar a recoger' 
                        : `Mesa ${order.mesa?.numero}`} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <OrderStatusBadge status={order.estado} />
                    <button
                      onClick={handlePrint}
                      className="text-gray-500 hover:text-primary-600 p-1 transition-colors no-print"
                      title="Imprimir Prefactura"
                    >
                      <PrinterIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 p-1 no-print"
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
                        <span translate="no">{formatAmount(order.total)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información adicional del cliente para pedidos externos */}
                {(order.datosCliente?.telefono || order.datosCliente?.direccion) && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Detalles de Entrega / Contacto</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {order.datosCliente?.telefono && (
                        <div>
                          <p className="text-xs text-gray-500">Teléfono</p>
                          <p className="text-sm font-medium text-gray-900">{order.datosCliente.telefono}</p>
                        </div>
                      )}
                      {order.datosCliente?.direccion && (
                        <div>
                          <p className="text-xs text-gray-500">Dirección</p>
                          <p className="text-sm font-medium text-gray-900">{order.datosCliente.direccion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                          <p className="font-medium"><span translate="no">{formatAmount(item.subtotal)}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600" translate="no">{formatAmount(order.total)}</span>
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

      {/* Printable Invoice Ticket (Hidden on screen, rendered in iframe) */}
      {order && isOpen && (
        <div id="print-ticket-container" className="hidden">
          <div className="text-center mb-4">
            <h2 className="font-bold text-xl uppercase mb-1">{restaurantData?.nombre || 'Restaurante'}</h2>
            <p className="text-xs">Orden #{order.numeroOrden}</p>
            <p className="text-xs">{formatDate(order.createdAt)}</p>
            <p className="text-xs font-bold mt-1">*** PREFACTURA ***</p>
          </div>

          <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2 text-xs">
            <p>Cliente: {order.nombreClienteFactura || order.sesion?.clienteNombre || 'Cliente anónimo'}</p>
            {order.tipoPedido === 'A_DOMICILIO' && <p>Tipo: Delivery</p>}
            {order.tipoPedido === 'RECOGER' && <p>Tipo: Pickup</p>}
            {order.tipoPedido === 'PARA_COMER_AQUI' && <p>Mesa: {order.mesa?.numero || 'N/A'}</p>}
            <p>Mesero: {order.mesero ? `${order.mesero.nombre} ${order.mesero.apellido || ''}`.trim() : 'No asignado'}</p>
          </div>

          <table className="w-full text-xs mb-2">
            <thead>
              <tr className="border-b border-dashed border-gray-400">
                <th className="text-center font-bold pb-1" style={{ width: '15%' }}>Cant</th>
                <th className="text-left font-bold pb-1" style={{ width: '55%' }}>Desc</th>
                <th className="text-right font-bold pb-1" style={{ width: '30%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index}>
                  <td className="align-top py-1 text-center">{item.cantidad}</td>
                  <td className="align-top py-1 px-1">
                    {item.producto?.nombre}
                    {item.notas && <div className="text-[10px] italic text-gray-600">- {item.notas}</div>}
                  </td>
                  <td className="align-top text-right py-1">
                    <span translate="no">{formatAmount(item.subtotal)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-400 pt-2 text-xs space-y-1">
            {order.subtotal > 0 && order.subtotal !== order.total && (
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span translate="no">{formatAmount(order.subtotal)}</span>
              </div>
            )}
            {order.impuestos > 0 && (
              <div className="flex justify-between">
                <span>IVA:</span>
                <span translate="no">{formatAmount(order.impuestos)}</span>
              </div>
            )}
            {order.propina > 0 && (
              <div className="flex justify-between">
                <span>Servicio:</span>
                <span translate="no">{formatAmount(order.propina)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm mt-2 border-t border-dashed border-gray-400 pt-2">
              <span>TOTAL:</span>
              <span translate="no">{formatAmount(order.total)}</span>
            </div>
          </div>

          <div className="text-center mt-6 text-xs italic">
            ¡Gracias por su preferencia!
          </div>
        </div>
      )}
    </Transition>
  );
};

export default OrderDetailsModal; 
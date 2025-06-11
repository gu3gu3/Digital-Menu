import { 
  ClockIcon, 
  FireIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  HandRaisedIcon 
} from '@heroicons/react/24/solid';

const OrderStatusBadge = ({ status, size = 'md' }) => {
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'ENVIADA':
        return {
          label: 'Enviada',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: ClockIcon,
          description: 'Pedido recibido'
        };
      case 'RECIBIDA':
        return {
          label: 'Recibida',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: ClockIcon,
          description: 'Pedido recibido'
        };
      case 'CONFIRMADA':
        return {
          label: 'Confirmada',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: HandRaisedIcon,
          description: 'Pedido confirmado'
        };
      case 'EN_PREPARACION':
        return {
          label: 'En Preparación',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: FireIcon,
          description: 'En cocina'
        };
      case 'LISTA':
        return {
          label: 'Lista',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircleIcon,
          description: 'Lista para servir'
        };
      case 'SERVIDA':
        return {
          label: 'Servida',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircleIcon,
          description: 'Pedido entregado'
        };
      case 'COMPLETADA':
        return {
          label: 'Completada',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircleIcon,
          description: 'Pedido entregado'
        };
      case 'CANCELADA':
        return {
          label: 'Cancelada',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircleIcon,
          description: 'Pedido cancelado'
        };
      default:
        return {
          label: status || 'Desconocido',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: ClockIcon,
          description: 'Estado desconocido'
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full border ${config.color} ${sizeClasses[size]}`}
      title={config.description}
    >
      <IconComponent className={`mr-1.5 ${iconSizes[size]}`} />
      {config.label}
    </span>
  );
};

export default OrderStatusBadge; 
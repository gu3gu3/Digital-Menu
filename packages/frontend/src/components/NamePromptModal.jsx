import { useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

const NamePromptModal = ({ isOpen, onSubmit, restaurantName }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm transform transition-all">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
            <UserIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            ¡Bienvenido a {restaurantName}!
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Para identificar tu pedido en la mesa, por favor danos un nombre.
          </p>
          <form onSubmit={handleSubmit} className="mt-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
              required
            />
            <button
              type="submit"
              className="w-full mt-4 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform transform hover:scale-105"
            >
              Continuar al Menú
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NamePromptModal; 
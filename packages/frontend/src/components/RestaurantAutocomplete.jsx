import React, { useState, useEffect, useRef } from 'react';

const RestaurantAutocomplete = ({ 
  restaurants = [], 
  selectedRestaurant, 
  onRestaurantSelect, 
  placeholder = "Escriba el nombre del restaurante..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Encontrar el restaurante seleccionado para mostrar su nombre
  const selectedRestaurantInfo = restaurants.find(r => r.id === selectedRestaurant);

  useEffect(() => {
    // Filtrar restaurantes basado en el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant =>
        restaurant.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchTerm, restaurants]);

  useEffect(() => {
    // Cerrar dropdown cuando se hace clic fuera
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        // Restaurar el nombre del restaurante seleccionado si no se seleccionó uno nuevo
        if (selectedRestaurantInfo) {
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedRestaurantInfo]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleRestaurantSelect = (restaurant) => {
    onRestaurantSelect(restaurant.id);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      inputRef.current.blur();
    }
  };

  const displayValue = isOpen ? searchTerm : (selectedRestaurantInfo?.nombre || '');

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Seleccionar Restaurante
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 pr-10"
        />
        
        {/* Icono de búsqueda */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Dropdown con resultados */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
        >
          {filteredRestaurants.length > 0 ? (
            <>
              {/* Mostrar contador de resultados */}
              {searchTerm && (
                <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                  {filteredRestaurants.length} restaurante{filteredRestaurants.length !== 1 ? 's' : ''} encontrado{filteredRestaurants.length !== 1 ? 's' : ''}
                </div>
              )}
              
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => handleRestaurantSelect(restaurant)}
                  className={`cursor-pointer select-none relative py-3 px-3 hover:bg-purple-50 ${
                    selectedRestaurant === restaurant.id ? 'bg-purple-100' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {restaurant.nombre}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {restaurant.email}
                      </div>
                      
                      {/* Estadísticas del restaurante */}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {restaurant._count?.categorias || 0} categorías
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                          {restaurant._count?.productos || 0} productos
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          {restaurant._count?.mesas || 0} mesas
                        </span>
                      </div>
                    </div>
                    
                    {/* Indicador de seleccionado */}
                    {selectedRestaurant === restaurant.id && (
                      <div className="text-purple-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              {searchTerm ? 'No se encontraron restaurantes' : 'No hay restaurantes disponibles'}
            </div>
          )}
        </div>
      )}
      
      {/* Información del restaurante seleccionado */}
      {selectedRestaurantInfo && !isOpen && (
        <div className="mt-2 p-3 bg-purple-50 rounded-md border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-purple-900">{selectedRestaurantInfo.nombre}</div>
              <div className="text-sm text-purple-700">{selectedRestaurantInfo.email}</div>
            </div>
            <div className="text-xs text-purple-600 space-y-1">
              <div>{selectedRestaurantInfo._count?.categorias || 0} categorías</div>
              <div>{selectedRestaurantInfo._count?.productos || 0} productos</div>
              <div>{selectedRestaurantInfo._count?.mesas || 0} mesas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantAutocomplete; 
export const formatTableName = (mesa, isHotelMode) => {
  if (!mesa) return 'N/A';
  if (!mesa.nombre) return `${isHotelMode ? 'Habitación' : 'Mesa'} ${mesa.numero || 'N/A'}`;
  
  // Si el nombre personalizado ya incluye el número (ej: "Cabaña 102"), no lo duplicamos.
  if (mesa.nombre.toLowerCase().includes(String(mesa.numero))) {
    return mesa.nombre;
  }
  
  // Concatenar el nombre con el número (ej: "Salón" -> "Salón 5")
  return `${mesa.nombre} ${mesa.numero}`;
};

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  PencilIcon, 
  TrashIcon,
  Bars3Icon 
} from '@heroicons/react/24/outline';

// Componente individual de categoría sorteable
function SortableCategory({ 
  categoria, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  isDragging 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: categoria.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border transition-all ${
        isSelected
          ? 'bg-primary-50 border-primary-200'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      } ${isSortableDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center space-x-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1"
          title="Arrastrar para reordenar"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {/* Category Content */}
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => onSelect(categoria)}
        >
          <h4 className="font-medium text-gray-900">{categoria.nombre}</h4>
          {categoria.descripcion && (
            <p className="text-sm text-gray-500 mt-1">{categoria.descripcion}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {categoria.productos?.length || 0} productos • Orden: {categoria.orden}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(categoria);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Editar categoría"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(categoria);
            }}
            className="p-1 text-red-400 hover:text-red-600"
            title="Eliminar categoría"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente principal de lista draggable
export default function DraggableCategoryList({
  categorias,
  selectedCategoria,
  onCategoriaSelect,
  onCategoriaEdit,
  onCategoriaDelete,
  onReorder,
  isReordering = false
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px antes de activar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = categorias.findIndex(cat => cat.id === active.id);
      const newIndex = categorias.findIndex(cat => cat.id === over.id);
      
      const newOrder = arrayMove(categorias, oldIndex, newIndex);
      
      // Crear el array de reordenamiento con nuevos órdenes
      const reorderData = newOrder.map((categoria, index) => ({
        id: categoria.id,
        orden: index + 1
      }));

      onReorder(reorderData, newOrder);
    }
  };

  if (categorias.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-300 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
        </div>
        <p className="text-gray-500">No hay categorías</p>
        <p className="text-sm text-gray-400 mt-1">
          Crea categorías para organizar tu menú
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Instrucciones de drag & drop */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <Bars3Icon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 font-medium">
              Reordenar categorías
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Arrastra las categorías usando el ícono ≡ para cambiar el orden en tu menú
            </p>
          </div>
        </div>
      </div>

      {/* Lista de categorías draggable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categorias.map(cat => cat.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {categorias.map((categoria) => (
              <SortableCategory
                key={categoria.id}
                categoria={categoria}
                isSelected={selectedCategoria?.id === categoria.id}
                onSelect={onCategoriaSelect}
                onEdit={onCategoriaEdit}
                onDelete={onCategoriaDelete}
                isDragging={isReordering}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Indicador de guardado */}
      {isReordering && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <p className="text-sm text-yellow-800">
              Guardando nuevo orden...
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 
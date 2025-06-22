import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  FolderIcon,
  PhotoIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import MenuImportModal from '../components/MenuImportModal'

const AdminMenuPage = () => {
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    nombre: '',
    descripcion: ''
  })

  // Product form state
  const [productForm, setProductForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoriaId: '',
    imagen: null
  })

  useEffect(() => {
    loadCategories()
    loadProducts()
    document.title = 'Gestión de Menú | menuView.app'
  }, [])

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategorias(data.data.categorias)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProducts = async (categoriaId = null) => {
    try {
      const token = localStorage.getItem('adminToken')
      const url = categoriaId 
        ? `/api/products?categoriaId=${categoriaId}`
        : '/api/products'
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProductos(data.data.productos)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('adminToken')
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryForm)
      })

      if (response.ok) {
        setSuccess(editingCategory ? 'Categoría actualizada' : 'Categoría creada')
        setShowCategoryModal(false)
        setCategoryForm({ nombre: '', descripcion: '' })
        setEditingCategory(null)
        loadCategories()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar la categoría')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('adminToken')
      const formData = new FormData()
      
      formData.append('nombre', productForm.nombre)
      formData.append('descripcion', productForm.descripcion)
      formData.append('precio', productForm.precio)
      formData.append('categoriaId', productForm.categoriaId)
      
      if (productForm.imagen) {
        formData.append('imagen', productForm.imagen)
      }

      const url = editingProduct 
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        setSuccess(editingProduct ? 'Producto actualizado' : 'Producto creado')
        setShowProductModal(false)
        setProductForm({ nombre: '', descripcion: '', precio: '', categoriaId: '', imagen: null })
        setEditingProduct(null)
        loadProducts(selectedCategoria?.id)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar el producto')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (category) => {
    if (!confirm(`¿Eliminar la categoría "${category.nombre}"?`)) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Categoría eliminada')
        loadCategories()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar la categoría')
      }
    } catch (error) {
      setError('Error de conexión')
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!confirm(`¿Eliminar el producto "${product.nombre}"?`)) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Producto eliminado')
        loadProducts(selectedCategoria?.id)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar el producto')
      }
    } catch (error) {
      setError('Error de conexión')
    }
  }

  const handleToggleAvailability = async (product) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/products/${product.id}/toggle-availability`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message)
        loadProducts(selectedCategoria?.id)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al cambiar disponibilidad')
      }
    } catch (error) {
      setError('Error de conexión')
    }
  }

  const openCategoryModal = (category = null) => {
    setEditingCategory(category)
    setCategoryForm({
      nombre: category?.nombre || '',
      descripcion: category?.descripcion || ''
    })
    setShowCategoryModal(true)
  }

  const openProductModal = (product = null) => {
    setEditingProduct(product)
    setProductForm({
      nombre: product?.nombre || '',
      descripcion: product?.descripcion || '',
      precio: product?.precio || '',
      categoriaId: product?.categoriaId || selectedCategoria?.id || '',
      imagen: null
    })
    setShowProductModal(true)
  }

  const handleExportMenu = async () => {
    // Verificar si hay categorías y productos antes de exportar
    if (categorias.length === 0) {
      setError('No hay menú para exportar. Primero agrega categorías y productos o importa un menú.')
      return
    }

    const totalProductos = categorias.reduce((total, cat) => total + (cat.productos?.length || 0), 0)
    if (totalProductos === 0) {
      setError('No hay productos para exportar. Agrega productos a tus categorías primero.')
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/menu-import/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        
        // Verificar que el archivo no esté vacío
        if (blob.size < 100) { // Un CSV vacío sería muy pequeño
          setError('El menú está vacío. Agrega productos antes de exportar.')
          return
        }
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `menu-export-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setSuccess('Menú exportado exitosamente')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al exportar el menú')
      }
    } catch (error) {
      console.error('Error exporting menu:', error)
      setError('Error al exportar el menú')
    }
  }

  const handleImportSuccess = (importResults) => {
    setSuccess(`Menú importado exitosamente: ${importResults.summary.categoriasCreadas} categorías y ${importResults.summary.productosCreados} productos creados`)
    loadCategories()
    if (selectedCategoria) {
      loadProducts(selectedCategoria.id)
    } else {
      loadProducts()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión del Menú</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra las categorías y productos de tu menú
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportMenu}
            disabled={categorias.length === 0}
            className={`px-4 py-2 rounded-lg flex items-center ${
              categorias.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={categorias.length === 0 ? 'Agrega categorías y productos primero' : 'Exportar menú actual'}
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exportar CSV
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
            Importar CSV
          </button>
          <button
            onClick={() => openCategoryModal()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Categorías</h3>
              
              {categorias.length === 0 ? (
                <div className="text-center py-6">
                  <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay categorías</p>
                  <button
                    onClick={() => openCategoryModal()}
                    className="mt-2 text-primary-600 hover:text-primary-700"
                  >
                    Crear la primera categoría
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {categorias.map((categoria) => (
                    <div
                      key={categoria.id}
                      className={`p-3 rounded-lg cursor-pointer border ${
                        selectedCategoria?.id === categoria.id
                          ? 'bg-primary-50 border-primary-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setSelectedCategoria(categoria)
                        loadProducts(categoria.id)
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{categoria.nombre}</h4>
                          {categoria.descripcion && (
                            <p className="text-sm text-gray-500 mt-1">{categoria.descripcion}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {categoria.productos?.length || 0} productos
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openCategoryModal(categoria)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCategory(categoria)
                            }}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedCategoria ? `Productos - ${selectedCategoria.nombre}` : 'Productos'}
                </h3>
                {selectedCategoria && (
                  <button
                    onClick={() => openProductModal()}
                    className="bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nuevo Producto
                  </button>
                )}
              </div>

              {!selectedCategoria ? (
                <div className="text-center py-6">
                  <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona una categoría para ver sus productos</p>
                </div>
              ) : productos.length === 0 ? (
                <div className="text-center py-6">
                  <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay productos en esta categoría</p>
                  <button
                    onClick={() => openProductModal()}
                    className="mt-2 text-primary-600 hover:text-primary-700"
                  >
                    Agregar el primer producto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productos.map((producto) => (
                    <div key={producto.id} className={`border rounded-lg p-4 transition-all ${
                      producto.disponible 
                        ? 'border-gray-200 bg-white' 
                        : 'border-gray-300 bg-gray-50 opacity-75'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className={`font-medium ${producto.disponible ? 'text-gray-900' : 'text-gray-600'}`}>
                            {producto.nombre}
                          </h4>
                          <p className={`text-lg font-bold ${producto.disponible ? 'text-primary-600' : 'text-gray-500'}`}>
                            ${producto.precio}
                          </p>
                          {producto.descripcion && (
                            <p className={`text-sm mt-1 ${producto.disponible ? 'text-gray-500' : 'text-gray-400'}`}>
                              {producto.descripcion}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => openProductModal(producto)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(producto)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {producto.imagenUrl && (
                        <img
                          src={producto.imagenUrl}
                          alt={producto.nombre}
                          className={`w-16 h-16 object-cover rounded-md mr-4 ${!producto.disponible ? 'grayscale' : ''}`}
                        />
                      )}
                      
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Disponible:</span>
                          <button
                            onClick={() => handleToggleAvailability(producto)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                              producto.disponible 
                                ? 'bg-green-600' 
                                : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                producto.disponible ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          producto.disponible
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {producto.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={categoryForm.nombre}
                  onChange={(e) => setCategoryForm({...categoryForm, nombre: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={categoryForm.descripcion}
                  onChange={(e) => setCategoryForm({...categoryForm, descripcion: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={productForm.nombre}
                  onChange={(e) => setProductForm({...productForm, nombre: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={productForm.precio}
                  onChange={(e) => setProductForm({...productForm, precio: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={productForm.categoriaId}
                  onChange={(e) => setProductForm({...productForm, categoriaId: e.target.value})}
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={productForm.descripcion}
                  onChange={(e) => setProductForm({...productForm, descripcion: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full"
                  onChange={(e) => setProductForm({...productForm, imagen: e.target.files[0]})}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Import Modal */}
      <MenuImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  )
}

export default AdminMenuPage 
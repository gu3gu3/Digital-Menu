import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  QrCodeIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TableCellsIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const AdminTablesPage = () => {
  const [mesas, setMesas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showTableModal, setShowTableModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [clearingSession, setClearingSession] = useState(null)

  // Table form state
  const [tableForm, setTableForm] = useState({
    numero: '',
    nombre: '',
    descripcion: '',
    capacidad: 4
  })

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('http://localhost:3001/api/tables', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMesas(data.data.mesas)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al cargar las mesas')
      }
    } catch (error) {
      console.error('Error loading tables:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleTableSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('adminToken')
      const url = editingTable 
        ? `http://localhost:3001/api/tables/${editingTable.id}`
        : 'http://localhost:3001/api/tables'
      
      const method = editingTable ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tableForm)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(editingTable ? 'Mesa actualizada exitosamente' : 'Mesa creada exitosamente')
        setShowTableModal(false)
        setTableForm({ numero: '', nombre: '', descripcion: '', capacidad: 4 })
        setEditingTable(null)
        loadTables()
        
        // Si es una nueva mesa, mostrar el QR automáticamente
        if (!editingTable && data.data?.qrCodeImage) {
          setSelectedTable(data.data.mesa)
          setQrCode({
            qrUrl: data.data.qrUrl,
            qrCodeImage: data.data.qrCodeImage
          })
          setShowQRModal(true)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar la mesa')
      }
    } catch (error) {
      console.error('Error saving table:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTable = async (table) => {
    if (!confirm(`¿Eliminar la mesa "${table.numero}"?`)) return

    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`http://localhost:3001/api/tables/${table.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Mesa eliminada exitosamente')
        loadTables()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar la mesa')
      }
    } catch (error) {
      console.error('Error deleting table:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleShowQR = async (table) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`http://localhost:3001/api/tables/${table.id}/qr`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedTable(table)
        setQrCode(data.data)
        setShowQRModal(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al generar código QR')
      }
    } catch (error) {
      console.error('Error generating QR:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAllQRs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('http://localhost:3001/api/tables/qr/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Crear y descargar PDF con todos los QRs
        generateQRsPDF(data.data)
        setSuccess(`${data.data.total} códigos QR generados exitosamente`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al generar códigos QR')
      }
    } catch (error) {
      console.error('Error downloading QRs:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const generateQRsPDF = (qrData) => {
    // Crear un elemento temporal para generar el PDF
    const printWindow = window.open('', '_blank')
    const { restaurant, qrCodes } = qrData
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Códigos QR - ${restaurant.nombre}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .qr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
            .qr-item { text-align: center; border: 1px solid #ccc; padding: 20px; }
            .qr-item h3 { margin: 0 0 10px 0; }
            .qr-item img { max-width: 200px; height: auto; }
            .mesa-info { margin-top: 10px; font-size: 14px; color: #666; }
            @media print {
              .qr-grid { grid-template-columns: repeat(2, 1fr); }
              .qr-item { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Códigos QR para Mesas</h1>
            <h2>${restaurant.nombre}</h2>
            <p>Generado el ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="qr-grid">
            ${qrCodes.map(item => `
              <div class="qr-item">
                <h3>Mesa ${item.mesa.numero}</h3>
                ${item.mesa.nombre ? `<p><strong>${item.mesa.nombre}</strong></p>` : ''}
                ${item.qrCodeImage ? `<img src="${item.qrCodeImage}" alt="QR Mesa ${item.mesa.numero}" />` : '<p>Error generando QR</p>'}
                <div class="mesa-info">
                  <p><small>${item.qrUrl}</small></p>
                </div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const downloadSingleQR = () => {
    if (!qrCode?.qrCodeImage) return
    
    const link = document.createElement('a')
    link.download = `qr-mesa-${selectedTable?.numero || 'table'}.png`
    link.href = qrCode.qrCodeImage
    link.click()
  }

  const openTableModal = (table = null) => {
    if (table) {
      setEditingTable(table)
      setTableForm({
        numero: table.numero,
        nombre: table.nombre || '',
        descripcion: table.descripcion || '',
        capacidad: table.capacidad
      })
    } else {
      setEditingTable(null)
      setTableForm({ numero: '', nombre: '', descripcion: '', capacidad: 4 })
    }
    setShowTableModal(true)
  }

  const handleClearTable = async (mesa) => {
    if (!mesa.estaActiva) {
      setError('Esta mesa no tiene sesiones activas')
      return
    }

    if (!confirm(`¿Estás seguro de que quieres limpiar la Mesa ${mesa.numero}?\n\nEsto cerrará todas las sesiones activas y los clientes perderán acceso a sus carritos.`)) {
      return
    }

    setClearingSession(mesa.id)
    setError('') // Limpiar errores previos
    setSuccess('') // Limpiar éxitos previos

    try {
      const token = localStorage.getItem('adminToken')
      
      // Obtener sesiones activas de esta mesa específica
      const sessionsResponse = await fetch(`http://localhost:3001/api/sessions/restaurant/all?mesaId=${mesa.id}&estado=activa&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!sessionsResponse.ok) {
        const errorData = await sessionsResponse.json()
        throw new Error(errorData.error || 'Error al obtener sesiones activas')
      }

      const sessionsData = await sessionsResponse.json()
      const sesionesActivas = sessionsData.data.sesiones

      if (sesionesActivas.length === 0) {
        setError(`La Mesa ${mesa.numero} no tiene sesiones activas para cerrar`)
        return
      }

      // Cerrar cada sesión activa
      let sessionsCerradas = 0
      let erroresCierre = 0

      for (const sesion of sesionesActivas) {
        try {
          const closeResponse = await fetch(`http://localhost:3001/api/sessions/${sesion.id}/close`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              notas: `Sesión cerrada manualmente por administrador desde panel de mesas - Mesa ${mesa.numero}` 
            })
          })

          if (closeResponse.ok) {
            sessionsCerradas++
          } else {
            erroresCierre++
            console.error(`Error cerrando sesión ${sesion.id}`)
          }
        } catch (error) {
          erroresCierre++
          console.error(`Error cerrando sesión ${sesion.id}:`, error)
        }
      }

      // Mostrar resultado
      if (sessionsCerradas > 0) {
        let mensaje = `Mesa ${mesa.numero} limpiada exitosamente. ${sessionsCerradas} sesión(es) cerrada(s).`
        if (erroresCierre > 0) {
          mensaje += ` (${erroresCierre} error(es) al cerrar algunas sesiones)`
        }
        setSuccess(mensaje)
        
        // Recargar las mesas para reflejar el cambio
        await loadTables()
      } else {
        setError(`No se pudieron cerrar las sesiones de la Mesa ${mesa.numero}`)
      }

    } catch (error) {
      console.error('Error clearing table:', error)
      setError(`Error al limpiar la Mesa ${mesa.numero}: ${error.message}`)
    } finally {
      setClearingSession(null)
      // Limpiar mensajes después de 8 segundos
      setTimeout(() => {
        setError('')
        setSuccess('')
      }, 8000)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Mesas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra las mesas de tu restaurante y genera códigos QR
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleDownloadAllQRs}
              disabled={loading || mesas.length === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Descargar Todos los QR
            </button>
            <button
              onClick={() => openTableModal()}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 shadow-sm text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Mesa
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TableCellsIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Mesas</p>
              <p className="text-2xl font-semibold text-gray-900">{mesas.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Mesas Activas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mesas.filter(mesa => mesa.activa).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <QrCodeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Con Órdenes Activas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mesas.filter(mesa => mesa.ordenesActivas > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      {loading && mesas.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : mesas.length === 0 ? (
        <div className="text-center py-12">
          <TableCellsIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay mesas</h3>
          <p className="mt-1 text-sm text-gray-500">Crea tu primera mesa para comenzar</p>
          <div className="mt-6">
            <button
              onClick={() => openTableModal()}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 shadow-sm text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Mesa
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mesas.map(mesa => (
            <div key={mesa.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className={`text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ${
                    mesa.estaActiva ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    {mesa.numero}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{mesa.nombre || `Mesa ${mesa.numero}`}</h3>
                    <p className="text-sm text-gray-500 flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {mesa.capacidad} personas
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  mesa.estaActiva ? 'bg-green-100 text-green-800 animate-pulse' : 'bg-gray-100 text-gray-800'
                }`}>
                  {mesa.estaActiva ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => handleShowQR(mesa)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <QrCodeIcon className="h-4 w-4 mr-2" />
                  Ver QR
                </button>
                
                {mesa.estaActiva && (
                  <button
                    onClick={() => handleClearTable(mesa)}
                    disabled={clearingSession === mesa.id}
                    className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 bg-white hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed ml-2 transition-colors duration-200"
                    title={`Limpiar Mesa ${mesa.numero} - Cerrar todas las sesiones activas`}
                  >
                    {clearingSession === mesa.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    ) : (
                      <>
                        <XMarkIcon className="h-4 w-4" />
                        <span className="sr-only">Limpiar mesa</span>
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => openTableModal(mesa)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ml-2"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTable(mesa)}
                  disabled={mesa.ordenesActivas > 0}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTable ? 'Editar Mesa' : 'Nueva Mesa'}
              </h3>
            </div>
            
            <form onSubmit={handleTableSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Mesa *
                </label>
                <input
                  type="text"
                  value={tableForm.numero}
                  onChange={(e) => setTableForm({...tableForm, numero: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="1, A1, Terraza 1, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre (opcional)
                </label>
                <input
                  type="text"
                  value={tableForm.nombre}
                  onChange={(e) => setTableForm({...tableForm, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Mesa VIP, Terraza, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={tableForm.descripcion}
                  onChange={(e) => setTableForm({...tableForm, descripcion: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ubicación o características especiales"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableForm.capacidad}
                  onChange={(e) => setTableForm({...tableForm, capacidad: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : (editingTable ? 'Actualizar' : 'Crear Mesa')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && qrCode && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Código QR - Mesa {selectedTable?.numero}
              </h3>
              {selectedTable?.nombre && (
                <p className="text-sm text-gray-500">{selectedTable.nombre}</p>
              )}
            </div>
            
            <div className="text-center mb-4">
              {qrCode.qrCodeImage ? (
                <img 
                  src={qrCode.qrCodeImage} 
                  alt={`QR Mesa ${selectedTable?.numero}`}
                  className="mx-auto border rounded-lg"
                  style={{ maxWidth: '250px' }}
                />
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-gray-400">Error generando QR</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del Menú
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={qrCode.qrUrl || ''}
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(qrCode.qrUrl)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  title="Copiar URL"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
              {qrCode.qrCodeImage && (
                <button
                  onClick={downloadSingleQR}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 text-sm font-medium"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2 inline" />
                  Descargar QR
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTablesPage 
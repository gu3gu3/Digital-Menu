import React, { useState } from 'react';
import { 
  XMarkIcon, 
  DocumentArrowUpIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const MenuImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Validation, 3: Import, 4: Results
  const [file, setFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState({
    replaceExisting: false,
    skipDuplicates: true,
    validateFirst: true
  });

  if (!isOpen) return null;

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setValidationResults(null);
    setImportResults(null);
    setIsLoading(false);
    setOptions({
      replaceExisting: false,
      skipDuplicates: true,
      validateFirst: true
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/menu-import/template', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'menu-template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Error downloading template');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const validateCSV = async () => {
    if (!file) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/menu-import/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setValidationResults(data.data.validation);
        setStep(2);
      } else {
        console.error('Validation error:', data.error);
        alert('Error validando archivo: ' + data.error);
      }
    } catch (error) {
      console.error('Error validating CSV:', error);
      alert('Error validando archivo CSV');
    } finally {
      setIsLoading(false);
    }
  };

  const importCSV = async () => {
    if (!file) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('replaceExisting', options.replaceExisting);
      formData.append('skipDuplicates', options.skipDuplicates);
      formData.append('validateFirst', options.validateFirst);

      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/menu-import/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setImportResults(data.data.import);
        setStep(4);
        
        // Notify parent component of successful import
        if (onImportSuccess) {
          onImportSuccess(data.data.import);
        }
      } else {
        console.error('Import error:', data.error);
        setImportResults(data.data?.import || { errors: [data.error] });
        setStep(4);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportResults({ errors: ['Error importando archivo CSV'] });
      setStep(4);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Importar Menú desde CSV
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Sube un archivo CSV con tu menú completo. Descarga la plantilla para ver el formato correcto.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-2">Formato del archivo:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Archivo CSV con encoding UTF-8</li>
              <li>• Máximo 5MB de tamaño</li>
              <li>• Incluye categorías y productos</li>
              <li>• Usa la plantilla para evitar errores</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Descargar Plantilla CSV
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="csv-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Seleccionar archivo CSV
              </span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Solo archivos .csv hasta 5MB
            </p>
          </div>
          
          {file && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-800">
                Archivo seleccionado: {file.name}
              </p>
              <p className="text-xs text-green-600">
                Tamaño: {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Opciones de importación:</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.replaceExisting}
              onChange={(e) => setOptions({...options, replaceExisting: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Reemplazar menú existente completamente
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.skipDuplicates}
              onChange={(e) => setOptions({...options, skipDuplicates: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Omitir productos duplicados
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.validateFirst}
              onChange={(e) => setOptions({...options, validateFirst: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Validar archivo antes de importar
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resultados de Validación
        </h3>
      </div>

      {validationResults && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Categorías encontradas</p>
              <p className="text-2xl font-bold text-blue-600">{validationResults.summary.categorias}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-900">Productos encontrados</p>
              <p className="text-2xl font-bold text-green-600">{validationResults.summary.productos}</p>
            </div>
          </div>

          {validationResults.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Errores encontrados:</h4>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {validationResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {validationResults.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Advertencias:</h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    {validationResults.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {validationResults.errors.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                <p className="text-sm font-medium text-green-800">
                  ✅ El archivo es válido y está listo para importar
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resultados de Importación
        </h3>
      </div>

      {importResults && (
        <div className="space-y-4">
          {importResults.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                <p className="text-sm font-medium text-green-800">
                  ✅ Importación completada exitosamente
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm font-medium text-gray-900">Categorías creadas</p>
                  <p className="text-lg font-bold text-green-600">{importResults.summary.categoriasCreadas}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm font-medium text-gray-900">Productos creados</p>
                  <p className="text-lg font-bold text-green-600">{importResults.summary.productosCreados}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">La importación falló:</h4>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {importResults.warnings && importResults.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Advertencias:</h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    {importResults.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Importar Menú desde CSV
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 h-1 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex justify-between mt-6">
          <div>
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isLoading}
              >
                Anterior
              </button>
            )}
          </div>
          
          <div className="space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              {step === 4 ? 'Cerrar' : 'Cancelar'}
            </button>
            
            {step === 1 && (
              <button
                onClick={validateCSV}
                disabled={!file || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Validando...' : 'Validar Archivo'}
              </button>
            )}
            
            {step === 2 && validationResults?.errors?.length === 0 && (
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Continuar con Importación
              </button>
            )}
            
            {step === 3 && (
              <button
                onClick={importCSV}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Importando...' : 'Importar Menú'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuImportModal; 
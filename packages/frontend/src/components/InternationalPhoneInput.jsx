import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const InternationalPhoneInput = ({ 
  value, 
  onChange, 
  placeholder = "Ingresa tu número de teléfono",
  className = "",
  required = false,
  name = "telefono",
  label = "Teléfono",
  error = ""
}) => {
  // Solo los países centroamericanos que soportamos
  const supportedCountries = [
    'NI', // Nicaragua (por defecto)
    'CR', // Costa Rica  
    'HN', // Honduras
    'GT', // Guatemala
    'PA', // Panamá
    'SV', // El Salvador
    'US'  // Estados Unidos
  ]

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className={`phone-input-container ${error ? 'phone-error' : ''} ${className}`}>
        <PhoneInput
          countries={supportedCountries}
          defaultCountry="NI"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          numberInputProps={{
            required: required,
            name: name
          }}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <style jsx>{`
        .phone-input-container {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          background: white;
          overflow: hidden;
        }

        .phone-input-container:focus-within {
          border-color: transparent;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
          outline: none;
        }

        .phone-input-container.phone-error {
          border-color: #ef4444;
        }

        .phone-input-container.phone-error:focus-within {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
        }

        .phone-input-container :global(.PhoneInput) {
          display: flex !important;
          align-items: center !important;
          padding: 0 !important;
        }
        
        .phone-input-container :global(.PhoneInputCountrySelect) {
          border: none !important;
          background: transparent !important;
          padding: 12px 8px !important;
          cursor: pointer !important;
          outline: none !important;
        }
        
        .phone-input-container :global(.PhoneInputCountrySelectArrow) {
          color: #6b7280 !important;
          margin-left: 4px !important;
        }
        
        .phone-input-container :global(.PhoneInputInput) {
          border: none !important;
          outline: none !important;
          padding: 12px !important;
          font-size: 14px !important;
          flex: 1 !important;
          background: transparent !important;
        }

        .phone-input-container :global(.PhoneInputInput):focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  )
}

export default InternationalPhoneInput 
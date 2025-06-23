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
  // Países que soportamos principalmente (Centroamérica + algunos otros)
  const supportedCountries = [
    'GT', // Guatemala
    'SV', // El Salvador
    'HN', // Honduras
    'NI', // Nicaragua
    'CR', // Costa Rica
    'PA', // Panamá
    'BZ', // Belice
    'MX', // México
    'US', // Estados Unidos
    'CA', // Canadá
    'DO', // República Dominicana
    'CU', // Cuba
    'JM', // Jamaica
    'HT', // Haití
    'PR', // Puerto Rico
    'CO', // Colombia
    'VE', // Venezuela
    'EC', // Ecuador
    'PE', // Perú
    'BO', // Bolivia
    'PY', // Paraguay
    'UY', // Uruguay
    'AR', // Argentina
    'CL', // Chile
    'BR', // Brasil
    'ES', // España
  ]

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className={`phone-input-container ${error ? 'error' : ''} ${className}`}>
        <PhoneInput
          countries={supportedCountries}
          defaultCountry="GT" // Guatemala como país por defecto
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
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          overflow: hidden;
          transition: all 0.2s;
        }
        
        .phone-input-container:focus-within {
          border-color: transparent;
          ring: 2px solid #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        
        .phone-input-container.error {
          border-color: #ef4444;
        }
        
        .phone-input-container.error:focus-within {
          ring: 2px solid #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
        }
        
        .phone-input-container :global(.PhoneInput) {
          display: flex;
          align-items: center;
          padding: 0;
        }
        
        .phone-input-container :global(.PhoneInputCountrySelect) {
          border: none;
          background: transparent;
          padding: 12px 8px;
          cursor: pointer;
        }
        
        .phone-input-container :global(.PhoneInputCountrySelectArrow) {
          color: #6b7280;
          margin-left: 4px;
        }
        
        .phone-input-container :global(.PhoneInputInput) {
          border: none;
          outline: none;
          padding: 12px;
          font-size: 14px;
          flex: 1;
          background: transparent;
        }
        
        .phone-input-container :global(.PhoneInputInput):focus {
          outline: none;
        }
      `}</style>
    </div>
  )
}

export default InternationalPhoneInput 
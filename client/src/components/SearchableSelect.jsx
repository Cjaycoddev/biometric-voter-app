'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, XCircle, Search } from 'lucide-react';

export function SearchableSelect({ 
  label, 
  name, 
  options, 
  placeholder, 
  icon, 
  disabled, 
  errors, 
  touched, 
  form, 
  handleChange, 
  handleBlur, 
  getFieldIcon, 
  ...props 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(opt =>
    (opt.name || opt.label || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === form[name]);
  const selectedLabel = selectedOption?.name || selectedOption?.label || '';

  const handleOptionClick = (optionId) => {
    handleChange(name, optionId);
    setIsOpen(false);
    setSearchTerm('');
    handleBlur(name);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1" ref={dropdownRef}>
      <label className="block text-sm font-medium text-black pl-1">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
        
        <div className="relative">
          <input
            type="text"
            readOnly
            className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none appearance-none transition ${
              errors[name] && touched[name] ? 'border-red-500 bg-red-50' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            value={selectedLabel}
            placeholder={placeholder}
            onClick={() => !disabled && setIsOpen(true)}
            onFocus={() => !disabled && setIsOpen(true)}
            disabled={disabled}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {getFieldIcon(name) && <div className="absolute inset-y-0 right-0 pr-10 flex items-center">{getFieldIcon(name)}</div>}
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No options found</div>
              ) : (
                filteredOptions.map(opt => (
                  <div
                    key={opt.id}
                    className={`px-4 py-3 text-sm hover:bg-gray-100 cursor-pointer transition ${
                      form[name] === opt.id ? 'bg-black text-white' : 'text-gray-700'
                    }`}
                    onClick={() => handleOptionClick(opt.id)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {opt.name || opt.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {errors[name] && touched[name] && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[name]}</p>}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, Loader2, User, Mail, Phone, Badge, MapPin, Calendar, Shield } from 'lucide-react';

const SEX_OPTIONS = ['Male', 'Female', 'Other'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const ID_TYPES = [
  { value: 'national_id', label: 'National ID (7-8 digits)' },
  { value: 'passport', label: 'Passport' },
];

function formatPhoneInput(value) {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.startsWith('254') && cleaned.length <= 12) return '+' + cleaned;
  if (cleaned.startsWith('0') && cleaned.length <= 10) return '+254' + cleaned.slice(1);
  if (cleaned.length <= 9) return '+254' + cleaned;
  return '+' + cleaned.slice(0, 12);
}

function validateKenyanPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return (cleaned.startsWith('254') && cleaned.length === 12) || (cleaned.startsWith('0') && cleaned.length === 10) || cleaned.length === 9;
}

function validateNationalId(id) {
  return /^\d{7,8}$/.test(id);
}

function validatePassport(id) {
  return id.length >= 6 && id.length <= 20;
}

function validateName(name) {
  return /^[a-zA-Z\s'-]+$/.test(name.trim());
}

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: personal, 2: location, 3: credentials
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    id_type: 'national_id',
    id_number: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
    county_id: '',
    constituency_id: '',
    ward_id: '',
    polling_station_id: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Dropdown data
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [pollingStations, setPollingStations] = useState([]);

  // Validation states
  const [idNumberValid, setIdNumberValid] = useState(null);
  const [phoneValid, setPhoneValid] = useState(null);
  const [emailValid, setEmailValid] = useState(null);
  const router = useRouter();

  // Fetch counties on mount
  useEffect(() => {
    fetchCounties();
  }, []);

  const fetchCounties = async () => {
    try {
      const data = await apiRequest('/public/counties');
      setCounties(data.data || []);
    } catch (err) {
      console.error('Failed to fetch counties:', err);
    }
  };

  const fetchConstituencies = async (countyId) => {
    try {
      const data = await apiRequest(`/public/constituencies?county_id=${countyId}`);
      setConstituencies(data.data || []);
      setForm(prev => ({ ...prev, constituency_id: '', ward_id: '', polling_station_id: '' }));
      setWards([]);
      setPollingStations([]);
    } catch (err) {
      console.error('Failed to fetch constituencies:', err);
    }
  };

  const fetchWards = async (constituencyId) => {
    try {
      const data = await apiRequest(`/public/wards?constituency_id=${constituencyId}`);
      setWards(data.data || []);
      setForm(prev => ({ ...prev, ward_id: '', polling_station_id: '' }));
      setPollingStations([]);
    } catch (err) {
      console.error('Failed to fetch wards:', err);
    }
  };

  const fetchPollingStations = async (wardId) => {
    try {
      const data = await apiRequest(`/public/polling-stations?ward_id=${wardId}`);
      setPollingStations(data.data || []);
      setForm(prev => ({ ...prev, polling_station_id: '' }));
    } catch (err) {
      console.error('Failed to fetch polling stations:', err);
    }
  };

  // Validation functions
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'first_name':
        if (!value.trim()) error = 'First name is required';
        else if (value.trim().length < 2) error = 'First name must be at least 2 characters';
        else if (!validateName(value)) error = 'First name cannot contain numbers or special characters';
        break;
      case 'middle_name':
        if (value.trim() && !validateName(value)) error = 'Middle name cannot contain numbers or special characters';
        break;
      case 'last_name':
        if (!value.trim()) error = 'Last name is required';
        else if (value.trim().length < 2) error = 'Last name must be at least 2 characters';
        else if (!validateName(value)) error = 'Last name cannot contain numbers or special characters';
        break;
      case 'id_number':
        if (!value.trim()) error = 'ID number is required';
        else if (form.id_type === 'national_id' && !validateNationalId(value)) error = 'National ID must be 7-8 digits';
        else if (form.id_type === 'passport' && !validatePassport(value)) error = 'Passport must be 6-20 characters';
        break;
      case 'date_of_birth':
        if (!value) error = 'Date of birth is required';
        else {
          const dob = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - dob.getFullYear();
          if (age < 18) error = 'You must be at least 18 years old';
          if (age > 120) error = 'Invalid date of birth';
        }
        break;
      case 'gender':
        if (!value) error = 'Gender is required';
        break;
      case 'phone':
        if (!value.trim()) error = 'Phone number is required';
        else if (!validateKenyanPhone(value)) error = 'Enter a valid Kenyan phone number (+254XXXXXXXXX)';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters';
        else if (!/[A-Z]/.test(value)) error = 'Password must contain at least one uppercase letter';
        else if (!/[a-z]/.test(value)) error = 'Password must contain at least one lowercase letter';
        else if (!/[0-9]/.test(value)) error = 'Password must contain at least one number';
        else if (!/[!@#$%^&*]/.test(value)) error = 'Password must contain at least one special character (!@#$%^&*)';
        break;
      case 'confirm_password':
        if (value !== form.password) error = 'Passwords do not match';
        break;
      case 'county_id':
        if (!value) error = 'County is required';
        break;
      case 'constituency_id':
        if (!value) error = 'Constituency is required';
        break;
      case 'ward_id':
        if (!value) error = 'Ward is required';
        break;
      case 'polling_station_id':
        if (!value) error = 'Polling station is required';
        break;
    }
    return error;
  };

const handleChange = (name, value) => {
    let newValue = value;
    if (name === 'id_number') newValue = value.toUpperCase();
    // Prevent numbers in name fields
    if (['first_name', 'middle_name', 'last_name'].includes(name)) {
      newValue = value.replace(/[^a-zA-Z\s'-]/g, '');
    }

    setForm(prev => ({ ...prev, [name]: newValue }));

    // Real-time validation for async fields (only for ID number - no phone formatting during typing)
    if (name === 'id_number' && newValue.length >= 6) {
      setLoading(true);
      apiRequest(`/public/validate-id?id_number=${encodeURIComponent(newValue)}`)
        .then(data => setIdNumberValid(!data.exists))
        .catch(() => setIdNumberValid(null))
        .finally(() => setLoading(false));
    }
    if (name === 'email' && newValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
      setEmailValid(true);
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    // Format phone on blur
    if (name === 'phone' && form.phone) {
      const formatted = formatPhoneInput(form.phone);
      if (formatted !== form.phone) {
        setForm(prev => ({ ...prev, phone: formatted }));
      }
      // Validate phone after formatting
      if (validateKenyanPhone(formatted)) {
        setLoading(true);
        apiRequest(`/public/validate-phone?phone=${encodeURIComponent(formatted)}`)
          .then(data => setPhoneValid(!data.exists))
          .catch(() => setPhoneValid(null))
          .finally(() => setLoading(false));
      }
    }
    const error = validateField(name, form[name]);
    if (error) setErrors(prev => ({ ...prev, [name]: error }));
  };

  const getFieldIcon = (name) => {
    if (errors[name] && touched[name]) return <XCircle className="w-5 h-5 text-red-500" />;
    if (!errors[name] && touched[name] && form[name]) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return null;
  };

  const handleHierarchyChange = async (name, value) => {
    // Handle ID type change - reset ID number and validation
    if (name === 'id_type') {
      setForm(prev => ({ ...prev, [name]: value, id_number: '' }));
      setIdNumberValid(null);
      setErrors(prev => ({ ...prev, id_number: '' }));
      setTouched(prev => ({ ...prev, [name]: true }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));

    if (name === 'county_id') {
      if (value) await fetchConstituencies(value);
      else { setConstituencies([]); setWards([]); setPollingStations([]); }
    }
    if (name === 'constituency_id') {
      if (value) await fetchWards(value);
      else { setWards([]); setPollingStations([]); }
    }
    if (name === 'ward_id') {
      if (value) await fetchPollingStations(value);
      else setPollingStations([]);
    }

    const error = validateField(name, value);
    if (error) setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateStep = (stepNum) => {
const stepFields = {
    1: ['first_name', 'last_name', 'id_type', 'id_number', 'date_of_birth', 'gender'],
    2: ['county_id', 'constituency_id', 'ward_id', 'polling_station_id'],
    3: ['phone', 'email', 'password', 'confirm_password'],
  };
    const fields = stepFields[stepNum] || [];
    let valid = true;
    const newErrors = {};

    fields.forEach(name => {
      const error = validateField(name, form[name]);
      if (error) {
        newErrors[name] = error;
        valid = false;
      }
    });

    // Check async validations
    if (stepNum === 1) {
      if (idNumberValid === false) { newErrors.id_number = 'This ID number is already registered'; valid = false; }
      if (phoneValid === false) { newErrors.phone = 'This phone is already registered'; valid = false; }
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    fields.forEach(name => setTouched(prev => ({ ...prev, [name]: true })));
    return valid;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim(),
        last_name: form.last_name.trim(),
        id_type: form.id_type,
        id_number: form.id_number.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        password: form.password,
        county_id: form.county_id,
        constituency_id: form.constituency_id,
        ward_id: form.ward_id,
        polling_station_id: form.polling_station_id,
      };

      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSubmitSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setSubmitError(err.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const Input = ({ label, name, type = 'text', icon, children, errors, touched, form, handleChange, handleBlur, getFieldIcon, ...props }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-black pl-1">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
        {children || (
          <input
            type={type}
            name={name}
            className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none transition ${
              errors[name] && touched[name] ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            value={form[name]}
            onChange={(e) => handleChange(name, e.target.value)}
            onBlur={() => handleBlur(name)}
            {...props}
          />
        )}
        {getFieldIcon(name) && <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{getFieldIcon(name)}</div>}
      </div>
      {errors[name] && touched[name] && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[name]}</p>}
    </div>
  );

  const Select = ({ label, name, options, placeholder, icon, disabled, errors, touched, form, handleChange, handleBlur, getFieldIcon, ...props }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-black pl-1">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
        <select
          name={name}
          className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none appearance-none transition ${
            errors[name] && touched[name] ? 'border-red-500 bg-red-50' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          value={form[name]}
          onChange={(e) => handleChange(name, e.target.value)}
          onBlur={() => handleBlur(name)}
          disabled={disabled}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name || opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
        {getFieldIcon(name) && <div className="absolute inset-y-0 right-0 pr-10 flex items-center">{getFieldIcon(name)}</div>}
      </div>
      {errors[name] && touched[name] && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[name]}</p>}
    </div>
  );

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-12 rounded-2xl shadow-xl max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-600 mb-6">Your account has been created. Redirecting to login...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-white to-green-700 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur rounded-full shadow-lg mb-6 border-2 border-black">
            <Shield className="w-8 h-8 text-black" />
            <span className="text-xl font-bold text-black">MwananchiBallot</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Voter Registration</h1>
          <p className="text-gray-700">Register as a Kenyan voter with biometric verification</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-black' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="mb-8 flex justify-center gap-8 text-sm">
          <span className={step >= 1 ? 'font-semibold text-black' : 'text-gray-400'}>Personal Details</span>
          <span className={step >= 2 ? 'font-semibold text-black' : 'text-gray-400'}>Location</span>
          <span className={step >= 3 ? 'font-semibold text-black' : 'text-gray-400'}>Credentials</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 text-black mb-4">
                <User className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="First Name" name="first_name" type="text" icon={<User className="w-5 h-5" />} placeholder="John" errors={errors} touched={touched} form={form} handleChange={handleChange} handleBlur={handleBlur} getFieldIcon={getFieldIcon} />
                <Input label="Middle Name (optional)" name="middle_name" type="text" icon={<User className="w-5 h-5" />} placeholder="Middle" errors={errors} touched={touched} form={form} handleChange={handleChange} handleBlur={handleBlur} getFieldIcon={getFieldIcon} />
              </div>

              <Input label="Last Name" name="last_name" type="text" icon={<User className="w-5 h-5" />} placeholder="Doe" errors={errors} touched={touched} form={form} handleChange={handleChange} handleBlur={handleBlur} getFieldIcon={getFieldIcon} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="ID Type"
                  name="id_type"
                  options={ID_TYPES}
                  placeholder="Select ID type"
                  icon={<Badge className="w-5 h-5" />}
                  errors={errors}
                  touched={touched}
                  form={form}
                  handleChange={handleHierarchyChange}
                  handleBlur={handleBlur}
                  getFieldIcon={getFieldIcon}
                />
                <Input
                  label={form.id_type === 'national_id' ? 'National ID Number' : 'Passport Number'}
                  name="id_number"
                  type={form.id_type === 'national_id' ? 'text' : 'text'}
                  inputMode={form.id_type === 'national_id' ? 'numeric' : 'text'}
                  pattern={form.id_type === 'national_id' ? '[0-9]*' : ''}
                  icon={<Badge className="w-5 h-5" />}
                  placeholder={form.id_type === 'national_id' ? '12345678' : 'A1234567'}
                  maxLength={form.id_type === 'national_id' ? 8 : 20}
                  errors={errors}
                  touched={touched}
                  form={form}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  getFieldIcon={getFieldIcon}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  icon={<Calendar className="w-5 h-5" />}
                  max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  errors={errors}
                  touched={touched}
                  form={form}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  getFieldIcon={getFieldIcon}
                />
                <Select
                  label="Gender"
                  name="gender"
                  options={GENDER_OPTIONS.map(s => ({ id: s, name: s }))}
                  placeholder="Select gender"
                  icon={<User className="w-5 h-5" />}
                  errors={errors}
                  touched={touched}
                  form={form}
                  handleChange={handleHierarchyChange}
                  handleBlur={handleBlur}
                  getFieldIcon={getFieldIcon}
                />
              </div>

              {/* Step Navigation */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={nextStep} className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition flex items-center gap-2">
                  Next <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location Hierarchy */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 text-black mb-4">
                <MapPin className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Voting Location</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Select your polling station by drilling down through Kenya's administrative hierarchy</p>

              <div className="space-y-4">
                <Select
                  label="County"
                  name="county_id"
                  options={counties}
                  placeholder="Select your county"
                  icon={<MapPin className="w-5 h-5" />}
                  disabled={counties.length === 0}
                  errors={errors}
                  touched={touched}
                  form={form}
                  handleChange={handleHierarchyChange}
                  handleBlur={handleBlur}
                  getFieldIcon={getFieldIcon}
                />
                <Select
                  label="Constituency"
                  name="constituency_id"
                  options={constituencies}
                  placeholder="Select your constituency"
                  icon={<MapPin className="w-5 h-5" />}
                  disabled={constituencies.length === 0 || !form.county_id}
                  errors={errors}
                  touched={touched}
                  form={form}
                  handleChange={handleHierarchyChange}
                  handleBlur={handleBlur}
                  getFieldIcon={getFieldIcon}
                />
                <Select
                  label="Ward (CAW)"
                  name="ward_id"
                  options={wards}
                  placeholder="Select your ward"
                  icon={<MapPin className="w-5 h-5" />}
                  disabled={wards.length === 0 || !form.constituency_id}
                  errors={errors}
                  touched={touched}
                  form={form}
                  handleChange={handleHierarchyChange}
                  handleBlur={handleBlur}
                  getFieldIcon={getFieldIcon}
                />
                <Select
                  label="Polling Station"
                  name="polling_station_id"
                  options={pollingStations}
                  placeholder="Select your polling station"
                  icon={<MapPin className="w-5 h-5" />}
                  disabled={pollingStations.length === 0 || !form.ward_id}
                  errors={errors}
                  touched={touched}
                  form={form}
                  handleChange={handleHierarchyChange}
                  handleBlur={handleBlur}
                  getFieldIcon={getFieldIcon}
                />
              </div>

              {/* Location Summary */}
              {(form.county_id || form.constituency_id || form.ward_id || form.polling_station_id) && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-black mb-2">Selected Location:</h4>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {form.county_id && counties.find(c => c.id === form.county_id) && (
                      <span className="px-3 py-1 bg-gray-100 text-black rounded-full">{counties.find(c => c.id === form.county_id).name}</span>
                    )}
                    {form.constituency_id && constituencies.find(c => c.id === form.constituency_id) && (
                      <span className="px-3 py-1 bg-gray-100 text-black rounded-full">{constituencies.find(c => c.id === form.constituency_id).name}</span>
                    )}
                    {form.ward_id && wards.find(w => w.id === form.ward_id) && (
                      <span className="px-3 py-1 bg-gray-100 text-black rounded-full">{wards.find(w => w.id === form.ward_id).name}</span>
                    )}
                    {form.polling_station_id && pollingStations.find(p => p.id === form.polling_station_id) && (
                      <span className="px-3 py-1 bg-black text-white rounded-full font-medium">{pollingStations.find(p => p.id === form.polling_station_id).name}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Step Navigation */}
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button type="button" onClick={prevStep} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
                </button>
                <button type="button" onClick={nextStep} className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition flex items-center gap-2">
                  Next <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Credentials */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 text-black mb-4">
                <Shield className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Account Credentials</h3>
              </div>

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                icon={<Phone className="w-5 h-5" />}
                placeholder="+2547XXXXXXXX"
                maxLength={14}
                errors={errors}
                touched={touched}
                form={form}
                handleChange={handleChange}
                handleBlur={handleBlur}
                getFieldIcon={getFieldIcon}
              />
              <p className="text-xs text-gray-500">Format: +2547XXXXXXXX (Safaricom, Airtel, Telkom)</p>

              <Input
                label="Email (optional)"
                name="email"
                type="email"
                icon={<Mail className="w-5 h-5" />}
                placeholder="john@example.com"
                errors={errors}
                touched={touched}
                form={form}
                handleChange={handleChange}
                handleBlur={handleBlur}
                getFieldIcon={getFieldIcon}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                icon={<Shield className="w-5 h-5" />}
                placeholder="••••••••"
                errors={errors}
                touched={touched}
                form={form}
                handleChange={handleChange}
                handleBlur={handleBlur}
                getFieldIcon={getFieldIcon}
              />
              <div className="text-xs text-gray-500 space-y-1 ml-1">
                <p className={form.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>✓ At least 8 characters</p>
                <p className={/[A-Z]/.test(form.password) ? 'text-green-600' : 'text-gray-400'}>✓ One uppercase letter</p>
                <p className={/[a-z]/.test(form.password) ? 'text-green-600' : 'text-gray-400'}>✓ One lowercase letter</p>
                <p className={/[0-9]/.test(form.password) ? 'text-green-600' : 'text-gray-400'}>✓ One number</p>
                <p className={/[!@#$%^&*]/.test(form.password) ? 'text-green-600' : 'text-gray-400'}>✓ One special character (!@#$%^&*)</p>
              </div>

              <Input
                label="Confirm Password"
                name="confirm_password"
                type="password"
                icon={<Shield className="w-5 h-5" />}
                placeholder="••••••••"
                errors={errors}
                touched={touched}
                form={form}
                handleChange={handleChange}
                handleBlur={handleBlur}
                getFieldIcon={getFieldIcon}
              />

              {/* Step Navigation */}
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button type="button" onClick={prevStep} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-green-700 transition flex items-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
                    </>
                  ) : (
                    <>
                      Register <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Login Link */}
        <p className="mt-8 text-center text-gray-700">
          Already have an account?{' '}
          <a href="/login" className="text-black hover:underline font-medium">Sign in</a>
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
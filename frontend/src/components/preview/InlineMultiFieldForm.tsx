import React, { useState } from 'react';

interface FormField {
  type: 'text' | 'email' | 'number' | 'tel' | 'date' | 'select' | 'checkbox' | 'radio';
  label: string;
  required?: boolean;
  options?: string[];
  name: string;
}

interface InlineMultiFieldFormProps {
  fields: FormField[];
  onSubmit: (values: Record<string, any>) => void;
  description?: string; // Description du formulaire
}

const InlineMultiFieldForm: React.FC<InlineMultiFieldFormProps> = ({ fields, onSubmit, description }) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && !values[field.name]) {
        newErrors[field.name] = 'Ce champ est requis';
      } else if (field.type === 'email' && values[field.name]) {
        // Simple email validation
        const emailRegex = /.+@.+\..+/;
        if (!emailRegex.test(values[field.name])) {
          newErrors[field.name] = 'Adresse email invalide';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(values);
    }
  };

  return (
    <form className="space-y-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600" onSubmit={handleSubmit}>
      <div className="border-b pb-2 mb-3 border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Veuillez compléter ce formulaire</h3>
      </div>
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          {(() => {
            switch (field.type) {
              case 'text':
              case 'email':
              case 'number':
              case 'tel':
              case 'date':
                return (
                  <input
                    type={field.type}
                    name={field.name}
                    value={values[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    required={field.required}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                );
              case 'select':
                return (
                  <select
                    name={field.name}
                    value={values[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    required={field.required}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {field.options && field.options.map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))}
                  </select>
                );
              case 'checkbox':
                return (
                  <input
                    type="checkbox"
                    name={field.name}
                    checked={!!values[field.name]}
                    onChange={e => handleChange(field.name, e.target.checked)}
                    className="mt-1"
                  />
                );
              case 'radio':
                return (
                  <div className="flex space-x-4 mt-1">
                    {field.options && field.options.map((opt, idx) => (
                      <label key={idx} className="inline-flex items-center">
                        <input
                          type="radio"
                          name={field.name}
                          value={opt}
                          checked={values[field.name] === opt}
                          onChange={() => handleChange(field.name, opt)}
                          className="mr-2"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                );
              default:
                return null;
            }
          })()}
          {errors[field.name] && (
            <div className="text-red-500 text-xs mt-1">{errors[field.name]}</div>
          )}
        </div>
      ))}
      <button
        type="submit"
        className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        Envoyer mes réponses
      </button>
    </form>
  );
};

export default InlineMultiFieldForm;

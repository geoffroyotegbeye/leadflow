import React, { useEffect, useState } from 'react';
import { useAssistantStore } from '../../stores/assistantStore';
import AssistantService from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';

interface OptionType {
  value: string;
  label: string;
}

const AssistantSelect: React.FC = () => {
  const [options, setOptions] = useState<OptionType[]>([]);
  const { selectedAssistantId, setSelectedAssistant, loadAssistant } = useAssistantStore();
  const navigate = useNavigate();
  const { assistantId } = useParams();

  useEffect(() => {
    async function fetchAssistants() {
      const assistants = await AssistantService.getAll();
      setOptions(
        assistants.map((a: any) => ({ value: a.id, label: a.name }))
      );
    }
    fetchAssistants();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedAssistant(value);
    loadAssistant(value);
    navigate(`/dashboard/chatbots/editor/${value}`);
  };

  // Dark mode dynamique (écoute les changements système ou classe)
  const [isDark, setIsDark] = useState(() =>
    (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
    (typeof document !== 'undefined' && (document.documentElement.classList.contains('dark') || document.body.classList.contains('dark')))
  );

  useEffect(() => {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      setIsDark(
        darkQuery.matches ||
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark')
      );
    };
    darkQuery.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => {
      darkQuery.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  return (
    <select
      className={`min-w-[240px] px-3 py-2 rounded-lg border focus:outline-none transition-colors text-sm font-medium shadow-sm
        ${isDark
          ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-400 focus:border-indigo-400'
          : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-500 focus:border-indigo-500'}
        focus:ring-2 focus:ring-indigo-400
      `}
      style={{
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
        colorScheme: isDark ? 'dark' : 'light',
      }}
      value={selectedAssistantId || ''}
      onChange={handleChange}
    >
      <option value="" disabled style={{color: isDark ? '#a1a1aa' : '#6b7280'}}>Sélectionner un assistant...</option>
      {options.map(option => (
        <option
          key={option.value}
          value={option.value}
          style={{
            background: isDark ? '#18181b' : '#fff',
            color: isDark ? '#fff' : '#18181b',
          }}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default AssistantSelect;

/**
 * Tabs Component
 *
 * A tabbed interface component.
 * Uses Tailwind CSS for all styling.
 */

import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

  const getTabClasses = (tab: Tab, isActive: boolean) => {
    const base =
      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

    if (tab.disabled) {
      return `${base} opacity-50 cursor-not-allowed`;
    }

    switch (variant) {
      case 'pills':
        return `${base} rounded-lg ${
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`;
      case 'underline':
        return `${base} border-b-2 rounded-none ${
          isActive
            ? 'border-primary-600 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
        }`;
      default:
        return `${base} rounded-lg ${
          isActive
            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
        }`;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Tab list */}
      <div
        className={`
          flex gap-1
          ${variant === 'underline' ? 'border-b border-neutral-200 dark:border-neutral-800' : ''}
        `}
        role="tablist"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            className={getTabClasses(tab, activeTab === tab.id)}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        className="mt-4 animate-fade-in"
      >
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs;

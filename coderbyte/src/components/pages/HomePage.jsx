import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

// __define-ocg__ - Migrated from styled-components and Bootstrap to Tailwind CSS for unified design system

// Component data configuration - moved outside component for better performance
const COMPONENT_CATEGORIES = {
  'Form Controls': ['Button', 'Radio Button', 'Dropdown'],
  'Layout': ['Hero', 'Accordion', 'List'],
  'Feedback': ['Modal', 'Loader', 'Badges'],
  'Data Display': ['Stats']
};

const COMPONENTS_DATA = [
  {
    id: 'button',
    name: 'Button',
    description: 'Versatile button components with various styles, states, and sizes for different actions and emphasis levels.',
    path: '/component/button',
    category: 'Form Controls',
    status: 'stable',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'accordion',
    name: 'Accordion',
    description: 'Collapsible content sections for organizing and presenting information in a compact, expandable format.',
    path: '/component/accordion',
    category: 'Layout',
    status: 'stable',
    lastUpdated: '2024-01-10'
  },
  {
    id: 'hero',
    name: 'Hero',
    description: 'Eye-catching banner sections designed to grab attention and convey key messages effectively.',
    path: '/component/hero',
    category: 'Layout',
    status: 'stable',
    lastUpdated: '2024-01-12'
  },
  {
    id: 'list',
    name: 'List',
    description: 'Flexible list components for displaying data in ordered, unordered, or custom formats.',
    path: '/component/list',
    category: 'Layout',
    status: 'stable',
    lastUpdated: '2024-01-08'
  },
  {
    id: 'modal',
    name: 'Modal',
    description: 'Overlay dialogs and popups for focused user interactions and important messages.',
    path: '/component/modal',
    category: 'Feedback',
    status: 'stable',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'loader',
    name: 'Loader',
    description: 'Loading indicators and spinners to provide visual feedback during async operations.',
    path: '/component/loader',
    category: 'Feedback',
    status: 'stable',
    lastUpdated: '2024-01-11'
  },
  {
    id: 'badges',
    name: 'Badges',
    description: 'Small count and status indicators to highlight information or notifications.',
    path: '/component/badges',
    category: 'Feedback',
    status: 'stable',
    lastUpdated: '2024-01-16'
  },
  {
    id: 'dropdown',
    name: 'Dropdown',
    description: 'Expandable menus for selecting options or triggering actions from a compact interface.',
    path: '/component/dropdown',
    category: 'Form Controls',
    status: 'stable',
    lastUpdated: '2024-01-13'
  },
  {
    id: 'radio-button',
    name: 'Radio Button',
    description: 'Form controls for selecting a single option from a set of mutually exclusive choices.',
    path: '/component/radio-button',
    category: 'Form Controls',
    status: 'stable',
    lastUpdated: '2024-01-09'
  },
  {
    id: 'stats',
    name: 'Stats',
    description: 'Statistical displays and metrics presentations for data visualization.',
    path: '/component/stats',
    category: 'Data Display',
    status: 'stable',
    lastUpdated: '2024-01-07'
  }
];

/**
 * ComponentCard - Individual component card with enhanced accessibility and interaction
 */
const ComponentCard = React.memo(({ component }) => (
  <Link 
    to={component.path}
    className="group bg-white rounded-xl p-8 no-underline text-inherit transition-all duration-300 ease-in-out border border-slate-200 hover:-translate-y-1 hover:shadow-xl hover:border-blue-600 hover:text-inherit block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    aria-label={`View ${component.name} component documentation`}
  >
    <div className="flex items-start justify-between mb-3">
      <h2 className="text-2xl font-semibold text-slate-800 group-hover:text-blue-600 transition-colors duration-200">
        {component.name}
      </h2>
      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
        {component.status}
      </span>
    </div>
    <p className="text-slate-500 leading-relaxed mb-4">
      {component.description}
    </p>
    <div className="flex items-center justify-between text-sm text-slate-400">
      <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">
        {component.category}
      </span>
      <span>Updated {component.lastUpdated}</span>
    </div>
  </Link>
));

ComponentCard.displayName = 'ComponentCard';

/**
 * HomePage - Main landing page for the Lumen Design System
 * Features component browsing, search, and categorization
 */
const HomePage = () => {
  // Variable names as required by the specification
  const varOcg = 'home-page-container';
  const varFiltersCg = 'tailwind-home-styles';
  
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Memoized filtered components for performance
  const filteredComponents = useMemo(() => {
    return COMPONENTS_DATA.filter(component => {
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           component.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || component.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);
  
  // Memoized category options
  const categoryOptions = useMemo(() => {
    return ['All', ...Object.keys(COMPONENT_CATEGORIES)];
  }, []);
  
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('All');
  }, []);

  return (
    <div className={`py-16 max-w-6xl mx-auto px-4 ${varOcg}`} data-filter-style={varFiltersCg}>
      <header className="text-center mb-16">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to Lumen
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-8">
          A modern, accessible, and beautiful design system that helps you build stunning user interfaces with ease.
        </p>
        
        {/* Search and Filter Controls */}
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Search components..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 pl-12 text-lg border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search components"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Component categories">
            {categoryOptions.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                role="tab"
                aria-selected={selectedCategory === category}
                aria-controls="components-grid"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        {filteredComponents.length > 0 ? (
          <>
            <div className="text-center mb-8">
              <p className="text-slate-600">
                Showing {filteredComponents.length} of {COMPONENTS_DATA.length} components
                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              </p>
            </div>
            
            <div 
              id="components-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              role="tabpanel"
            >
              {filteredComponents.map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4" role="img" aria-label="No results found">🔍</div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">No components found</h2>
            <p className="text-slate-500 mb-6">
              Try adjusting your search terms or category filter.
            </p>
            <button
              onClick={handleClearFilters}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

HomePage.displayName = 'HomePage';

export default HomePage;
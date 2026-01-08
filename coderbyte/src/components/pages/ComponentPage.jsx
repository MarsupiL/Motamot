import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Import components
import Button from '../ui/Button/Button';
import Accordion from '../ui/Accordion/Accordion';
import Hero from '../ui/Hero/Hero';
import List from '../ui/List/List';
import Modal from '../ui/Modal/Modal';
import Loader from '../ui/Loader/Loader';
import Badge from '../ui/Badges/Badges';
import Dropdown from '../ui/Dropdown/Dropdown';
import RadioButton from '../ui/RadioButton/RadioButton';
import Stats from '../ui/Stats/Stats';

// __define-ocg__ - Migrated from styled-components to Tailwind CSS for unified design system

/**
 * ComponentPage - Displays detailed information about a specific design system component
 * Includes usage guidelines, examples, props documentation, and accessibility information
 */
const ComponentPage = () => {
  const { componentName } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState('option1');
  
  // Variable names as required by the specification
  const varOcg = 'component-page-container';
  const varFiltersCg = 'tailwind-unified-styles';
  
  // Memoized modal handlers for performance
  const handleModalOpen = useCallback(() => setIsModalOpen(true), []);
  const handleModalClose = useCallback(() => setIsModalOpen(false), []);
  const handleRadioChange = useCallback((value) => setSelectedRadio(value), []);
  const handleBadgeRemove = useCallback(() => alert('Badge removed'), []);
  const handleBackNavigation = useCallback(() => navigate('/'), [navigate]);
  
  // Memoized component data configuration
  const getComponentData = useMemo(() => (name) => {
    const components = {
      'button': {
        title: 'Button',
        description: 'Versatile button components with various styles, states, and sizes for different actions and emphasis levels.',
        usage: 'Use buttons to trigger actions, submit forms, or navigate between pages.',
        examples: (
          <div className="space-x-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="success" outline>Outline Button</Button>
            <Button variant="danger" size="sm">Small Button</Button>
            <Button variant="warning" size="lg">Large Button</Button>
            <Button variant="info" loading>Loading Button</Button>
          </div>
        )
      },
      'accordion': {
        title: 'Accordion',
        description: 'Collapsible content sections for organizing and presenting information in a compact, expandable format.',
        usage: 'Use accordions to organize related content in a collapsible manner, saving space while maintaining accessibility.',
        examples: (
          <Accordion
            items={[
              {
                title: 'Section 1',
                content: 'This is the content for section 1. It can contain any React elements.'
              },
              {
                title: 'Section 2',
                content: 'This is the content for section 2. It can be text, components, or any JSX.'
              },
              {
                title: 'Section 3',
                content: 'This is the content for section 3. Accordions are great for FAQs and similar content.'
              }
            ]}
          />
        )
      },
      'hero': {
        title: 'Hero',
        description: 'Eye-catching banner sections designed to grab attention and convey key messages effectively.',
        usage: 'Use hero sections at the top of landing pages or key sections to make a strong visual impact.',
        examples: (
          <Hero
            title="Welcome to Our Platform"
            subtitle="Create beautiful and responsive hero sections with ease. Perfect for landing pages and key marketing messages."
            size="large"
          >
            <Button variant="primary" size="lg">Get Started</Button>
            <Button variant="secondary" size="lg">Learn More</Button>
          </Hero>
        )
      },
      'list': {
        title: 'List',
        description: 'Flexible list components for displaying data in ordered, unordered, or custom formats.',
        usage: 'Use lists to display collections of related items or data in a structured format.',
        examples: (
          <div className="space-y-4">
            <List
              items={['First item', 'Second item', 'Third item']}
              variant="bullet"
            />
            <List
              items={['Completed task', 'Another done', 'Yet another done']}
              variant="check"
              bulletColor="#10b981"
            />
            <List
              items={['Important item', 'Critical task', 'Key point']}
              variant="bullet"
              bulletColor="#ef4444"
              divider
            />
          </div>
        )
      },
      'modal': {
        title: 'Modal',
        description: 'Overlay dialogs and popups for focused user interactions and important messages.',
        usage: 'Use modals to focus user attention on important actions or information without leaving the current page.',
        examples: (
          <div>
            <Button onClick={handleModalOpen}>Open Modal</Button>
            <Modal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              title="Example Modal"
              footer={
                <div className="flex gap-3 justify-end">
                  <Button variant="secondary" onClick={handleModalClose}>Cancel</Button>
                  <Button variant="primary" onClick={handleModalClose}>Confirm</Button>
                </div>
              }
            >
              <p>This is an example modal dialog. It can contain any content you want.</p>
            </Modal>
          </div>
        )
      },
      'loader': {
        title: 'Loader',
        description: 'Loading indicators and spinners to provide visual feedback during async operations.',
        usage: 'Use loaders to indicate that content is being loaded or an operation is in progress.',
        examples: (
          <div className="space-x-8">
            <Loader variant="spinner" size="small" />
            <Loader variant="dots" size="medium" color="primary" />
            <Loader variant="pulse" size="large" color="success" />
            <Loader variant="spinner" size="medium" color="warning" text="Loading..." />
          </div>
        )
      },
      'badges': {
        title: 'Badges',
        description: 'Small count and status indicators to highlight information or notifications.',
        usage: 'Use badges to display counts, status, or to highlight new or updated content.',
        examples: (
          <div className="space-x-2">
            <Badge variant="primary">New</Badge>
            <Badge variant="success">Completed</Badge>
            <Badge variant="warning" outlined>Warning</Badge>
            <Badge variant="danger" size="large">Error</Badge>
            <Badge variant="info" size="small">Info</Badge>
            <Badge variant="secondary" removable onRemove={handleBadgeRemove}>Removable</Badge>
          </div>
        )
      },
      'dropdown': {
        title: 'Dropdown',
        description: 'Expandable menus for selecting options or triggering actions from a compact interface.',
        usage: 'Use dropdowns to present a list of options or actions in a space-efficient manner.',
        examples: (
          <div className="space-x-4">
            <Dropdown
              trigger="Options"
              items={[
                { label: 'Profile', icon: '👤' },
                { label: 'Settings', icon: '⚙️' },
                { divider: true },
                { label: 'Logout', icon: '🚪' }
              ]}
            />
            <Dropdown
              trigger="Actions"
              items={[
                { label: 'Edit', icon: '✏️' },
                { label: 'Delete', icon: '🗑️', disabled: true },
                { label: 'Share', icon: '📤' }
              ]}
              placement="right"
            />
          </div>
        )
      },
      'radio-button': {
        title: 'Radio Button',
        description: 'Form controls for selecting a single option from a set of mutually exclusive choices.',
        usage: 'Use radio buttons when users need to select exactly one option from a set of choices.',
        examples: (
          <div className="space-y-4">
            <RadioButton
              name="example"
              value={selectedRadio}
              onChange={handleRadioChange}
              options={[
                { value: 'option1', label: 'Option 1', description: 'This is the first option' },
                { value: 'option2', label: 'Option 2', description: 'This is the second option' },
                { value: 'option3', label: 'Option 3', disabled: true, description: 'This option is disabled' }
              ]}
            />
            <RadioButton
              name="horizontal-example"
              value={selectedRadio}
              onChange={handleRadioChange}
              options={[
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' }
              ]}
              horizontal
            />
          </div>
        )
      },
      'stats': {
        title: 'Stats',
        description: 'Statistical displays and metrics presentations for data visualization.',
        usage: 'Use stats components to display key metrics, numbers, or data points in an engaging way.',
        examples: (
          <Stats
            items={[
              {
                label: 'Total Users',
                value: '24.8k',
                change: 12,
                description: 'Compared to last month',
                icon: '👥'
              },
              {
                label: 'Revenue',
                value: '$45,231',
                change: -2.4,
                description: 'Compared to last month',
                icon: '💰'
              },
              {
                label: 'Active Projects',
                value: '12',
                change: 8.3,
                description: 'Compared to last month',
                icon: '📊'
              },
              {
                label: 'Satisfaction',
                value: '98%',
                change: 3.2,
                description: 'Based on surveys',
                icon: '⭐'
              }
            ]}
          />
        )
      }
    };
    
    return components[name?.toLowerCase()] || {
      title: 'Component Not Found',
      description: 'This component does not exist in our design system.',
      usage: 'Please check the component name in the URL or return to the homepage to browse available components.',
      examples: (
        <div className="text-center py-8">
          <p className="text-slate-500 mb-4">No examples available for this component.</p>
          <Button variant="primary" onClick={handleBackNavigation}>
            Browse Components
          </Button>
        </div>
      )
    };
  }, [handleModalOpen, handleModalClose, handleRadioChange, handleBadgeRemove, handleBackNavigation, isModalOpen, selectedRadio]);

  // Memoized component data to prevent unnecessary recalculations
  const component = useMemo(() => getComponentData(componentName), [getComponentData, componentName]);

  // Error boundary for component rendering
  if (!componentName) {
    return (
      <div className={`py-16 max-w-6xl mx-auto px-4 text-center ${varOcg}`} data-filter-style={varFiltersCg}>
        <h1 className="text-4xl font-bold mb-4 text-slate-800">Invalid Component</h1>
        <p className="text-lg text-slate-500 mb-8">No component specified in the URL.</p>
        <Button variant="primary" onClick={handleBackNavigation}>
          Return to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className={`py-16 max-w-6xl mx-auto px-4 ${varOcg}`} data-filter-style={varFiltersCg}>
      <nav className="mb-8" aria-label="Breadcrumb">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBackNavigation}
          className="mb-8"
          aria-label="Go back to components overview"
        >
          ← Back to Components
        </Button>
      </nav>
      
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-slate-800">
          {component.title}
        </h1>
        <p className="text-lg text-slate-500 max-w-3xl leading-relaxed">
          {component.description}
        </p>
      </header>

      <main>
        <section className="mb-12 p-8 bg-white rounded-xl border border-slate-200 shadow-sm" aria-labelledby="usage-heading">
          <h2 id="usage-heading" className="text-2xl font-semibold mb-6 text-slate-800">
            Usage Guidelines
          </h2>
          <p className="text-lg text-slate-500 max-w-3xl leading-relaxed">
            {component.usage}
          </p>
        </section>

        <section className="mb-12 p-8 bg-white rounded-xl border border-slate-200 shadow-sm" aria-labelledby="examples-heading">
          <h2 id="examples-heading" className="text-2xl font-semibold mb-6 text-slate-800">
            Interactive Examples
          </h2>
          <div className="space-y-6">
            {component.examples}
          </div>
        </section>

        <section className="mb-12 p-8 bg-white rounded-xl border border-slate-200 shadow-sm" aria-labelledby="props-heading">
          <h2 id="props-heading" className="text-2xl font-semibold mb-6 text-slate-800">
            API Reference
          </h2>
          <p className="text-lg text-slate-500 max-w-3xl leading-relaxed">
            Comprehensive props documentation and TypeScript definitions will be added here.
          </p>
        </section>

        <section className="mb-12 p-8 bg-white rounded-xl border border-slate-200 shadow-sm" aria-labelledby="accessibility-heading">
          <h2 id="accessibility-heading" className="text-2xl font-semibold mb-6 text-slate-800">
            Accessibility & Best Practices
          </h2>
          <p className="text-lg text-slate-500 max-w-3xl leading-relaxed">
            WCAG compliance guidelines, keyboard navigation patterns, and screen reader support documentation will be added here.
          </p>
        </section>
      </main>
    </div>
  );
};

ComponentPage.displayName = 'ComponentPage';

export default ComponentPage;
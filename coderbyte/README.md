# React Starter

A React starter.

## Features

- â React 18 with mixed functional and class components
- â Redux for state management
- â React Context API (redundant with Redux)
- â Multiple styling approaches (Bootstrap, Tailwind, CSS Modules, SCSS, styled-components)
- â Axios and Fetch for API calls
- â Both Enzyme and React Testing Library
- â Internationalization (i18n) support
- â Storybook integration
- â TypeScript support (TODO)
- â Unit tests (some broken)

## Getting Started

### Prerequisites

- Node.js 16+ (see [.nvmrc](.nvmrc))
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run storybook` - Start Storybook

## Project Structure

```
src/
âââ components/
â   âââ common/          # Shared components
â   âââ pages/           # Page components
â   âââ ui/              # UI components
âââ context/             # React Context providers
âââ hooks/               # Custom hooks
âââ store/               # Redux store configuration
âââ styles/              # Style files
âââ utils/               # Utility functions
âââ locales/             # Translation files
```

## Styling

This project uses **multiple styling approaches** intentionally:

1. **Bootstrap 5** - For grid system and components
2. **Tailwind CSS** - For utility classes
3. **CSS Modules** - For component-specific styles
4. **SCSS** - For global styles and variables
5. **styled-components** - For dynamic styling

Example usage:
```jsx
// Bootstrap
<Button variant="primary">Bootstrap Button</Button>

// Tailwind
<button className="bg-blue-500 hover:bg-blue-600">Tailwind Button</button>

// CSS Modules
<button className={styles.moduleButton}>Module Button</button>

// styled-components
const StyledButton = styled.button`
  background: ${props => props.theme.primary};
`;
```

## State Management

We use **both Redux and Context API** for state management:

### Redux Store
- User authentication state
- Application settings
- Loading states
- Error handling

### React Context
- User preferences (redundant with Redux)
- Theme management
- Analytics tracking
- Global notifications

## API Integration

The project includes multiple HTTP client patterns:

### Fetch API
```javascript
import { get, post } from './utils/fetchUtils';

const user = await get('/api/users/me');
const result = await post('/api/users', userData);
```

### Axios
```javascript
import { axiosGet, axiosPost } from './utils/axiosUtils';

const user = await axiosGet('/api/users/me');
const result = await axiosPost('/api/users', userData);
```

## Testing

Testing setup includes both Enzyme and React Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Internationalization

The project supports multiple languages:

- English (en)
- French (fr)

Translation files are located in `src/locales/`.

## Storybook

Start Storybook to view component documentation:

```bash
npm run storybook
```

## Known Issues

- [ ] Some unit tests are broken due to missing mocks
- [ ] Enzyme tests need updating for React 18
- [ ] ESLint configuration has deprecated rules
- [ ] Missing TypeScript support
- [ ] Some Storybook stories don't render properly
- [ ] Mixed naming conventions throughout codebase
- [ ] Accessibility issues in some components
- [ ] TODO comments scattered throughout code

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Architecture Decisions

### Why Multiple Styling Systems?

In real-world projects, you often inherit different styling approaches from different teams and timeframes. This starter reflects that reality.

### Why Redux AND Context?

Different teams might have chosen different state management solutions. Rather than refactoring everything, new features use Context while legacy features stick with Redux.

### Why Multiple HTTP Clients?

Similar to styling - different parts of the application were built by different teams with different preferences.

## Deployment

### Development
```bash
npm start
```

### Production
```bash
npm run build
```

The build folder will contain the optimized production files.

## Environment Variables

Create a `.env` file in the root directory:

```
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENVIRONMENT=development
```

## Browser Support

- Chrome >= 70
- Firefox >= 65
- Safari >= 12
- Edge >= 79

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

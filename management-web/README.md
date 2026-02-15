# ISBAT Library Management System - Management Web Portal

A modern React-based web application for library management, built with Vite, TypeScript, and Material-UI. This is the management portal for librarians and administrators to manage the library system.

## 🚀 Features

### Core Functionality
- **Authentication**: Secure login system with JWT tokens
- **Dashboard**: Comprehensive overview with statistics and metrics
- **Books Management**: Complete CRUD operations for book inventory
- **User Management**: Member and librarian account management
- **Loan Management**: Track book loans, returns, and renewals
- **Responsive Design**: Works seamlessly on desktop and tablet devices

### UI/UX Features
- **Modern Design**: Clean, professional interface matching Flutter app design
- **Dark/Light Theme**: Consistent theming with Flutter counterpart
- **Interactive Components**: Smooth animations and transitions
- **Accessibility**: WCAG compliant components
- **Real-time Updates**: Live status updates and notifications

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Material-UI (MUI)** - React component library
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling with validation
- **Axios** - HTTP client for API calls

### Development Tools
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking
- **Vite Dev Server** - Hot module replacement

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd management-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
src/
├── core/                  # Core application logic
│   ├── config/           # Configuration files
│   ├── hooks/            # Custom React hooks
│   ├── theme/            # Theme configuration
│   └── utils/            # Utility functions
├── features/             # Feature-based modules
│   ├── auth/             # Authentication components
│   ├── books/            # Books management
│   ├── dashboard/        # Dashboard components
│   ├── loans/            # Loan management
│   ├── members/          # Member management
│   └── settings/         # Application settings
├── shared/               # Shared resources
│   ├── components/       # Reusable UI components
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   └── constants/        # Application constants
└── App.tsx               # Main application component
```

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Login**: Users authenticate with email and password
2. **Token Storage**: JWT tokens stored in localStorage
3. **Auto-refresh**: Tokens automatically refresh on expiry
4. **Protected Routes**: Authentication guards for sensitive pages

## 📊 Dashboard Features

### Statistics Overview
- Total books in library
- Active loans count
- Registered members
- Overdue books alert

### Quick Actions
- Add new book
- Process loan requests
- Member management
- System settings

## 📚 Books Management

### Features
- **Search & Filter**: Find books by title, author, or ISBN
- **CRUD Operations**: Create, read, update, delete books
- **Status Tracking**: Available, borrowed, reserved status
- **Category Management**: Organize books by categories
- **Inventory Tracking**: Monitor total and available copies

### Book Information
- Title and author
- ISBN and publication details
- Category and subject
- Copy count and availability
- Cover image support

## 🎨 Design System

### Theme Configuration
- **Primary Color**: #BF0019 (Brand red)
- **Secondary Color**: #8A0C1E (Dark red)
- **Background**: #F5F5F5 (Light gray)
- **Surface**: #FFFFFF (White)
- **Typography**: Poppins font family

### Component Library
- Custom themed Material-UI components
- Consistent spacing and sizing
- Responsive breakpoints
- Interactive states and animations

## 🔧 API Integration

### Service Architecture
- **API Service**: Centralized HTTP client with interceptors
- **Error Handling**: Global error handling and user feedback
- **Request/Response Interceptors**: Automatic token injection
- **Type Safety**: TypeScript interfaces for API responses

### Endpoints
```typescript
// Authentication
POST /auth/login
GET /auth/me

// Books Management
GET /books
POST /books
PUT /books/:id
DELETE /books/:id

// Dashboard
GET /dashboard/summary
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# Test coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Structure
- Unit tests for components and utilities
- Integration tests for API services
- E2E tests for user workflows

## 🚀 Deployment

### Build Process
```bash
# Production build
npm run build

# Preview build
npm run preview
```

### Environment Setup
- Production environment variables
- API endpoint configuration
- Build optimization settings

## 🔄 State Management

### Zustand Store
- **Auth Store**: User authentication state
- **UI Store**: Interface state and preferences
- **Data Store**: Application data caching

### Local Storage
- User session persistence
- Preference storage
- Offline data caching

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 600px
- **Tablet**: 600px - 960px
- **Desktop**: > 960px

### Adaptive Layout
- Collapsible sidebar navigation
- Responsive grid systems
- Touch-friendly interactions
- Optimized for different screen sizes

## 🔒 Security Features

### Implementation
- JWT token authentication
- XSS protection
- CSRF protection
- Secure token storage
- API request validation

### Best Practices
- Input validation and sanitization
- Secure HTTP headers
- Environment variable protection
- Role-based access control

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component documentation

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check documentation

---

**Note**: This management portal is designed to work with the ISBAT Library Management System backend API. Ensure the backend service is running and properly configured before using this application.

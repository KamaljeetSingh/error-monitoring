# Error Monitoring System

A React-based error monitoring system that groups and tracks application errors similar to Sentry. This system provides real-time error tracking, grouping, and visualization capabilities.

## Features

- Real-time error tracking and logging
- Smart error grouping using fingerprinting
- MongoDB integration for error storage
- React-based UI for error visualization
- Error boundary integration
- Support for various error types:
  - Resource Loading Errors
  - Network Errors
  - Type Errors
  - React State Errors
  - And more...

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Clone the repository:

```bash
git clone https://github.com/KamaljeetSingh/error-monitoring.git
cd error-monitoring
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
SERVER_PORT=5000
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:

```bash
npm start
```

## Project Structure

- `/src` - React application source code
- `/server` - Express.js backend server
- `/src/components` - React components
- `/src/utils` - Utility functions and error logging

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

You may serve it with a static server after npm run build.

npm install -g serve
serve -s build

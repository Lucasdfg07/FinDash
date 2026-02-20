import '@testing-library/jest-dom';

// Mock de environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'file:./test.db';
process.env.INTER_CLIENT_ID = 'test-client-id';
process.env.INTER_CLIENT_SECRET = 'test-client-secret';
process.env.INTER_CERT_PEM = 'test-cert';
process.env.INTER_KEY_PEM = 'test-key';

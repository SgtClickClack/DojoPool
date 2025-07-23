import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-simple';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error("Failed to find the root element. Please ensure an element with id 'root' exists in your HTML.");
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
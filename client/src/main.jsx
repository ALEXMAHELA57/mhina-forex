import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CallProvider } from './lib/CallContext.jsx';
import FloatingCallWindow from './components/FloatingCallWindow.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CallProvider>
        <App />
        {/* Rendered as a sibling to <App>, outside its <Routes> — so
            navigating between pages never unmounts an active call. */}
        <FloatingCallWindow />
      </CallProvider>
    </BrowserRouter>
  </React.StrictMode>
);

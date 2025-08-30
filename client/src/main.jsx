import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.process = {
  env: {}
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThirdwebProvider } from '@thirdweb-dev/react'; 
// --- NEW: Import Sepolia chain object ---
import { Sepolia } from "@thirdweb-dev/chains"; 
// --- END NEW ---

import { StateContextProvider } from './context';
import App from './App';
import './index.css';

const THIRDWEB_CLIENT_ID = "9aa238081453a427e0d7084a8c927c08"; 

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ThirdwebProvider 
    activeChain={Sepolia} 
    supportedChains={[Sepolia]}
    clientId={THIRDWEB_CLIENT_ID}
  > 
    <Router>
      <StateContextProvider>
        <App />
      </StateContextProvider>
    </Router>
  </ThirdwebProvider> 
);

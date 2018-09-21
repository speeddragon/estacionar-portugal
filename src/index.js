import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom'
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

// HashRouter for single page app

ReactDOM.render((
    <HashRouter>
        <App />
    </HashRouter>), document.getElementById('root')
);
registerServiceWorker();

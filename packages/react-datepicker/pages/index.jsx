import {createRoot} from 'react-dom/client';
import DateTimeDialog from '../components/DateTimeDialog.jsx';

createRoot(document.getElementById('react-root')).render(<DateTimeDialog timezone="America/Vancouver"/>);

import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { StockPage } from './pages/StockPage';
import { CustomersPage } from './pages/CustomersPage';
import { InvoicesListPage } from './pages/InvoicesListPage';
import { InvoiceCreatePage } from './pages/InvoiceCreatePage';
import { InvoiceViewPage } from './pages/InvoiceViewPage';
import { DeliveryNotesListPage } from './pages/DeliveryNotesListPage';
import { DeliveryNoteCreatePage } from './pages/DeliveryNoteCreatePage';
import { DeliveryNoteViewPage } from './pages/DeliveryNoteViewPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SupplierInvoicesListPage } from './pages/SupplierInvoicesListPage';
import { SupplierInvoiceCreatePage } from './pages/SupplierInvoiceCreatePage';
import { SupplierInvoiceViewPage } from './pages/SupplierInvoiceViewPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UpdateNotifier } from './components/UpdateNotifier';

function App() {
  return (
    <>
      <UpdateNotifier />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/invoices/new" element={<InvoiceCreatePage />} />
          <Route path="/invoices/:id" element={<InvoiceViewPage />} />
          <Route path="/delivery-notes" element={<DeliveryNotesListPage />} />
          <Route path="/delivery-notes/new" element={<DeliveryNoteCreatePage />} />
          <Route path="/delivery-notes/:id" element={<DeliveryNoteViewPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/supplier-invoices" element={<SupplierInvoicesListPage />} />
          <Route path="/supplier-invoices/new" element={<SupplierInvoiceCreatePage />} />
          <Route path="/supplier-invoices/:id" element={<SupplierInvoiceViewPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;

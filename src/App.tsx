import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ReservationsPage } from './pages/ReservationsPage';
import { TodosPage } from './pages/TodosPage';
import { TenantsPage } from './pages/admin/TenantsPage';
import { ReportsPage } from './pages/ReportsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { CampersPage } from './pages/CampersPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto py-6 px-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/todos" element={<TodosPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/campers" element={<CampersPage />} />
            <Route path="/admin/tenants" element={<TenantsPage />} />
            <Route path="/admin/tenants/:tenantId" element={<TenantsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
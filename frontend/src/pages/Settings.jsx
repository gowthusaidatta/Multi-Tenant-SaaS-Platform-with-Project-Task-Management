import React from 'react';
import MainLayout from '../components/MainLayout';
import { PageHeader, Card } from '../components/UIComponents';

export default function Settings() {
  return (
    <MainLayout>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile</h3>
          <p className="text-sm text-gray-600">Profile settings coming soon.</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
          <p className="text-sm text-gray-600">Password and 2FA settings coming soon.</p>
        </Card>
      </div>
    </MainLayout>
  );
}
import React from 'react';
import { ArrowLeft, Ban, Mail, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CamperInfo } from './camper-details/CamperInfo';
import { CamperHistory } from './camper-details/CamperHistory';
import { Customer } from '../types';

interface CamperDetailsProps {
  customer: Customer;
  onClose: () => void;
}

export function CamperDetails({ customer, onClose }: CamperDetailsProps) {
  const [activeTab, setActiveTab] = React.useState<'history' | 'info'>('info');
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gray-50 z-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onClose()}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                Save
              </button>
              <button 
                onClick={() => onClose()}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Ban className="h-5 w-5" />
                Block
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Mail className="h-5 w-5" />
                Message
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8">
            <button
              className={`py-3 px-1 border-b-2 ${
                activeTab === 'history'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
            <button
              className={`py-3 px-1 border-b-2 ${
                activeTab === 'info'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('info')}
            >
              Camper info
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'history' ? (
          <CamperHistory customer={customer} />
        ) : (
          <CamperInfo customer={customer} />
        )}
      </main>
    </div>
  );
}
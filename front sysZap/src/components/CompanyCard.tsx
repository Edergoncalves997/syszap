import React from 'react';
import { Building2, Wifi, WifiOff } from 'lucide-react';
import { Company } from '../data/mockCompanies';

interface CompanyCardProps {
  company: Company;
  onTest?: (id: number) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onTest }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Building2 className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{company.name}</h3>
            {company.cnpj && (
              <p className="text-sm text-gray-500">{company.cnpj}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {company.status === 'connected' ? (
            <Wifi className="text-green-500" size={20} />
          ) : (
            <WifiOff className="text-red-500" size={20} />
          )}
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              company.status === 'connected'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {company.status === 'connected' ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Último check: {company.lastCheck}
        </p>
        {onTest && (
          <button
            onClick={() => onTest(company.id)}
            className="text-sm text-primary hover:text-primary-light font-medium"
          >
            Testar conexão
          </button>
        )}
      </div>
    </div>
  );
};

export default CompanyCard;



import React, { useState, useEffect } from 'react';
import { Project } from './types';
import { RefreshCw, UploadCloud, FileSpreadsheet, Settings, AlertTriangle } from 'lucide-react';
import { fmt } from './types';

interface Props {
  project: Project;
}

export function ProjectAccountingSync({ project }: Props) {
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('dqh_gas_api_url') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('dqh_gas_api_url'));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, any[][]> | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('');
  
  const sheetId = React.useMemo(() => {
    if (!project.accountingSheetUrl) return null;
    const match = project.accountingSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : project.accountingSheetUrl; // could be raw ID
  }, [project.accountingSheetUrl]);

  const saveApiUrl = (url: string) => {
    setApiUrl(url);
    localStorage.setItem('dqh_gas_api_url', url);
    setShowSettings(false);
  };

  const handleSync = async () => {
    if (!apiUrl || !sheetId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}?action=read&sheetId=${sheetId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (Object.keys(json.data).length > 0) {
          setActiveTab(Object.keys(json.data)[0]);
        }
      } else {
        setError(json.error || 'Lỗi khi đồng bộ dữ liệu');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến Google Scripts. Vui lòng kiểm tra lại URL.');
    } finally {
      setLoading(false);
    }
  };

  if (!project.accountingSheetUrl) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
        <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-700">Chưa cấu hình Google Sheet Kế toán</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Dự án này chưa được liên kết với bảng kế toán Google Sheets. Vui lòng chỉnh sửa dự án và thêm Link Google Sheet để sử dụng tính năng đồng bộ này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Settings / Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Đồng bộ Kế Toán Google Sheets
          </h3>
          <p className="text-xs text-slate-500 mt-1">Sheet ID: {sheetId}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={handleSync} disabled={loading || !apiUrl} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang tải...' : 'Lấy dữ liệu (Pull)'}
          </button>
          <button disabled className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2">
            <UploadCloud className="w-3.5 h-3.5" />
            Đẩy dữ liệu (Push)
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700">Cấu hình API Google Scripts</h4>
          <p className="text-xs text-slate-500">Dán URL Web App của Google Apps Script bạn đã triển khai vào đây. URL này sẽ được lưu ở trình duyệt của bạn.</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={apiUrl} 
              onChange={e => setApiUrl(e.target.value)} 
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
            />
            <button onClick={() => saveApiUrl(apiUrl)} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700">
              Lưu
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg flex items-start gap-2 border border-red-100">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {data && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50 p-2 gap-1 shrink-0">
            {Object.keys(data).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Table View */}
          <div className="flex-1 overflow-auto p-4 relative">
            {activeTab && data[activeTab] && data[activeTab].length > 0 ? (
              <table className="w-full text-left text-xs border-collapse min-w-max">
                <thead>
                  <tr>
                    {data[activeTab][0].map((h: any, i: number) => (
                      <th key={i} className="sticky top-0 bg-slate-100 p-2 border-b border-slate-200 font-bold text-slate-700 whitespace-nowrap z-10">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data[activeTab].slice(1).map((row: any[], ri: number) => (
                    <tr key={ri} className="border-b border-slate-50 hover:bg-slate-50">
                      {row.map((cell: any, ci: number) => (
                        <td key={ci} className="p-2 text-slate-600">
                          {typeof cell === 'number' ? cell.toLocaleString('vi-VN') : cell?.toString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                Tab này không có dữ liệu
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

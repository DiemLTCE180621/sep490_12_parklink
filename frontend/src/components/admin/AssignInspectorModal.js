import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import fieldInspectorService from '../../services/fieldInspectorService';
import {
  UserCheck,
  Search,
  MapPin,
  Mail,
  Phone,
  Check,
  RotateCcw,
  AlertCircle,
  X,
  Building2,
  Briefcase
} from 'lucide-react';


const AssignInspectorModal = ({
  isOpen,
  onClose,
  onConfirm,
  facilityName,
  facilityAddress,
  currentInspectorId = null,
  isSubmitting = false,
  title,
  confirmText
}) => {
  const { t } = useTranslation('admin');
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');

  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [workloadFilter, setWorkloadFilter] = useState('ALL'); 

  
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchInspectors = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fieldInspectorService.getActiveInspectors();
        const list = res?.data || res || [];
        const validList = Array.isArray(list) ? list : [];

        if (isMounted) {
          setInspectors(validList);
          
          if (currentInspectorId) {
            setSelectedId(String(currentInspectorId));
          } else if (validList.length > 0) {
            setSelectedId(String(validList[0].id));
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách nhân viên khảo sát:', err);
        if (isMounted) {
          setError('registrations.inspectorModal.loadError');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInspectors();

    
    setSearchQuery('');
    setSelectedArea('ALL');
    setWorkloadFilter('ALL');

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentInspectorId]);

  
  const availableAreas = useMemo(() => {
    const areas = new Set();
    inspectors.forEach((ins) => {
      if (ins.address) {
        const parts = ins.address.split(',').map((p) => p.trim());
        parts.forEach((part) => {
          if (
            part.toLowerCase().includes('quận') ||
            part.toLowerCase().includes('huyện') ||
            part.toLowerCase().includes('phường') ||
            part.toLowerCase().includes('ninh kiều') ||
            part.toLowerCase().includes('cái răng') ||
            part.toLowerCase().includes('bình thủy') ||
            part.toLowerCase().includes('ô môn') ||
            part.toLowerCase().includes('thốt nốt') ||
            part.toLowerCase().includes('vĩnh long') ||
            part.toLowerCase().includes('cần thơ')
          ) {
            areas.add(part);
          }
        });
      }
    });
    return Array.from(areas);
  }, [inspectors]);

  
  const filteredInspectors = useMemo(() => {
    return inspectors.filter((ins) => {
      
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (ins.full_name || '').toLowerCase().includes(q) ||
        (ins.email || '').toLowerCase().includes(q) ||
        (ins.phone_number || '').toLowerCase().includes(q) ||
        (ins.address || '').toLowerCase().includes(q);

      
      const matchArea =
        selectedArea === 'ALL' ||
        (ins.address || '').toLowerCase().includes(selectedArea.toLowerCase());

      
      const activeTasks = ins._count?.assigned_facilities || 0;
      let matchWorkload = true;
      if (workloadFilter === 'IDLE') {
        matchWorkload = activeTasks === 0;
      } else if (workloadFilter === 'BUSY') {
        matchWorkload = activeTasks > 0;
      }

      return matchSearch && matchArea && matchWorkload;
    });
  }, [inspectors, searchQuery, selectedArea, workloadFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedArea('ALL');
    setWorkloadFilter('ALL');
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    onConfirm(parseInt(selectedId, 10));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-hidden">
      {}
      <style>{`
        .inspector-scroll-area::-webkit-scrollbar {
          width: 7px;
        }
        .inspector-scroll-area::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .inspector-scroll-area::-webkit-scrollbar-thumb {
          background: #0d9488;
          border-radius: 9999px;
        }
        .inspector-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #0f766e;
        }
      `}</style>

      {}
      <div className="bg-white rounded-xl w-full max-w-4xl md:max-w-5xl h-[85vh] min-h-[600px] max-h-[780px] shadow-2xl flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {}
        <div className="px-6 py-4 md:px-8 md:py-5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-amber-100/80 rounded-xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">{title || t('registrations.assign.assignTitle')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('registrations.inspectorModal.description')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition flex items-center justify-center shrink-0"
            title={t('registrations.inspectorModal.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {}
        <div className="px-6 py-3.5 md:px-8 border-b border-gray-200 bg-gray-50/60 shrink-0 space-y-3">
          {}
          <div className="p-3 bg-white rounded-xl border border-gray-200/80 flex items-center gap-3 text-xs shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center shrink-0 font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 truncate">
                 {facilityName || t('registrations.table.facilityName')}
              </div>
              {facilityAddress && (
                <div className="text-gray-600 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-neighbor-600 shrink-0" />
                  <span className="truncate">{facilityAddress}</span>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center">
            {}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder={t('registrations.inspectorModal.searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500/20 focus:border-neighbor-500 transition shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {}
            {availableAreas.length > 0 && (
              <div className="relative w-full sm:w-48">
                <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full pl-7 pr-6 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500/20 focus:border-neighbor-500 transition appearance-none cursor-pointer truncate shadow-sm"
                >
                   <option value="ALL">{t('registrations.inspectorModal.allAreas')}</option>
                  {availableAreas.map((area, idx) => (
                    <option key={idx} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {}
            <div className="relative w-full sm:w-40">
              <Briefcase className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <select
                value={workloadFilter}
                onChange={(e) => setWorkloadFilter(e.target.value)}
                className="w-full pl-7 pr-6 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500/20 focus:border-neighbor-500 transition appearance-none cursor-pointer shadow-sm"
              >
                 <option value="ALL">{t('registrations.inspectorModal.allWorkloads')}</option>
                 <option value="IDLE">{t('registrations.inspectorModal.idleFilter')}</option>
                 <option value="BUSY">{t('registrations.inspectorModal.busyFilter')}</option>
              </select>
            </div>
          </div>

          {}
          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 pt-0.5">
            <span>
               {t('registrations.inspectorModal.results', { count: filteredInspectors.length, total: inspectors.length })}
            </span>
            {(searchQuery || selectedArea !== 'ALL' || workloadFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-neighbor-700 hover:text-neighbor-800 font-semibold hover:underline flex items-center gap-1"
              >
                 <RotateCcw className="w-3 h-3" /> {t('common.reset')}
              </button>
            )}
          </div>
        </div>

        {}
        <div
          className="inspector-scroll-area flex-1 min-h-0 overflow-y-auto p-4 md:p-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#0d9488 #f1f5f9'
          }}
        >
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
              <RotateCcw className="w-6 h-6 animate-spin text-neighbor-600" />
               <span>{t('registrations.inspectorModal.loading')}</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs text-center space-y-2">
               <p className="font-semibold">{t(error)}</p>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-bold hover:bg-rose-50 transition"
              >
                 {t('registrations.inspectorModal.close')}
              </button>
            </div>
          ) : inspectors.length === 0 ? (
            <div className="p-8 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 text-center space-y-2 my-auto">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
               <p className="font-bold text-sm">{t('registrations.inspectorModal.noInspectors')}</p>
              <p className="text-[11px] text-amber-700 max-w-md mx-auto">
                 {t('registrations.inspectorModal.noInspectorsHint')}
              </p>
            </div>
          ) : filteredInspectors.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs space-y-2 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
              <Search className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-semibold text-gray-600">
                 {t('registrations.inspectorModal.noMatches')}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-neighbor-700 hover:underline font-semibold"
              >
                 {t('registrations.inspectorModal.clearFilters', { count: inspectors.length })}
              </button>
            </div>
          ) : (
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredInspectors.map((inspector) => {
                const isSelected = String(selectedId) === String(inspector.id);
                const activeCount = inspector._count?.assigned_facilities || 0;
                const isCurrent = currentInspectorId && Number(currentInspectorId) === inspector.id;

                return (
                  <div
                    key={inspector.id}
                    onClick={() => setSelectedId(String(inspector.id))}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 shadow-sm ${
                      isSelected
                        ? 'border-neighbor-600 bg-neighbor-50/70 ring-2 ring-neighbor-600/20'
                        : 'border-gray-200 hover:border-neighbor-300 hover:bg-gray-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-colors ${
                          isSelected
                            ? 'bg-neighbor-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {inspector.full_name?.charAt(0) || 'N'}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs md:text-sm font-bold text-gray-900 truncate">
                            {inspector.full_name}
                          </span>
                          <span className="text-[10px] font-semibold text-neighbor-700 bg-neighbor-100/80 px-2 py-0.5 rounded-full shrink-0">
                             {t('registrations.inspectorModal.inspector')}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                               {t('registrations.inspectorModal.currentAssignee')}
                            </span>
                          )}
                        </div>

                        {}
                        <div>
                          {activeCount === 0 ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full inline-block">
                               {t('registrations.inspectorModal.idle')}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full inline-block">
                               {t('registrations.inspectorModal.activeFacilities', { count: activeCount })}
                            </span>
                          )}
                        </div>

                        {}
                        <div className="text-xs text-gray-500 flex items-center gap-3 pt-0.5 flex-wrap">
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            {inspector.email}
                          </span>
                          {inspector.phone_number && (
                            <span className="flex items-center gap-1.5 font-medium text-gray-700 shrink-0">
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {inspector.phone_number}
                            </span>
                          )}
                        </div>

                        {}
                        <div className="pt-1 flex items-start gap-1.5 text-xs text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-gray-700 line-clamp-2">
                             <strong>{t('registrations.inspectorModal.address')}:</strong> {inspector.address || t('registrations.inspectorModal.addressMissing')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="shrink-0 pl-1 pt-0.5">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-neighbor-600 bg-neighbor-600 text-white shadow-sm scale-110'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {}
        <div className="px-6 py-3.5 md:px-8 md:py-4 border-t border-gray-200 bg-gray-50/80 shrink-0 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-500 hidden sm:block">
            {selectedId ? (
              <span>
                 {t('registrations.inspectorModal.selectedInspector')}{' '}
                <strong className="text-neighbor-700">
                  {inspectors.find((i) => String(i.id) === String(selectedId))?.full_name}
                </strong>
              </span>
            ) : (
               <span>{t('registrations.inspectorModal.selectInspector')}</span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto sm:min-w-[320px]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 transition text-xs shadow-sm"
            >
               {t('registrations.confirm.cancel')}
            </button>
            <button
              type="button"
              disabled={isSubmitting || !selectedId || filteredInspectors.length === 0}
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs font-semibold whitespace-nowrap"
            >
               {isSubmitting ? t('registrations.confirm.processing') : (confirmText || t('registrations.assign.assignConfirm'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignInspectorModal;


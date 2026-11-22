import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  AlertCircle, 
  ShieldCheck 
} from 'lucide-react';

const StatusBadge = ({ status = '', label = '', size = 'md', className = '' }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const normalizedStatus = String(status).toUpperCase().trim();

  const getStatusConfig = () => {
    switch (normalizedStatus) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'COMPLETED':
      case 'PAID':
      case 'HOAT_DONG':
      case 'DA_DUYET':
      case 'DA_THANH_TOAN':
      case 'SUCCESS':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          defaultLabel: isEn ? 'Active' : 'Hoạt động',
        };

      case 'PENDING':
      case 'WAITING':
      case 'IN_PROGRESS':
      case 'CHO_DUYET':
      case 'CHO_XU_LY':
      case 'DANG_XU_LY':
        return {
          icon: Clock,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
          defaultLabel: isEn ? 'Pending' : 'Chờ duyệt',
        };

      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
      case 'OUT_OF_SLOTS':
      case 'TU_CHOI':
      case 'DA_HUY':
      case 'HET_CHO':
        return {
          icon: XCircle,
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-700',
          borderColor: 'border-rose-200',
          defaultLabel: isEn ? 'Rejected' : 'Đã từ chối',
        };

      case 'EXPIRED':
      case 'TERMINATED':
      case 'SUSPENDED':
      case 'HET_HAN':
      case 'CHAM_DUT':
      case 'TAM_DUNG':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
          defaultLabel: isEn ? 'Expired' : 'Hết hạn',
        };

      case 'VERIFIED':
      case 'DA_XAC_THUC':
        return {
          icon: ShieldCheck,
          bgColor: 'bg-neighbor-50',
          textColor: 'text-neighbor-700',
          borderColor: 'border-neighbor-200',
          defaultLabel: isEn ? 'Verified' : 'Đã xác thực',
        };

      default:
        return {
          icon: AlertCircle,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          defaultLabel: label || status || (isEn ? 'Undefined' : 'Chưa xác định'),
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;
  const displayText = label || config.defaultLabel;

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-2 font-semibold',
    lg: 'text-base px-3.5 py-1.5 gap-2.5 font-bold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border shrink-0 ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      <IconComponent className={`${iconSizes[size] || iconSizes.md} shrink-0`} />
      <span>{displayText}</span>
    </span>
  );
};

export default StatusBadge;

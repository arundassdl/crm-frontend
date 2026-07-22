import React from 'react';
import { useTheme } from '@mui/material/styles';
import FieldsListTab from './FieldsListTab';
import FieldPermissionTab from './FieldPermissionTab';

interface FieldsManagerProps {
    module: string;
    layoutRows?: { name: string; layout_name?: string }[];
}

const FieldsManager: React.FC<FieldsManagerProps> = ({ module, layoutRows }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [activeTab, setActiveTab] = React.useState<'list' | 'permissions'>('list');

    const subTabs: { key: 'list' | 'permissions'; label: string }[] = [
        { key: 'list', label: 'Field Listing' },
        { key: 'permissions', label: 'Field Permissions' },
    ];

    return (
        <div className="w-full pt-2">
            {/* Sub-tabs */}
            <div className={`flex items-center gap-1 mb-5 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E3ECFC]'}`}>
                {subTabs.map(st => {
                    const active = activeTab === st.key;
                    return (
                        <button
                            key={st.key}
                            onClick={() => setActiveTab(st.key)}
                            className={`px-4 py-2 text-[14px] font-semibold transition-all border-b-2 -mb-px ${
                                active
                                    ? 'border-[#1D4ED8] text-[#1D4ED8] bg-[#EFF6FF] dark:bg-[#111a33] rounded-t-md'
                                    : isDark
                                        ? 'border-transparent text-[#A1A1AA] hover:text-[#D4D4D8]'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {st.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'list' && (
                <FieldsListTab module={module} layoutRows={layoutRows} />
            )}

            {activeTab === 'permissions' && (
                <FieldPermissionTab module={module} layoutRows={layoutRows} />
            )}
        </div>
    );
};

export default FieldsManager;

import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface RolesViewProps {
  onBack: () => void;
  onSelectListener: () => void;
  onSelectOtherRole: (role: string) => void;
}

const ROLES = [
  { id: 'listener', label: 'Listener' },
  { id: 'artist', label: 'Artist' },
  { id: 'record_label', label: 'Record Label' },
  { id: 'manager', label: 'Manager' },
  { id: 'producer', label: 'Producer' },
  { id: 'publisher', label: 'Publisher' },
];

export const RolesView: React.FC<RolesViewProps> = ({
  onBack,
  onSelectListener,
  onSelectOtherRole,
}) => {
  return (
    <div className="w-full max-w-md mx-auto px-6 py-8 flex flex-col justify-center min-h-full text-white">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Choose your role</h1>
        <p className="text-sm text-neutral-400">
          Select what best describes your profile on JamiiSound.
        </p>
      </div>

      {/* Role list */}
      <div className="space-y-3">
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => {
              if (role.id === 'listener') {
                onSelectListener();
              } else {
                onSelectOtherRole(role.label);
              }
            }}
            className="w-full px-5 py-4 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-800 rounded-2xl flex items-center justify-between text-left transition-colors group"
          >
            <span className="font-medium text-white text-base">{role.label}</span>
            <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};

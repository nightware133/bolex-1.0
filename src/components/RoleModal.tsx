import { X, Check, Sparkles, Terminal, Brain, Zap, PenTool } from 'lucide-react';
import { PERSONA_ROLES } from '../constants';
import { PersonaRole } from '../types';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoleId: string;
  onSelectRole: (role: PersonaRole) => void;
}

const ICONS_MAP: Record<string, any> = {
  Sparkles,
  Terminal,
  Brain,
  Zap,
  PenTool,
};

export function RoleModal({
  isOpen,
  onClose,
  selectedRoleId,
  onSelectRole,
}: RoleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Select AI Persona</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tune system reasoning style and domain specialization
            </p>
          </div>
          <button
            id="close-role-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Roles List */}
        <div className="p-4 overflow-y-auto space-y-2.5">
          {PERSONA_ROLES.map((role) => {
            const isSelected = role.id === selectedRoleId;
            const Icon = ICONS_MAP[role.icon] || Sparkles;

            return (
              <button
                key={role.id}
                id={`select-role-${role.id}`}
                type="button"
                onClick={() => {
                  onSelectRole(role);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-xs'
                    : 'bg-neutral-850/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{role.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                      {role.badge}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="shrink-0 mt-1 text-amber-400">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

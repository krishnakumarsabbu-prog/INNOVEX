import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sparkles, ChevronRight, ChevronLeft, Check, X, Edit3,
  Loader2, Info, AlertTriangle, Lightbulb,
} from 'lucide-react';
import { copilotApi } from '../api/endpoints';
import type { AIRecommendation, AIContextCapability, AIEntityType } from '../types';

interface RecommendationState {
  [key: string]: 'pending' | 'accepted' | 'modified' | 'dismissed';
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600 bg-green-50';
  if (confidence >= 0.6) return 'text-amber-600 bg-amber-50';
  return 'text-gray-500 bg-gray-50';
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  return 'Low';
}

function parseContext(pathname: string, search: string): { entityType: AIEntityType | null; entityId: string | null } {
  const params = new URLSearchParams(search);
  const queryIdea = params.get('idea');
  const queryInnovation = params.get('innovation');
  const queryProject = params.get('project');

  const ideaMatch = pathname.match(/^\/ideas\/([^/]+)$/);
  if (ideaMatch) return { entityType: 'idea', entityId: ideaMatch[1] };

  const validationMatch = pathname.match(/^\/ideas\/([^/]+)\/validation$/);
  if (validationMatch) return { entityType: 'validation', entityId: validationMatch[1] };

  if (pathname === '/review' && queryIdea) {
    return { entityType: 'review', entityId: queryIdea };
  }

  const innovationMatch = pathname.match(/^\/innovation\/([^/]+)$/);
  if (innovationMatch) return { entityType: 'innovation', entityId: innovationMatch[1] };

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) return { entityType: 'project', entityId: projectMatch[1] };

  if (queryInnovation) return { entityType: 'innovation', entityId: queryInnovation };
  if (queryProject) return { entityType: 'project', entityId: queryProject };

  return { entityType: null, entityId: null };
}

export function IntelligencePanel() {
  const location = useLocation();
  const { entityType, entityId } = parseContext(location.pathname, location.search);
  const [isOpen, setIsOpen] = useState(true);
  const [recStates, setRecStates] = useState<RecommendationState>({});
  const [activeCapability, setActiveCapability] = useState<string | null>(null);

  const { data: capabilities, isLoading: capsLoading } = useQuery({
    queryKey: ['ai-context', entityType, entityId],
    queryFn: () => copilotApi.getContextCapabilities(entityType!, entityId!),
    enabled: !!entityType && !!entityId,
  staleTime: 60000,
  refetchOnWindowFocus: false,
  retry: false,
  });

  useEffect(() => {
    setActiveCapability(null);
    setRecStates({});
  }, [entityType, entityId]);

  const analyzeMutation = useMutation({
    mutationFn: ({ capability, et, eid }: { capability: string; et: AIEntityType; eid: string }) =>
      copilotApi.analyze(capability, et, eid),
    onSuccess: (recs, vars) => {
      const newStates: RecommendationState = {};
      recs.forEach((_, idx) => {
        newStates[`${vars.capability}-${idx}`] = 'pending';
      });
      setRecStates(newStates);
    },
  });

  const handleAnalyze = useCallback((capability: string) => {
    if (!entityType || !entityId) return;
    setActiveCapability(capability);
    analyzeMutation.mutate({ capability, et: entityType, eid: entityId });
  }, [entityType, entityId, analyzeMutation]);

  const setRecState = (key: string, state: 'accepted' | 'modified' | 'dismissed') => {
    setRecStates(prev => ({ ...prev, [key]: state }));
  };

  if (!entityType || !entityId) {
    return (
      <div className="hidden lg:block w-0" />
    );
  }

  const recommendations = analyzeMutation.data || [];
  const isLoading = analyzeMutation.isPending;

  return (
    <>
      {/* Toggle button when collapsed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-enterprise-charcoal text-white px-2 py-4 rounded-l-lg shadow-lg hover:bg-enterprise-charcoal/90 transition-colors flex flex-col items-center gap-1"
          aria-label="Open INNOVEX Intelligence"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-medium writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
            Intelligence
          </span>
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <aside className="hidden lg:flex flex-col w-80 bg-white border-l border-enterprise-gray-border sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-enterprise-charcoal text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-enterprise-gold" />
              <div>
                <h2 className="text-sm font-semibold tracking-wide">INNOVEX Intelligence</h2>
                <p className="text-[10px] text-white/60">AI-assisted recommendations</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white p-1 rounded transition-colors"
              aria-label="Collapse panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Governance notice */}
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 flex items-start gap-1.5">
            <Info className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-amber-700 leading-snug">
              Recommendations are advisory. All decisions require human approval.
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Capabilities */}
            {!activeCapability && (
              <div className="p-3">
                {capsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-enterprise-charcoal/30 animate-spin" />
                  </div>
                ) : capabilities && capabilities.length > 0 ? (
                  <>
                    <p className="text-xs text-enterprise-charcoal/60 mb-3 px-1">
                      Select an analysis to run for this {entityType}:
                    </p>
                    <div className="space-y-1.5">
                      {capabilities.map((cap: AIContextCapability) => (
                        <button
                          key={cap.capability}
                          onClick={() => handleAnalyze(cap.capability)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-enterprise-gray-border bg-white hover:border-enterprise-red/30 hover:bg-enterprise-gray-warm transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-enterprise-red/5 flex items-center justify-center group-hover:bg-enterprise-red/10 transition-colors">
                              <Lightbulb className="w-3.5 h-3.5 text-enterprise-red" />
                            </div>
                            <span className="text-sm font-medium text-enterprise-charcoal">{cap.label}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-enterprise-charcoal/30 group-hover:text-enterprise-red/50 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 px-4">
                    <Info className="w-6 h-6 text-enterprise-charcoal/20 mx-auto mb-2" />
                    <p className="text-xs text-enterprise-charcoal/50">
                      No AI analysis available for this page.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Analysis results */}
            {activeCapability && (
              <div className="p-3">
                <button
                  onClick={() => setActiveCapability(null)}
                  className="flex items-center gap-1 text-xs text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-3 transition-colors"
                >
                  <ChevronRight className="w-3 h-3 rotate-180" />
                  Back to actions
                </button>

                <h3 className="text-sm font-semibold text-enterprise-charcoal mb-3 capitalize">
                  {activeCapability.replace(/_/g, ' ')}
                </h3>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-enterprise-red animate-spin mb-2" />
                    <p className="text-xs text-enterprise-charcoal/50">Analyzing...</p>
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((rec: AIRecommendation, idx: number) => {
                      const key = `${activeCapability}-${idx}`;
                      const state = recStates[key] || 'pending';
                      return (
                        <RecommendationCard
                          key={key}
                          rec={rec}
                          state={state}
                          onAccept={() => setRecState(key, 'accepted')}
                          onModify={() => setRecState(key, 'modified')}
                          onDismiss={() => setRecState(key, 'dismissed')}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-6 h-6 text-enterprise-charcoal/20 mx-auto mb-2" />
                    <p className="text-xs text-enterprise-charcoal/50">No recommendations returned.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-enterprise-gray-border bg-enterprise-gray-warm">
            <p className="text-[10px] text-enterprise-charcoal/40 text-center">
              INNOVEX Intelligence does not make decisions.
            </p>
          </div>
        </aside>
      )}
    </>
  );
}

function RecommendationCard({
  rec,
  state,
  onAccept,
  onModify,
  onDismiss,
}: {
  rec: AIRecommendation;
  state: string;
  onAccept: () => void;
  onModify: () => void;
  onDismiss: () => void;
}) {
  const stateStyles: Record<string, string> = {
    pending: '',
    accepted: 'border-green-200 bg-green-50/50',
    modified: 'border-blue-200 bg-blue-50/50',
    dismissed: 'border-gray-200 bg-gray-50 opacity-60',
  };

  const stateBadge: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pending', class: 'bg-gray-100 text-gray-500' },
    accepted: { label: 'Accepted', class: 'bg-green-100 text-green-700' },
    modified: { label: 'Modified', class: 'bg-blue-100 text-blue-700' },
    dismissed: { label: 'Dismissed', class: 'bg-gray-100 text-gray-400' },
  };

  const badge = stateBadge[state] || stateBadge.pending;

  return (
    <div className={`rounded-md border border-enterprise-gray-border p-3 transition-all ${stateStyles[state] || ''}`}>
      {/* Confidence badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${confidenceColor(rec.confidence)}`}>
          {confidenceLabel(rec.confidence)} confidence
        </span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.class}`}>
          {badge.label}
        </span>
      </div>

      {/* Recommendation */}
      <p className="text-sm text-enterprise-charcoal font-medium leading-snug mb-2">
        {rec.recommendation}
      </p>

      {/* Reason */}
      <div className="mb-2">
        <p className="text-[10px] font-semibold text-enterprise-charcoal/50 uppercase tracking-wide mb-0.5">Reason</p>
        <p className="text-xs text-enterprise-charcoal/70 leading-relaxed">{rec.reason}</p>
      </div>

      {/* Evidence */}
      <div className="mb-2">
        <p className="text-[10px] font-semibold text-enterprise-charcoal/50 uppercase tracking-wide mb-0.5">Evidence</p>
        <p className="text-xs text-enterprise-charcoal/70 leading-relaxed">{rec.evidence}</p>
      </div>

      {/* Items */}
      {rec.items && rec.items.length > 0 && (
        <div className="mb-3 mt-2 pt-2 border-t border-enterprise-gray-border">
          <ul className="space-y-1">
            {rec.items.slice(0, 5).map((item, i) => (
              <li key={i} className="text-xs text-enterprise-charcoal/60 flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-enterprise-red mt-1.5 flex-shrink-0" />
                <span>{formatItem(item)}</span>
              </li>
            ))}
            {rec.items.length > 5 && (
              <li className="text-[10px] text-enterprise-charcoal/40 pl-2.5">
                +{rec.items.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Actions */}
      {state === 'pending' && (
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-enterprise-gray-border">
          <button
            onClick={onAccept}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors"
          >
            <Check className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={onModify}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
          >
            <Edit3 className="w-3 h-3" /> Modify
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded transition-colors ml-auto"
          >
            <X className="w-3 h-3" /> Dismiss
          </button>
        </div>
      )}

      {/* Accepted/Modified indicator */}
      {state === 'accepted' && (
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-green-100">
          <Check className="w-3 h-3 text-green-600" />
          <span className="text-[11px] text-green-700 font-medium">Recommendation accepted</span>
        </div>
      )}
      {state === 'modified' && (
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-blue-100">
          <Edit3 className="w-3 h-3 text-blue-600" />
          <span className="text-[11px] text-blue-700 font-medium">Marked for modification</span>
        </div>
      )}
      {state === 'dismissed' && (
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
          <X className="w-3 h-3 text-gray-400" />
          <span className="text-[11px] text-gray-500 font-medium">Dismissed</span>
        </div>
      )}
    </div>
  );
}

function formatItem(item: Record<string, unknown>): string {
  const keys = ['question', 'item', 'guideline', 'point', 'risk', 'title', 'technology', 'dependency', 'field', 'role_title'];
  for (const k of keys) {
    if (item[k]) return String(item[k]);
  }
  const values = Object.values(item).filter(v => typeof v === 'string' || typeof v === 'number');
  return values.length > 0 ? String(values[0]) : JSON.stringify(item);
}

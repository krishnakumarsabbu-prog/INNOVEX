import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, ArrowRight, Check, Lightbulb, Code, Wrench,
  FileText, Eye, Send, Plus, X,
} from 'lucide-react';
import { ideaApi, userApi } from '../api/endpoints';
import { Loading, ErrorState } from '../components/ui';
import type { User } from '../types';

const STEPS = [
  { id: 1, label: 'Problem', icon: Lightbulb },
  { id: 2, label: 'Solution', icon: Wrench },
  { id: 3, label: 'Technology', icon: Code },
  { id: 4, label: 'Delivery', icon: FileText },
  { id: 5, label: 'Supporting Material', icon: Eye },
  { id: 6, label: 'Review', icon: Check },
  { id: 7, label: 'Submit', icon: Send },
];

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(300, 'Title must be under 300 characters'),
  problem_statement: z.string().min(1, 'Problem statement is required'),
  proposed_solution: z.string().min(1, 'Proposed solution is required'),
  business_impact: z.string().optional().default(''),
  engineering_impact: z.string().optional().default(''),
  expected_benefits: z.string().optional().default(''),
  business_area: z.string().optional().default(''),
  technologies: z.array(z.string()).default([]),
  dependencies: z.string().optional().default(''),
  risks: z.string().optional().default(''),
  estimated_complexity: z.string().optional().default(''),
  estimated_duration: z.string().optional().default(''),
  founder_id: z.string().min(1, 'Founder is required'),
});

type FormData = z.infer<typeof schema>;

const COMPLEXITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export function NewIdeaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [techInput, setTechInput] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [createdIdeaId, setCreatedIdeaId] = useState<string | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', problem_statement: '', proposed_solution: '',
      business_impact: '', engineering_impact: '', expected_benefits: '',
      business_area: '', technologies: [], dependencies: '', risks: '',
      estimated_complexity: '', estimated_duration: '', founder_id: '',
    },
    mode: 'onChange',
  });

  const technologies = watch('technologies');

  const createMutation = useMutation({
    mutationFn: (data: FormData) => ideaApi.create(data),
    onSuccess: (idea) => {
      setCreatedIdeaId(idea.id);
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => {
      setSubmitError(e instanceof Error ? e.message : 'Failed to create idea');
      setStep(1);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (ideaId: string) => ideaApi.submit(ideaId, watch('founder_id')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/ideas/${createdIdeaId}`);
    },
    onError: (e) => {
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit idea');
    },
  });

  const addTechnology = () => {
    const t = techInput.trim();
    if (t && !technologies.includes(t)) {
      setValue('technologies', [...technologies, t]);
    }
    setTechInput('');
  };

  const removeTechnology = (t: string) => {
    setValue('technologies', technologies.filter((x) => x !== t));
  };

  const validateStep = async (stepNum: number): Promise<boolean> => {
    const fields: (keyof FormData)[] = [];
    if (stepNum === 1) fields.push('title', 'problem_statement');
    if (stepNum === 2) fields.push('proposed_solution');
    if (stepNum === 4) fields.push('founder_id');
    if (fields.length === 0) return true;
    return await trigger(fields);
  };

  const next = async () => {
    const valid = await validateStep(step);
    if (valid) setStep((s) => Math.min(s + 1, 7));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = (data: FormData) => {
    setSubmitError('');
    createMutation.mutate(data);
  };

  const handleFinalSubmit = () => {
    if (createdIdeaId) {
      submitMutation.mutate(createdIdeaId);
    }
  };

  if (usersLoading) return <Loading />;

  const formValues = watch();

  return (
    <div>
      <Link to="/ideas" className="flex items-center gap-1 text-sm text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Ideas
      </Link>

      <h1 className="text-2xl font-bold text-enterprise-charcoal mb-1">Submit a New Idea</h1>
      <p className="text-sm text-enterprise-charcoal/60 mb-6">Complete each step to submit your idea for review.</p>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8 max-w-3xl">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-enterprise-red text-white shadow-md' :
                    isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-enterprise-red font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-16 mx-1 sm:mx-2 ${step > s.id ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-6 max-w-3xl">
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Step 1: Problem */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="section-title">Step 1: Problem</h2>
            <div>
              <label className="label">Title <span className="text-red-500">*</span></label>
              <input {...register('title')} className="input" placeholder="Enter a clear, concise title" />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="label">Problem Statement <span className="text-red-500">*</span></label>
              <textarea {...register('problem_statement')} className="input min-h-[120px]" placeholder="What problem does this idea solve? Who is affected?" />
              {errors.problem_statement && <p className="text-xs text-red-600 mt-1">{errors.problem_statement.message}</p>}
            </div>
            <div>
              <label className="label">Business Area</label>
              <input {...register('business_area')} className="input" placeholder="e.g. Engineering, Operations, Finance" />
            </div>
          </div>
        )}

        {/* Step 2: Solution */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="section-title">Step 2: Solution</h2>
            <div>
              <label className="label">Proposed Solution <span className="text-red-500">*</span></label>
              <textarea {...register('proposed_solution')} className="input min-h-[120px]" placeholder="How do you propose to solve this problem?" />
              {errors.proposed_solution && <p className="text-xs text-red-600 mt-1">{errors.proposed_solution.message}</p>}
            </div>
            <div>
              <label className="label">Business Impact</label>
              <textarea {...register('business_impact')} className="input min-h-[80px]" placeholder="What is the expected business impact?" />
            </div>
            <div>
              <label className="label">Engineering Impact</label>
              <textarea {...register('engineering_impact')} className="input min-h-[80px]" placeholder="What is the expected engineering impact?" />
            </div>
            <div>
              <label className="label">Expected Benefits</label>
              <textarea {...register('expected_benefits')} className="input min-h-[80px]" placeholder="What benefits do you expect?" />
            </div>
          </div>
        )}

        {/* Step 3: Technology */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="section-title">Step 3: Technology</h2>
            <div>
              <label className="label">Technologies</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTechnology(); } }}
                  className="input"
                  placeholder="Add a technology and press Enter"
                />
                <button type="button" onClick={addTechnology} className="btn-secondary">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {technologies.map((t) => (
                    <span key={t} className="badge bg-blue-100 text-blue-800 flex items-center gap-1">
                      {t}
                      <button type="button" onClick={() => removeTechnology(t)} className="ml-1 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label">Dependencies</label>
              <textarea {...register('dependencies')} className="input min-h-[80px]" placeholder="What does this idea depend on?" />
            </div>
            <div>
              <label className="label">Risks</label>
              <textarea {...register('risks')} className="input min-h-[80px]" placeholder="What are the key risks?" />
            </div>
          </div>
        )}

        {/* Step 4: Delivery */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="section-title">Step 4: Delivery</h2>
            <div>
              <label className="label">Estimated Complexity</label>
              <select {...register('estimated_complexity')} className="input">
                <option value="">Select complexity...</option>
                {COMPLEXITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estimated Duration</label>
              <input {...register('estimated_duration')} className="input" placeholder="e.g. 3 months, 2 weeks" />
            </div>
            <div>
              <label className="label">Founder <span className="text-red-500">*</span></label>
              <select {...register('founder_id')} className="input">
                <option value="">Select founder...</option>
                {users?.map((u: User) => <option key={u.id} value={u.id}>{u.name} - {u.email}</option>)}
              </select>
              {errors.founder_id && <p className="text-xs text-red-600 mt-1">{errors.founder_id.message}</p>}
            </div>
          </div>
        )}

        {/* Step 5: Supporting Material */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="section-title">Step 5: Supporting Material</h2>
            <p className="text-sm text-enterprise-charcoal/60">
              Supporting evidence and documents can be added after the idea is created.
              Review your idea details on the next step before submitting.
            </p>
            <div className="bg-enterprise-gray-warm rounded-md p-4 text-sm text-enterprise-charcoal/70">
              <p className="font-medium mb-1">What you can add later:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Links to documents, diagrams, or prototypes</li>
                <li>Supporting evidence for your claims</li>
                <li>References to related ideas or projects</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="section-title">Step 6: Review</h2>
            <div className="space-y-3">
              <ReviewField label="Title" value={formValues.title} />
              <ReviewField label="Problem Statement" value={formValues.problem_statement} multiline />
              <ReviewField label="Proposed Solution" value={formValues.proposed_solution} multiline />
              <ReviewField label="Business Impact" value={formValues.business_impact} multiline />
              <ReviewField label="Engineering Impact" value={formValues.engineering_impact} multiline />
              <ReviewField label="Expected Benefits" value={formValues.expected_benefits} multiline />
              <ReviewField label="Business Area" value={formValues.business_area} />
              <div>
                <span className="text-sm font-medium text-enterprise-charcoal/70">Technologies</span>
                {formValues.technologies.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formValues.technologies.map((t) => (
                      <span key={t} className="badge bg-blue-100 text-blue-800">{t}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-enterprise-charcoal/40 mt-1">None specified</p>
                )}
              </div>
              <ReviewField label="Dependencies" value={formValues.dependencies} multiline />
              <ReviewField label="Risks" value={formValues.risks} multiline />
              <ReviewField label="Estimated Complexity" value={formValues.estimated_complexity} />
              <ReviewField label="Estimated Duration" value={formValues.estimated_duration} />
              <ReviewField label="Founder" value={users?.find((u) => u.id === formValues.founder_id)?.name || ''} />
            </div>
          </div>
        )}

        {/* Step 7: Submit */}
        {step === 7 && (
          <div className="space-y-4 text-center py-4">
            <h2 className="section-title">Step 7: Submit</h2>
            {!createdIdeaId && (
              <>
                <p className="text-sm text-enterprise-charcoal/70">
                  Click "Create Draft" to save your idea as a draft. You can submit it for review after.
                </p>
                <button
                  onClick={handleSubmit(onSubmit)}
                  className="btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Draft'}
                </button>
              </>
            )}
            {createdIdeaId && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-enterprise-charcoal">Draft Created Successfully</p>
                <p className="text-sm text-enterprise-charcoal/60">
                  Your idea has been saved as a draft. Submit it now for review, or keep it as a draft.
                </p>
                <div className="flex gap-2 justify-center mt-4">
                  <button
                    onClick={() => navigate(`/ideas/${createdIdeaId}`)}
                    className="btn-secondary"
                  >
                    View Idea
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    className="btn-primary"
                    disabled={submitMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                    {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        {step < 7 && (
          <div className="flex justify-between mt-6 pt-4 border-t border-enterprise-gray-border">
            <button onClick={prev} className="btn-secondary" disabled={step <= 1}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={next} className="btn-primary">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <span className="text-sm font-medium text-enterprise-charcoal/70">{label}</span>
      {value ? (
        <p className={`text-sm text-enterprise-charcoal mt-0.5 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
      ) : (
        <p className="text-sm text-enterprise-charcoal/40 mt-0.5">Not specified</p>
      )}
    </div>
  );
}

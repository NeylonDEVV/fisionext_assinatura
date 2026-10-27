"use client";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { saveAdmission } from "@/actions-patient";
import { bmi, type FieldDef, type StepDef } from "@/lib/specialties";

type Props = {
  patientId: string; steps: StepDef[]; services: Record<string, { label: string }>; initial: Record<string, string>;
  consentText: string; consentChecked: boolean; submitLabel: string; bmi?: { weight: string; height: string };
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn disabled:opacity-60" disabled={pending}>{pending ? "Salvando..." : label}</button>;
}

export function AdmissionWizard({ patientId, steps, services, initial, consentText, consentChecked, submitLabel, bmi: bmiKeys }: Props) {
  const [state, action] = useFormState(saveAdmission, undefined);
  const [step, setStep] = useState(0);
  const [scales, setScales] = useState<Record<string, number>>(() => {
    const o: Record<string, number> = {};
    for (const s of steps) for (const f of s.fields) if (f.type === "scale") o[f.key] = Number(initial[f.key] ?? Math.round(((f.min ?? 0) + (f.max ?? 10)) / 2));
    return o;
  });
  const [body, setBody] = useState({ w: initial[bmiKeys?.weight ?? ""] ?? "", h: initial[bmiKeys?.height ?? ""] ?? "" });
  const ref = useRef<HTMLFormElement>(null);

  function go(to: number) {
    if (to > step) {
      const panel = ref.current?.querySelector(`[data-step="${step}"]`);
      const fields = Array.from(panel?.querySelectorAll<HTMLInputElement>("input, select, textarea") ?? []);
      for (const el of fields) if (!el.checkValidity()) { el.reportValidity(); return; }
    }
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const field = (f: FieldDef) => {
    const d = initial[f.key] ?? "";
    const wide = f.type === "textarea" || f.type === "scale";
    const label = <label className="label" htmlFor={f.key}>{f.label}{f.required && " *"}</label>;
    let control: React.ReactNode;
    if (f.type === "textarea") control = <textarea id={f.key} name={f.key} rows={f.rows ?? 3} required={f.required} defaultValue={d} placeholder={f.placeholder} className="input" />;
    else if (f.type === "number") control = (
      <input id={f.key} name={f.key} type="number" step={f.step ?? 1} min={f.min} max={f.max} required={f.required} defaultValue={d} className="input"
        onChange={(e) => { if (f.key === bmiKeys?.weight) setBody((b) => ({ ...b, w: e.target.value })); if (f.key === bmiKeys?.height) setBody((b) => ({ ...b, h: e.target.value })); }} />
    );
    else if (f.type === "scale") return (
      <div key={f.key} className="sm:col-span-2">
        <label className="label" htmlFor={f.key}>{f.label}: <b className="text-brand-600">{scales[f.key]}{f.unit}</b></label>
        <input id={f.key} name={f.key} type="range" min={f.min} max={f.max} step={f.step} value={scales[f.key]} onChange={(e) => setScales((s) => ({ ...s, [f.key]: Number(e.target.value) }))} className="w-full accent-brand-500" />
      </div>
    );
    else if (f.type === "select") control = <select id={f.key} name={f.key} defaultValue={d} className="input"><option value="">—</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>;
    else if (f.type === "service") control = <select id={f.key} name={f.key} defaultValue={d || Object.keys(services)[0]} className="input">{Object.entries(services).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>;
    else control = <input id={f.key} name={f.key} required={f.required} defaultValue={d} placeholder={f.placeholder} className="input" />;
    return <div key={f.key} className={wide ? "sm:col-span-2" : ""}>{label}{control}</div>;
  };

  const imc = bmiKeys ? bmi(Number(body.w), Number(body.h)) : null;

  return (
    <form ref={ref} action={action} onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault(); }}>
      <input type="hidden" name="patientId" value={patientId} />
      <div className="mb-6">
        <div className="mb-3 flex gap-2">
          {steps.map((s, i) => (
            <button type="button" key={s.title} onClick={() => go(i)} className={`flex-1 text-left text-xs font-semibold transition ${i <= step ? "text-brand-700" : "text-ink-400"}`}>
              <span className="block">{i + 1}. {s.title}</span>
            </button>
          ))}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
          <motion.div className="h-full rounded-full bg-brand-500" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 28 }} />
        </div>
      </div>

      <div className="card p-6">
        {steps.map((s, i) => (
          <div key={s.title} data-step={i} hidden={step !== i} className="step-in">
            <div className="grid gap-4 sm:grid-cols-2">{s.fields.map(field)}</div>
            {bmiKeys && s.fields.some((f) => f.key === bmiKeys.weight) && (
              <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">IMC: <b className="text-ink-900">{imc !== null ? String(imc).replace(".", ",") : "informe peso e altura"}</b></p>
            )}
            {i === steps.length - 1 && (
              <label className="mt-5 flex items-start gap-3 rounded-xl bg-ink-50 p-4 text-sm">
                <input type="checkbox" name="consent" required defaultChecked={consentChecked} className="mt-0.5 h-4 w-4 accent-brand-500" />
                <span>{consentText} *</span>
              </label>
            )}
          </div>
        ))}
      </div>

      {state?.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <div className="mt-5 flex justify-between">
        <button type="button" onClick={() => go(step - 1)} className={`btn-ghost ${step === 0 ? "invisible" : ""}`}>Voltar</button>
        {step < steps.length - 1 ? <button type="button" onClick={() => go(step + 1)} className="btn">Continuar</button> : <Submit label={submitLabel} />}
      </div>
    </form>
  );
}

"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronRight, Zap, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface QaLibraryProps {
  onSelectQuestion: (question: string) => void;
  onClose?: () => void;
}

export function QaLibraryPanel({ onSelectQuestion, onClose }: QaLibraryProps) {
  const t = useTranslations("Bfxps.qa");

  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    3: true,
  });

  const QA_CATEGORIES = [
    {
      title: t("cat_core"),
      defaultOpen: true,
      questions: [
        { label: t("q_today_label"), q: t("q_today_text") },
        { label: t("q_current_label"), q: t("q_current_text") },
        { label: t("q_r5_label"), q: t("q_r5_text") },
        { label: t("q_range_label"), q: t("q_range_text") },
        { label: t("q_filled_label"), q: t("q_filled_text") },
        { label: t("q_v44_label"), q: t("q_v44_text") },
      ],
    },
    {
      title: t("cat_v44"),
      defaultOpen: true,
      questions: [
        { label: t("q_v44_long_label"), q: t("q_v44_long_text") },
        { label: t("q_v44_short_label"), q: t("q_v44_short_text") },
        { label: t("q_v44_train_label"), q: t("q_v44_train_text") },
        { label: t("q_v44_stmt_label"), q: t("q_v44_stmt_text") },
      ],
    },
    {
      title: t("cat_tp_sl"),
      defaultOpen: false,
      questions: [
        { label: t("q_cutloss_label"), q: t("q_cutloss_text") },
        { label: t("q_sl_label"), q: t("q_sl_text") },
        { label: t("q_tp_label"), q: t("q_tp_text") },
        { label: t("q_flip_label"), q: t("q_flip_text") },
        { label: t("q_review_label"), q: t("q_review_text") },
      ],
    },
    {
      title: t("cat_perf"),
      defaultOpen: true,
      questions: [
        { label: t("q_pnl30d_label"), q: t("q_pnl30d_text") },
        { label: t("q_perf30s_label"), q: t("q_perf30s_text") },
        { label: t("q_fresh_label"), q: t("q_fresh_text") },
        { label: t("q_source_label"), q: t("q_source_text") },
      ],
    },
  ];

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0b0f17] text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-sky-400" />
          <b className="text-xs font-black tracking-wider uppercase text-white">{t("title")}</b>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">{t("click_to_run")}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title={t("close")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {QA_CATEGORIES.map((cat, idx) => {
          const isOpen = !!openSections[idx];
          return (
            <div
              key={idx}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleSection(idx)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold text-slate-200 hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <span>{cat.title}</span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="grid grid-cols-1 gap-1.5 p-2 border-t border-white/[0.06] bg-black/20">
                  {cat.questions.map((qItem, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => onSelectQuestion(qItem.q)}
                      className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-left text-[11px] text-slate-300 transition-all hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-300 cursor-pointer"
                    >
                      <span className="font-medium leading-normal">{qItem.label}</span>
                      <Zap className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-amber-400 transition-all shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

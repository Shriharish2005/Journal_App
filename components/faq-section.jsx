"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { HelpCircle } from "lucide-react";
import faqs from "@/data/faqs.json";

export default function FAQSection() {
  return (
    <section id="faq" className="mt-28 max-w-4xl mx-auto px-4">
      <div className="text-center space-y-2 mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-600 bg-orange-100/80 px-3 py-1 rounded-full">
          Frequently Asked Questions
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-orange-950 tracking-tight">
          Everything You Need to Know
        </h2>
        <p className="text-stone-600 text-sm md:text-base max-w-md mx-auto">
          Have questions about security, mood insights, or how Reflct works? Here are common answers.
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-orange-200/70 shadow-sm">
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-orange-100 rounded-2xl px-5 bg-orange-50/20 hover:bg-orange-50/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-base md:text-lg text-orange-950 py-4 hover:no-underline">
                <span className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-black flex items-center justify-center">
                    ?
                  </span>
                  {faq.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-stone-600 text-sm md:text-base leading-relaxed pl-9 pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

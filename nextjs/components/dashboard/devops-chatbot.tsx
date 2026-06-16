"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  actions?: { label: string; action: string }[];
}

export function DevopsChatbot({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Hello! I am LepoS DevOps Copilot. I can help you manage your edge proxy, analyze WAF alerts, trigger failovers, or inspect CDC replication. Try clicking one of the shortcuts below!",
      timestamp: new Date().toLocaleTimeString(),
      actions: [
        { label: "Check anycast POP status", action: "pop_status" },
        { label: "Purge homepage cache", action: "purge_cache" },
        { label: "Simulate CDC Event", action: "cdc_simulate" }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleActionClick = (action: string, label: string) => {
    handleUserMessage(`Action: ${label}`, action);
  };

  const handleUserMessage = async (text: string, actionKey?: string) => {
    if (!text.trim() && !actionKey) return;
    
    const newMsg: ChatMessage = {
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);

    const key = actionKey || text.toLowerCase();
    let replyText = "I parsed your query but couldn't execute it directly. Try checking failover settings or reviewing plugin reviews.";
    let actionsList: { label: string; action: string }[] | undefined = undefined;

    if (key.includes("pop") || key.includes("failover")) {
      replyText = "DNS Anycast routes are optimal. Singapore (ap-southeast-1) resolved in 15ms. US East (us-east-1) in 12ms. Outage simulator shows all zones healthy.";
      actionsList = [
        { label: "Simulate Outage on US-East", action: "simulate_outage" }
      ];
    } else if (key.includes("purge") || key.includes("cache")) {
      replyText = "Edge cache invalidation triggered successfully. Purged keys: 1 path key. Etag tags invalidated recursively.";
      actionsList = [
        { label: "Check cache health", action: "cache_health" }
      ];
    } else if (key.includes("cdc") || key.includes("replicate")) {
      replyText = "CDC Event Replication simulation requested. Injected INSERT transaction on table 'UserSession'. Synchronizing replicas in ap-southeast-1, us-east-1, eu-west-1. Estimated sync lag: 18ms.";
    } else if (key.includes("error") || key.includes("crash")) {
      replyText = "Parsed crash log logs. Found 1 recurrent error group under fingerprint 'TypeError: Cannot read properties of undefined'. Mapped code snippet visualizer is active.";
    } else {
      replyText = `Copilot understood: "${text}". I have scheduled background health check telemetry. Core Web Vitals health score is currently at 94/100 (Good).`;
    }

    setMessages(prev => [...prev, {
      sender: "bot",
      text: replyText,
      timestamp: new Date().toLocaleTimeString(),
      actions: actionsList
    }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="size-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl flex items-center justify-center border border-indigo-400/30 transition transform hover:scale-105 duration-200"
        >
          <MessageSquare className="size-5" />
          <span className="absolute -top-1 -right-1 flex size-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card className="w-[360px] h-[480px] bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">
          <CardHeader className="bg-slate-950 p-4 border-b border-slate-800/80 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                <Bot className="size-4 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  DevOps Copilot
                  <Sparkles className="size-3 text-indigo-400 animate-pulse" />
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-400">Active telemetry AI assistant</CardDescription>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="size-6 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div className={`p-1.5 rounded-full size-7 flex items-center justify-center shrink-0 ${
                  msg.sender === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 text-indigo-400 border border-slate-700"
                }`}>
                  {msg.sender === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-slate-950 border border-slate-850 text-slate-200 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                  
                  {/* Actions / Shortcuts */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleActionClick(act.action, act.label)}
                          className="text-[9px] font-semibold bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 px-2 py-1 rounded transition flex items-center gap-1"
                        >
                          {act.label}
                          <ArrowRight className="size-2.5" />
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="text-[8px] text-slate-500 font-mono self-start">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="p-1.5 rounded-full size-7 bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
                  <Bot className="size-3.5" />
                </div>
                <div className="bg-slate-950 border border-slate-850 text-slate-400 rounded-xl rounded-tl-none px-3 py-2 text-xs flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  Copilot is processing...
                </div>
              </div>
            )}
          </CardContent>

          {/* Chat input form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleUserMessage(inputValue);
            }}
            className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything or simulate DevOps actions..."
              className="h-8 text-xs bg-slate-900 border-slate-800 text-slate-200 focus:ring-indigo-500 placeholder-slate-500"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="size-8 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 cursor-pointer"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

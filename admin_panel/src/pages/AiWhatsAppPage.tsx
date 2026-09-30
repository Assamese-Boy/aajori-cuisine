import React, { useState } from 'react';
import { Bot, MessageSquare, Send, Sparkles, Terminal, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api';

export const AiWhatsAppPage: React.FC = () => {
  const [userPrompt, setUserPrompt] = useState('I want something spicy for 2 people under ₹500');
  const [aiResult, setAiResult] = useState<any>(null);
  const [whatsAppHistory, setWhatsAppHistory] = useState<
    Array<{ sender: 'user' | 'bot'; text: string; time: string }>
  >([
    {
      sender: 'bot',
      text: '👋 *Welcome to Aajori Cuisine!* Hyperlocal food delivery for Kamrup.\nType *Menu* or ask e.g. "Duck curry under ₹400"!',
      time: '12:00 PM',
    },
  ]);
  const [waInput, setWaInput] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingWa, setLoadingWa] = useState(false);

  const testAiAssistant = async () => {
    if (!userPrompt.trim()) return;
    setLoadingAi(true);
    try {
      const res = await apiRequest('/ai/recommend', {
        method: 'POST',
        body: JSON.stringify({ message: userPrompt }),
      });
      if (res.success) {
        setAiResult(res.data);
      }
    } finally {
      setLoadingAi(false);
    }
  };

  const sendWhatsAppMessage = async () => {
    if (!waInput.trim()) return;
    const msg = waInput;
    setWaInput('');

    const newHistory = [
      ...whatsAppHistory,
      { sender: 'user' as const, text: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ];
    setWhatsAppHistory(newHistory);

    setLoadingWa(true);
    try {
      const res = await apiRequest('/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify({
          from: '+919864000020',
          message: msg,
        }),
      });
      if (res.success && res.data?.reply) {
        setWhatsAppHistory([
          ...newHistory,
          {
            sender: 'bot',
            text: res.data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } finally {
      setLoadingWa(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">AI Assistant & WhatsApp Hub</h2>
        <p className="text-sm text-slate-500">
          Live simulation and verification of intent extraction, MCP tools & conversational food commerce
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: AI Food Assistant & Structured Intent Parser */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-base">AI Meal Assistant Sandbox</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customer Natural Language Prompt
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="e.g. Find duck curry for 2 people under ₹500"
                className="flex-1 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={testAiAssistant}
                disabled={loadingAi}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {loadingAi ? 'Analyzing...' : 'Resolve Intent'}
              </button>
            </div>
          </div>

          {/* Quick preset suggestions */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              'I want something spicy for 2 people under ₹500',
              'Duck curry with black sesame under ₹400',
              'Pure vegetarian thali with Joha rice',
              'Luchi and aloo dum quick snacks',
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setUserPrompt(preset)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 text-[11px]"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Structured Intent Debug Output */}
          {aiResult && (
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Structured Intent Extracted
                </h4>
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono">
                  <pre>{JSON.stringify(aiResult.intent, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Database Grounded Recommendations (No Hallucinations)
                </h4>
                <div className="space-y-2">
                  {aiResult.suggestions?.map((sug: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{sug.restaurant.name}</span>
                        <span className="font-mono font-bold text-brand-700">
                          Total: ₹{sug.comboTotal}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {sug.items.map((it: any) => (
                          <div key={it.id} className="flex justify-between py-0.5">
                            <span>• {it.name}</span>
                            <span className="font-mono">₹{it.price}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-amber-700 italic border-t border-slate-200 pt-1">
                        {sug.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: WhatsApp Ordering Sandbox Simulator */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col h-[650px]">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">
              WhatsApp Cloud API Conversation Simulator
            </h3>
          </div>

          <div className="flex-1 bg-emerald-50/40 rounded-xl border border-emerald-100 p-4 overflow-y-auto space-y-3">
            {whatsAppHistory.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  item.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm whitespace-pre-line ${
                    item.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                  }`}
                >
                  {item.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{item.time}</span>
              </div>
            ))}
          </div>

          {/* Inbound Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={waInput}
              onChange={(e) => setWaInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendWhatsAppMessage()}
              placeholder="Type message (e.g. '1', 'menu', 'track', 'duck curry')..."
              className="flex-1 px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={sendWhatsAppMessage}
              disabled={loadingWa}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

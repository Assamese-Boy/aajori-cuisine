import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Plus,
  Bot,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PROMPTS = [
  'Grand Assamese dinner for 3 under ₹1000',
  'Spicy smoked pork and duck combo for 2',
  'Parampara non-veg thali with Masor Tenga',
  'Light vegetarian lunch with Joha rice',
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { addItem, openCart } = useCart();
  const toast = useToast();

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [parsedIntent, setParsedIntent] = useState<any>(null);
  const [hasQueried, setHasQueried] = useState(false);

  // Do NOT return null here so that entrance/exit CSS transitions run smoothly

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    setHasQueried(true);
    try {
      const [recRes, intentRes] = await Promise.all([
        apiRequest<{ combos: any[]; reasoning: string }>('/ai/recommend', {
          method: 'POST',
          body: JSON.stringify({ message: queryText }),
        }),
        apiRequest<any>('/ai/parse-intent', {
          method: 'POST',
          body: JSON.stringify({ message: queryText }),
        }),
      ]);

      if (recRes.success && recRes.data) {
        setRecommendations(recRes.data.combos || []);
      } else {
        setRecommendations([]);
      }

      if (intentRes.success && intentRes.data) {
        setParsedIntent(intentRes.data);
      }
    } catch (e: any) {
      toast.error('AI Error', e.message || 'Could not query food advisor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(message);
  };

  const handleAddComboToCart = (combo: any) => {
    const restaurant = {
      id: combo.restaurantId || 'd0000000-0000-0000-0000-000000000001',
      name: combo.restaurantName || 'Khorikaa Ethnic Kitchen',
    };

    let count = 0;
    for (const item of combo.items || []) {
      addItem(
        restaurant,
        {
          id: item.id || item.menuItemId,
          restaurantId: restaurant.id,
          categoryId: item.categoryId || 'c1',
          name: item.name,
          price: item.price,
          isVeg: item.isVeg ?? false,
        },
        item.quantity || 1
      );
      count++;
    }

    toast.success('Combo Added!', `${count} items added from ${restaurant.name}`);
    onClose();
    openCart();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-350 ease-out ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Smooth Backdrop Fade */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Pull-Up Sheet with Spring Cubic Bezier */}
      <div
        className={`w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl border-t border-stone-200 overflow-hidden flex flex-col h-[85vh] safe-bottom relative z-10 transition-transform duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Pull Handle */}
        <div className="pt-3 pb-1 flex justify-center bg-white shrink-0">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-stone-900 via-brand-950 to-amber-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-1.5">
                <span>Aajori AI Food Concierge</span>
              </h3>
              <p className="text-xs text-amber-200/90 font-medium">
                Grounded in live Assam kitchen menus
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors btn-press"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat / Recommendation Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick preset bubble chips */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Popular Prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setMessage(prompt);
                    handleQuery(prompt);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-brand-50 border border-stone-200/90 text-xs text-slate-800 font-semibold transition-colors text-left btn-press"
                >
                  ⚡ {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Loading or Results */}
          {isLoading ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-9 h-9 rounded-full border-3 border-brand-500 border-t-transparent animate-spin mx-auto"></div>
              <p className="text-sm text-slate-600 font-bold">
                Resolving headcounts, budget, and real kitchen items...
              </p>
            </div>
          ) : hasQueried ? (
            <div className="space-y-3.5 animate-fade-in">
              {/* Intent badge bar */}
              {parsedIntent && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex flex-wrap items-center gap-2 text-xs text-amber-900">
                  <span className="font-extrabold">Detected:</span>
                  {parsedIntent.budget && (
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-amber-200 font-black text-xs text-amber-800">
                      ₹{parsedIntent.budget}
                    </span>
                  )}
                  {parsedIntent.headcount && (
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-amber-200 font-bold text-xs">
                      {parsedIntent.headcount} Guests
                    </span>
                  )}
                  {parsedIntent.spiciness && (
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-amber-200 font-bold text-xs">
                      {parsedIntent.spiciness}
                    </span>
                  )}
                </div>
              )}

              {/* Combos list */}
              {recommendations.length === 0 ? (
                <div className="p-6 bg-stone-50 rounded-2xl text-center text-sm text-slate-500 font-medium">
                  No direct combo matched that specific budget or craving. Try adjusting headcount or spiciness.
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((combo, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-sm">{combo.name}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {combo.description}
                          </p>
                          <span className="inline-block text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200/50">
                            {combo.restaurantName || 'Authentic Kitchen'}
                          </span>
                        </div>

                        <span className="text-base font-black text-slate-900 shrink-0">
                          ₹{combo.totalPrice || combo.price}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 pt-2 border-t border-stone-100">
                        {combo.items?.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-slate-700">
                            <span className="font-medium">
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-bold text-slate-900">
                              ₹{(it.price * (it.quantity || 1))}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleAddComboToCart(combo)}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 btn-press cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Full Combo to Cart</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Bot className="w-10 h-10 mx-auto text-brand-500" />
              <p className="text-sm font-semibold max-w-xs mx-auto">
                Ask anything like: &quot;I want spicy duck curry and pork for 3 people under ₹1000&quot;
              </p>
            </div>
          )}
        </div>

        {/* Bottom input */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell Aajori AI what you'd like to eat..."
              className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl disabled:opacity-50 btn-press cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

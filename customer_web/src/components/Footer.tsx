import React from 'react';
import { Heart, ShieldCheck, MapPin, Phone, Mail, Award, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🍲</span>
              <div>
                <span className="text-lg font-bold text-white font-serif-culinary">
                  Aajori Cuisine
                </span>
                <span className="block text-[10px] text-brand-400 font-semibold tracking-wider uppercase">
                  Assam Food Commerce
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              District-scale food commerce infrastructure preserving and delivering authentic Assamese
              culinary heritage across Guwahati, Kamrup Metropolitan.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-xl w-fit">
              <Award className="w-3.5 h-3.5" />
              <span>100% Indigenous Assam Recipes</span>
            </div>
          </div>

          {/* District Operational Hubs */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">Operational Hubs</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                <span>Ulubari / GS Road Core Zone</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                <span>Silpukhuri Heritage Corridor</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                <span>Uzan Bazar Riverfront Kitchens</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                <span>Dispur Capital & Beltola Outpost</span>
              </li>
            </ul>
          </div>

          {/* Culinary Institutions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">Partner Institutions</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-white transition-colors cursor-pointer">
                <strong>Khorikaa Ethnic Kitchen</strong> - Charcoal Smoked Delicacies
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                <strong>Paradise Heritage Diner</strong> - Parampara Thalis Since 1984
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                <strong>Brahmaputra Spice Bistro</strong> - River Fish & Orthodox Teas
              </li>
              <li className="text-[11px] text-slate-500">
                All menus managed live via the unified merchant control center.
              </li>
            </ul>
          </div>

          {/* Platform & Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">Connect & Operations</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kitchen Hours: 11:00 AM - 10:30 PM IST</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Operational Hotline: +91 98640 00001</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@aajori.in</span>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Aajori Cuisine. District-Scale Local Commerce for Assam.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>for Guwahati & Assam</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

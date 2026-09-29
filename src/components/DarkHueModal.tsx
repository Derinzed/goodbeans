import React from 'react';
import { X, RotateCcw, Check, Sparkles, Sliders } from 'lucide-react';

export interface HuePreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  background: string;
}

export const PRESET_THEMES: HuePreset[] = [
  {
    id: 'classic-caramel',
    name: 'Classic Dark Roast',
    description: 'Espresso caramel & hazelnut on warm bean dark',
    primary: '#C87D32',
    secondary: '#ECA357',
    background: '#14110F',
  },
  {
    id: 'bourbon-cherry',
    name: 'Cherry & Bourbon',
    description: 'Dark cherry & rosé on deep wine noir',
    primary: '#C53030',
    secondary: '#F472B6',
    background: '#180D11',
  },
  {
    id: 'nordic-forest',
    name: 'Nordic Spruce',
    description: 'Pine spruce & golden honey on evergreen shadows',
    primary: '#2E8B57',
    secondary: '#E5A93C',
    background: '#0D1612',
  },
  {
    id: 'royal-plum',
    name: 'Ethiopian Plum',
    description: 'Velvet plum & lilac froth on dark aubergine',
    primary: '#805AD5',
    secondary: '#C084FC',
    background: '#170F1C',
  },
  {
    id: 'pacific-cyan',
    name: 'Ocean Geisha',
    description: 'Pacific teal & sun gold on midnight ocean',
    primary: '#0D9488',
    secondary: '#F59E0B',
    background: '#0C131D',
  },
  {
    id: 'smoky-bronze',
    name: 'Smoky Bronze',
    description: 'Molten copper & almond on roasted mocha',
    primary: '#D97706',
    secondary: '#FBBF24',
    background: '#1A130E',
  },
  {
    id: 'pitch-noir',
    name: 'Pitch Obsidian',
    description: 'Vibrant amber & clean platinum on true pitch black',
    primary: '#F59E0B',
    secondary: '#E2E8F0',
    background: '#0A0A0A',
  },
];

export const PRIMARY_COLOR_SWATCHES = [
  { name: 'Caramel', value: '#C87D32' },
  { name: 'Warm Crema', value: '#DDA15E' },
  { name: 'Cinnamon', value: '#D96B27' },
  { name: 'Cherry', value: '#C53030' },
  { name: 'Spruce', value: '#2E8B57' },
  { name: 'Amethyst', value: '#805AD5' },
  { name: 'Teal', value: '#0D9488' },
  { name: 'Ochre', value: '#D97706' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Cobalt', value: '#2563EB' },
];

export const SECONDARY_COLOR_SWATCHES = [
  { name: 'Hazelnut', value: '#ECA357' },
  { name: 'Honey', value: '#F6AD55' },
  { name: 'Peach', value: '#F472B6' },
  { name: 'Terracotta', value: '#DD6B20' },
  { name: 'Sage', value: '#8FB397' },
  { name: 'Lavender', value: '#C084FC' },
  { name: 'Sky', value: '#38BDF8' },
  { name: 'Almond', value: '#FBBF24' },
  { name: 'Cream', value: '#F3E8DC' },
  { name: 'Mint', value: '#34D399' },
];

export const BACKGROUND_COLOR_SWATCHES = [
  { name: 'Espresso', value: '#14110F', desc: 'Classic coffeehouse' },
  { name: 'Obsidian', value: '#0A0A0A', desc: 'Pure pitch black' },
  { name: 'Dark Mocha', value: '#1A130E', desc: 'Warm dark roast' },
  { name: 'Deep Cocoa', value: '#1F1610', desc: 'Rich chocolate tone' },
  { name: 'Midnight', value: '#0C131D', desc: 'Deep navy night' },
  { name: 'Pine Shadow', value: '#0D1612', desc: 'Nordic evergreen' },
  { name: 'Plum Velvet', value: '#170F1C', desc: 'Ethiopian wine dark' },
  { name: 'Deep Wine', value: '#180D11', desc: 'Cherry roastery dark' },
  { name: 'Dark Slate', value: '#15171C', desc: 'Modern industrial' },
  { name: 'Charcoal', value: '#181818', desc: 'Neutral studio dark' },
];

interface DarkHueModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryHue: string;
  secondaryHue: string;
  backgroundColor: string;
  onPrimaryHueChange: (hex: string) => void;
  onSecondaryHueChange: (hex: string) => void;
  onBackgroundColorChange: (hex: string) => void;
  onReset: () => void;
}

export const DarkHueModal: React.FC<DarkHueModalProps> = ({
  isOpen,
  onClose,
  primaryHue,
  secondaryHue,
  backgroundColor,
  onPrimaryHueChange,
  onSecondaryHueChange,
  onBackgroundColorChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1E1815] border border-[#3D3128] text-[#EDE4DC] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3D3128] bg-[#261F1A]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: primaryHue }}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F4EDE6]">
                Dark View Palette & Background
              </h3>
              <p className="text-xs text-[#A8988B]">
                Customize primary, secondary, and base background colors for your dark roast theme
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A8988B] hover:text-[#F4EDE6] hover:bg-[#332923] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Curated Theme Presets */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A8988B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ECA357]" />
                Curated Roast Combos
              </span>
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-[#A8988B] hover:text-[#F4EDE6] flex items-center gap-1 transition-colors"
                title="Reset to default espresso & caramel"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_THEMES.map((preset) => {
                const isActive =
                  preset.primary.toLowerCase() === primaryHue.toLowerCase() &&
                  preset.secondary.toLowerCase() === secondaryHue.toLowerCase() &&
                  preset.background.toLowerCase() === backgroundColor.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onPrimaryHueChange(preset.primary);
                      onSecondaryHueChange(preset.secondary);
                      onBackgroundColorChange(preset.background);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isActive
                        ? 'border-[#ECA357] bg-[#2F251E] shadow-sm'
                        : 'border-[#382D26] bg-[#241D18] hover:bg-[#2C231D] hover:border-[#4D3C32]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-2xs"
                        style={{ backgroundColor: preset.primary }}
                        title="Primary"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-2xs"
                        style={{ backgroundColor: preset.secondary }}
                        title="Secondary"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-2xs"
                        style={{ backgroundColor: preset.background }}
                        title="Background"
                      />
                      {isActive && (
                        <Check className="w-3.5 h-3.5 text-[#ECA357] ml-auto" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-[#F4EDE6] truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-[#A8988B] line-clamp-1">
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Color Selector */}
          <div className="p-4 bg-[#261F1A] rounded-xl border border-[#382D26] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#F4EDE6] block">
                  Background Color
                </label>
                <span className="text-[11px] text-[#A8988B]">
                  Canvas & page backdrop. Surfaces and cards layer dynamically on top.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => onBackgroundColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#44362D] bg-transparent p-0.5"
                  title="Pick custom background color"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => onBackgroundColorChange(e.target.value)}
                  className="w-20 px-2 py-1 bg-[#1A1411] border border-[#44362D] rounded-md text-xs font-mono text-[#F4EDE6] text-center"
                />
              </div>
            </div>

            {/* Background Swatches */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {BACKGROUND_COLOR_SWATCHES.map((swatch) => {
                const isSelected = swatch.value.toLowerCase() === backgroundColor.toLowerCase();
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => onBackgroundColorChange(swatch.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'border-white text-white font-semibold shadow-xs'
                        : 'border-[#382D26] bg-[#1E1815] text-[#D2C5B8] hover:border-[#524135]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: swatch.value }}
                    />
                    <span>{swatch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Hue Selector */}
          <div className="p-4 bg-[#261F1A] rounded-xl border border-[#382D26] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#F4EDE6] block">
                  Primary Hue
                </label>
                <span className="text-[11px] text-[#A8988B]">
                  Buttons, highlights, active tabs, and primary action accents
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryHue}
                  onChange={(e) => onPrimaryHueChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#44362D] bg-transparent p-0.5"
                  title="Pick custom primary hue"
                />
                <input
                  type="text"
                  value={primaryHue}
                  onChange={(e) => onPrimaryHueChange(e.target.value)}
                  className="w-20 px-2 py-1 bg-[#1A1411] border border-[#44362D] rounded-md text-xs font-mono text-[#F4EDE6] text-center"
                />
              </div>
            </div>

            {/* Primary Swatches */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRIMARY_COLOR_SWATCHES.map((swatch) => {
                const isSelected = swatch.value.toLowerCase() === primaryHue.toLowerCase();
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => onPrimaryHueChange(swatch.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'border-white text-white font-semibold shadow-xs'
                        : 'border-[#382D26] bg-[#1E1815] text-[#D2C5B8] hover:border-[#524135]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: swatch.value }}
                    />
                    <span>{swatch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Hue Selector */}
          <div className="p-4 bg-[#261F1A] rounded-xl border border-[#382D26] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#F4EDE6] block">
                  Secondary Hue
                </label>
                <span className="text-[11px] text-[#A8988B]">
                  Badges, sub-headings, timeline steps, and chip highlights
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryHue}
                  onChange={(e) => onSecondaryHueChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#44362D] bg-transparent p-0.5"
                  title="Pick custom secondary hue"
                />
                <input
                  type="text"
                  value={secondaryHue}
                  onChange={(e) => onSecondaryHueChange(e.target.value)}
                  className="w-20 px-2 py-1 bg-[#1A1411] border border-[#44362D] rounded-md text-xs font-mono text-[#F4EDE6] text-center"
                />
              </div>
            </div>

            {/* Secondary Swatches */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SECONDARY_COLOR_SWATCHES.map((swatch) => {
                const isSelected = swatch.value.toLowerCase() === secondaryHue.toLowerCase();
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => onSecondaryHueChange(swatch.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'border-white text-white font-semibold shadow-xs'
                        : 'border-[#382D26] bg-[#1E1815] text-[#D2C5B8] hover:border-[#524135]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: swatch.value }}
                    />
                    <span>{swatch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Interactive Preview Card */}
          <div
            className="p-5 rounded-xl border border-[#3D3128] transition-colors space-y-3"
            style={{ backgroundColor: backgroundColor }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8988B] block">
                Live Preview (On Custom Background)
              </span>
              <span className="text-[10px] font-mono text-[#A8988B]">
                {backgroundColor}
              </span>
            </div>

            {/* Sample Card Surface */}
            <div
              className="p-4 rounded-xl border transition-colors space-y-3"
              style={{
                backgroundColor: `color-mix(in srgb, ${backgroundColor} 86%, white 14%)`,
                borderColor: `color-mix(in srgb, ${backgroundColor} 70%, white 30%)`,
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: primaryHue }}
                >
                  <span>Primary Action</span>
                </button>
                <div
                  className="px-2.5 py-1 text-xs font-mono rounded-md border"
                  style={{
                    color: secondaryHue,
                    backgroundColor: `color-mix(in srgb, ${secondaryHue} 15%, transparent)`,
                    borderColor: `color-mix(in srgb, ${secondaryHue} 35%, transparent)`,
                  }}
                >
                  Secondary Badge · 93°C
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#A8988B]">
                  <span>Brew Progress</span>
                  <span style={{ color: primaryHue }} className="font-semibold">
                    68%
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${backgroundColor} 70%, white 30%)`,
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: '68%', backgroundColor: primaryHue }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#3D3128] bg-[#261F1A] flex items-center justify-between">
          <span className="text-xs text-[#A8988B]">
            Applied instantly to your dark view
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-all"
            style={{ backgroundColor: primaryHue }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

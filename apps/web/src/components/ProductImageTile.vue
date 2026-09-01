<template>
  <div
    class="relative flex items-center justify-center overflow-hidden"
    :style="{ background: gradient }"
  >
    <svg
      class="w-[42%] h-[42%] text-white/90"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.3"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <g v-html="ICONS[icon] || ICONS.box" />
    </svg>
  </div>
</template>

<script>
// A small, hand-drawn icon set (Heroicons-outline style, matching the rest
// of the app's inline SVGs) mapped per product — used instead of stock
// photos so every product's visual actually matches what it is, with zero
// external image dependency.
const ICONS = {
  headphones:
    '<path d="M4 13v-1a8 8 0 0116 0v1"/><rect x="3" y="13" width="4" height="7" rx="1.5"/><rect x="17" y="13" width="4" height="7" rx="1.5"/>',
  bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
  camera:
    '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="14" r="3.5"/>',
  keyboard:
    '<rect x="2.5" y="6" width="19" height="13" rx="1.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M9.5 13.5h.01M13 13.5h.01M16.5 13.5h.01M8 17h8"/>',
  speaker:
    '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="15" r="3.5"/>',
  battery: '<rect x="2.5" y="8" width="17" height="8" rx="1.5"/><path d="M22 10.5v3"/><path d="M6 11v2M9 11v2"/>',
  box: '<path d="M3 8l9-5 9 5-9 5-9-5z"/><path d="M3 8v9l9 5 9-5V8"/><path d="M12 13v9"/>',
  cup: '<path d="M5 3h11v10a5.5 5.5 0 01-11 0V3z"/><path d="M16 6h1.5a3 3 0 010 6H16"/><path d="M5 3v0"/>',
  scale:
    '<path d="M12 3v18"/><path d="M5 8h14"/><path d="M5 8l-3 6a3.2 3.2 0 006 0l-3-6z"/><path d="M19 8l-3 6a3.2 3.2 0 006 0l-3-6z"/>',
  utensils:
    '<path d="M6 2v8a2 2 0 002 2v10"/><path d="M6 2v6M9 2v6"/><path d="M18 2c-2 1-3 3-3 6s1 3 3 3v11"/>',
  kettle:
    '<path d="M5 10h11a3 3 0 013 3v0a3 3 0 01-3 3h-1"/><path d="M5 10a5 5 0 0110 0v6a4 4 0 01-4 4H9a4 4 0 01-4-4v-6z"/><path d="M8 6c0-1.5 1-2 1-3M12 6c0-1.5 1-2 1-3"/>',
  dumbbell:
    '<rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><rect x="5" y="7" width="2.5" height="10" rx="1"/><rect x="16.5" y="7" width="2.5" height="10" rx="1"/><path d="M7.5 12h9"/>',
  mat: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M3 13h18M3 18h18"/>',
  ring: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
  bottle:
    '<path d="M10 2h4v3.5l1.5 2V21a1 1 0 01-1 1h-5a1 1 0 01-1-1V7.5L10 5.5V2z"/><path d="M9 11h6"/>',
  droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',
  brush:
    '<path d="M14.5 3.5l6 6-8 8-6-2 8-12z"/><path d="M12.5 11.5L5 19"/><path d="M4 22c0-2 1-3 3-3"/>',
  flatiron:
    '<rect x="3" y="9" width="18" height="6" rx="2.5"/><path d="M6 9V6a2 2 0 012-2h8a2 2 0 012 2v3"/>',
  tent: '<path d="M2 20L12 4l10 16"/><path d="M8 20l4-9 4 9"/><path d="M2 20h20"/>',
  chair:
    '<path d="M6 4v9a2 2 0 002 2h8a2 2 0 002-2V4"/><path d="M6 20l1-5M18 20l-1-5"/><path d="M6 13h12"/>',
  lamp: '<path d="M8 3h8l-2 7H10L8 3z"/><path d="M12 10v8"/><path d="M8 21h8"/>',
  paw: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="9" r="2"/><path d="M8 15.5c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5-1.8 3.5-4 3.5-4-1.5-4-3.5z"/>',
  bowl: '<path d="M3 11h18a9 8 0 01-18 0z"/><path d="M8 11a4 3 0 018 0"/>',
  bed: '<path d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6"/><path d="M3 18v2M21 18v2"/><path d="M5 13V7a1 1 0 011-1h5a1 1 0 011 1v3"/>',
  puzzle:
    '<path d="M6 4h4v2a1.5 1.5 0 003 0V4h4a1 1 0 011 1v4h-2a1.5 1.5 0 000 3h2v4a1 1 0 01-1 1h-4v-2a1.5 1.5 0 00-3 0v2H6a1 1 0 01-1-1v-4h2a1.5 1.5 0 000-3H5V5a1 1 0 011-1z"/>',
  hammock: '<path d="M3 6l18 4M3 18l18-4"/><path d="M4 6l1.5 12M20 10l-1.5 12"/><path d="M4 18a5 5 0 0016-4"/>',
  knife: '<path d="M5 3l14 14-3 3L2 6z"/><path d="M13 5l6 6"/>',
  toaster:
    '<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M8 9V6a1 1 0 011-1h6a1 1 0 011 1v3"/><path d="M9 20l-1 2M15 20l1 2"/>',
  pan: '<circle cx="10" cy="12" r="7"/><path d="M17 10h5"/>',
  pot: '<path d="M4 11h16v5a4 4 0 01-4 4H8a4 4 0 01-4-4v-5z"/><path d="M2 11h20"/><path d="M9 11V8a3 3 0 016 0v3"/>',
  roller: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M7 8h10M7 13h10"/>',
  razor: '<rect x="4" y="4" width="14" height="6" rx="2"/><path d="M11 10v10"/><path d="M7 20h8"/>',
  leash: '<circle cx="6" cy="6" r="3"/><path d="M8.5 8.5L20 20"/>',
  tower:
    '<rect x="7" y="3" width="10" height="6" rx="1"/><rect x="4" y="9" width="16" height="6" rx="1"/><rect x="7" y="15" width="10" height="6" rx="1"/>',
};

export default {
  name: 'ProductImageTile',
  props: {
    icon: { type: String, required: true },
    category: { type: String, default: '' },
  },
  data() {
    return { ICONS };
  },
  computed: {
    gradient() {
      const key = CATEGORY_GRADIENTS[this.category] || CATEGORY_GRADIENTS.default;
      return `linear-gradient(135deg, ${key[0]}, ${key[1]})`;
    },
  },
};

const CATEGORY_GRADIENTS = {
  Electronics: ['#00bbf9', '#9b5de5'],
  'Home & Kitchen': ['#ff9f1c', '#f15bb5'],
  Fitness: ['#2ec4b6', '#00bbf9'],
  Beauty: ['#f15bb5', '#9b5de5'],
  Outdoor: ['#2ec4b6', '#ffbf69'],
  'Pet Supplies': ['#ff9f1c', '#2ec4b6'],
  default: ['#33373f', '#17191d'],
};
</script>

/**
 * Draft Studio style definitions — shared between Draft Studio and Reader.
 * Contains the font, palette, animation, paper, and background option lookup tables.
 */

export type FontOption = {
    id: string;
    label: string;
    family: string;
    mood: string;
};

export type PaletteOption = {
    id: string;
    label: string;
    page: string;
    text: string;
    accent: string;
    shell: string;
};

export type AnimationEffect = 'none' | 'flare' | 'snow' | 'vortex' | 'sparkle';

export type AnimationOption = {
    id: string;
    label: string;
    effect: AnimationEffect;
    note: string;
};

export type PaperEffect = 'clean' | 'parchment' | 'grain' | 'notebook';

export type PaperOption = {
    id: string;
    label: string;
    effect: PaperEffect;
    note: string;
};

export type BackgroundOption = {
    id: string;
    label: string;
    url: string | null;
    note: string;
};

export const fontOptions: FontOption[] = [
    {
        id: 'bpg-mtavruli',
        label: 'მთავრული (BPG)',
        family: '"BPG Extrasquare Mtavruli", sans-serif',
        mood: 'მკაფიო, კლასიკური და კომფორტული სათაურებისთვის',
    },
    {
        id: 'tfmecomicse',
        label: 'კომიქსი (TFMecomicse)',
        family: '"TFMecomicse-Italic", cursive',
        mood: 'მსუბუქი, დახრილი ხელნაწერი სტილი',
    },
];

export const paletteOptions: PaletteOption[] = [
    {
        id: 'paper-ivory',
        label: 'სპილოს ძვლის ქაღალდი',
        page: '#f7f1df',
        text: '#2c251a',
        accent: '#a46e2a',
        shell: '#191c23',
    },
    {
        id: 'ink-night',
        label: 'მელნის ღამე',
        page: '#111318',
        text: '#f3f4f6',
        accent: '#7ec8ff',
        shell: '#06080d',
    },
    {
        id: 'sage',
        label: 'ბალახის ბეჭდვა',
        page: '#ecf1e6',
        text: '#223127',
        accent: '#4b7f5d',
        shell: '#141b16',
    },
    {
        id: 'sunset',
        label: 'თბილი მზის ჩასვლა',
        page: '#fff0e7',
        text: '#3f1f16',
        accent: '#d85f2e',
        shell: '#23120f',
    },
    {
        id: 'ocean-breeze',
        label: 'ოკეანის ბრიზი',
        page: '#e6f0fa',
        text: '#1a2b3c',
        accent: '#2b6cb0',
        shell: '#0d1821',
    },
    {
        id: 'lavender-dream',
        label: 'ლავანდის ოცნება',
        page: '#f4f0fb',
        text: '#3b2f4a',
        accent: '#805ad5',
        shell: '#1a1625',
    },
    {
        id: 'autumn-leaf',
        label: 'შემოდგომის ფოთოლი',
        page: '#fdf6e3',
        text: '#4a2f1d',
        accent: '#d97706',
        shell: '#2a1a10',
    },
    {
        id: 'obsidian',
        label: 'ობსიდიანი',
        page: '#0b0c10',
        text: '#c5c6c7',
        accent: '#66fcf1',
        shell: '#000000',
    },
];

export const animationOptions: AnimationOption[] = [
    {
        id: 'none',
        label: 'ანიმაციის გარეშე',
        effect: 'none',
        note: 'სტატიკური',
    },
    {
        id: 'flare',
        label: 'ბრწყინვალება',
        effect: 'flare',
        note: 'ნელი, მცურავი პარტიკლები',
    },
    {
        id: 'snow',
        label: 'თოვლი',
        effect: 'snow',
        note: 'წვიმის მსგავსი ფიფქები',
    },
    {
        id: 'sparkle',
        label: 'ნაპერწკალი',
        effect: 'sparkle',
        note: 'ციმციმა ვარსკვლავები',
    },
];

export const paperOptions: PaperOption[] = [
    {
        id: 'clean',
        label: 'სუფთა',
        effect: 'clean',
        note: 'სუფთა ზედაპირი ტექსტურის გარეშე',
    },
    {
        id: 'parchment',
        label: 'ძველი პერგამენტი',
        effect: 'parchment',
        note: 'მოყვითალო დაძველებული სტილი (რეკომენდებულია ღია ფერებზე)',
    },
    {
        id: 'grain',
        label: 'მარცვლოვანი ქაღალდი',
        effect: 'grain',
        note: 'ტაქტილური, მარცვლოვანი ტექსტურა',
    },
    {
        id: 'notebook',
        label: 'რვეული',
        effect: 'notebook',
        note: 'კლასიკური ხაზებიანი რვეულის ფურცელი',
    },
];

// Helper to reliably import or reference the featureCalled background images.
import natureBg from '../featureCalled/assets/images/nature.jpg';
import galaxyBg from '../featureCalled/assets/images/galaxy.jpg';
import moonBg from '../featureCalled/assets/images/moon.jpg';

export const backgroundOptions: BackgroundOption[] = [
    {
        id: 'none',
        label: 'ფონის გარეშე',
        url: null,
        note: 'სტანდარტული მონიტორის ფერი',
    },
    {
        id: 'nature',
        label: 'ბუნება',
        url: natureBg,
        note: 'მშვიდი ბუნების პეიზაჟი',
    },
    {
        id: 'galaxy',
        label: 'გალაქტიკა',
        url: galaxyBg,
        note: 'კოსმოსური სივრცე',
    },
    {
        id: 'moon',
        label: 'მთვარე',
        url: moonBg,
        note: 'ღამის ცა მთვარით',
    },
];

/* ── Helpers ── */

export function getFontById(id: string): FontOption {
    return fontOptions.find((f) => f.id === id) ?? fontOptions[0];
}

export function getPaletteById(id: string): PaletteOption {
    return paletteOptions.find((p) => p.id === id) ?? paletteOptions[0];
}

export function getAnimationById(id: string): AnimationOption {
    return animationOptions.find((a) => a.id === id) ?? animationOptions[0];
}

export function getPaperById(id: string): PaperOption {
    return paperOptions.find((p) => p.id === id) ?? paperOptions[0];
}

export function getBackgroundById(id: string): BackgroundOption {
    return backgroundOptions.find((b) => b.id === id) ?? backgroundOptions[0];
}

/** Draft Studio theme shape as stored in the backend */
export interface DraftStudioTheme {
    font_id: string;
    palette_id: string;
    animation_id: string;
    paper_id: string;
    background_id: string;
    base_font_size: number;
    line_height: number;
    letter_spacing: number;
    content_width: number;
}

export const DEFAULT_DRAFT_THEME: DraftStudioTheme = {
    font_id: 'bpg-mtavruli',
    palette_id: 'paper-ivory',
    animation_id: 'none',
    paper_id: 'clean',
    background_id: 'none',
    base_font_size: 17,
    line_height: 1.75,
    letter_spacing: 0.01,
    content_width: 740,
};

const animate = require("tailwindcss-animate");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  safelist: ["dark"],
  prefix: "",

  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],

  theme: {
  	container: {
  		center: true,
  		padding: '1.5rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'var(--border)',
  			input: 'var(--input)',
  			ring: 'var(--ring)',
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)',
  				deep: 'var(--primary-deep)',
  				soft: 'var(--primary-soft)'
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)',
  				foreground: 'var(--destructive-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			ink: {
  				DEFAULT: 'var(--ink)',
  				secondary: 'var(--ink-secondary)',
  				mute: 'var(--ink-mute)',
  				'mute-2': 'var(--ink-mute-2)',
  				faint: 'var(--ink-faint)'
  			},
  			canvas: {
  				DEFAULT: 'var(--canvas)',
  				soft: 'var(--canvas-soft)',
  				night: 'var(--canvas-night)',
  				'night-soft': 'var(--canvas-night-soft)'
  			},
  			hairline: {
  				DEFAULT: 'var(--hairline)',
  				strong: 'var(--hairline-strong)',
  				cool: 'var(--hairline-cool)',
  				'cool-2': 'var(--hairline-cool-2)',
  				'cool-3': 'var(--hairline-cool-3)'
  			},
  			'accent-purple': 'var(--accent-purple)',
  			'accent-violet': 'var(--accent-violet)',
  			'accent-purple-soft': 'var(--accent-purple-soft)',
  			'accent-yellow': 'var(--accent-yellow)',
  			'accent-tomato': 'var(--accent-tomato)',
  			'accent-pink': 'var(--accent-pink)',
  			'accent-indigo': 'var(--accent-indigo)',
  			'accent-crimson': 'var(--accent-crimson)',
  			sidebar: {
  				DEFAULT: 'var(--sidebar-background)',
  				foreground: 'var(--sidebar-foreground)',
  				primary: 'var(--sidebar-primary)',
  				'primary-foreground': 'var(--sidebar-primary-foreground)',
  				accent: 'var(--sidebar-accent)',
  				'accent-foreground': 'var(--sidebar-accent-foreground)',
  				border: 'var(--sidebar-border)',
  				ring: 'var(--sidebar-ring)'
  			}
  		},
  		borderRadius: {
  			none: '0px',
  			xs: '4px',
  			sm: '6px',
  			md: '8px',
  			lg: '12px',
  			xl: '16px',
  			full: '9999px',
  		},
  		spacing: {
  			hair: '1px',
  			xxs: '2px',
  			xs: '4px',
  			sm: '8px',
  			md: '12px',
  			lg: '16px',
  			xl: '24px',
  			xxl: '32px',
  			huge: '64px',
  			section: '96px',
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'Circular',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'sans-serif'
  			],
  			serif: [
  				'Georgia',
  				'Times New Roman',
  				'serif'
  			],
  			mono: [
  				'ui-monospace',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'monospace'
  			]
  		},
  		fontSize: {
  			'display-xxl': [
  				'64px',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-1.92px',
  					fontWeight: '500'
  				}
  			],
  			'display-xl': [
  				'48px',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-1.44px',
  					fontWeight: '500'
  				}
  			],
  			'display-lg': [
  				'36px',
  				{
  					lineHeight: '1.15',
  					letterSpacing: '-0.72px',
  					fontWeight: '500'
  				}
  			],
  			'display-md': [
  				'28px',
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.42px',
  					fontWeight: '500'
  				}
  			],
  			'heading-lg': [
  				'22px',
  				{
  					lineHeight: '1.2',
  					letterSpacing: '0',
  					fontWeight: '500'
  				}
  			],
  			'heading-md': [
  				'18px',
  				{
  					lineHeight: '1.4',
  					letterSpacing: '0',
  					fontWeight: '500'
  				}
  			],
  			'body-lg': [
  				'18px',
  				{
  					lineHeight: '1.55',
  					letterSpacing: '0',
  					fontWeight: '400'
  				}
  			],
  			'body-md': [
  				'16px',
  				{
  					lineHeight: '1.5',
  					letterSpacing: '0',
  					fontWeight: '400'
  				}
  			],
  			'button-md': [
  				'14px',
  				{
  					lineHeight: '1.0',
  					letterSpacing: '0',
  					fontWeight: '500'
  				}
  			],
  			'caption': [
  				'13px',
  				{
  					lineHeight: '1.45',
  					letterSpacing: '0',
  					fontWeight: '400'
  				}
  			],
  			'micro': [
  				'12px',
  				{
  					lineHeight: '1.45',
  					letterSpacing: '0',
  					fontWeight: '400'
  				}
  			],
  			'code': [
  				'14px',
  				{
  					lineHeight: '1.5',
  					letterSpacing: '0',
  					fontWeight: '400'
  				}
  			],
  			// Keep previous system keys for full backwards-compatibility
  			'headline': [
  				'26px',
  				{
  					lineHeight: '1.35',
  					letterSpacing: '-0.26px',
  					fontWeight: '540'
  				}
  			],
  			'subhead': [
  				'26px',
  				{
  					lineHeight: '1.35',
  					letterSpacing: '-0.26px',
  					fontWeight: '340'
  				}
  			],
  			'card-title': [
  				'24px',
  				{
  					lineHeight: '1.45',
  					letterSpacing: '0',
  					fontWeight: '700'
  				}
  			],
  			'body-sm': [
  				'16px',
  				{
  					lineHeight: '1.45',
  					letterSpacing: '-0.14px',
  					fontWeight: '330'
  				}
  			],
  			'link': [
  				'20px',
  				{
  					lineHeight: '1.40',
  					letterSpacing: '-0.10px',
  					fontWeight: '480'
  				}
  			],
  			'button': [
  				'20px',
  				{
  					lineHeight: '1.40',
  					letterSpacing: '-0.10px',
  					fontWeight: '480'
  				}
  			],
  			'eyebrow': [
  				'18px',
  				{
  					lineHeight: '1.30',
  					letterSpacing: '0.54px',
  					fontWeight: '400'
  				}
  			],
  			'heading-sm': [
  				'18px',
  				{
  					lineHeight: '27px',
  					letterSpacing: '0'
  				}
  			],
  			'heading-sm-mixed': [
  				'18px',
  				{
  					lineHeight: '28px',
  					letterSpacing: '0'
  				}
  			],
  			'body-strong': [
  				'16px',
  				{
  					lineHeight: '24px',
  					fontWeight: '600'
  				}
  			],
  			'body-sm-strong': [
  				'15px',
  				{
  					lineHeight: '25.65px',
  					fontWeight: '600'
  				}
  			],
  			'body-xs': [
  				'14px',
  				{
  					lineHeight: '20px',
  					fontWeight: '500'
  				}
  			],
  			'caption-md': [
  				'14px',
  				{
  					lineHeight: '24px',
  					fontWeight: '700'
  				}
  			],
  			'caption-sm': [
  				'13px',
  				{
  					lineHeight: '19.5px',
  					fontWeight: '500'
  				}
  			],
  			'caption-xs': [
  				'12px',
  				{
  					lineHeight: '16px',
  					fontWeight: '600'
  				}
  			],
  			'utility-xs': [
  				'12px',
  				{
  					lineHeight: '16px',
  					fontWeight: '700'
  				}
  			],
  			'link-md': [
  				'16px',
  				{
  					lineHeight: '24px'
  				}
  			],
  			'button-sm': [
  				'13px',
  				{
  					lineHeight: '13px',
  					fontWeight: '500'
  				}
  			],
  			'code-sm': [
  				'14px',
  				{
  					lineHeight: '20px'
  				}
  			],
  			'code-xs': [
  				'14px',
  				{
  					lineHeight: '20px',
  					fontWeight: '500'
  				}
  			]
  		},
  		keyframes: {
  			'collapsible-down': {
  				from: {
  					height: 0
  				},
  				to: {
  					height: 'var(--radix-collapsible-content-height)'
  				}
  			},
  			'collapsible-up': {
  				from: {
  					height: 'var(--radix-collapsible-content-height)'
  				},
  				to: {
  					height: 0
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'collapsible-down': 'collapsible-down 0.2s ease-in-out',
  			'collapsible-up': 'collapsible-up 0.2s ease-in-out',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [animate],
};


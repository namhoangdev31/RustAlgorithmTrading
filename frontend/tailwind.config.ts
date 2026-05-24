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
  			border: '#3f3a36',
  			input: '#3f3a36',
  			ring: '#f7f5f0',
  			background: '#2b2622',
  			foreground: '#f7f5f0',
  			primary: {
  				DEFAULT: '#f7f5f0',
  				foreground: '#2b2622'
  			},
  			secondary: {
  				DEFAULT: '#383330',
  				foreground: '#f7f5f0'
  			},
  			destructive: {
  				DEFAULT: '#ef4444',
  				foreground: '#f7f5f0'
  			},
  			muted: {
  				DEFAULT: '#383330',
  				foreground: '#aea69c'
  			},
  			accent: {
  				DEFAULT: '#383330',
  				foreground: '#f7f5f0'
  			},
  			popover: {
  				DEFAULT: '#383330',
  				foreground: '#f7f5f0'
  			},
  			card: {
  				DEFAULT: '#383330',
  				foreground: '#f7f5f0'
  			},
  			primaryBrand: '#f7f5f0',
  			'on-primary': '#2b2622',
  			ink: '#f7f5f0',
  			body: '#c9c0ad',
  			'body-strong': '#dad2c1',
  			mute: '#aea69c',
  			canvas: '#2b2622',
  			'canvas-soft': '#383330',
  			hairline: '#3f3a36',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			none: '0px',
  			xxs: '1px',
  			xs: '2px',
  			sm: '3px',
  			md: '4px',
  			lg: '6px',
  			pill: '9999px',
  			full: '9999px',
  			xl: 'calc(var(--radius) + 4px)'
  		},
  		spacing: {
  			xxs: '2px',
  			xs: '4px',
  			sm: '8px',
  			md: '10px',
  			lg: '16px',
  			xl: '24px',
  			'2xl': '32px',
  			'3xl': '48px',
  			'4xl': '64px',
  			'5xl': '96px'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'-apple-system',
  				'sans-serif'
  			],
  			serif: [
  				'Instrument Serif',
  				'Georgia',
  				'Times New Roman',
  				'serif'
  			],
  			mono: [
  				'DM Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'monospace'
  			],
  			abel: [
  				'Abel',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'display-xl': [
  				'64px',
  				{
  					lineHeight: '70.4px',
  					letterSpacing: '-1.6px'
  				}
  			],
  			'display-lg': [
  				'48px',
  				{
  					lineHeight: '52.8px',
  					letterSpacing: '-1.2px'
  				}
  			],
  			'display-md': [
  				'32px',
  				{
  					lineHeight: '40px',
  					letterSpacing: '-0.8px'
  				}
  			],
  			'display-sm': [
  				'24px',
  				{
  					lineHeight: '32px',
  					letterSpacing: '-0.4px'
  				}
  			],
  			'display-serif': [
  				'48px',
  				{
  					lineHeight: '52px',
  					letterSpacing: '-0.5px'
  				}
  			],
  			'body-lg': [
  				'18px',
  				{
  					lineHeight: '28px'
  				}
  			],
  			'body-md': [
  				'16px',
  				{
  					lineHeight: '24px'
  				}
  			],
  			'body-md-strong': [
  				'16px',
  				{
  					lineHeight: '24px',
  					fontWeight: '500'
  				}
  			],
  			'body-sm': [
  				'14px',
  				{
  					lineHeight: '20px'
  				}
  			],
  			'body-sm-strong': [
  				'14px',
  				{
  					lineHeight: '20px',
  					fontWeight: '500'
  				}
  			],
  			caption: [
  				'12px',
  				{
  					lineHeight: '16px'
  				}
  			],
  			code: [
  				'13px',
  				{
  					lineHeight: '18px'
  				}
  			],
  			'code-md': [
  				'14px',
  				{
  					lineHeight: '20px'
  				}
  			],
  			'button-md': [
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


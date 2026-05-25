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
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			posthogYellow: 'hsl(var(--posthog-yellow))',
  			charcoal: 'hsl(var(--posthog-charcoal))',
  			ash: 'hsl(var(--posthog-ash))',
  			stone: 'hsl(var(--posthog-stone))',
  			linkBlue: 'hsl(var(--posthog-link-blue))',
  			linkTeal: 'hsl(var(--posthog-link-teal))',
  			blueSoft: 'hsl(var(--posthog-blue-soft))',
  			greenSoft: 'hsl(var(--posthog-green-soft))',
  			redSoft: 'hsl(var(--posthog-red-soft))',
  			purpleSoft: 'hsl(var(--posthog-purple-soft))',
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
  			xs: '2px',
  			sm: '4px',
  			md: '6px',
  			lg: '8px',
  			pill: '9999px',
  			full: '9999px',
  		},
  		spacing: {
  			xxs: '2px',
  			xs: '4px',
  			sm: '8px',
  			md: '12px',
  			lg: '16px',
  			xl: '24px',
  			xxl: '32px',
  			'2xl': '32px',
  			'3xl': '48px',
  			'4xl': '64px',
  			'5xl': '96px',
  			section: '80px'
  		},
  		fontFamily: {
  			sans: [
  				'IBM Plex Sans Variable',
  				'IBM Plex Sans',
  				'Inter',
  				'system-ui',
  				'-apple-system',
  				'sans-serif'
  			],
  			serif: [
  				'Georgia',
  				'Times New Roman',
  				'serif'
  			],
  			mono: [
  				'Source Code Pro',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'monospace'
  			]
  		},
  		fontSize: {
  			'display-xl': [
  				'36px',
  				{
  					lineHeight: '54px',
  					letterSpacing: '0px'
  				}
  			],
  			'display-lg': [
  				'24px',
  				{
  					lineHeight: '32px',
  					letterSpacing: '-0.6px'
  				}
  			],
  			'heading-lg': [
  				'21px',
  				{
  					lineHeight: '29.4px',
  					letterSpacing: '-0.5px'
  				}
  			],
  			'heading-md': [
  				'20px',
  				{
  					lineHeight: '28px',
  					letterSpacing: '0'
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
  			'body-md': [
  				'16px',
  				{
  					lineHeight: '24px'
  				}
  			],
  			'body-strong': [
  				'16px',
  				{
  					lineHeight: '24px',
  					fontWeight: '600'
  				}
  			],
  			'body-sm': [
  				'15px',
  				{
  					lineHeight: '25.65px'
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
  			'button-md': [
  				'14px',
  				{
  					lineHeight: '21px',
  					fontWeight: '700'
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


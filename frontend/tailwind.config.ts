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
  			ink: 'hsl(var(--ink))',
  			canvas: 'hsl(var(--canvas))',
  			'inverse-canvas': 'hsl(var(--inverse-canvas))',
  			'inverse-ink': 'hsl(var(--inverse-ink))',
  			'on-inverse-soft': 'hsl(var(--on-inverse-soft))',
  			hairline: 'hsl(var(--hairline))',
  			'hairline-soft': 'hsl(var(--hairline-soft))',
  			'surface-soft': 'hsl(var(--surface-soft))',
  			'block-lime': 'hsl(var(--block-lime))',
  			'block-lilac': 'hsl(var(--block-lilac))',
  			'block-cream': 'hsl(var(--block-cream))',
  			'block-pink': 'hsl(var(--block-pink))',
  			'block-mint': 'hsl(var(--block-mint))',
  			'block-coral': 'hsl(var(--block-coral))',
  			'block-navy': 'hsl(var(--block-navy))',
  			'accent-magenta': 'hsl(var(--accent-magenta))',
  			'semantic-success': 'hsl(var(--semantic-success))',
  			'overlay-scrim': 'hsl(var(--overlay-scrim))',
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
  			sm: '6px',
  			md: '8px',
  			lg: '24px',
  			xl: '32px',
  			pill: '50px',
  			full: '9999px',
  		},
  		spacing: {
  			hair: '1px',
  			xxs: '4px',
  			xs: '8px',
  			sm: '12px',
  			md: '16px',
  			lg: '24px',
  			xl: '32px',
  			xxl: '48px',
  			section: '96px',
  		},
  		fontFamily: {
  			sans: [
  				'figmaSans',
  				'figmaSans Fallback',
  				'SF Pro Display',
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
  				'figmaMono',
  				'figmaMono Fallback',
  				'SF Mono',
  				'JetBrains Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'monospace'
  			]
  		},
  		fontSize: {
  			'display-xl': [
  				'86px',
  				{
  					lineHeight: '1.00',
  					letterSpacing: '-1.72px',
  					fontWeight: '340'
  				}
  			],
  			'display-lg': [
  				'64px',
  				{
  					lineHeight: '1.10',
  					letterSpacing: '-0.96px',
  					fontWeight: '340'
  				}
  			],
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
  			'body-lg': [
  				'20px',
  				{
  					lineHeight: '1.40',
  					letterSpacing: '-0.14px',
  					fontWeight: '330'
  				}
  			],
  			'body': [
  				'18px',
  				{
  					lineHeight: '1.45',
  					letterSpacing: '-0.26px',
  					fontWeight: '320'
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
  			'caption': [
  				'12px',
  				{
  					lineHeight: '1.00',
  					letterSpacing: '0.60px',
  					fontWeight: '400'
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


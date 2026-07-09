import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'

const RpgFichaPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#faf6ee',
      100: '#f0e4c8',
      200: '#e4cd9d',
      300: '#d8b671',
      400: '#cea452',
      500: '#c9a15c', // âmbar/dourado — accent principal do tema RPG
      600: '#ab853f',
      700: '#8c6a33',
      800: '#6e5127',
      900: '#523b1c',
      950: '#382811',
    },
    colorScheme: {
      dark: {
        surface: {
          0: '#ffffff',
          50: '#f4f4f5',
          100: '#e4e4e7',
          // ... (mantém os claros default do Lara, raramente usados no dark)
          700: '#1c1c25', // bg-surface-hover
          800: '#16161d', // bg-surface (cards)
          900: '#0d0d12', // bg-base (fundo da página)
          950: '#08080b',
        },
        formField: {
          background: '{surface.800}',
          borderColor: '{surface.700}',
          hoverBorderColor: '{primary.500}',
          color: '{surface.0}',
        },
        content: {
          background: '{surface.800}',
          borderColor: 'rgba(255, 255, 255, 0.06)', // border-subtle
        },
        text: {
          color: '{surface.0}',
          mutedColor: '{surface.400}', // pro seu text-mid/text-lo
        },
      },
    },
  },
})

export default RpgFichaPreset
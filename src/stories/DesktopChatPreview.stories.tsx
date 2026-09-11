import type { Meta, StoryObj } from '@storybook/react-vite'
import { App } from '../App'

const meta = {
  title: 'Desktop UI/Chat preview',
  component: App,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: {
        desktop1440: {
          name: 'Desktop 1440 × 900',
          styles: {
            width: '1440px',
            height: '900px',
          },
          type: 'desktop',
        },
      },
    },
  },
  globals: {
    viewport: { value: 'desktop1440', isRotated: false },
  },
  decorators: [
    (Story) => (
      <div className="min-h-dvh bg-[rgb(0_91_150)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof App>

export default meta

type Story = StoryObj<typeof meta>

/** PC desktop layout at 1440 × 900. */
export const Default: Story = {}

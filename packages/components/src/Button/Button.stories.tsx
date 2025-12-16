import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { ButtonVariants, ButtonColors, ButtonSizes } from "./Button.config";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    loading: false,
    iconOnly: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      options: [...ButtonVariants],
    },
    color: {
      control: { type: "inline-radio" },
      options: [...ButtonColors],
    },
    size: {
      control: { type: "inline-radio" },
      options: [...ButtonSizes],
    },
    iconStart: {
      table: {
        disable: true,
      },
    },
    iconEnd: {
      table: {
        disable: true,
      },
    },
    asChild: {
      table: {
        disable: true,
      },
    },
    disabled: {
      if: { arg: "asChild", truthy: false },
    },
    iconOnly: {
      if: { arg: "iconStart", truthy: true },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Button",
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: "Loading Button",
    loading: true,
  },
};

export const DisabledLinkButton: Story = {
  render: (args) => (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 300,
      }}
    >
      <p style={{ fontFamily: "var(--font-family-body)" }}>
        You should probably not do this, but if you have to make a Button that's
        a link and disabled, remove the href and add role="link"
      </p>
      <div>
        <Button asChild {...args}>
          <a {...(args.disabled ? { role: "link" } : { href: "#" })}>
            A {args.disabled && "disabled"} link
          </a>
        </Button>
      </div>
    </div>
  ),
  args: {
    disabled: true,
  },
  argTypes: {
    children: {
      table: {
        disable: true,
      },
    },
  },
};

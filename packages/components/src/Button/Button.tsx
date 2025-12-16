import {
  type ButtonHTMLAttributes,
  type ReactNode,
  cloneElement,
  forwardRef,
  isValidElement,
} from "react";
import { clsx } from "clsx";
import { Button as AriaButton } from "react-aria-components";
import { Slot } from "@radix-ui/react-slot";
import * as styles from "./Button.css";
import type { ButtonVariant, ButtonColor, ButtonSize } from "./Button.config";
import {
  DEFAULT_BUTTON_VARIANT,
  DEFAULT_BUTTON_COLOR,
  DEFAULT_BUTTON_SIZE,
} from "./Button.config";

interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The variant of the button
   * @default 'solid'
   */
  variant?: ButtonVariant;

  /**
   * The color of the button
   * @default 'primary'
   */
  color?: ButtonColor;

  /**
   * The size of the button
   * @default 'lg'
   */
  size?: ButtonSize;

  /**
   * When true, shows a loading spinner and disables the button
   * The button width is preserved when loading
   */
  loading?: boolean;

  /**
   * When true, the button will render its children as a child of the button
   * @default false
   */
  asChild?: boolean;
}

interface ButtonCustomProps extends ButtonBaseProps {
  /**
   * Icon to display at the start of the button
   * Will be wrapped in an Icon component with size 16
   */
  iconStart?: ReactNode;

  /**
   * Icon to display at the end of the button
   * Will be wrapped in an Icon component with size 16
   */
  iconEnd?: ReactNode;

  /**
   * When false or undefined, renders a standard button
   * Can have iconStart, iconEnd, both or neither
   * @default false
   */
  iconOnly?: false;
}

interface IconButtonCustomProps extends ButtonBaseProps {
  /**
   * Icon to display in the button
   * Will be wrapped in an Icon component with size 16
   */
  iconStart: ReactNode;

  /**
   * IconButton cannot have an icon at the end
   */
  iconEnd?: never;

  /**
   * When true, renders an icon-only button
   * Ignores text children, removes minWidth, and uses equal padding
   */
  iconOnly: true;
}

export type ButtonProps = ButtonCustomProps | IconButtonCustomProps;

const LoadingWrapper = ({
  loading,
  children,
}: {
  loading: boolean;
  children: ReactNode;
}) => {
  return loading ? (
    <>
      <span className={styles.loadingContent}>{children}</span>
      <span className={styles.loadingSpinner}>
        spinner
      </span>
    </>
  ) : (
    children
  );
};

const ButtonContent = ({
  iconStart,
  iconEnd,
  iconOnly,
  loading,
  children,
}: {
  iconStart: ReactNode;
  iconEnd: ReactNode;
  iconOnly: boolean;
  loading: boolean;
  children: ReactNode;
}) => {
  return (
    <LoadingWrapper loading={loading}>
      {iconStart && iconStart}
      {!iconOnly && children}
      {!iconOnly && iconEnd && iconEnd}
    </LoadingWrapper>
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = DEFAULT_BUTTON_VARIANT,
      color = DEFAULT_BUTTON_COLOR,
      size = DEFAULT_BUTTON_SIZE,
      className,
      children,
      iconStart,
      iconEnd,
      iconOnly = false,
      loading = false,
      disabled = false,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const buttonClasses = clsx(
      styles.button({
        variant,
        color,
        size,
        iconOnly,
      }),
      className
    );

    // Filter out undefined values to satisfy exactOptionalPropertyTypes
    const filteredProps = Object.fromEntries(
      Object.entries(props).filter(([, value]) => value !== undefined)
    );

    if (asChild && isValidElement(children)) {
      return (
        <Slot
          ref={ref}
          {...filteredProps}
          className={buttonClasses}
          aria-disabled={disabled || loading}
        >
          {cloneElement(
            children,
            {},
            <ButtonContent
              iconStart={iconStart}
              iconEnd={iconEnd}
              iconOnly={iconOnly}
              loading={loading}
              // pass the children's props.children to the ButtonContent since
              // we're cloning the children and using that as the "Button"
              children={children.props.children}
            />
          )}
        </Slot>
      );
    }

    return (
      <AriaButton
        ref={ref}
        {...filteredProps}
        className={buttonClasses}
        isDisabled={disabled || loading}
      >
        <ButtonContent
          iconStart={iconStart}
          iconEnd={iconEnd}
          iconOnly={iconOnly}
          loading={loading}
          children={children}
        />
      </AriaButton>
    );
  }
);

Button.displayName = "Button";

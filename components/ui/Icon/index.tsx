import type { ReactElement, SVGProps } from "react";

type IconDef = {
  viewBox: string;
  content: ReactElement;
};

const icons: Record<string, IconDef> = {
  user: {
    viewBox: "0 0 32 32",
    content: (
      <path d="M16 5c-3.854 0-7 3.146-7 7c0 2.41 1.23 4.552 3.094 5.813C8.527 19.343 6 22.88 6 27h2c0-4.43 3.57-8 8-8s8 3.57 8 8h2c0-4.12-2.527-7.658-6.094-9.188A7.02 7.02 0 0 0 23 12c0-3.854-3.146-7-7-7m0 2c2.773 0 5 2.227 5 5s-2.227 5-5 5s-5-2.227-5-5s2.227-5 5-5" />
    ),
  },
  settings: {
    viewBox: "0 0 24 24",
    content: (
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M7.05 6.462a2 2 0 0 0 2.63-1.519l.32-1.72a9 9 0 0 1 3.998 0l.322 1.72a2 2 0 0 0 2.63 1.519l1.649-.58a9 9 0 0 1 2.001 3.46l-1.33 1.14a2 2 0 0 0 0 3.037l1.33 1.139a9 9 0 0 1-2.001 3.46l-1.65-.58a2 2 0 0 0-2.63 1.519L14 20.777a9 9 0 0 1-3.998 0l-.322-1.72a2 2 0 0 0-2.63-1.519l-1.649.58a9 9 0 0 1-2.001-3.46l1.33-1.14a2 2 0 0 0 0-3.036L3.4 9.342a9 9 0 0 1 2-3.46zM12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6"
        clipRule="evenodd"
      />
    ),
  },
  logout: {
    viewBox: "0 0 24 24",
    content: (
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M13.496 21H6.5c-1.105 0-2-1.151-2-2.571V5.57c0-1.419.895-2.57 2-2.57h7M16 15.5l3.5-3.5L16 8.5m-6.5 3.496h10"
      />
    ),
  },
  close: {
    viewBox: "0 0 32 32",
    content: (
      <path d="M25.03 8.03 17.06 16l7.97 7.97-1.06 1.06L16 17.06l-7.97 7.97-1.06-1.06L14.94 16 6.97 8.03l1.06-1.06L16 14.94l7.97-7.97 1.06 1.06Z" />
    ),
  },
};

export type IconName = keyof typeof icons;

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

export default function Icon({ name, size = 20, ...props }: Props) {
  const { viewBox, content } = icons[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {content}
    </svg>
  );
}

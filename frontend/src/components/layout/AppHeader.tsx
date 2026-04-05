import "../../styles/app-header.css";
import LogoIcon from "../welcome/LogoIcon";
import type { ReactNode } from "react";

type AppHeaderProps = {
  rightContent?: ReactNode;
};

export default function AppHeader({ rightContent }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <LogoIcon />
        <div className="app-header__brand-copy">
          <span className="app-header__brand-title">VitalStudy</span>
        </div>
      </div>

      {rightContent ? (
        <div className="app-header__right">
          {rightContent}
        </div>
      ) : null}
    </header>
  );
}
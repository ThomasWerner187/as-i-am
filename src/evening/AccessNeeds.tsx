import { useId } from "react";
import { ACCESS_NEEDS, type AccessNeed } from "./accessNeeds";
import "../styles/access-needs.css";

interface AccessNeedsProps {
  value: AccessNeed[];
  onChange: (next: AccessNeed[]) => void;
  disabled?: boolean;
}

export default function AccessNeeds({ value, onChange, disabled = false }: AccessNeedsProps) {
  const id = useId();

  function changeNeed(changed: AccessNeed, checked: boolean) {
    onChange(ACCESS_NEEDS
      .filter((need) => need.id === changed ? checked : value.includes(need.id))
      .map((need) => need.id));
  }

  return (
    <fieldset className="access-needs" disabled={disabled} aria-describedby={`${id}-hint`}>
      <legend>What would help you today?</legend>
      <p className="access-needs-hint" id={`${id}-hint`}>
        Choose any that help. Nothing changes until you apply.
      </p>
      <div className="access-needs-options">
        {ACCESS_NEEDS.map((need) => {
          const checked = value.includes(need.id);
          return (
            <label className="access-need" data-selected={checked} key={need.id}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => changeNeed(need.id, event.currentTarget.checked)}
                aria-labelledby={`${id}-${need.id}-label`}
                aria-describedby={`${id}-${need.id}-description`}
              />
              <span className="access-need-copy">
                <span className="access-need-label" id={`${id}-${need.id}-label`}>{need.label}</span>
                <span className="access-need-description" id={`${id}-${need.id}-description`}>{need.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

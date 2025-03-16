import { useEffect } from "react";

/**
 * A hook that traps focus within a specific DOM element
 * @param {React.RefObject} ref - Ref to the container element
 * @param {boolean} isActive - Whether the focus trap is active
 */
const useFocusTrap = (ref, isActive = true) => {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // If shift + tab and on first element, move to last element
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // If tab and on last element, move to first element
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const element = ref.current;
    element.addEventListener("keydown", handleTabKey);

    // Focus the first element when trap activates
    if (firstElement && typeof firstElement.focus === "function") {
      firstElement.focus();
    }

    return () => {
      element.removeEventListener("keydown", handleTabKey);
    };
  }, [ref, isActive]);
};

export default useFocusTrap;

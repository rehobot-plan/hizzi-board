export function useVisibilityTooltip(
  visibleTo: string[],
  users: { email: string; name: string }[]
): { isSpecific: boolean; tooltipText: string } {
  const isSpecific = visibleTo.length > 1;
  const tooltipText = isSpecific
    ? visibleTo
        .map(email => users.find(u => u.email === email)?.name || email.split('@')[0])
        .join(', ')
    : '';
  return { isSpecific, tooltipText };
}

export function icon(name) {
  switch (name) {
    case "settings":
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M19.4 15a8.7 8.7 0 0 0 .1-1l2-1.6-2-3.4-2.5 1a9 9 0 0 0-1.7-1L15 6h-6l-.3 3a9 9 0 0 0-1.7 1l-2.5-1-2 3.4L4.6 14a8.7 8.7 0 0 0 .1 1l-2 1.6 2 3.4 2.5-1a9 9 0 0 0 1.7 1L9 22h6l.3-3a9 9 0 0 0 1.7-1l2.5 1 2-3.4-2-1.6Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      </svg>`;
    case "network":
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M5 23a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M19 23a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M12 7v4M12 11L5 17M12 11l7 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>`;
    case "table":
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v12H4V6Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M4 10h16M8 6v12M16 6v12" stroke="currentColor" stroke-width="1.4"/>
      </svg>`;
    case "search":
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M16.5 16.5 21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;
    case "plus":
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;
    case "minus":
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;
    case "reset":
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 12a8 8 0 1 1-2.3-5.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M20 4v6h-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    default:
      return "";
  }
}

